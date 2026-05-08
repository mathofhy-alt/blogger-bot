# -*- coding: utf-8 -*-
"""
migrate_this_to_moygoosa.py

'this' 폴더의 연도별 고2 모의고사 파일을 분석하여
이미 모의고사/ 폴더에 있는 자료는 제외하고
없는 것만 모의고사/{년도}/고2/ 구조로 복사합니다.

파일 명명 패턴 (this 폴더):
  - 0603.pdf            → 2006년 3월 문제지
  - 0609가형.pdf        → 2006년 9월 가형 문제지
  - 0609가형해설.pdf    → 2006년 9월 가형 해설지
  - 1109가형.pdf        → 2011년 9월 가형 문제지
  - 16고2_3월(서울)가형.pdf       → 2016년 3월 가형 문제지
  - 20고2_9월.pdf       → 2020년 9월 문제지
  - 25고23월(서울).pdf  → 2025년 3월 문제지

출력 파일명 형식 (모의고사/ 폴더):
  - 3월_문제지.pdf
  - 9월_가형_문제지.pdf
  - 9월_가형_해설지.pdf
"""

import os
import re
import shutil
from pathlib import Path

# ── 경로 설정 ──────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent                          # math-girul/
SOURCE_ROOT  = PROJECT_ROOT.parent                        # 기출홈페이지/

THIS_DIR     = SOURCE_ROOT / "this"
MOYGOOSA_DIR = SOURCE_ROOT / "모의고사"

# 현재 년도의 2자리 (연도 판별용)
CURRENT_YEAR = 2026


def parse_year(yy: str) -> int:
    """2자리 연도 → 4자리 연도 변환"""
    n = int(yy)
    # 06~99 → 2006~2099, 00~05 → 2000~2005
    if n >= 0:
        full = 2000 + n
        return full


def parse_month(mm: str) -> int:
    return int(mm)


def normalize_type(raw: str) -> str:
    """파일 타입 문자열 → 표준화"""
    raw = raw.strip()
    if re.search(r'해설|해설지|해설지', raw, re.IGNORECASE):
        return '해설지'
    if re.search(r'정답', raw, re.IGNORECASE):
        return '정답지'
    return '문제지'


# 무시할 파일 패턴 (쓰레기 파일 등)
IGNORE_PATTERNS = [
    r'gotjfwl',          # 24고2_9월_gotjfwl.pdf 같은 임시 파일
]


def should_ignore(stem: str) -> bool:
    return any(re.search(p, stem, re.IGNORECASE) for p in IGNORE_PATTERNS)


def parse_this_filename(filename: str):
    """
    this 폴더의 파일명을 파싱하여
    (year, month, variant, filetype, extra_label) 5-튜플 반환.
    variant: None | '가형' | '나형' | 'A형' | 'B형' 등
    extra_label: None | '예비수능' 등 (파일명 중간에 삽입되는 레이블)
    파싱 불가 시 None 반환, 무시해야 하면 'IGNORE' 반환.
    """
    stem = re.sub(r'\.pdf$', '', filename, flags=re.IGNORECASE)

    # 무시 패턴 체크
    if should_ignore(stem):
        return 'IGNORE'

    # 패턴 0: YYMM예비수능(A|B)?(해설지)?
    # 예: 1205예비수능A, 1205예비수능A해설지, 1205예비수능B
    m = re.match(r'^(\d{2})(\d{2})예비수능(A|B)?(해설지|해설|정답지|정답)?$', stem)
    if m:
        yy, mm, variant_raw, suffix = m.groups()
        year   = parse_year(yy)
        month  = parse_month(mm)
        variant = {'A': 'A형', 'B': 'B형'}.get(variant_raw or '', None)
        ftype  = normalize_type(suffix or '')
        return year, month, variant, ftype, '예비수능'

    # 패턴 1: YYMM... (old style, 4자리 숫자 시작)
    # 예: 0603, 0603해설, 0609가형, 0609가형해설지, 1206A, 1206A해설지
    m = re.match(r'^(\d{2})(\d{2})(가형|나형|A형|B형|A|B)?(해설지|해설|정답지|정답)?$', stem)
    if m:
        yy, mm, variant_raw, suffix = m.groups()
        year  = parse_year(yy)
        month = parse_month(mm)
        # A→A형, B→B형 정규화
        variant = None
        if variant_raw:
            variant = {'A': 'A형', 'B': 'B형'}.get(variant_raw, variant_raw)
        ftype = normalize_type(suffix or '')
        return year, month, variant, ftype, None

    # 패턴 2: YY고2_MM월... or YY고2MM월...
    # 예: 16고2_3월(서울)가형, 20고2_9월, 25고23월(서울), 25고210월(경기)
    # 2013/2014 형식: 13고2_3월(서울)A형
    m = re.match(
        r'^(\d{2})고2[_]?(\d{1,2})월?(?:\([^)]+\))?(가형|나형|A형|B형)?(해설지|해설|정답지|정답)?$',
        stem
    )
    if m:
        yy, mm, variant, suffix = m.groups()
        year  = parse_year(yy)
        month = parse_month(mm)
        ftype = normalize_type(suffix or '')
        return year, month, variant, ftype, None

    return None


def get_existing_go2_files(year: int) -> set:
    """
    모의고사/{year}/고2/ 폴더에 이미 존재하는 파일명 집합 반환.
    """
    go2_dir = MOYGOOSA_DIR / str(year) / "고2"
    if not go2_dir.exists():
        return set()
    return set(f.name for f in go2_dir.iterdir() if f.suffix.lower() == '.pdf')


def build_dest_filename(month: int, variant, ftype: str, extra_label=None) -> str:
    """목적지 파일명 생성"""
    parts = [f"{month}월"]
    if extra_label:
        parts.append(extra_label)
    if variant:
        parts.append(variant)
    parts.append(ftype)
    return "_".join(parts) + ".pdf"


def main():
    print("=" * 60)
    print("  this → 모의고사/고2 마이그레이션")
    print("=" * 60)
    print()

    if not THIS_DIR.exists():
        print(f"❌ 'this' 폴더를 찾을 수 없습니다: {THIS_DIR}")
        return

    total_copied = 0
    total_skipped = 0
    total_failed = 0
    failed_files = []

    # 연도 폴더 순회
    year_dirs = sorted([d for d in THIS_DIR.iterdir() if d.is_dir() and d.name.isdigit()])

    for year_dir in year_dirs:
        year = int(year_dir.name)
        pdf_files = [f for f in year_dir.iterdir() if f.suffix.lower() == '.pdf']

        if not pdf_files:
            continue

        existing = get_existing_go2_files(year)
        print(f"\n[{year}년] PDF {len(pdf_files)}개, 기존 {len(existing)}개")

        for src_file in sorted(pdf_files):
            parsed = parse_this_filename(src_file.name)
            if parsed == 'IGNORE':
                print(f"  [무시됨] {src_file.name}")
                total_skipped += 1
                continue
            if parsed is None:
                print(f"  [파싱실패] {src_file.name}")
                total_failed += 1
                failed_files.append(str(src_file))
                continue

            file_year, month, variant, ftype, extra_label = parsed

            dest_filename = build_dest_filename(month, variant, ftype, extra_label)
            dest_dir = MOYGOOSA_DIR / str(year) / "고2"

            if dest_filename in existing:
                print(f"  [SKIP] {dest_filename} (이미 존재)")
                total_skipped += 1
                continue

            # 복사
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest_path = dest_dir / dest_filename
            shutil.copy2(src_file, dest_path)
            print(f"  [COPY] {src_file.name} -> {dest_filename}")
            existing.add(dest_filename)  # 중복 방지
            total_copied += 1

    print()
    print("=" * 60)
    print(f"  [완료 요약]")
    print(f"  - 복사됨   : {total_copied}개")
    print(f"  - 건너뜀   : {total_skipped}개 (이미 존재)")
    print(f"  - 파싱실패 : {total_failed}개")
    if failed_files:
        print(f"\n  [파싱 실패 파일 목록]:")
        for f in failed_files:
            print(f"     {f}")
    print("=" * 60)

    if total_copied > 0:
        print()
        print("[다음 단계] 홈페이지 동기화를 실행하세요:")
        print("   cd math-girul && npm run sync")


if __name__ == "__main__":
    main()
