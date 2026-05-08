# -*- coding: utf-8 -*-
"""
organize_sagwan.py

사관학교 루트에 놓인 파일들을 연도별 폴더로 이동하고
파일명을 sync-posts.js가 인식할 수 있는 형태로 변환한다.

패턴:
  2002~2021학년도: YYYY학년도 사관학교(가형).hwp/pdf  →  YYYY/가형_문제지.hwp/pdf
  2022~2024학년도: YYYY학년도 사관학교 수학영역.hwp/pdf  →  YYYY/문제지.hwp/pdf

  * 문제+해설이 통합된 파일이므로 파일명은 '문제지'로 통일
    (실제로는 문제+해설 통합 파일임을 label로 표현)
"""

import re
import shutil
from pathlib import Path

SAGWAN_DIR = Path(r'C:\Users\matho\OneDrive\바탕 화면\기출홈페이지\사관학교')


def main():
    # 루트에 있는 파일만 대상
    root_files = [f for f in SAGWAN_DIR.iterdir() if f.is_file()]
    if not root_files:
        print("루트에 처리할 파일이 없습니다.")
        return

    moved = 0
    for src in sorted(root_files):
        name = src.name
        ext = src.suffix.lower()  # .hwp or .pdf

        # 패턴 A: YYYY학년도 사관학교(가형/나형)
        m = re.match(r'^(\d{4})학년도\s*사관학교\((가형|나형)\)', name)
        if m:
            year = m.group(1)
            form = m.group(2)  # 가형 or 나형
            dest_dir = SAGWAN_DIR / year
            dest_dir.mkdir(exist_ok=True)
            dest_name = f"{form}_문제지{ext}"
            dest = dest_dir / dest_name
            if dest.exists():
                print(f"  [충돌] {name} → {year}/{dest_name} (이미 존재, 건너뜀)")
                continue
            shutil.move(str(src), str(dest))
            print(f"  [이동] {name} → {year}/{dest_name}")
            moved += 1
            continue

        # 패턴 B: YYYY학년도 사관학교 수학영역 (2022~)
        m = re.match(r'^(\d{4})학년도\s*사관학교\s*수학영역', name)
        if m:
            year = m.group(1)
            dest_dir = SAGWAN_DIR / year
            dest_dir.mkdir(exist_ok=True)
            dest_name = f"문제지{ext}"
            dest = dest_dir / dest_name
            if dest.exists():
                print(f"  [충돌] {name} → {year}/{dest_name} (이미 존재, 건너뜀)")
                continue
            shutil.move(str(src), str(dest))
            print(f"  [이동] {name} → {year}/{dest_name}")
            moved += 1
            continue

        print(f"  [미처리] 패턴 불일치: {name}")

    print(f"\n완료: {moved}개 이동")


if __name__ == '__main__':
    main()
