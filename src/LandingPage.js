

export default function LandingPage({ onStart }) {
return (
<div style={{ minHeight: “100vh”, background: “#0f0f0f”, color: “#f0ede8”, fontFamily: “sans-serif”, maxWidth: 480, margin: “0 auto”, boxSizing: “border-box” }}>


  {/* 히어로 섹션 */}
  <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #111 100%)", padding: "60px 24px 48px", textAlign: "center", borderBottom: "1px solid #222" }}>
    <div style={{ fontSize: 64, marginBottom: 16 }}>🏋️</div>
    <h1 style={{ margin: "0 0 12px", fontSize: 32, fontWeight: 900, color: "#f0ede8", lineHeight: 1.2 }}>
      StrongLifts 5x5
    </h1>
    <p style={{ margin: "0 0 8px", fontSize: 16, color: "#e8c96d", fontWeight: 600 }}>
      가장 단순하고 검증된 근력 프로그램
    </p>
    <p style={{ margin: "0 0 32px", fontSize: 14, color: "#666", lineHeight: 1.7 }}>
      5가지 핵심 운동으로 전신 근력을 체계적으로 키우세요.<br />
      초보자부터 중급자까지 누구에게나 효과적이에요.
    </p>
    <button onClick={onStart}
      style={{ padding: "16px 40px", background: "linear-gradient(135deg, #e8c96d, #d4a843)", border: "none", borderRadius: 14, fontSize: 17, fontWeight: 800, color: "#111", cursor: "pointer", boxShadow: "0 4px 20px #e8c96d33" }}>
      지금 시작하기 →
    </button>
    <p style={{ marginTop: 12, fontSize: 12, color: "#444" }}>무료 · 가입 필요</p>
  </div>

  {/* 특징 섹션 */}
  <div style={{ padding: "40px 20px" }}>
    <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 800, color: "#f0ede8", textAlign: "center" }}>왜 StrongLifts 5x5인가요?</h2>
    {[
      { emoji: "📈", title: "검증된 효과", desc: "전 세계 수백만 명이 사용한 근력 증가 프로그램이에요. 매 세션마다 중량이 자동으로 올라가요." },
      { emoji: "⚡", title: "단순한 구성", desc: "5가지 운동만 기억하면 돼요. 복잡한 루틴 없이 주 3회 운동으로 최대 효과를 낼 수 있어요." },
      { emoji: "📱", title: "스마트한 기록", desc: "웜업 세트 자동 계산, 휴식 타이머, 중량 증가 자동화까지 — 운동에만 집중하세요." },
      { emoji: "🔒", title: "나만의 기록", desc: "계정을 만들면 모든 운동 기록이 안전하게 저장돼요. 언제 어디서든 확인할 수 있어요." },
    ].map((item, i) => (
      <div key={i} style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: i < 3 ? "1px solid #1a1a1a" : "none" }}>
        <div style={{ fontSize: 32, flexShrink: 0, width: 40, textAlign: "center" }}>{item.emoji}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#f0ede8", marginBottom: 4 }}>{item.title}</div>
          <div style={{ fontSize: 13, color: "#666", lineHeight: 1.7 }}>{item.desc}</div>
        </div>
      </div>
    ))}
  </div>

  {/* 프로그램 구성 */}
  <div style={{ padding: "0 20px 40px" }}>
    <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#f0ede8" }}>프로그램 구성</h2>
    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
      {[
        { label: "워크아웃 A", color: "#6db8e8", exercises: ["하체 운동", "벤치프레스 5x5", "바벨 로우 5x5"] },
        { label: "워크아웃 B", color: "#6de8a0", exercises: ["하체 운동", "오버헤드 프레스 5x5", "데드리프트 1x5"] },
      ].map(w => (
        <div key={w.label} style={{ flex: 1, background: "#1a1a1a", borderRadius: 12, padding: 16, border: "1px solid #2a2a2a" }}>
          <div style={{ fontWeight: 700, color: w.color, fontSize: 13, marginBottom: 10 }}>{w.label}</div>
          {w.exercises.map(e => (
            <div key={e} style={{ fontSize: 12, color: "#888", padding: "4px 0", borderBottom: "1px solid #222" }}>{e}</div>
          ))}
        </div>
      ))}
    </div>
    <p style={{ fontSize: 12, color: "#444", textAlign: "center", margin: 0 }}>A → B → A → B 순으로 번갈아 진행 · 주 3회</p>
  </div>

  {/* 앱 기능 */}
  <div style={{ background: "#111", padding: "40px 20px", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a" }}>
    <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#f0ede8", textAlign: "center" }}>앱 주요 기능</h2>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {[
        { emoji: "🔥", title: "웜업 자동 계산", desc: "본 세트 중량에 맞게 웜업 중량을 자동으로 계산해드려요" },
        { emoji: "⏱️", title: "휴식 타이머", desc: "난이도에 따라 90초~5분 타이머가 자동으로 시작돼요" },
        { emoji: "📊", title: "중량 자동 증가", desc: "성공하면 다음 세션에 자동으로 5kg 올라가요" },
        { emoji: "🧮", title: "원판 계산기", desc: "목표 중량에 필요한 원판 조합을 바로 알려드려요" },
      ].map((item, i) => (
        <div key={i} style={{ background: "#1a1a1a", borderRadius: 12, padding: 14, border: "1px solid #2a2a2a" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>{item.emoji}</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#f0ede8", marginBottom: 4 }}>{item.title}</div>
          <div style={{ fontSize: 11, color: "#666", lineHeight: 1.6 }}>{item.desc}</div>
        </div>
      ))}
    </div>
  </div>

  {/* CTA */}
  <div style={{ padding: "48px 20px", textAlign: "center" }}>
    <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 800, color: "#f0ede8" }}>오늘부터 시작하세요</h2>
    <p style={{ margin: "0 0 28px", fontSize: 14, color: "#666", lineHeight: 1.7 }}>
      복잡하게 생각하지 마세요.<br />
      지금 가입하고 첫 운동을 기록해보세요.
    </p>
    <button onClick={onStart}
      style={{ padding: "16px 40px", background: "linear-gradient(135deg, #e8c96d, #d4a843)", border: "none", borderRadius: 14, fontSize: 17, fontWeight: 800, color: "#111", cursor: "pointer" }}>
      무료로 시작하기 →
    </button>
  </div>

  {/* 푸터 */}
  <div style={{ borderTop: "1px solid #1a1a1a", padding: "24px 20px", textAlign: "center" }}>
    <p style={{ margin: "0 0 8px", fontSize: 12, color: "#333" }}>© 2025 StrongLifts 5x5 · 정승재</p>
    <p style={{ margin: 0, fontSize: 12, color: "#333" }}>
      문의: luckyseungjae@naver.com ·{" "}
      <span onClick={() => window.location.hash = "#privacy"}
        style={{ color: "#555", cursor: "pointer", textDecoration: "underline" }}>
        개인정보처리방침
      </span>
    </p>
  </div>
</div>
```

);
}
