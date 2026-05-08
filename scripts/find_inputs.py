import re

html = open('ebsi_login.html', encoding='utf-8').read()
inputs = re.findall(r'<input[^>]*>', html)
for i in inputs:
    if 'id=' in i or 'name=' in i:
        print(i)
