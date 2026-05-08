# -*- coding: utf-8 -*-
"""
sagwan download script from kimsplan.tistory.com/243
"""
import os, sys, time, requests
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"c:\Users\matho\OneDrive\바탕 화면\기출홈페이지\사관학교"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://kimsplan.tistory.com/243",
}

# (학년도, 파일명, URL) - t1.daumcdn.net 직접 링크
FILES = [
    ("2002", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/992D90455A3710E041"),
    ("2002", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/9985A64C5A3710E005"),
    ("2003", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/99B9FF4F5A3710E00E"),
    ("2003", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/997E53415A3710E034"),
    ("2004", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/990476345A3710E00F"),
    ("2004", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/9945FF425A3710E00B"),
    ("2005", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/998ABD335A3710E133"),
    ("2005", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/991EF8365A3710E10B"),
    ("2006", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/99A32E385A3710E109"),
    ("2006", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/99332C355A3710E111"),
    ("2007", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/99A32C385A3710E109"),
    ("2007", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/99DFA1505A3710E132"),
    ("2008", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/9972DB3F5A3710E10D"),
    ("2008", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/99621C3E5A3710E111"),
    ("2009", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/99963D415A3710E106"),
    ("2009", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/99C3F94B5A3710E10C"),
    ("2010", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/998C604E5A3710E112"),
    ("2010", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/9983A03B5A3710E102"),
    ("2011", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/9922A93C5A3710E112"),
    ("2011", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/99CBC4345A3710E244"),
    ("2012", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/996CDF335A3710E238"),
    ("2012", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/997EBB3B5A3710E203"),
    ("2013", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/993861425A3710E20E"),
    ("2013", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/99B3BE4B5A3710E235"),
    ("2014", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/9991A94B5A3710E212"),
    ("2014", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/9940B4425A3710E235"),
    ("2015", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/99283B375A3710E20B"),
    ("2015", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/993F77355A3710E239"),
    ("2016", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/99880D3E5A3710E20B"),
    ("2016", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/994E933B5A3710E20A"),
    ("2017", "가형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/99C02E475A3710E216"),
    ("2017", "나형_문제지.pdf", "https://t1.daumcdn.net/cfile/tistory/991682375A3710E20E"),
]

def download(url, dest):
    try:
        r = requests.get(url, headers=HEADERS, timeout=30, stream=True)
        r.raise_for_status()
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as f:
            for chunk in r.iter_content(8192):
                f.write(chunk)
        size_kb = os.path.getsize(dest) // 1024
        print(f"  OK ({size_kb}KB) -> {os.path.basename(dest)}")
        return True
    except Exception as e:
        print(f"  FAIL: {e}")
        return False

ok, fail = 0, 0
print(f"[다운로드 시작] 사관학교 기출 총 {len(FILES)}개\n")

for year, fname, url in FILES:
    dest = os.path.join(BASE_DIR, year, fname)
    print(f"[{year}] {fname}")
    if os.path.exists(dest) and os.path.getsize(dest) > 5000:
        print("  -> 이미 존재, 건너뜀")
        ok += 1
        continue
    if download(url, dest):
        ok += 1
    else:
        fail += 1
    time.sleep(0.3)

print(f"\n{'='*40}")
print(f"성공: {ok}개  /  실패: {fail}개")
if fail > 0:
    print("실패한 파일은 URL 만료됐을 수 있음. 브라우저로 직접 확인 필요.")
