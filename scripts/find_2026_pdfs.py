import sys, re

with open('src/data/posts.ts', encoding='utf-8') as f:
    content = f.read()

# 포스트 블록 단위로 분리
post_blocks = re.split(r'\{\s*\n\s*id:', content)
results = []

for block in post_blocks:
    slug_m = re.search(r"slug:\s*'(2026-[^']+)'", block)
    if not slug_m:
        continue
    slug = slug_m.group(1)
    pdfs = re.findall(r"url:\s*'([^']+\.pdf)'", block)
    results.append((slug, pdfs))

print(f"{'슬러그':<40} PDF 개수  URL")
print("-" * 90)
total = 0
for slug, pdfs in results:
    print(f"{slug:<40} {len(pdfs)}개")
    for p in pdfs:
        print(f"  {'':40} {p}")
    total += len(pdfs)
print(f"\n총 2026 게시물: {len(results)}개 / 총 PDF: {total}개")
