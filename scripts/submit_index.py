"""
math.stac100.com Indexing API 제출 스크립트
---------------------------------------------
vercel --prod 배포 후 실행하여 신규 URL만 구글에 색인 요청합니다.

사용법:
  # 신규 URL 자동 감지 후 제출 (기존 제출 기록과 비교)
  python scripts/submit_index.py

  # 특정 URL 직접 지정
  python scripts/submit_index.py --url https://math.stac100.com/posts/2023-go3-6wol-go3

  # 실제 제출 없이 제출 예정 URL 목록만 출력
  python scripts/submit_index.py --dry-run

  # 전체 URL 강제 재제출 (캐시 무시)
  python scripts/submit_index.py --force-all
"""

import json
import os
import sys
import argparse
import re
from pathlib import Path

# ── 설정 ──────────────────────────────────────────────────────────────────────
SITE_URL = "https://math.stac100.com"
POSTS_TS_PATH = Path("src/data/posts.ts")
SUBMITTED_CACHE_PATH = Path("scripts/.submitted_urls.json")

# ── 임포트 (스크립트 위치 기준으로 indexing.py 탐색) ──────────────────────────
sys.path.insert(0, str(Path(__file__).parent / "blogger"))
try:
    from indexing import submit_urls, submit_url
except ImportError:
    print("❌ scripts/blogger/indexing.py를 찾을 수 없습니다.")
    sys.exit(1)


def load_submitted_cache() -> set[str]:
    """이미 제출된 URL 캐시를 로드합니다."""
    if SUBMITTED_CACHE_PATH.exists():
        with open(SUBMITTED_CACHE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return set(data.get("submitted", []))
    return set()


def save_submitted_cache(submitted_urls: set[str]):
    """제출된 URL을 캐시 파일에 저장합니다."""
    SUBMITTED_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SUBMITTED_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump({"submitted": sorted(submitted_urls)}, f, ensure_ascii=False, indent=2)


def extract_slugs_from_posts_ts() -> list[str]:
    """
    src/data/posts.ts에서 slug 목록을 파싱합니다.
    (TypeScript 파일을 직접 파싱하므로 정규식 사용)
    """
    if not POSTS_TS_PATH.exists():
        print(f"❌ {POSTS_TS_PATH} 파일을 찾을 수 없습니다.")
        return []

    content = POSTS_TS_PATH.read_text(encoding="utf-8")
    # slug: '2023-go3-6wol-go3' 형태 파싱
    slugs = re.findall(r"slug:\s*['\"]([^'\"]+)['\"]", content)
    return slugs


def build_urls_from_slugs(slugs: list[str]) -> list[str]:
    """slug 목록을 전체 URL로 변환합니다."""
    urls = []
    for slug in slugs:
        urls.append(f"{SITE_URL}/posts/{slug}")
    # 홈, 카테고리 페이지도 포함
    extras = [
        SITE_URL + "/",
        SITE_URL + "/category/suneung",
        SITE_URL + "/category/go3",
        SITE_URL + "/category/go2",
        SITE_URL + "/category/go1",
        SITE_URL + "/category/gyeongchalda",
        SITE_URL + "/category/sagwan",
    ]
    return extras + urls


def main():
    parser = argparse.ArgumentParser(description="math.stac100.com Google Indexing API 제출")
    parser.add_argument("--url", type=str, help="특정 URL만 직접 제출")
    parser.add_argument("--dry-run", action="store_true", help="실제 제출 없이 대상 URL 목록만 출력")
    parser.add_argument("--force-all", action="store_true", help="캐시 무시하고 전체 URL 재제출")
    args = parser.parse_args()

    # ── 특정 URL 직접 제출 ────────────────────────────────────────────────────
    if args.url:
        print(f"📌 단일 URL 제출: {args.url}")
        if not args.dry_run:
            submit_url(args.url)
        return

    # ── posts.ts에서 URL 목록 추출 ────────────────────────────────────────────
    print("📄 posts.ts에서 slug 목록 파싱 중...")
    slugs = extract_slugs_from_posts_ts()
    if not slugs:
        print("❌ slug를 찾을 수 없습니다.")
        return

    all_urls = build_urls_from_slugs(slugs)
    print(f"   전체 URL 수: {len(all_urls)}개")

    # ── 신규 URL 필터링 ───────────────────────────────────────────────────────
    if args.force_all:
        target_urls = all_urls
        print(f"🔄 강제 재제출 모드: {len(target_urls)}개 전체 제출")
    else:
        submitted_cache = load_submitted_cache()
        target_urls = [u for u in all_urls if u not in submitted_cache]
        print(f"🆕 신규 URL (미제출): {len(target_urls)}개")

    if not target_urls:
        print("✅ 제출할 신규 URL이 없습니다.")
        return

    # ── 출력 / 제출 ───────────────────────────────────────────────────────────
    print()
    for url in target_urls:
        print(f"  → {url}")
    print()

    if args.dry_run:
        print("🔍 [dry-run] 실제 제출은 하지 않았습니다.")
        return

    confirm = input(f"위 {len(target_urls)}개 URL을 제출하겠습니까? (y/N): ").strip().lower()
    if confirm != "y":
        print("취소했습니다.")
        return

    # ── 색인 제출 ─────────────────────────────────────────────────────────────
    results = submit_urls(target_urls)

    # ── 캐시 업데이트 ─────────────────────────────────────────────────────────
    submitted_cache = load_submitted_cache()
    submitted_cache.update(results["success"])
    save_submitted_cache(submitted_cache)
    print(f"\n💾 캐시 업데이트 완료: {SUBMITTED_CACHE_PATH}")


if __name__ == "__main__":
    main()
