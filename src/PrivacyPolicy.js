import React from “react”;

export default function PrivacyPolicy() {
return (
<div style={{ minHeight: “100vh”, background: “#0f0f0f”, color: “#f0ede8”, fontFamily: “sans-serif”, maxWidth: 480, margin: “0 auto”, padding: “40px 20px 80px”, boxSizing: “border-box” }}>
<div style={{ marginBottom: 32 }}>
<div style={{ display: “flex”, alignItems: “center”, gap: 10, marginBottom: 8 }}>
<span style={{ fontSize: 28 }}>🏋️</span>
<h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: “#e8c96d” }}>StrongLifts 5x5</h1>
</div>
<h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: “#f0ede8” }}>개인정보처리방침</h2>
<p style={{ color: “#555”, fontSize: 13, marginTop: 8 }}>최종 업데이트: 2025년 4월</p>
</div>

```
  {[
    {
      title: "1. 수집하는 개인정보",
      content: "본 앱은 서비스 제공을 위해 다음과 같은 정보를 수집합니다.\n\n• 아이디 (사용자가 직접 설정)\n• 이메일 주소 (비밀번호 찾기 용도)\n• 운동 기록 (중량, 세션 히스토리)"
    },
    {
      title: "2. 개인정보 수집 및 이용 목적",
      content: "수집한 개인정보는 다음 목적으로만 사용됩니다.\n\n• 회원 식별 및 로그인 서비스 제공\n• 비밀번호 분실 시 재설정\n• 개인별 운동 기록 저장 및 관리"
    },
    {
      title: "3. 개인정보 보유 및 이용 기간",
      content: "회원 탈퇴 시 또는 수집 목적 달성 후 즉시 파기합니다. 단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다."
    },
    {
      title: "4. 개인정보의 제3자 제공",
      content: "본 앱은 수집한 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 의한 경우는 예외로 합니다."
    },
    {
      title: "5. 개인정보 보호 조치",
      content: "본 앱은 Google Firebase를 통해 데이터를 안전하게 저장하며, 비밀번호는 암호화되어 관리됩니다."
    },
    {
      title: "6. 이용자의 권리",
      content: "이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있습니다. 앱 내 '내 기록 초기화' 기능을 통해 모든 데이터를 삭제할 수 있으며, 추가 요청은 아래 이메일로 문의해주세요."
    },
    {
      title: "7. 개인정보 책임자",
      content: "이름: 정승재\n이메일: luckyseungjae@naver.com\n\n개인정보와 관련한 불만이나 문의사항은 위 이메일로 연락주시면 신속하게 처리하겠습니다."
    },
    {
      title: "8. 개정 안내",
      content: "본 방침은 법령 또는 서비스 변경에 따라 업데이트될 수 있으며, 변경 시 앱 내 공지를 통해 안내드립니다."
    },
  ].map((section, i) => (
    <div key={i} style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a", marginBottom: 12 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#e8c96d" }}>{section.title}</h3>
      <p style={{ margin: 0, fontSize: 13, color: "#aaa", lineHeight: 1.8, whiteSpace: "pre-line" }}>{section.content}</p>
    </div>
  ))}

  <div style={{ textAlign: "center", marginTop: 32, color: "#333", fontSize: 12 }}>
    © 2025 StrongLifts 5x5 · 정승재
  </div>
</div>
```

);
}
