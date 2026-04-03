import re
with open('src/App.js','r') as f: c=f.read()
c=c.replace('\u201c','"').replace('\u201d','"')
c=c.replace('\u2018',"'").replace('\u2019',"'")
c=c.replace('\u2026','...')
c=re.sub('\n`{3}\n','\n',c)
c=re.sub('\n`{3}$','',c,flags=re.MULTILINE)
c=re.sub(r'<div style=\{\{ display: "flex", alignItems: "center", gap: 12 \}\}>.*?</div>',
'<div style={{ textAlign: "center", fontSize: 40, fontWeight: 800, color: "#e8c96d", marginBottom: 16 }}>{calcWeight}kg</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>{[-10,-5,5,10].map(d=>(<button key={d} onClick={()=>setCalcWeight(w=>Math.max(20,w+d))} style={{ padding: "12px 0", background: d<0?"#1e1e1e":"#2e2a1a", border: "1px solid "+(d<0?"#333":"#e8c96d44"), borderRadius: 10, color: d<0?"#aaa":"#e8c96d", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{d>0?"+":""}{d}</button>))}</div>',
c, flags=re.DOTALL)
with open('src/App.js','w') as f: f.write(c)
print("Done!")
