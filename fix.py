import re
with open('src/App.js','r') as f: c=f.read()
c=c.replace('\u201c','"').replace('\u201d','"')
c=c.replace('\u2018',"'").replace('\u2019',"'")
c=c.replace('\u2026','...')
c=re.sub('\n`{3}\n','\n',c)
c=re.sub('\n`{3}$','',c,flags=re.MULTILINE)
old='<button onClick={() => setCalcWeight(Math.max(20, calcWeight - 5))} style={{ width: 40, height: 40, borderRadius: 10, background: "#222", border: "1px solid #444", color: "#f0ede8", fontSize: 20, cursor: "pointer" }}>\u2212</button>\n            <input type="number" value={calcWeight} onChange={e => setCalcWeight(parseFloat(e.target.value) || 20)}\n              style={{ flex: 1, padding: "10px", background: "#111", border: "1px solid #333", borderRadius: 10, color: "#e8c96d", fontSize: 22, fontWeight: 800, textAlign: "center", outline: "none" }} />\n            <button onClick={() => setCalcWeight(calcWeight + 5)} style={{ width: 40, height: 40, borderRadius: 10, background: "#222", border: "1px solid #444", color: "#f0ede8", fontSize: 20, cursor: "pointer" }}>+</button>'
new='<div style={{ textAlign: "center", fontSize: 40, fontWeight: 800, color: "#e8c96d", marginBottom: 16 }}>{calcWeight}kg</div>\n          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>\n            {[-10, -5, 5, 10].map(delta => (\n              <button key={delta} onClick={() => setCalcWeight(w => Math.max(20, w + delta))} style={{ padding: "12px 0", background: delta < 0 ? "#1e1e1e" : "#2e2a1a", border: "1px solid " + (delta < 0 ? "#333" : "#e8c96d44"), borderRadius: 10, color: delta < 0 ? "#aaa" : "#e8c96d", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{delta > 0 ? "+" : ""}{delta}</button>\n            ))}\n          </div>'
c=c.replace(old,new)
with open('src/App.js','w') as f: f.write(c)
print("Done!")
