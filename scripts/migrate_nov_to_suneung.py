# -*- coding: utf-8 -*-
"""
모의고사/고3 수능 파일을 수능 폴더로 이동
파일명 패턴:
  ~2014: YYMM가문제.pdf, YYMM나문제.pdf, YY수능가문제.pdf
  2015~2018: YYMMА.pdf, YY수A.pdf
  2019~: MM월_가형_문제지.pdf, 11월_가형_문제지.pdf
"""
import os, sys, shutil, re
sys.stdout.reconfigure(encoding='utf-8')

BASE    = r"c:\Users\matho\OneDrive\바탕 화면\기출홈페이지"
MOYGO   = os.path.join(BASE, "모의고사")
SUNEUNG = os.path.join(BASE, "수능")

moved = 0
skipped = 0

print("[수능 파일 이동 시작]\n")

def is_suneung_file(fname, year_str):
    """수능 파일인지 판별 (11월/수능 키워드 포함)"""
    yy = year_str[2:]  # 2007 -> 07
    fname_lower = fname.lower()
    
    # 패턴1: 2019~현재 - "11월" 포함
    if re.match(r'^11월', fname):
        return True
    # 패턴2: ~2018 - YYMM에서 MM=11 (예: 0711, 1011, 1511)
    if re.match(rf'^{yy}11', fname):
        return True
    # 패턴3: "수능" 문자 포함 (07수능가.pdf 등)
    if '수능' in fname:
        return True
    # 패턴4: 수 (yy + 수) 
    if re.match(rf'^{yy}수', fname):
        return True
    return False

def get_new_name(fname, year_str):
    """수능 폴더에 저장할 새 파일명 결정"""
    yy = year_str[2:]
    
    # 2019~: "11월_가형_문제지.pdf" -> "가형_문제지.pdf"
    m = re.match(r'^11월_?(.+)', fname)
    if m:
        return m.group(1)
    
    # 2015~2018: "YY수A.pdf", "YY수A해설.pdf", "15수A.pdf"
    # -> "A형_문제지.pdf" / "A형_해설지.pdf"
    m = re.match(rf'^{yy}수([AB])(해설)?\.pdf$', fname)
    if m:
        form = m.group(1) + "형"
        ftype = "해설지" if m.group(2) else "문제지"
        return f"{form}_{ftype}.pdf"
    
    # 2015~2018: "YYMMA.pdf", "YYMMa해설.pdf"
    m = re.match(rf'^{yy}11([AB])(해설)?\.pdf$', fname)
    if m:
        form = m.group(1) + "형"
        ftype = "해설지" if m.group(2) else "문제지"
        return f"{form}_{ftype}.pdf"
    
    # ~2014: "YY수능가문제.pdf", "YY수능나해설.pdf"
    m = re.match(rf'^{yy}수능([가나])(문제|해설)\.pdf$', fname)
    if m:
        form = "가형" if m.group(1) == "가" else "나형"
        ftype = "문제지" if m.group(2) == "문제" else "해설지"
        return f"{form}_{ftype}.pdf"
    
    # ~2014 수능: "07수능가.pdf" (해설 없이)
    m = re.match(rf'^{yy}수능([가나])\.pdf$', fname)
    if m:
        form = "가형" if m.group(1) == "가" else "나형"
        return f"{form}_문제지.pdf"
    
    # 그 외: 그냥 "11월_" 제거하거나 원본 유지
    result = re.sub(r'^11월_?', '', fname)
    return result if result else fname

for year_str in sorted(os.listdir(MOYGO)):
    year_dir = os.path.join(MOYGO, year_str)
    if not os.path.isdir(year_dir) or not re.match(r'^\d{4}$', year_str):
        continue
    
    go3_dir = os.path.join(year_dir, "고3")
    if not os.path.isdir(go3_dir):
        continue
    
    all_files = [f for f in os.listdir(go3_dir) if f.endswith(".pdf")
                 and os.path.getsize(os.path.join(go3_dir, f)) > 1000]
    
    suneung_files = [f for f in all_files if is_suneung_file(f, year_str)]
    if not suneung_files:
        continue
    
    # 수능 학년도 = 시행연도 + 1
    suneung_year = str(int(year_str) + 1)
    dest_dir = os.path.join(SUNEUNG, suneung_year)
    os.makedirs(dest_dir, exist_ok=True)
    
    for fname in sorted(suneung_files):
        src = os.path.join(go3_dir, fname)
        new_name = get_new_name(fname, year_str)
        dest = os.path.join(dest_dir, new_name)
        
        if os.path.exists(dest):
            if os.path.getsize(dest) >= os.path.getsize(src):
                print(f"  [건너뜀] {suneung_year}/{new_name} (기존 파일이 더 큼)")
                os.remove(src)
                skipped += 1
                continue
            else:
                os.remove(dest)
        
        shutil.move(src, dest)
        kb = os.path.getsize(dest) // 1024
        print(f"  [이동] {year_str}/고3/{fname} -> 수능/{suneung_year}/{new_name} ({kb}KB)")
        moved += 1

print(f"\n{'='*50}")
print(f"이동: {moved}개  /  건너뜀(중복): {skipped}개")

print("\n[수능 폴더 결과]")
for y in sorted(os.listdir(SUNEUNG)):
    ypath = os.path.join(SUNEUNG, y)
    if not os.path.isdir(ypath):
        continue
    files = [f for f in os.listdir(ypath)
             if f.endswith(".pdf") and os.path.getsize(os.path.join(ypath, f)) > 1000]
    if files:
        print(f"  {y}학년도 ({len(files)}개): {', '.join(sorted(files))}")
