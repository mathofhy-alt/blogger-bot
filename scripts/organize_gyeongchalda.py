# -*- coding: utf-8 -*-
"""
경찰대 폴더 정리 스크립트
- 경찰대/XXXX학년도_수학.pdf  ->  경찰대/XXXX/문제지.pdf
- 경찰대/XXXX학년도_정답.pdf  ->  경찰대/XXXX/정답지.pdf
- 11바이트 더미 파일 삭제
"""
import os, sys, shutil, re
sys.stdout.reconfigure(encoding='utf-8')

BASE = r"c:\Users\matho\OneDrive\바탕 화면\기출홈페이지\경찰대"

# 파일명 → 이동 대상 결정
TYPE_MAP = {
    "수학": "문제지.pdf",
    "정답": "정답지.pdf",
    "해설": "해설지.pdf",
    "문제": "문제지.pdf",
}

moved = 0
deleted = 0
skipped = 0

print("[경찰대 폴더 정리 시작]\n")

# 1. 최상위에 흩어진 파일들 연도폴더로 이동
for fname in os.listdir(BASE):
    fpath = os.path.join(BASE, fname)
    if not os.path.isfile(fpath):
        continue
    if not fname.endswith(".pdf"):
        continue

    # 더미 파일 (11바이트 이하) 삭제
    if os.path.getsize(fpath) <= 100:
        os.remove(fpath)
        print(f"  [삭제] 더미파일: {fname}")
        deleted += 1
        continue

    # XXXX학년도_수학.pdf or XXXX학년도_정답.pdf 패턴 파싱
    m = re.match(r"(\d{4})학년도_(.+)\.pdf$", fname)
    if not m:
        print(f"  [건너뜀] 파싱불가: {fname}")
        skipped += 1
        continue

    year = m.group(1)
    type_key = m.group(2)  # 수학, 정답, 해설 등

    # 타입 결정
    dest_name = None
    for key, name in TYPE_MAP.items():
        if key in type_key:
            dest_name = name
            break
    if not dest_name:
        print(f"  [건너뜀] 타입불명: {fname}")
        skipped += 1
        continue

    # 연도 폴더 생성 및 이동
    year_dir = os.path.join(BASE, year)
    os.makedirs(year_dir, exist_ok=True)
    dest_path = os.path.join(year_dir, dest_name)

    # 이미 존재하면 크기 비교해서 더 큰 파일 유지
    if os.path.exists(dest_path):
        existing_size = os.path.getsize(dest_path)
        new_size = os.path.getsize(fpath)
        if existing_size >= new_size:
            os.remove(fpath)
            print(f"  [삭제] 중복(기존이 더 큼): {fname}")
            deleted += 1
            continue
        else:
            os.remove(dest_path)
            print(f"  [교체] 더 큰 파일로 교체: {fname}")

    shutil.move(fpath, dest_path)
    print(f"  [이동] {fname} -> {year}/{dest_name}")
    moved += 1

# 2. 각 연도 폴더 안의 더미파일 정리
for year_dir in sorted(os.listdir(BASE)):
    ypath = os.path.join(BASE, year_dir)
    if not os.path.isdir(ypath):
        continue
    for fname in os.listdir(ypath):
        fpath = os.path.join(ypath, fname)
        if os.path.isfile(fpath) and os.path.getsize(fpath) <= 100:
            os.remove(fpath)
            print(f"  [삭제] 더미파일: {year_dir}/{fname}")
            deleted += 1

print(f"\n{'='*40}")
print(f"이동: {moved}개  /  삭제(더미/중복): {deleted}개  /  건너뜀: {skipped}개")
print("\n[결과 확인]")
for year_dir in sorted(os.listdir(BASE)):
    ypath = os.path.join(BASE, year_dir)
    if not os.path.isdir(ypath):
        continue
    files = [f for f in os.listdir(ypath) if f.endswith(".pdf")]
    if files:
        print(f"  {year_dir}/  ->  {', '.join(sorted(files))}")
    else:
        print(f"  {year_dir}/  ->  (비어있음)")
