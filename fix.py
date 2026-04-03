import re
with open('src/App.js','r') as f: c=f.read()
c=c.replace('\u201c','"').replace('\u201d','"')
c=c.replace('\u2018',"'").replace('\u2019',"'")
c=c.replace('\u2026','...')
c=re.sub(r'\n```\n','\n',c)
c=re.sub(r'\n```$','',c,flags=re.MULTILINE)
with open('src/App.js','w') as f: f.write(c)
