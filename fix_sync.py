with open('scripts/sync-posts.js', 'rb') as f:
    content = f.read()

# Fix CATEGORY_LABELS - add upcoming: '업로드 예정'
# 업로드 예정 = ec9785ebb85ceb939c20ec98ˆec 
# 업 = ec9785, 로 = ebb85c, 드 = eb939c, 공백 = 20
# 예 = ec98ˆ, 정 = ec •...
# Let me use proper encoding
upcoming_label = '업로드 예정'.encode('utf-8')
upcoming_desc = '업로드 예정 시험 자료 목록'.encode('utf-8')

old1 = b"  sagwan: '\xec\x82\xac\xea\xb4\x80\xed\x95\x99\xea\xb5\x90 \xea\xb8\xb0\xec\xb6\x9c',\r\n};"
new1 = b"  sagwan: '\xec\x82\xac\xea\xb4\x80\xed\x95\x99\xea\xb5\x90 \xea\xb8\xb0\xec\xb6\x9c',\r\n  upcoming: '" + upcoming_label + b"',\r\n};"

if old1 in content:
    content = content.replace(old1, new1)
    print("Fixed CATEGORY_LABELS!")
else:
    print("CATEGORY_LABELS pattern not found, hex:", old1.hex())

# Fix CATEGORY_DESCRIPTIONS - add upcoming description
old2 = b"  sagwan: '\xec\x9c\xa1\xc2\xb7\xed\x95\xb4\xc2\xb7\xea\xb3\xb5\xea\xb5\xb0 \xec\x82\xac\xea\xb4\x80\xed\x95\x99\xea\xb5\x90 \xec\x9e\x85\xec\x8b\x9c \xec\x88\x98\xed\x95\x99 \xea\xb8\xb0\xec\xb6\x9c\xeb\xac\xb8\xec\xa0\x9c',\r\n};"
new2 = b"  sagwan: '\xec\x9c\xa1\xc2\xb7\xed\x95\xb4\xc2\xb7\xea\xb3\xb5\xea\xb5\xb0 \xec\x82\xac\xea\xb4\x80\xed\x95\x99\xea\xb5\x90 \xec\x9e\x85\xec\x8b\x9c \xec\x88\x98\xed\x95\x99 \xea\xb8\xb0\xec\xb6\x9c\xeb\xac\xb8\xec\xa0\x9c',\r\n  upcoming: '" + upcoming_desc + b"',\r\n};"

if old2 in content:
    content = content.replace(old2, new2)
    print("Fixed CATEGORY_DESCRIPTIONS!")
else:
    print("CATEGORY_DESCRIPTIONS pattern not found, hex:", old2.hex())
    # Show what we have
    idx = content.find(b"  sagwan: '\xec\x9c\xa1")
    if idx >= 0:
        print("Actual bytes:", repr(content[idx:idx+120]))

with open('scripts/sync-posts.js', 'wb') as f:
    f.write(content)
print("Saved!")
