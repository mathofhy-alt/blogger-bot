"""
시험지 PDF 자동 분석 스크립트 (Gemini 2.5 Pro)
------------------------------------------------
- 모든 연도의 게시물 대상 (연도 제한 없음)
- 이미 분석된 슬러그는 건너뜀 (증분 실행)
- 결과: src/data/examAnalysis.json 에 병합 저장

실행:
  python scripts/analyze_exam_pdfs.py          # 신규 게시물만
  python scripts/analyze_exam_pdfs.py --all    # 전체 재분석
"""

import sys, os, json, re, time, requests, tempfile
import concurrent.futures
from google import genai
from google.genai import types

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── 설정 ────────────────────────────────────────────────────────
GEMINI_API_KEY     = os.getenv("GEMINI_API_KEY", "")
MODEL_NAME         = "gemini-2.5-pro"
SITE_BASE_URL      = "https://math.stac100.com"
OUTPUT_FILE        = "src/data/examAnalysis.json"
PRICE_INPUT_PER_M  = 1.25
PRICE_OUTPUT_PER_M = 10.00

client = genai.Client(api_key=GEMINI_API_KEY)


# ── 문제지 PDF 목록 파싱 (전 연도) ──────────────────────────────
def get_problem_pdfs():
    """posts.ts에서 모든 게시물의 문제지 PDF URL 추출 (해설지 제외)"""
    with open('src/data/posts.ts', encoding='utf-8') as f:
        content = f.read()

    post_blocks = re.split(r'\{\s*\n\s*id:', content)
    posts = []

    for block in post_blocks:
        slug_m = re.search(r"slug:\s*'([^']+)'", block)
        if not slug_m:
            continue
        slug = slug_m.group(1)

        all_pdfs = re.findall(r"label:\s*'([^']*)',\s*url:\s*'([^']+\.pdf)'", block)
        problem_pdfs = [
            {'label': lbl, 'url': url}
            for lbl, url in all_pdfs
            if '해설' not in lbl and '정답' not in lbl
        ]

        if problem_pdfs:
            posts.append({'slug': slug, 'pdfs': problem_pdfs})

    return posts


# ── 기존 분석 결과 로드 ─────────────────────────────────────────
def load_existing() -> dict:
    """기존 examAnalysis.json 로드. 없으면 빈 dict 반환."""
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, encoding='utf-8') as f:
            data = json.load(f)
        return {entry['slug']: entry for entry in data}
    return {}


# ── PDF 업로드 ──────────────────────────────────────────────────
def upload_pdf(pdf_url: str):
    full_url = SITE_BASE_URL + pdf_url if pdf_url.startswith('/') else pdf_url
    print(f"  [DL] {full_url}")

    resp = requests.get(full_url, timeout=30)
    if resp.status_code != 200:
        print(f"  [SKIP] HTTP {resp.status_code}")
        return None

    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        tmp.write(resp.content)
        tmp_path = tmp.name

    try:
        with open(tmp_path, 'rb') as f:
            file_obj = client.files.upload(
                file=f,
                config=types.UploadFileConfig(mime_type='application/pdf')
            )
        print(f"  [UP] {file_obj.name}")
        return file_obj
    except Exception as e:
        print(f"  [ERROR] {e}")
        return None
    finally:
        os.unlink(tmp_path)


# ── 분석 프롬프트 ────────────────────────────────────────────────
PROMPT = """이 파일은 한국 수학 시험지 PDF입니다. 아래 항목을 분석하여 JSON만 반환하세요.

{
  "killer_questions": [번호, ...],
  "question_concepts": {
    "1": "개념설명",
    "2": "개념설명"
  },
  "exam_summary": "시험 전체 특징과 난이도 총평 2~3문장",
  "key_concepts": ["개념1", "개념2"],
  "difficulty_notes": {
    "문항번호": "특이사항"
  }
}

- killer_questions: 최고 난도 문항 번호 (보통 21번, 28~30번)
- question_concepts: 주요 문항의 핵심 수학 개념 (최소 10문항)
- key_concepts: 이 시험에서 중점 출제된 개념 5~10개

[매우 중요: 절대 금지 사항]
- AI가 문제를 풀 수 없거나 정보가 부족하다고 해서 "오류가 있다", "잘못 출제되었다", "풀 수 없다"는 등의 부정적 평가나 문제의 결함을 지적하는 내용을 절대 포함하지 마세요. 오직 출제 의도와 수학적 개념 분석만 작성하세요.

- JSON 외 다른 텍스트 없이 반환"""


# ── 포스트 분석 ──────────────────────────────────────────────────
def analyze_post(slug: str, pdfs: list) -> dict:
    print(f"\n[{slug}] PDF {len(pdfs)}개 분석")
    total_in = total_out = 0
    analyses = []

    for pdf_info in pdfs:
        label, url = pdf_info['label'], pdf_info['url']
        print(f"  >> {label or url}")

        file_obj = upload_pdf(url)
        if not file_obj:
            continue

        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=[
                    types.Part.from_uri(file_uri=file_obj.uri, mime_type='application/pdf'),
                    PROMPT,
                ],
                config=types.GenerateContentConfig(temperature=0.1),
            )

            meta = response.usage_metadata
            if meta:
                inp = getattr(meta, 'prompt_token_count', 0) or 0
                out = getattr(meta, 'candidates_token_count', 0) or 0
                total_in  += inp
                total_out += out
                print(f"  [TOKEN] in:{inp:,} out:{out:,}")

            text = response.text.strip()
            text = re.sub(r'^```[a-z]*\n?', '', text)
            text = re.sub(r'\n?```$', '', text)

            result = json.loads(text)
            result['_label'] = label
            result['_url']   = url
            analyses.append(result)
            print(f"  [OK] 킬러: {result.get('killer_questions')}")

        except Exception as e:
            print(f"  [ERROR] {e}")

    return {
        'slug': slug,
        'analyses': analyses,
        'tokens': {'input': total_in, 'output': total_out},
    }


# ── 메인 ─────────────────────────────────────────────────────────
def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--all', action='store_true', help='전체 재분석 (기존 캐시 무시)')
    parser.add_argument('--year', type=int, help='특정 연도만 분석 (예: --year 2025)')
    parser.add_argument('--workers', type=int, default=5, help='병렬 처리 워커 수 (기본: 5)')
    args = parser.parse_args()

    all_posts = get_problem_pdfs()

    # 연도 필터
    if args.year:
        all_posts = [p for p in all_posts if p['slug'].startswith(str(args.year))]

    existing  = {} if args.all else load_existing()

    # 신규 슬러그만 필터
    new_posts = [p for p in all_posts if p['slug'] not in existing]

    if not new_posts:
        print("[완료] 새로 분석할 게시물이 없습니다.")
        return

    year_label = f"{args.year}년 " if args.year else ""
    print(f"[시작] 모델: {MODEL_NAME}")
    print(f"[신규] {year_label}{len(new_posts)}개 게시물 분석")
    for p in new_posts:
        print(f"  - {p['slug']}: {len(p['pdfs'])}개 PDF")

    grand_in = grand_out = 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_to_post = {executor.submit(analyze_post, post['slug'], post['pdfs']): post for post in new_posts}
        
        for future in concurrent.futures.as_completed(future_to_post):
            post = future_to_post[future]
            try:
                result = future.result()
                if result: # In case of error
                    existing[post['slug']] = result
                    grand_in  += result['tokens']['input']
                    grand_out += result['tokens']['output']
                    # 중간 저장 (동시성 문제 방지: 메인 스레드에서 순차 기록)
                    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                        json.dump(list(existing.values()), f, ensure_ascii=False, indent=2)
            except Exception as exc:
                print(f"  [CRITICAL] {post['slug']} 처리 중 예외 발생: {exc}")

    # 최종 저장
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(list(existing.values()), f, ensure_ascii=False, indent=2)

    cost_in    = grand_in  / 1_000_000 * PRICE_INPUT_PER_M
    cost_out   = grand_out / 1_000_000 * PRICE_OUTPUT_PER_M
    cost_total = cost_in + cost_out
    krw        = cost_total * 1380

    print(f"\n{'='*55}")
    print(f"[완료] {OUTPUT_FILE} 저장됨 (총 {len(existing)}개 슬러그)")
    print(f"[토큰] 입력: {grand_in:,} | 출력: {grand_out:,}")
    print(f"[비용] ${cost_total:.4f} (약 {krw:.0f}원)")
    print(f"{'='*55}")


if __name__ == '__main__':
    main()
