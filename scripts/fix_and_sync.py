# -*- coding: utf-8 -*-
"""
fix_and_sync.py

1. 모의고사/ 폴더에서 이름이 잘못된 PDF 파일을 올바른 이름으로 변환
   예) 1306A.pdf  →  6월_A형_문제지.pdf
       1306A해설지.pdf  →  6월_A형_해설지.pdf
       2403기하.pdf  →  3월_기하_문제지.pdf
       2411수능기하.pdf  →  11월_수능_기하_문제지.pdf
       26수능기하.pdf  →  11월_수능_기하_문제지.pdf   (수능은 11월로 처리)

2. 변환 후 결과를 출력하고 종료 (sync는 npm run sync 로 별도 실행)
"""

import re
import shutil
from pathlib import Path

MOYGOOSA_DIR = Path(r'C:\Users\matho\OneDrive\바탕 화면\기출홈페이지\모의고사')

# 과목명 정규화
SUBJECT_MAP = {
    '기하': '기하', '미적분': '미적분', '확통': '확통',
    '확률과통계': '확통', '확률통계': '확통',
}


def normalize_type(raw: str) -> str:
    if re.search(r'해설|해설지', raw):
        return '해설지'
    if re.search(r'정답', raw):
        return '정답지'
    return '문제지'


def try_rename(filename: str):
    """
    파일명 → (month, extra_labels[], ftype) 또는 None

    지원 패턴:
      YYMM(가형|나형|A|B)?(해설지)?         → 일반 학력평가
      YYMM(기하|미적분|확통)?(해설지)?       → 고3 과목별
      YYMM수능(기하|미적분|확통)?(해설지)?   → 고3 수능 (11월)
      YY수능(기하|미적분|확통)?(해설지)?     → 고3 수능 약식 (11월)
    """
    stem = re.sub(r'\.pdf$', '', filename, flags=re.IGNORECASE)

    # ── 패턴 A: YYMM수능과목? ─────────────────────────────
    m = re.match(r'^\d{2}(\d{2})수능(기하|미적분|확통|확률과통계|확률통계)?(\s*해설지|\s*해설|\s*정답지|\s*정답)?$', stem)
    if m:
        mm, subject_raw, suffix = m.groups()
        month = int(mm)
        subject = SUBJECT_MAP.get(subject_raw or '', subject_raw or None)
        ftype = normalize_type(suffix or '')
        extras = ['수능']
        if subject: extras.append(subject)
        return month, extras, ftype

    # ── 패턴 B: YY수능과목? (연도 2자리만, 수능=11월) ──────
    m = re.match(r'^\d{2}수능(기하|미적분|확통|확률과통계|확률통계)?(\s*해설지|\s*해설|\s*정답지|\s*정답)?$', stem)
    if m:
        subject_raw, suffix = m.groups()
        month = 11
        subject = SUBJECT_MAP.get(subject_raw or '', subject_raw or None)
        ftype = normalize_type(suffix or '')
        extras = ['수능']
        if subject: extras.append(subject)
        return month, extras, ftype

    # ── 패턴 C: YYMM과목? (기하/미적분/확통) ────────────────
    m = re.match(r'^\d{2}(\d{2})(기하|미적분|확통|확률과통계|확률통계)?(\s*해설지|\s*해설|\s*정답지|\s*정답)?$', stem)
    if m:
        mm, subject_raw, suffix = m.groups()
        subject = SUBJECT_MAP.get(subject_raw or '', subject_raw or None)
        month = int(mm)
        ftype = normalize_type(suffix or '')
        extras = [subject] if subject else []
        return month, extras, ftype

    # ── 패턴 D: YYMM(가형|나형|A|B)? 일반 ──────────────────
    m = re.match(r'^\d{2}(\d{2})(가형|나형|A형|B형|A|B)?(\s*해설지|\s*해설|\s*정답지|\s*정답)?$', stem)
    if m:
        mm, variant_raw, suffix = m.groups()
        month = int(mm)
        variant = {'A': 'A형', 'B': 'B형'}.get(variant_raw or '', variant_raw or None)
        ftype = normalize_type(suffix or '')
        extras = [variant] if variant else []
        return month, extras, ftype

    return None


def build_name(month, extras, ftype):
    parts = [f"{month}월"] + (extras or []) + [ftype]
    return "_".join(parts) + ".pdf"


def main():
    print("=" * 60)
    print("  모의고사 파일명 정규화")
    print("=" * 60)

    renamed = 0
    failed = []

    for year_dir in sorted(MOYGOOSA_DIR.iterdir()):
        if not year_dir.is_dir():
            continue
        for grade_dir in sorted(year_dir.iterdir()):
            if not grade_dir.is_dir():
                continue

            pdf_files = [f for f in grade_dir.iterdir() if f.suffix.lower() == '.pdf']
            # 4자리 숫자로 시작하거나, YY수능... 패턴인 파일
            bad_files = [f for f in pdf_files if
                         re.match(r'^\d{4}', f.name) or
                         re.match(r'^\d{2}수능', f.name)]

            if not bad_files:
                continue

            print(f"\n[{year_dir.name}/{grade_dir.name}]")
            existing_names = set(f.name for f in grade_dir.iterdir() if f.suffix.lower() == '.pdf')

            for src in sorted(bad_files):
                parsed = try_rename(src.name)
                if parsed is None:
                    print(f"  [실패] 파싱 불가: {src.name}")
                    failed.append(str(src))
                    continue

                month, extras, ftype = parsed
                new_name = build_name(month, extras, ftype)
                new_path = grade_dir / new_name

                if new_name in existing_names and new_path != src:
                    print(f"  [충돌] {src.name} → {new_name} (이미 존재, 원본 삭제)")
                    src.unlink()
                    renamed += 1
                    continue

                src.rename(new_path)
                existing_names.discard(src.name)
                existing_names.add(new_name)
                print(f"  [변환] {src.name} → {new_name}")
                renamed += 1

    print()
    print("=" * 60)
    print(f"  완료: {renamed}개 변환/처리, 실패 {len(failed)}개")
    if failed:
        for f in failed:
            print(f"  실패: {f}")
    print("=" * 60)
    print()
    print("다음 단계: npm run sync 를 실행하세요.")


if __name__ == "__main__":
    main()
