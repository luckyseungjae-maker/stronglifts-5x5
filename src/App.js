import { useState, useEffect } from “react”;
import { db, auth } from “./firebase”;
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, updateDoc, arrayUnion } from “firebase/firestore”;
import { createUserWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider, signInWithEmailAndPassword } from “firebase/auth”;

const EXERCISE_DESC = {
“벤치프레스”: {
target: “가슴, 삼두, 전면 어깨”,
points: [
“벤치에 누워 눈이 바벨 바로 아래에 오도록 위치해요”,
“양발을 바닥에 평평하게 붙이고 등은 자연스럽게 아치를 유지해요”,
“바를 어깨 너비보다 약간 넓게 잡아요”,
“바를 내릴 때 가슴 중앙(유두 라인)으로 내려요”,
“팔꿈치는 몸통과 45~75도 각도를 유지해요”,
“숨을 들이쉬며 내리고, 밀어 올리며 내쉬어요”,
],
caution: “손목이 꺾이지 않게 주의하고, 바를 가슴에 튀기지 마세요.”,
},
“스쿼트”: {
target: “대퇴사두, 둔근, 햄스트링”,
points: [
“발은 어깨 너비로 벌리고 발끝은 30도 정도 바깥으로 향해요”,
“바는 승모근 위(하이바) 또는 승모근 아래(로우바)에 얹어요”,
“가슴을 펴고 시선은 정면 약간 위를 봐요”,
“무릎은 발끝 방향으로 밀어내며 앉아요”,
“허벅지가 바닥과 평행이 될 때까지 내려가요”,
“발꿈치로 바닥을 밀어내듯 일어나요”,
],
caution: “무릎이 안쪽으로 모이지 않도록 주의하고, 허리가 굽지 않게 해요.”,
},
“불가리안 스플릿 스쿼트”: {
target: “대퇴사두, 둔근, 햄스트링 (단다리 집중)”,
points: [
“벤치에서 60~90cm 앞에 서서 뒷발을 벤치 위에 올려요”,
“앞발은 무릎이 발끝을 넘지 않을 위치에 놓아요”,
“상체를 곧게 세우고 시선은 정면을 봐요”,
“앞 무릎이 90도가 될 때까지 수직으로 내려가요”,
“뒷 무릎은 바닥 가까이 내려가요”,
“앞발 뒤꿈치로 밀어내며 올라와요”,
],
caution: “덤벨 중량은 양손 합산으로 입력해요. 균형 잡기 어려우면 처음엔 맨몸으로 시작하세요.”,
},
“바벨 로우”: {
target: “광배근, 승모근, 이두”,
points: [
“발은 어깨 너비, 바는 발 중앙 위에 위치해요”,
“무릎을 살짝 구부리고 엉덩이를 뒤로 빼며 상체를 45~90도 숙여요”,
“바를 오버그립(손등이 위)으로 잡아요”,
“팔꿈치를 뒤로 당기며 배꼽 쪽으로 바를 끌어당겨요”,
“광배근이 수축되는 느낌을 확인해요”,
“천천히 바를 내리며 광배근을 스트레칭해요”,
],
caution: “허리가 둥글게 말리지 않도록 복압을 유지하고 허리를 곧게 펴요.”,
},
“오버헤드 프레스”: {
target: “전면/측면 어깨, 삼두”,
points: [
“발은 어깨 너비, 바는 쇄골 앞에 위치해요”,
“그립은 어깨 너비보다 약간 넓게 잡아요”,
“코어에 힘을 주고 둔근을 조여요”,
“바를 머리 위로 수직으로 밀어 올려요”,
“바가 이마를 지날 때 머리를 살짝 뒤로 빼요”,
“팔이 완전히 펴지면 귀 옆에 오도록 해요”,
],
caution: “허리가 과도하게 꺾이지 않도록 주의하고, 다리 반동을 쓰지 마세요.”,
},
“데드리프트”: {
target: “허리, 둔근, 햄스트링, 전신”,
points: [
“발은 엉덩이 너비, 바는 정강이 가까이(발 중앙) 위치해요”,
“바를 어깨 너비로 잡고 팔은 수직으로 유지해요”,
“엉덩이를 내리고 가슴을 들어 척추를 중립으로 만들어요”,
“발로 바닥을 밀어내듯 하체를 펴며 바를 들어요”,
“바는 항상 몸에 붙여서 올려요”,
“서있는 자세에서 둔근을 조이며 마무리해요”,
],
caution: “데드리프트는 1세트만 해요. 허리가 둥글게 말리는 것이 가장 위험하니 중량보다 자세를 우선해요.”,
},
“덤벨 인클라인 프레스”: {
target: “상부 가슴, 전면 어깨, 삼두”,
points: [
“벤치를 30~45도 각도로 세워요”,
“덤벨을 가슴 옆 높이에서 시작해요”,
“팔꿈치는 몸통과 45~60도 각도를 유지해요”,
“덤벨을 위로 밀어 올리며 가슴을 쥐어짜는 느낌으로 마무리해요”,
“천천히 내리며 가슴 스트레칭을 느껴요”,
],
caution: “너무 높은 각도(70도+)는 어깨 운동이 돼요. 30~45도를 유지하세요.”,
},
“덤벨 컬”: {
target: “이두근, 전완근”,
points: [
“팔을 몸통 옆에 붙이고 손바닥이 앞을 향하게 잡아요”,
“팔꿈치를 고정하고 팔뚝만 올려요”,
“정점에서 이두를 최대로 수축시켜요”,
“천천히 내리며 완전히 펴요”,
“양팔 교대 또는 동시에 모두 가능해요”,
],
caution: “반동을 쓰지 마세요. 팔꿈치가 앞뒤로 흔들리면 중량을 낮추세요.”,
},
“케이블 트라이셉스 푸시다운”: {
target: “삼두근”,
points: [
“케이블 머신 앞에 서서 로프 or 바 핸들을 잡아요”,
“팔꿈치를 몸 옆에 고정해요”,
“팔꿈치만 이용해 아래로 밀어내요”,
“완전히 펴진 상태에서 삼두를 수축시켜요”,
“천천히 올려 팔꿈치 90도까지 돌아와요”,
],
caution: “팔꿈치가 위로 뜨지 않도록 고정하는 게 핵심이에요.”,
},
“플랭크”: {
target: “코어 전체, 복횡근, 척추 기립근”,
points: [
“팔꿈치를 어깨 바로 아래에 위치해요”,
“발끝으로 지탱하며 몸을 일직선으로 만들어요”,
“엉덩이가 올라가거나 내려가지 않도록 해요”,
“복부에 힘을 주고 호흡을 유지해요”,
“목은 중립 위치(바닥을 봐요)를 유지해요”,
],
caution: “버티다가 자세가 무너지면 거기서 멈추세요. 시간보다 자세가 우선이에요.”,
},
“사이드 레터럴 레이즈”: {
target: “측면 어깨(중간 삼각근)”,
points: [
“양손에 덤벨을 들고 서요”,
“팔꿈치를 살짝 구부린 상태로 유지해요”,
“팔을 옆으로 천천히 올려요 (어깨 높이까지)”,
“엄지가 살짝 아래를 향하게 하면 측면 자극이 더 강해요”,
“천천히 내리며 조절해요”,
],
caution: “반동을 쓰지 말고, 어깨 높이 이상 올리면 승모근으로 힘이 분산돼요.”,
},
“페이스풀”: {
target: “후면 어깨, 회전근개, 승모근 하부”,
points: [
“케이블이나 밴드를 눈 높이에 맞춰 설정해요”,
“팔꿈치를 어깨 높이로 유지하며 뒤로 당겨요”,
“손이 얼굴 양옆으로 오도록 당겨요”,
“후면 어깨와 등 상부를 수축시켜요”,
“천천히 돌아가며 스트레칭해요”,
],
caution: “가벼운 중량으로 자세에 집중하세요. 어깨 건강에 매우 중요한 운동이에요.”,
},
“렛풀다운”: {
target: “광배근, 이두, 승모근 하부”,
points: [
“그립을 어깨 너비보다 넓게 잡아요”,
“가슴을 펴고 약간 뒤로 기울어요”,
“바를 쇄골 앞쪽으로 내려요”,
“팔꿈치를 옆구리 쪽으로 당기는 느낌으로 해요”,
“천천히 올리며 광배근을 스트레칭해요”,
],
caution: “목 뒤로 내리는 넥 풀다운은 경추에 위험해요. 항상 앞으로 내려요.”,
},
“행잉 레그레이즈”: {
target: “하복부, 장요근, 코어”,
points: [
“철봉에 매달려 몸을 안정시켜요”,
“다리를 모으고 무릎을 살짝 구부려요”,
“복부에 힘을 주며 다리를 올려요”,
“엉덩이가 뒤로 빠지지 않도록 해요”,
“천천히 내리며 컨트롤해요”,
],
caution: “반동을 쓰지 마세요. 처음엔 무릎을 구부려서 시작하면 더 쉬워요.”,
},
};

const ACCESSORY_WORKOUTS = {
A: [
{ name: “덤벨 인클라인 프레스”, sets: 3, minReps: 8, maxReps: 12, increment: 2.5, isAccessory: true },
{ name: “덤벨 컬”, sets: 3, minReps: 8, maxReps: 12, increment: 2.5, isAccessory: true },
{ name: “케이블 트라이셉스 푸시다운”, sets: 3, minReps: 10, maxReps: 12, increment: 2.5, isAccessory: true },
{ name: “플랭크”, sets: 3, minReps: 60, maxReps: 60, increment: 0, isAccessory: true, isPlank: true },
],
B: [
{ name: “사이드 레터럴 레이즈”, sets: 3, minReps: 12, maxReps: 15, increment: 2.5, isAccessory: true },
{ name: “페이스풀”, sets: 3, minReps: 15, maxReps: 15, increment: 2.5, isAccessory: true },
{ name: “렛풀다운”, sets: 3, minReps: 8, maxReps: 10, increment: 2.5, isAccessory: true },
{ name: “행잉 레그레이즈”, sets: 3, minReps: 12, maxReps: 12, increment: 0, isAccessory: true, isBodyweight: true },
],
};

const LOWER_OPTIONS = {
bulgarian: { name: “불가리안 스플릿 스쿼트”, sets: 3, reps: 8, increment: 5, note: “양손 합산 각 다리”, isBulgarian: true },
squat: { name: “스쿼트”, sets: 5, reps: 5, increment: 5 },
};

const getWorkouts = (lowerType) => ({
A: [
LOWER_OPTIONS[lowerType],
{ name: “벤치프레스”, sets: 5, reps: 5, increment: 5 },
{ name: “바벨 로우”, sets: 5, reps: 5, increment: 5 },
],
B: [
LOWER_OPTIONS[lowerType],
{ name: “오버헤드 프레스”, sets: 5, reps: 5, increment: 5 },
{ name: “데드리프트”, sets: 1, reps: 5, increment: 5 },
],
});

const DEFAULT_WEIGHTS = {
“불가리안 스플릿 스쿼트”: 20,
“스쿼트”: 60,
“벤치프레스”: 40,
“바벨 로우”: 40,
“오버헤드 프레스”: 20,
“데드리프트”: 60,
};

const DEFAULT_ACCESSORY_WEIGHTS = {
“덤벨 인클라인 프레스”: 0,
“덤벨 컬”: 0,
“케이블 트라이셉스 푸시다운”: 0,
“플랭크”: 0,
“사이드 레터럴 레이즈”: 0,
“페이스풀”: 0,
“렛풀다운”: 0,
“행잉 레그레이즈”: 0,
};

// 플랭크 시간 자동 증가: 60 → 75 → 90
const getPlankDuration = (weight) => {
if (weight <= 0) return 60;
if (weight === 1) return 75;
return 90;
};

const TABS = [“오늘 운동”, “기록”, “중량 계산기”, “가이드”];
const EXERCISE_NAMES = [“벤치프레스”, “스쿼트”, “불가리안 스플릿 스쿼트”, “바벨 로우”, “오버헤드 프레스”, “데드리프트”];
const ACCESSORY_NAMES = Object.keys(DEFAULT_ACCESSORY_WEIGHTS);
const EXERCISE_COLORS = {
“벤치프레스”: “#e8c96d”,
“스쿼트”: “#6db8e8”,
“불가리안 스플릿 스쿼트”: “#6de8a0”,
“바벨 로우”: “#e87a6d”,
“오버헤드 프레스”: “#b06de8”,
“데드리프트”: “#e8a06d”,
“덤벨 인클라인 프레스”: “#e8c96d”,
“덤벨 컬”: “#6db8e8”,
“케이블 트라이셉스 푸시다운”: “#b06de8”,
“플랭크”: “#6de8a0”,
“사이드 레터럴 레이즈”: “#e87a6d”,
“페이스풀”: “#6db8e8”,
“렛풀다운”: “#6de8a0”,
“행잉 레그레이즈”: “#e8a06d”,
};

const formatDate = (d) =>
new Date(d).toLocaleDateString(“ko-KR”, { month: “short”, day: “numeric”, weekday: “short” });

const formatDateShort = (d) =>
new Date(d).toLocaleDateString(“ko-KR”, { month: “numeric”, day: “numeric” });

const formatDateTime = (d) =>
new Date(d).toLocaleString(“ko-KR”, { month: “short”, day: “numeric”, hour: “2-digit”, minute: “2-digit” });

const getWarmupSets = (weight, isBulgarian) => {
if (isBulgarian) {
return [
{ label: “맨몸”, weight: 0, reps: 10 },
{ label: “웜업 1”, weight: Math.max(2, Math.round(weight * 0.25 / 2) * 2), reps: 8 },
{ label: “웜업 2”, weight: Math.max(4, Math.round(weight * 0.5 / 2) * 2), reps: 5 },
];
}
return [
{ label: “웜업 1”, weight: Math.max(20, Math.round(weight * 0.4 / 10) * 10), reps: 5 },
{ label: “웜업 2”, weight: Math.max(20, Math.round(weight * 0.6 / 10) * 10), reps: 3 },
{ label: “웜업 3”, weight: Math.max(20, Math.round(weight * 0.8 / 10) * 10), reps: 2 },
];
};

// 중량 직접 입력 가능한 컴포넌트 (탭하면 input, blur시 확정)
function WeightInput({ value, onChange, color = “#e8c96d”, step = 2.5, unit = “kg”, minVal = 0 }) {
const [editing, setEditing] = useState(false);
const [raw, setRaw] = useState(””);

const startEdit = () => {
setRaw(value === 0 ? “” : String(value));
setEditing(true);
};

const commitEdit = () => {
const parsed = parseFloat(raw);
if (!isNaN(parsed) && parsed >= minVal) {
// 반올림: step 단위로 맞춤
const rounded = Math.round(parsed / step) * step;
onChange(Math.max(minVal, rounded));
}
setEditing(false);
};

if (editing) return (
<input
autoFocus
type=“number”
value={raw}
onChange={e => setRaw(e.target.value)}
onBlur={commitEdit}
onKeyDown={e => { if (e.key === “Enter”) commitEdit(); if (e.key === “Escape”) setEditing(false); }}
style={{
width: 62, padding: “4px 6px”, background: “#111”, border: “1px solid “ + color,
borderRadius: 8, color: color, fontSize: 15, fontWeight: 700, textAlign: “center”,
outline: “none”, boxSizing: “border-box”
}}
/>
);

return (
<span
onClick={startEdit}
style={{
fontSize: 16, fontWeight: 700, color, minWidth: 62, textAlign: “center”,
display: “inline-block”, padding: “4px 8px”, borderRadius: 8,
border: “1px solid “ + color + “33”, cursor: “text”, userSelect: “none”
}}
title=“탭해서 직접 입력”
>
{value}{unit}
</span>
);
}

function ExerciseDescPanel({ name, onClose }) {
const desc = EXERCISE_DESC[name];
if (!desc) return null;
const color = EXERCISE_COLORS[name] || “#e8c96d”;
return (
<div style={{ position: “fixed”, inset: 0, background: “rgba(0,0,0,0.85)”, zIndex: 200, display: “flex”, alignItems: “flex-end” }}>
<div style={{ background: “#1a1a1a”, borderRadius: “20px 20px 0 0”, padding: 24, width: “100%”, maxWidth: 480, margin: “0 auto”, maxHeight: “80vh”, overflowY: “auto” }}>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 16 }}>
<h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: color }}>{name}</h2>
<button onClick={onClose} style={{ background: “#222”, border: “1px solid #333”, borderRadius: 8, color: “#aaa”, padding: “6px 14px”, cursor: “pointer”, fontSize: 13 }}>닫기</button>
</div>
<div style={{ background: “#111”, borderRadius: 10, padding: “8px 14px”, marginBottom: 16 }}>
<span style={{ fontSize: 12, color: “#666” }}>주요 자극 근육: </span>
<span style={{ fontSize: 12, color: color, fontWeight: 700 }}>{desc.target}</span>
</div>
<h3 style={{ margin: “0 0 10px”, fontSize: 14, color: “#f0ede8”, fontWeight: 700 }}>자세 포인트</h3>
{desc.points.map((p, i) => (
<div key={i} style={{ display: “flex”, gap: 10, padding: “8px 0”, borderBottom: “1px solid #222” }}>
<div style={{ width: 22, height: 22, borderRadius: “50%”, background: color + “22”, border: “1px solid “ + color + “44”, display: “flex”, alignItems: “center”, justifyContent: “center”, fontSize: 11, fontWeight: 800, color: color, flexShrink: 0 }}>{i + 1}</div>
<span style={{ fontSize: 13, color: “#aaa”, lineHeight: 1.7 }}>{p}</span>
</div>
))}
{desc.caution && (
<div style={{ background: “#2e1a1a”, border: “1px solid #5a2020”, borderRadius: 10, padding: 14, marginTop: 16 }}>
<span style={{ fontSize: 12, color: “#e87a6d”, fontWeight: 700 }}>주의사항: </span>
<span style={{ fontSize: 12, color: “#aaa”, lineHeight: 1.7 }}>{desc.caution}</span>
</div>
)}
</div>
</div>
);
}

function WeightGraph({ history, exerciseName }) {
const data = [];
const reversed = […history].reverse();
for (const h of reversed) {
const result = h.results.find(r => r.name === exerciseName);
if (result) data.push({ date: h.date, weight: result.weight, success: result.success });
}
if (data.length < 2) return (
<div style={{ textAlign: “center”, color: “#444”, fontSize: 13, padding: “20px 0” }}>
기록이 2개 이상 쌓이면 그래프가 표시돼요
</div>
);
const weights = data.map(d => d.weight);
const minW = Math.min(…weights) - 5;
const maxW = Math.max(…weights) + 5;
const range = maxW - minW || 1;
const W = 300, H = 120;
const pad = { l: 36, r: 10, t: 10, b: 24 };
const gw = W - pad.l - pad.r;
const gh = H - pad.t - pad.b;
const px = (i) => pad.l + (i / (data.length - 1)) * gw;
const py = (w) => pad.t + gh - ((w - minW) / range) * gh;
const pathD = data.map((d, i) => (i === 0 ? “M” : “L”) + px(i).toFixed(1) + “,” + py(d.weight).toFixed(1)).join(” “);
const color = EXERCISE_COLORS[exerciseName] || “#e8c96d”;
const yTicks = [minW + 5, minW + Math.round(range / 2), maxW - 5].filter((v, i, a) => a.indexOf(v) === i);
const xTicks = data.length <= 6 ? data.map((_, i) => i) : [0, Math.floor((data.length - 1) / 2), data.length - 1];
return (
<svg width=“100%” viewBox={“0 0 “ + W + “ “ + H} style={{ display: “block” }}>
{yTicks.map(v => (
<g key={v}>
<line x1={pad.l} y1={py(v).toFixed(1)} x2={W - pad.r} y2={py(v).toFixed(1)} stroke=”#1e1e1e” strokeWidth=“1” />
<text x={pad.l - 4} y={py(v) + 4} textAnchor=“end” fill=”#444” fontSize=“9”>{v}</text>
</g>
))}
<path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
<path d={pathD + “ L” + px(data.length - 1).toFixed(1) + “,” + (H - pad.b) + “ L” + pad.l + “,” + (H - pad.b) + “ Z”} fill={color} fillOpacity=“0.08” />
{data.map((d, i) => (
<circle key={i} cx={px(i).toFixed(1)} cy={py(d.weight).toFixed(1)} r=“3” fill={d.success ? color : “#e86d6d”} stroke=”#0f0f0f” strokeWidth=“1.5” />
))}
{xTicks.map(i => (
<text key={i} x={px(i).toFixed(1)} y={H - pad.b + 14} textAnchor=“middle” fill=”#444” fontSize=“9”>{formatDateShort(data[i].date)}</text>
))}
</svg>
);
}

// 보조운동 그래프: 플랭크는 시간(초), 맨몸운동은 횟수, 나머지는 kg
function AccessoryGraph({ history, exerciseName }) {
const ex = […ACCESSORY_WORKOUTS.A, …ACCESSORY_WORKOUTS.B].find(e => e.name === exerciseName);
const isPlank = ex && ex.isPlank;
const isBodyweight = ex && ex.isBodyweight;

const data = [];
const reversed = […history].reverse();
for (const h of reversed) {
if (!h.accessoryResults) continue;
const result = h.accessoryResults.find(r => r.name === exerciseName);
if (result) {
const val = isPlank ? result.plankSeconds : (isBodyweight ? result.reps : result.weight);
data.push({ date: h.date, weight: val, success: result.success });
}
}
if (data.length < 2) return (
<div style={{ textAlign: “center”, color: “#444”, fontSize: 13, padding: “20px 0” }}>
기록이 2개 이상 쌓이면 그래프가 표시돼요
</div>
);
const weights = data.map(d => d.weight);
const minW = Math.min(…weights) - (isPlank ? 5 : 2);
const maxW = Math.max(…weights) + (isPlank ? 5 : 2);
const range = maxW - minW || 1;
const W = 300, H = 120;
const pad = { l: 36, r: 10, t: 10, b: 24 };
const gw = W - pad.l - pad.r;
const gh = H - pad.t - pad.b;
const pxFn = (i) => pad.l + (i / (data.length - 1)) * gw;
const pyFn = (w) => pad.t + gh - ((w - minW) / range) * gh;
const pathD = data.map((d, i) => (i === 0 ? “M” : “L”) + pxFn(i).toFixed(1) + “,” + pyFn(d.weight).toFixed(1)).join(” “);
const color = EXERCISE_COLORS[exerciseName] || “#e8c96d”;
const yTicks = [minW + (isPlank ? 5 : 1), minW + Math.round(range / 2), maxW - (isPlank ? 5 : 1)].filter((v, i, a) => a.indexOf(v) === i);
const xTicks = data.length <= 6 ? data.map((_, i) => i) : [0, Math.floor((data.length - 1) / 2), data.length - 1];
const unit = isPlank ? “초” : (isBodyweight ? “회” : “kg”);
return (
<svg width=“100%” viewBox={“0 0 “ + W + “ “ + H} style={{ display: “block” }}>
{yTicks.map(v => (
<g key={v}>
<line x1={pad.l} y1={pyFn(v).toFixed(1)} x2={W - pad.r} y2={pyFn(v).toFixed(1)} stroke=”#1e1e1e” strokeWidth=“1” />
<text x={pad.l - 4} y={pyFn(v) + 4} textAnchor=“end” fill=”#444” fontSize=“9”>{v}{unit}</text>
</g>
))}
<path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
<path d={pathD + “ L” + pxFn(data.length - 1).toFixed(1) + “,” + (H - pad.b) + “ L” + pad.l + “,” + (H - pad.b) + “ Z”} fill={color} fillOpacity=“0.08” />
{data.map((d, i) => (
<circle key={i} cx={pxFn(i).toFixed(1)} cy={pyFn(d.weight).toFixed(1)} r=“3” fill={d.success ? color : “#e86d6d”} stroke=”#0f0f0f” strokeWidth=“1.5” />
))}
{xTicks.map(i => (
<text key={i} x={pxFn(i).toFixed(1)} y={H - pad.b + 14} textAnchor=“middle” fill=”#444” fontSize=“9”>{formatDateShort(data[i].date)}</text>
))}
</svg>
);
}

async function loginUser(uid, pw) {
const ref = doc(db, “users”, uid);
const snap = await getDoc(ref);
if (!snap.exists()) return { ok: false, error: “존재하지 않는 아이디예요.” };
if (snap.data().pw !== pw) return { ok: false, error: “비밀번호가 틀렸어요.” };
try {
await signInWithEmailAndPassword(auth, snap.data().email, pw);
} catch (e) {}
await updateDoc(ref, {
loginHistory: arrayUnion({ time: Date.now(), device: navigator.userAgent.includes(“Mobile”) ? “모바일” : “PC” })
});
return { ok: true, isAdmin: snap.data().isAdmin || false };
}

async function registerUser(uid, pw, email, initialWeights, initialAccessoryWeights) {
const ref = doc(db, “users”, uid);
const snap = await getDoc(ref);
if (snap.exists()) return { ok: false, error: “이미 사용 중인 아이디예요.” };
if (pw.length < 6) return { ok: false, error: “비밀번호는 6자 이상이어야 해요.” };
try {
await createUserWithEmailAndPassword(auth, email, pw);
} catch (e) {
if (e.code === “auth/email-already-in-use”) return { ok: false, error: “이미 사용 중인 이메일이에요.” };
if (e.code === “auth/invalid-email”) return { ok: false, error: “올바른 이메일 형식이 아니에요.” };
if (e.code === “auth/weak-password”) return { ok: false, error: “비밀번호는 6자 이상이어야 해요.” };
return { ok: false, error: “회원가입 오류: “ + e.message };
}
const allUsers = await getDocs(collection(db, “users”));
const isAdmin = allUsers.empty;
await setDoc(ref, { pw, email, isAdmin, loginHistory: [{ time: Date.now(), device: navigator.userAgent.includes(“Mobile”) ? “모바일” : “PC” }] });
if (initialWeights) {
await setDoc(doc(db, “userData”, uid), {
weights: initialWeights,
accessoryWeights: initialAccessoryWeights || Object.assign({}, DEFAULT_ACCESSORY_WEIGHTS),
history: [],
next: “A”,
fails: {}
});
}
return { ok: true, isAdmin };
}

async function resetPassword(email) {
try {
await sendPasswordResetEmail(auth, email);
return { ok: true };
} catch (e) {
if (e.code === “auth/user-not-found”) return { ok: false, error: “해당 이메일로 가입된 계정이 없어요.” };
if (e.code === “auth/invalid-email”) return { ok: false, error: “올바른 이메일 형식이 아니에요.” };
return { ok: false, error: “오류가 발생했어요. 다시 시도해주세요.” };
}
}

async function loadUserData(uid) {
const ref = doc(db, “userData”, uid);
const snap = await getDoc(ref);
return snap.exists() ? snap.data() : null;
}

async function saveUserData(uid, data) {
await setDoc(doc(db, “userData”, uid), data);
}

async function deleteUser(uid) {
await deleteDoc(doc(db, “users”, uid));
await deleteDoc(doc(db, “userData”, uid));
}

async function getAllUsers() {
const snap = await getDocs(collection(db, “users”));
const result = {};
snap.forEach(d => { result[d.id] = d.data(); });
return result;
}

function LoginScreen({ onLogin }) {
const [id, setId] = useState(””);
const [pw, setPw] = useState(””);
const [email, setEmail] = useState(””);
const [mode, setMode] = useState(“login”);
const [error, setError] = useState(””);
const [loading, setLoading] = useState(false);
const [step, setStep] = useState(“auth”);
const [pendingUid, setPendingUid] = useState(””);
const [pendingPw, setPendingPw] = useState(””);
const [pendingEmail, setPendingEmail] = useState(””);
const [initWeights, setInitWeights] = useState(Object.assign({}, DEFAULT_WEIGHTS));
const [initAccessoryWeights, setInitAccessoryWeights] = useState(Object.assign({}, DEFAULT_ACCESSORY_WEIGHTS));
const [weightStep, setWeightStep] = useState(“main”); // “main” | “accessory”
const [resetEmail, setResetEmail] = useState(””);
const [resetSent, setResetSent] = useState(false);

const inputStyle = { width: “100%”, padding: “12px 14px”, background: “#111”, border: “1px solid #333”, borderRadius: 10, color: “#f0ede8”, fontSize: 15, outline: “none”, boxSizing: “border-box” };

const handle = async () => {
if (!id.trim() || !pw.trim()) { setError(“아이디와 비밀번호를 입력해주세요.”); return; }
if (mode === “register” && !email.trim()) { setError(“이메일을 입력해주세요.”); return; }
setLoading(true); setError(””);
try {
if (mode === “login”) {
const res = await loginUser(id.trim(), pw);
if (!res.ok) { setError(res.error); return; }
onLogin(id.trim(), res.isAdmin);
} else {
setPendingUid(id.trim()); setPendingPw(pw); setPendingEmail(email.trim());
setStep(“weights”); setWeightStep(“main”);
}
} catch (e) { setError(“오류가 발생했어요. Firebase 설정을 확인해주세요.”); }
finally { setLoading(false); }
};

const handleWeightsDone = async () => {
setLoading(true);
try {
const res = await registerUser(pendingUid, pendingPw, pendingEmail, initWeights, initAccessoryWeights);
if (!res.ok) { setError(res.error); setStep(“auth”); return; }
onLogin(pendingUid, res.isAdmin);
} catch (e) { setError(“오류가 발생했어요.”); setStep(“auth”); }
finally { setLoading(false); }
};

const handleReset = async () => {
if (!resetEmail.trim()) { setError(“이메일을 입력해주세요.”); return; }
setLoading(true); setError(””);
try {
const res = await resetPassword(resetEmail.trim());
if (!res.ok) { setError(res.error); return; }
setResetSent(true);
} finally { setLoading(false); }
};

if (step === “reset”) return (
<div style={{ minHeight: “100vh”, background: “#0f0f0f”, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: 20 }}>
<div style={{ width: “100%”, maxWidth: 400 }}>
<div style={{ textAlign: “center”, marginBottom: 32 }}>
<div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
<h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: “#f0ede8” }}>비밀번호 찾기</h2>
<p style={{ color: “#555”, fontSize: 13, marginTop: 6 }}>가입 시 사용한 이메일로 재설정 링크를 보내드려요</p>
</div>
{resetSent ? (
<div style={{ background: “#1a2e1a”, border: “1px solid #2a4a2a”, borderRadius: 14, padding: 24, textAlign: “center” }}>
<div style={{ fontSize: 36, marginBottom: 12 }}>✉️</div>
<div style={{ color: “#6de8a0”, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>이메일을 보냈어요!</div>
<div style={{ color: “#888”, fontSize: 13, lineHeight: 1.7 }}>{resetEmail} 로 비밀번호 재설정 링크를 전송했어요.</div>
<button onClick={() => { setStep(“auth”); setResetSent(false); setResetEmail(””); }}
style={{ marginTop: 20, width: “100%”, padding: “13px”, background: “linear-gradient(135deg, #e8c96d, #d4a843)”, border: “none”, borderRadius: 12, fontSize: 15, fontWeight: 800, color: “#111”, cursor: “pointer” }}>
로그인으로 돌아가기
</button>
</div>
) : (
<div style={{ background: “#1a1a1a”, borderRadius: 16, padding: 24, border: “1px solid #2a2a2a” }}>
<div style={{ marginBottom: 20 }}>
<label style={{ fontSize: 13, color: “#888”, display: “block”, marginBottom: 6 }}>이메일</label>
<input value={resetEmail} onChange={e => setResetEmail(e.target.value)} onKeyDown={e => e.key === “Enter” && handleReset()} placeholder=“가입 시 이메일 입력” style={inputStyle} />
</div>
{error && <div style={{ background: “#2e1a1a”, border: “1px solid #5a2020”, borderRadius: 8, padding: “10px 14px”, color: “#e87a6d”, fontSize: 13, marginBottom: 16 }}>{error}</div>}
<button onClick={handleReset} disabled={loading}
style={{ width: “100%”, padding: “14px”, background: loading ? “#555” : “linear-gradient(135deg, #e8c96d, #d4a843)”, border: “none”, borderRadius: 12, fontSize: 15, fontWeight: 800, color: “#111”, cursor: loading ? “default” : “pointer”, marginBottom: 10 }}>
{loading ? “전송 중…” : “재설정 링크 보내기”}
</button>
<button onClick={() => { setStep(“auth”); setError(””); }}
style={{ width: “100%”, padding: “12px”, background: “none”, border: “1px solid #2a2a2a”, borderRadius: 12, fontSize: 14, color: “#555”, cursor: “pointer” }}>
뒤로 가기
</button>
</div>
)}
</div>
</div>
);

if (step === “weights”) {
// 메인 운동 중량 설정
if (weightStep === “main”) return (
<div style={{ minHeight: “100vh”, background: “#0f0f0f”, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: 20 }}>
<div style={{ width: “100%”, maxWidth: 400 }}>
<div style={{ textAlign: “center”, marginBottom: 24 }}>
<div style={{ fontSize: 40, marginBottom: 8 }}>⚖️</div>
<h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: “#f0ede8” }}>메인 운동 시작 중량</h2>
<p style={{ color: “#555”, fontSize: 13, marginTop: 6 }}>각 운동의 시작 중량을 입력해주세요 (1/2)</p>
</div>
<div style={{ background: “#1a1a1a”, borderRadius: 16, padding: 20, border: “1px solid #2a2a2a”, marginBottom: 16 }}>
{Object.entries(initWeights).map(([name, w]) => (
<div key={name} style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, padding: “10px 0”, borderBottom: “1px solid #222” }}>
<span style={{ fontSize: 14, color: “#f0ede8” }}>{name}</span>
<div style={{ display: “flex”, alignItems: “center”, gap: 8 }}>
<button onClick={() => setInitWeights(prev => Object.assign({}, prev, { [name]: Math.max(0, prev[name] - 5) }))}
style={{ width: 32, height: 32, borderRadius: 8, background: “#222”, border: “1px solid #444”, color: “#f0ede8”, fontSize: 18, cursor: “pointer” }}>-</button>
<span style={{ fontSize: 16, fontWeight: 700, color: “#e8c96d”, minWidth: 50, textAlign: “center” }}>{w}kg</span>
<button onClick={() => setInitWeights(prev => Object.assign({}, prev, { [name]: prev[name] + 5 }))}
style={{ width: 32, height: 32, borderRadius: 8, background: “#222”, border: “1px solid #444”, color: “#f0ede8”, fontSize: 18, cursor: “pointer” }}>+</button>
</div>
</div>
))}
</div>
{error && <div style={{ background: “#2e1a1a”, border: “1px solid #5a2020”, borderRadius: 8, padding: “10px 14px”, color: “#e87a6d”, fontSize: 13, marginBottom: 16 }}>{error}</div>}
<button onClick={() => setWeightStep(“accessory”)}
style={{ width: “100%”, padding: “14px”, background: “linear-gradient(135deg, #e8c96d, #d4a843)”, border: “none”, borderRadius: 12, fontSize: 15, fontWeight: 800, color: “#111”, cursor: “pointer” }}>
다음 → 보조운동 중량 설정
</button>
</div>
</div>
);

```
// 보조운동 중량 설정
return (
  <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ width: "100%", maxWidth: 400 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🏅</div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f0ede8" }}>보조운동 시작 중량</h2>
        <p style={{ color: "#555", fontSize: 13, marginTop: 6 }}>모르면 0으로 두고 나중에 기록 탭에서 수정할 수 있어요 (2/2)</p>
      </div>
      <div style={{ background: "#1a1a1a", borderRadius: 16, padding: 20, border: "1px solid #2a2a2a", marginBottom: 16 }}>
        {/* 워크아웃 A */}
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6db8e8", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #222" }}>워크아웃 A 보조운동</div>
        {ACCESSORY_WORKOUTS.A.map(({ name, isPlank, isBodyweight }) => {
          const w = initAccessoryWeights[name] || 0;
          if (isPlank || isBodyweight) return (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e1e1e" }}>
              <span style={{ fontSize: 13, color: "#888" }}>{name}</span>
              <span style={{ fontSize: 12, color: "#555", fontStyle: "italic" }}>{isPlank ? "자동 설정 (60초~)" : "맨몸"}</span>
            </div>
          );
          return (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e1e1e" }}>
              <span style={{ fontSize: 13, color: "#f0ede8" }}>{name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setInitAccessoryWeights(prev => Object.assign({}, prev, { [name]: Math.max(0, (prev[name] || 0) - 2.5) }))}
                  style={{ width: 32, height: 32, borderRadius: 8, background: "#222", border: "1px solid #444", color: "#f0ede8", fontSize: 18, cursor: "pointer" }}>-</button>
                <WeightInput
                  value={initAccessoryWeights[name] || 0}
                  onChange={val => setInitAccessoryWeights(prev => Object.assign({}, prev, { [name]: val }))}
                  step={2.5}
                />
                <button onClick={() => setInitAccessoryWeights(prev => Object.assign({}, prev, { [name]: (prev[name] || 0) + 2.5 }))}
                  style={{ width: 32, height: 32, borderRadius: 8, background: "#222", border: "1px solid #444", color: "#f0ede8", fontSize: 18, cursor: "pointer" }}>+</button>
              </div>
            </div>
          );
        })}
        {/* 워크아웃 B */}
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6de8a0", margin: "14px 0 10px", paddingBottom: 6, borderBottom: "1px solid #222" }}>워크아웃 B 보조운동</div>
        {ACCESSORY_WORKOUTS.B.map(({ name, isBodyweight }) => {
          const w = initAccessoryWeights[name] || 0;
          if (isBodyweight) return (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e1e1e" }}>
              <span style={{ fontSize: 13, color: "#888" }}>{name}</span>
              <span style={{ fontSize: 12, color: "#555", fontStyle: "italic" }}>맨몸</span>
            </div>
          );
          return (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e1e1e" }}>
              <span style={{ fontSize: 13, color: "#f0ede8" }}>{name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setInitAccessoryWeights(prev => Object.assign({}, prev, { [name]: Math.max(0, (prev[name] || 0) - 2.5) }))}
                  style={{ width: 32, height: 32, borderRadius: 8, background: "#222", border: "1px solid #444", color: "#f0ede8", fontSize: 18, cursor: "pointer" }}>-</button>
                <WeightInput
                  value={initAccessoryWeights[name] || 0}
                  onChange={val => setInitAccessoryWeights(prev => Object.assign({}, prev, { [name]: val }))}
                  step={2.5}
                />
                <button onClick={() => setInitAccessoryWeights(prev => Object.assign({}, prev, { [name]: (prev[name] || 0) + 2.5 }))}
                  style={{ width: 32, height: 32, borderRadius: 8, background: "#222", border: "1px solid #444", color: "#f0ede8", fontSize: 18, cursor: "pointer" }}>+</button>
              </div>
            </div>
          );
        })}
      </div>
      {error && <div style={{ background: "#2e1a1a", border: "1px solid #5a2020", borderRadius: 8, padding: "10px 14px", color: "#e87a6d", fontSize: 13, marginBottom: 16 }}>{error}</div>}
      <button onClick={handleWeightsDone} disabled={loading}
        style={{ width: "100%", padding: "14px", background: loading ? "#555" : "linear-gradient(135deg, #e8c96d, #d4a843)", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, color: "#111", cursor: "pointer", marginBottom: 10 }}>
        {loading ? "처리 중..." : "🚀 시작하기"}
      </button>
      <button onClick={() => setWeightStep("main")}
        style={{ width: "100%", padding: "12px", background: "none", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 14, color: "#555", cursor: "pointer" }}>
        ← 메인 운동 중량으로 돌아가기
      </button>
    </div>
  </div>
);
```

}

return (
<div style={{ minHeight: “100vh”, background: “#0f0f0f”, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: 20 }}>
<div style={{ width: “100%”, maxWidth: 400 }}>
<div style={{ textAlign: “center”, marginBottom: 36 }}>
<div style={{ fontSize: 48, marginBottom: 8 }}>🏋️</div>
<h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: “#f0ede8” }}>SetUp</h1>
<p style={{ color: “#555”, fontSize: 13, marginTop: 6 }}>나만의 운동 기록을 관리하세요</p>
</div>
<div style={{ display: “flex”, background: “#1a1a1a”, borderRadius: 12, padding: 4, marginBottom: 24 }}>
{[[“login”, “로그인”], [“register”, “회원가입”]].map(([v, label]) => (
<button key={v} onClick={() => { setMode(v); setError(””); }}
style={{ flex: 1, padding: “10px”, border: “none”, borderRadius: 9, background: mode === v ? “#e8c96d” : “none”, color: mode === v ? “#111” : “#555”, fontWeight: mode === v ? 700 : 400, fontSize: 14, cursor: “pointer” }}>
{label}
</button>
))}
</div>
<div style={{ background: “#1a1a1a”, borderRadius: 16, padding: 24, border: “1px solid #2a2a2a” }}>
<div style={{ marginBottom: 16 }}>
<label style={{ fontSize: 13, color: “#888”, display: “block”, marginBottom: 6 }}>아이디</label>
<input value={id} onChange={e => setId(e.target.value)} onKeyDown={e => e.key === “Enter” && handle()} placeholder=“아이디 입력” style={inputStyle} />
</div>
{mode === “register” && (
<div style={{ marginBottom: 16 }}>
<label style={{ fontSize: 13, color: “#888”, display: “block”, marginBottom: 6 }}>이메일 <span style={{ color: “#555”, fontSize: 11 }}>(비밀번호 찾기에 사용돼요)</span></label>
<input type=“email” value={email} onChange={e => setEmail(e.target.value)} placeholder=“이메일 입력” style={inputStyle} />
</div>
)}
<div style={{ marginBottom: mode === “login” ? 8 : 20 }}>
<label style={{ fontSize: 13, color: “#888”, display: “block”, marginBottom: 6 }}>
비밀번호{mode === “register” && <span style={{ color: “#555”, fontSize: 11 }}> (6자 이상)</span>}
</label>
<input type=“password” value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === “Enter” && handle()} placeholder=“비밀번호 입력” style={inputStyle} />
</div>
{mode === “login” && (
<div style={{ textAlign: “right”, marginBottom: 16 }}>
<button onClick={() => { setStep(“reset”); setError(””); }}
style={{ background: “none”, border: “none”, color: “#6db8e8”, fontSize: 12, cursor: “pointer”, padding: 0 }}>
비밀번호를 잊으셨나요?
</button>
</div>
)}
{error && <div style={{ background: “#2e1a1a”, border: “1px solid #5a2020”, borderRadius: 8, padding: “10px 14px”, color: “#e87a6d”, fontSize: 13, marginBottom: 16 }}>{error}</div>}
<button onClick={handle} disabled={loading}
style={{ width: “100%”, padding: “14px”, background: loading ? “#555” : “linear-gradient(135deg, #e8c96d, #d4a843)”, border: “none”, borderRadius: 12, fontSize: 15, fontWeight: 800, color: “#111”, cursor: loading ? “default” : “pointer” }}>
{loading ? “처리 중…” : mode === “login” ? “로그인” : “회원가입”}
</button>
</div>
<p style={{ textAlign: “center”, color: “#333”, fontSize: 12, marginTop: 20 }}>첫 번째 가입자는 자동으로 관리자가 됩니다</p>
</div>
</div>
);
}

function AdminPanel({ currentUid, onClose }) {
const [users, setUsers] = useState({});
const [loading, setLoading] = useState(true);
const [confirm, setConfirm] = useState(null);
const [expandedUser, setExpandedUser] = useState(null);
useEffect(() => { getAllUsers().then(u => { setUsers(u); setLoading(false); }); }, []);
const handleDelete = async (uid) => {
await deleteUser(uid);
const updated = Object.assign({}, users);
delete updated[uid];
setUsers(updated); setConfirm(null);
};
return (
<div style={{ position: “fixed”, inset: 0, background: “#0f0f0f”, zIndex: 100, overflowY: “auto” }}>
<div style={{ maxWidth: 480, margin: “0 auto”, padding: 20 }}>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 24 }}>
<h2 style={{ margin: 0, color: “#e8c96d”, fontSize: 18 }}>관리자 패널</h2>
<button onClick={onClose} style={{ background: “#222”, border: “1px solid #333”, borderRadius: 8, color: “#aaa”, padding: “6px 14px”, cursor: “pointer” }}>닫기</button>
</div>
<div style={{ background: “#1a1a1a”, borderRadius: 14, border: “1px solid #2a2a2a”, overflow: “hidden” }}>
<div style={{ padding: “12px 16px”, borderBottom: “1px solid #2a2a2a”, color: “#555”, fontSize: 13 }}>전체 유저 ({Object.keys(users).length}명)</div>
{loading ? (
<div style={{ padding: 20, textAlign: “center”, color: “#444” }}>불러오는 중…</div>
) : Object.entries(users).map(([uid, info]) => (
<div key={uid} style={{ borderBottom: “1px solid #1e1e1e” }}>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, padding: “14px 16px” }}>
<div>
<span style={{ fontWeight: 600, color: uid === currentUid ? “#e8c96d” : “#f0ede8” }}>{uid}</span>
{info.isAdmin && <span style={{ marginLeft: 6, fontSize: 11, color: “#e8c96d”, background: “#2e2a1a”, padding: “2px 7px”, borderRadius: 20 }}>관리자</span>}
{uid === currentUid && <span style={{ marginLeft: 6, fontSize: 11, color: “#6db8e8” }}>나</span>}
{info.loginHistory && <div style={{ fontSize: 11, color: “#444”, marginTop: 3 }}>로그인 {info.loginHistory.length}회</div>}
</div>
<div style={{ display: “flex”, gap: 6, alignItems: “center” }}>
{info.loginHistory && info.loginHistory.length > 0 && (
<button onClick={() => setExpandedUser(expandedUser === uid ? null : uid)}
style={{ padding: “4px 8px”, background: “#1a1a2e”, border: “1px solid #2a2a4a”, borderRadius: 6, color: “#6db8e8”, fontSize: 11, cursor: “pointer” }}>
기록
</button>
)}
{uid !== currentUid && !info.isAdmin && (
confirm === uid ? (
<div style={{ display: “flex”, gap: 6 }}>
<button onClick={() => setConfirm(null)} style={{ padding: “5px 10px”, background: “#222”, border: “1px solid #333”, borderRadius: 6, color: “#aaa”, fontSize: 12, cursor: “pointer” }}>취소</button>
<button onClick={() => handleDelete(uid)} style={{ padding: “5px 10px”, background: “#3a1010”, border: “1px solid #5a2020”, borderRadius: 6, color: “#e87a6d”, fontSize: 12, cursor: “pointer” }}>삭제</button>
</div>
) : (
<button onClick={() => setConfirm(uid)} style={{ padding: “5px 12px”, background: “none”, border: “1px solid #3a2020”, borderRadius: 6, color: “#e87a6d”, fontSize: 12, cursor: “pointer” }}>삭제</button>
)
)}
</div>
</div>
{expandedUser === uid && info.loginHistory && (
<div style={{ padding: “0 16px 14px”, background: “#111” }}>
<div style={{ fontSize: 11, color: “#555”, marginBottom: 6 }}>최근 로그인 기록</div>
{[…info.loginHistory].reverse().slice(0, 5).map((log, i) => (
<div key={i} style={{ fontSize: 11, color: “#666”, padding: “4px 0”, borderBottom: “1px solid #1a1a1a”, display: “flex”, justifyContent: “space-between” }}>
<span>{formatDateTime(log.time)}</span>
<span style={{ color: “#444” }}>{log.device}</span>
</div>
))}
</div>
)}
</div>
))}
</div>
</div>
</div>
);
}

function ProfilePanel({ uid, onClose }) {
const [newPw, setNewPw] = useState(””);
const [confirmPw, setConfirmPw] = useState(””);
const [currentPw, setCurrentPw] = useState(””);
const [error, setError] = useState(””);
const [success, setSuccess] = useState(””);
const [loading, setLoading] = useState(false);

const inputStyle = { width: “100%”, padding: “12px 14px”, background: “#111”, border: “1px solid #333”, borderRadius: 10, color: “#f0ede8”, fontSize: 14, outline: “none”, boxSizing: “border-box” };

const handleChangePw = async () => {
if (!currentPw || !newPw || !confirmPw) { setError(“모든 항목을 입력해주세요.”); return; }
if (newPw.length < 6) { setError(“새 비밀번호는 6자 이상이어야 해요.”); return; }
if (newPw !== confirmPw) { setError(“새 비밀번호가 일치하지 않아요.”); return; }
setLoading(true); setError(””); setSuccess(””);
try {
const firebaseUser = auth.currentUser;
if (!firebaseUser) { setError(“로그인 상태를 확인해주세요.”); return; }
const credential = EmailAuthProvider.credential(firebaseUser.email, currentPw);
await reauthenticateWithCredential(firebaseUser, credential);
await updatePassword(firebaseUser, newPw);
await updateDoc(doc(db, “users”, uid), { pw: newPw });
setSuccess(“비밀번호가 변경됐어요!”);
setCurrentPw(””); setNewPw(””); setConfirmPw(””);
} catch (e) {
if (e.code === “auth/wrong-password” || e.code === “auth/invalid-credential”) setError(“현재 비밀번호가 틀렸어요.”);
else setError(“오류가 발생했어요: “ + e.message);
} finally { setLoading(false); }
};

return (
<div style={{ position: “fixed”, inset: 0, background: “rgba(0,0,0,0.85)”, zIndex: 200, display: “flex”, alignItems: “flex-end” }}>
<div style={{ background: “#1a1a1a”, borderRadius: “20px 20px 0 0”, padding: 24, width: “100%”, maxWidth: 480, margin: “0 auto”, maxHeight: “80vh”, overflowY: “auto” }}>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 20 }}>
<h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: “#e8c96d” }}>프로필 편집</h2>
<button onClick={onClose} style={{ background: “#222”, border: “1px solid #333”, borderRadius: 8, color: “#aaa”, padding: “6px 14px”, cursor: “pointer”, fontSize: 13 }}>닫기</button>
</div>
<div style={{ background: “#111”, borderRadius: 12, padding: “12px 16px”, marginBottom: 20, display: “flex”, alignItems: “center”, gap: 12 }}>
<div style={{ width: 40, height: 40, borderRadius: “50%”, background: “#e8c96d22”, border: “2px solid #e8c96d44”, display: “flex”, alignItems: “center”, justifyContent: “center”, fontSize: 18, color: “#e8c96d”, fontWeight: 800 }}>{uid[0].toUpperCase()}</div>
<div>
<div style={{ fontSize: 15, fontWeight: 700, color: “#f0ede8” }}>{uid}</div>
<div style={{ fontSize: 12, color: “#555” }}>아이디는 변경할 수 없어요</div>
</div>
</div>
<h3 style={{ margin: “0 0 14px”, fontSize: 15, color: “#f0ede8”, fontWeight: 700 }}>비밀번호 변경</h3>
<div style={{ display: “flex”, flexDirection: “column”, gap: 12, marginBottom: 16 }}>
<div>
<label style={{ fontSize: 12, color: “#666”, display: “block”, marginBottom: 6 }}>현재 비밀번호</label>
<input type=“password” value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder=“현재 비밀번호” style={inputStyle} />
</div>
<div>
<label style={{ fontSize: 12, color: “#666”, display: “block”, marginBottom: 6 }}>새 비밀번호</label>
<input type=“password” value={newPw} onChange={e => setNewPw(e.target.value)} placeholder=“새 비밀번호 (6자 이상)” style={inputStyle} />
</div>
<div>
<label style={{ fontSize: 12, color: “#666”, display: “block”, marginBottom: 6 }}>새 비밀번호 확인</label>
<input type=“password” value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder=“새 비밀번호 재입력” style={inputStyle} />
</div>
</div>
{error && <div style={{ background: “#2e1a1a”, border: “1px solid #5a2020”, borderRadius: 8, padding: “10px 14px”, color: “#e87a6d”, fontSize: 13, marginBottom: 12 }}>{error}</div>}
{success && <div style={{ background: “#1a2e1a”, border: “1px solid #2a5a2a”, borderRadius: 8, padding: “10px 14px”, color: “#6de8a0”, fontSize: 13, marginBottom: 12 }}>{success}</div>}
<button onClick={handleChangePw} disabled={loading}
style={{ width: “100%”, padding: “14px”, background: loading ? “#555” : “linear-gradient(135deg, #e8c96d, #d4a843)”, border: “none”, borderRadius: 12, fontSize: 15, fontWeight: 800, color: “#111”, cursor: loading ? “default” : “pointer” }}>
{loading ? “변경 중…” : “비밀번호 변경”}
</button>
</div>
</div>
);
}

// 보조운동 세션 컴포넌트
function AccessorySession({ workoutType, accessoryWeights, onFinish, onSkip }) {
const exercises = ACCESSORY_WORKOUTS[workoutType].map(e => ({
…e,
weight: e.isPlank ? 0 : (accessoryWeights[e.name] || 0),
// 플랭크 시간: plankSeconds 필드로 관리 (0=60초, 1=75초, 2+=90초)
plankSeconds: e.isPlank ? getPlankDuration(accessoryWeights[e.name] || 0) : 0,
}));

const [completedSets, setCompletedSets] = useState({});
// 세트별 입력 횟수 기록 (더블 프로그레션)
const [repInputs, setRepInputs] = useState({});
const [restTimer, setRestTimer] = useState(null);
const [plankTimer, setPlankTimer] = useState(null); // { exIdx, remaining, total }
const [progressNotif, setProgressNotif] = useState(null); // 중량 올릴 타이밍 알림

useEffect(() => {
if (!restTimer || restTimer.remaining <= 0) return;
const id = setTimeout(() => setRestTimer(prev => prev ? { …prev, remaining: prev.remaining - 1 } : null), 1000);
return () => clearTimeout(id);
}, [restTimer]);

useEffect(() => {
if (!plankTimer || plankTimer.remaining <= 0) return;
const id = setTimeout(() => setPlankTimer(prev => prev ? { …prev, remaining: prev.remaining - 1 } : null), 1000);
return () => clearTimeout(id);
}, [plankTimer]);

const toggleSet = (exIdx, setIdx) => {
const key = exIdx + “-” + setIdx;
setCompletedSets(prev => ({ …prev, [key]: !prev[key] }));
};

const isAllSetsCompleted = (exIdx, sets) =>
Array.from({ length: sets }, (_, i) => completedSets[exIdx + “-” + i]).every(Boolean);

const formatTime = (s) => Math.floor(s / 60) + “:” + String(s % 60).padStart(2, “0”);

// 더블 프로그레션: 3세트 모두 maxReps 달성했는지 확인
const checkDoubleProgression = (ex, exIdx) => {
if (ex.isPlank || ex.isBodyweight) return false;
for (let i = 0; i < ex.sets; i++) {
const reps = repInputs[exIdx + “-” + i];
if (!reps || reps < ex.maxReps) return false;
}
return true;
};

const handleFinish = () => {
const results = exercises.map((ex, exIdx) => {
const allDone = isAllSetsCompleted(exIdx, ex.sets);
const metProgression = checkDoubleProgression(ex, exIdx);
return {
name: ex.name,
weight: ex.isPlank ? (accessoryWeights[ex.name] || 0) : (accessoryWeights[ex.name] || 0),
plankSeconds: ex.isPlank ? ex.plankSeconds : undefined,
reps: ex.isBodyweight ? (repInputs[exIdx + “-0”] || ex.minReps) : undefined,
success: allDone,
metProgression,
};
});

```
// 중량 올릴 타이밍 알림 체크
const toLevel = results.filter(r => r.metProgression).map(r => r.name);
if (toLevel.length > 0) {
  setProgressNotif(toLevel);
  return;
}
onFinish(results);
```

};

if (progressNotif) return (
<div style={{ padding: “20px 0” }}>
<div style={{ background: “#1a2e1a”, border: “1px solid #2a5a2a”, borderRadius: 14, padding: 24, marginBottom: 20, textAlign: “center” }}>
<div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
<div style={{ fontSize: 18, fontWeight: 800, color: “#6de8a0”, marginBottom: 8 }}>목표 횟수 달성!</div>
<div style={{ fontSize: 13, color: “#aaa”, lineHeight: 1.8, marginBottom: 16 }}>
다음 세션에 중량을 올려보세요!
</div>
{progressNotif.map(name => (
<div key={name} style={{ background: “#1e3a1e”, borderRadius: 8, padding: “8px 14px”, marginBottom: 8, fontSize: 14, color: “#6de8a0”, fontWeight: 700 }}>
{name} → 다음 세션 중량 UP ↑
</div>
))}
<div style={{ fontSize: 12, color: “#555”, marginTop: 12 }}>기록 탭 → 보조운동 중량 설정에서 조정하세요</div>
</div>
<button onClick={() => {
const results = exercises.map((ex, exIdx) => ({
name: ex.name,
weight: ex.isPlank ? (accessoryWeights[ex.name] || 0) : (accessoryWeights[ex.name] || 0),
plankSeconds: ex.isPlank ? ex.plankSeconds : undefined,
reps: ex.isBodyweight ? (repInputs[exIdx + “-0”] || ex.minReps) : undefined,
success: isAllSetsCompleted(exIdx, ex.sets),
metProgression: checkDoubleProgression(ex, exIdx),
}));
onFinish(results);
}}
style={{ width: “100%”, padding: “14px”, background: “linear-gradient(135deg, #e8c96d, #d4a843)”, border: “none”, borderRadius: 12, fontSize: 15, fontWeight: 800, color: “#111”, cursor: “pointer” }}>
완료 & 저장
</button>
</div>
);

return (
<div>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 16 }}>
<div>
<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: “#f0ede8” }}>보조운동</h2>
<div style={{ fontSize: 12, color: “#b06de8”, marginTop: 2 }}>워크아웃 {workoutType} · 4가지</div>
</div>
<button onClick={onSkip}
style={{ padding: “6px 12px”, background: “none”, border: “1px solid #2a2a2a”, borderRadius: 8, color: “#555”, fontSize: 12, cursor: “pointer” }}>
건너뛰기
</button>
</div>

```
  {exercises.map((ex, exIdx) => {
    const allDone = isAllSetsCompleted(exIdx, ex.sets);
    const color = EXERCISE_COLORS[ex.name] || "#e8c96d";
    const isPlankRunning = plankTimer && plankTimer.exIdx === exIdx;

    return (
      <div key={ex.name} style={{ background: allDone ? "#1a2a1a" : "#1a1a1a", borderRadius: 14, padding: 16, marginBottom: 14, border: "1px solid " + (allDone ? "#2a4a2a" : "#2a2a2a") }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: color }}>{ex.name}</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
              {ex.isPlank
                ? `3세트 × ${ex.plankSeconds}초`
                : ex.isBodyweight
                  ? `3세트 × ${ex.minReps}회 (맨몸)`
                  : `3세트 × ${ex.minReps}~${ex.maxReps}회 · ${ex.weight > 0 ? ex.weight + "kg" : "중량 미설정"}`
              }
            </div>
            {!ex.isPlank && !ex.isBodyweight && ex.weight === 0 && (
              <div style={{ fontSize: 11, color: "#e8c96d", marginTop: 3 }}>💡 기록 탭에서 중량을 설정해보세요</div>
            )}
          </div>
          {allDone && <span style={{ color: "#6de8a0", fontSize: 22 }}>✓</span>}
        </div>

        {/* 플랭크 */}
        {ex.isPlank ? (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {Array.from({ length: ex.sets }, (_, i) => {
                const isDone = completedSets[exIdx + "-" + i];
                return (
                  <div key={i} style={{ flex: 1 }}>
                    <button
                      onClick={() => {
                        if (isDone) return;
                        setPlankTimer({ exIdx, setIdx: i, remaining: ex.plankSeconds, total: ex.plankSeconds });
                      }}
                      style={{ width: "100%", aspectRatio: "1", borderRadius: 10, border: "2px solid " + (isDone ? "#6de8a0" : "#333"), background: isDone ? "#1e3a2a" : "#111", color: isDone ? "#6de8a0" : "#888", fontSize: isDone ? 16 : 13, fontWeight: 700, cursor: isDone ? "default" : "pointer" }}>
                      {isDone ? "✓" : i + 1}
                    </button>
                  </div>
                );
              })}
            </div>
            {isPlankRunning && (
              <div style={{ background: "#111", borderRadius: 10, padding: 14, border: "1px solid #2a2a2a", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>플랭크 진행 중...</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: plankTimer.remaining <= 10 ? "#e86d6d" : "#6de8a0", letterSpacing: 2, marginBottom: 8 }}>
                  {formatTime(plankTimer.remaining)}
                </div>
                <div style={{ height: 4, background: "#222", borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: (plankTimer.remaining / plankTimer.total * 100) + "%", background: plankTimer.remaining <= 10 ? "#e86d6d" : "#6de8a0", borderRadius: 2, transition: "width 1s linear" }} />
                </div>
                {plankTimer.remaining === 0 ? (
                  <div>
                    <div style={{ color: "#6de8a0", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>완료! 세트 체크하세요 ✓</div>
                    <button onClick={() => {
                      toggleSet(exIdx, plankTimer.setIdx);
                      setPlankTimer(null);
                      if (plankTimer.setIdx < ex.sets - 1) {
                        setRestTimer({ seconds: 60, remaining: 60, exIdx, setIdx: plankTimer.setIdx });
                      }
                    }} style={{ padding: "8px 20px", background: "#1e3a2a", border: "1px solid #2a5a2a", borderRadius: 8, color: "#6de8a0", fontSize: 13, cursor: "pointer" }}>
                      세트 완료
                    </button>
                  </div>
                ) : (
                  <button onClick={() => {
                    toggleSet(exIdx, plankTimer.setIdx);
                    setPlankTimer(null);
                  }} style={{ padding: "7px 20px", background: "#1e1e1e", border: "1px solid #333", borderRadius: 8, color: "#666", fontSize: 12, cursor: "pointer" }}>
                    조기 종료
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* 일반 보조운동 */
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {Array.from({ length: ex.sets }, (_, i) => {
                const isDone = completedSets[exIdx + "-" + i];
                const repsVal = repInputs[exIdx + "-" + i] || "";
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <button
                      onClick={() => {
                        if (isDone) return;
                        toggleSet(exIdx, i);
                        if (i < ex.sets - 1) {
                          setRestTimer({ seconds: 75, remaining: 75, exIdx, setIdx: i });
                        }
                      }}
                      style={{ width: "100%", aspectRatio: "1", borderRadius: 10, border: "2px solid " + (isDone ? color : "#333"), background: isDone ? color + "22" : "#111", color: isDone ? color : "#888", fontSize: isDone ? 16 : 13, fontWeight: 700, cursor: isDone ? "default" : "pointer" }}>
                      {isDone ? "✓" : i + 1}
                    </button>
                    {/* 횟수 입력 (맨몸 운동 포함) */}
                    {!ex.isBodyweight ? null : (
                      <input
                        type="number"
                        value={repsVal}
                        onChange={e => setRepInputs(prev => ({ ...prev, [exIdx + "-" + i]: parseInt(e.target.value) || 0 }))}
                        placeholder="회"
                        style={{ width: "100%", padding: "4px 0", background: "#111", border: "1px solid #2a2a2a", borderRadius: 6, color: "#f0ede8", fontSize: 11, textAlign: "center", boxSizing: "border-box" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {/* 더블 프로그레션 힌트 */}
            {!ex.isBodyweight && !ex.isPlank && (
              <div style={{ fontSize: 11, color: "#444", marginBottom: 6 }}>
                목표: {ex.minReps}~{ex.maxReps}회 · 3세트 모두 {ex.maxReps}회 달성 시 중량 UP
              </div>
            )}
          </div>
        )}

        {/* 휴식 타이머 (보조운동) */}
        {restTimer && restTimer.exIdx === exIdx && (
          <div style={{ marginTop: 10, background: "#111", borderRadius: 10, padding: "12px 14px", border: "1px solid #2a2a2a", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>휴식 중 (60~90초)</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: restTimer.remaining <= 10 ? "#e86d6d" : "#e8c96d", letterSpacing: 2, marginBottom: 6 }}>
              {formatTime(restTimer.remaining)}
            </div>
            <div style={{ height: 3, background: "#222", borderRadius: 2, marginBottom: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: (restTimer.remaining / restTimer.seconds * 100) + "%", background: "#e8c96d", borderRadius: 2, transition: "width 1s linear" }} />
            </div>
            {restTimer.remaining === 0
              ? <div style={{ color: "#6de8a0", fontWeight: 700, fontSize: 13 }}>다음 세트 시작하세요!</div>
              : <button onClick={() => setRestTimer(null)} style={{ padding: "6px 18px", background: "#1e1e1e", border: "1px solid #333", borderRadius: 8, color: "#666", fontSize: 12, cursor: "pointer" }}>건너뛰기</button>
            }
          </div>
        )}
      </div>
    );
  })}

  <button onClick={handleFinish}
    style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg, #b06de8, #8a4dc8)", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, color: "#fff", cursor: "pointer", marginTop: 8 }}>
    보조운동 완료 & 저장
  </button>
  <button onClick={onSkip}
    style={{ width: "100%", padding: "12px", background: "none", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 14, color: "#555", cursor: "pointer", marginTop: 8 }}>
    건너뛰기
  </button>
</div>
```

);
}

function WorkoutApp({ uid, isAdmin, onLogout }) {
const [tab, setTab] = useState(0);
const [weights, setWeights] = useState(Object.assign({}, DEFAULT_WEIGHTS));
const [accessoryWeights, setAccessoryWeights] = useState(Object.assign({}, DEFAULT_ACCESSORY_WEIGHTS));
const [history, setHistory] = useState([]);
const [nextWorkout, setNextWorkout] = useState(“A”);
const [failCounts, setFailCounts] = useState({});
const [dataLoaded, setDataLoaded] = useState(false);
const [session, setSession] = useState(null);
const [completedSets, setCompletedSets] = useState({});
const [done, setDone] = useState(false);
const [showWarmup, setShowWarmup] = useState({});
const [calcWeight, setCalcWeight] = useState(100);
const [resetConfirm, setResetConfirm] = useState(false);
const [restTimer, setRestTimer] = useState(null);
const [difficulty, setDifficulty] = useState({});
const [showAdmin, setShowAdmin] = useState(false);
const [lowerChoice, setLowerChoice] = useState(null);
const [showWeightEdit, setShowWeightEdit] = useState(false);
const [showAccessoryWeightEdit, setShowAccessoryWeightEdit] = useState(false);
const [selectedExercise, setSelectedExercise] = useState(“벤치프레스”);
const [selectedAccessoryExercise, setSelectedAccessoryExercise] = useState(“덤벨 인클라인 프레스”);
const [descExercise, setDescExercise] = useState(null);
const [showProfile, setShowProfile] = useState(false);
// 보조운동 관련
const [accessoryChoice, setAccessoryChoice] = useState(null); // null | “yes” | “no”
const [sessionPhase, setSessionPhase] = useState(“main”); // “main” | “accessory”
const [mainResults, setMainResults] = useState(null);
// 기록 탭 그래프 모드
const [graphMode, setGraphMode] = useState(“main”); // “main” | “accessory”

const DIFFICULTY_OPTIONS = [
{ key: “easy”, label: “적당했어요”, seconds: 90, color: “#6de8a0”, bg: “#1a2e1a”, emoji: “😊” },
{ key: “hard”, label: “힘들었어요”, seconds: 180, color: “#e8c96d”, bg: “#2e2a1a”, emoji: “😅” },
{ key: “fail”, label: “실패했어요”, seconds: 300, color: “#e86d6d”, bg: “#2e1a1a”, emoji: “😤” },
];

useEffect(() => {
loadUserData(uid).then(d => {
if (d) {
if (d.weights) setWeights(d.weights);
if (d.accessoryWeights) setAccessoryWeights(d.accessoryWeights);
else setAccessoryWeights(Object.assign({}, DEFAULT_ACCESSORY_WEIGHTS)); // 기존 유저 기본값
if (d.history) setHistory(d.history);
if (d.next) setNextWorkout(d.next);
if (d.fails) setFailCounts(d.fails);
}
setDataLoaded(true);
});
}, [uid]);

useEffect(() => {
if (!dataLoaded) return;
saveUserData(uid, { weights, accessoryWeights, history, next: nextWorkout, fails: failCounts });
}, [weights, accessoryWeights, history, nextWorkout, failCounts, dataLoaded]);

useEffect(() => {
if (!restTimer || restTimer.remaining <= 0) return;
const id = setTimeout(() => setRestTimer(prev => prev ? Object.assign({}, prev, { remaining: prev.remaining - 1 }) : null), 1000);
return () => clearTimeout(id);
}, [restTimer]);

const startRest = (exIdx, setIdx, seconds, diffKey) => {
setDifficulty(prev => Object.assign({}, prev, { [exIdx + “-” + setIdx]: diffKey }));
setRestTimer({ seconds, remaining: seconds, exIdx, setIdx });
};
const skipRest = () => setRestTimer(null);
const formatTime = (s) => Math.floor(s / 60) + “:” + String(s % 60).padStart(2, “0”);

const handleReset = async () => {
const fresh = { weights: Object.assign({}, DEFAULT_WEIGHTS), accessoryWeights: Object.assign({}, DEFAULT_ACCESSORY_WEIGHTS), history: [], next: “A”, fails: {} };
setWeights(fresh.weights); setAccessoryWeights(fresh.accessoryWeights);
setHistory(fresh.history); setNextWorkout(fresh.next); setFailCounts(fresh.fails);
setSession(null); setResetConfirm(false);
await saveUserData(uid, fresh);
};

const startSession = (lowerType) => {
const WORKOUTS = getWorkouts(lowerType);
const exercises = WORKOUTS[nextWorkout].map(e => Object.assign({}, e, { weight: weights[e.name] || DEFAULT_WEIGHTS[e.name] }));
const initialWarmup = {};
exercises.forEach((_, i) => { initialWarmup[i] = true; });
setSession({ type: nextWorkout, exercises, date: Date.now() });
setCompletedSets({}); setShowWarmup(initialWarmup);
setLowerChoice(null); setDone(false);
setSessionPhase(“main”); setMainResults(null); setAccessoryChoice(null);
};

const toggleSet = (prefix, exIdx, setIdx) => {
const key = prefix + “-” + exIdx + “-” + setIdx;
setCompletedSets(prev => Object.assign({}, prev, { [key]: !prev[key] }));
};

const isWarmupAllDone = (exIdx, count) =>
Array.from({ length: count }, (_, i) => completedSets[“w-” + exIdx + “-” + i]).every(Boolean);

const isMainAllDone = (exIdx, totalSets) =>
Array.from({ length: totalSets }, (_, i) => completedSets[“m-” + exIdx + “-” + i]).every(Boolean);

const finishMainSession = () => {
if (!session) return;
const newWeights = Object.assign({}, weights);
const newFails = Object.assign({}, failCounts);
const results = session.exercises.map((ex, i) => {
const success = isMainAllDone(i, ex.sets);
if (success) {
newWeights[ex.name] = (newWeights[ex.name] || ex.weight) + ex.increment;
newFails[ex.name] = 0;
} else {
newFails[ex.name] = (newFails[ex.name] || 0) + 1;
if (newFails[ex.name] >= 3) {
newWeights[ex.name] = Math.max(20, Math.round((newWeights[ex.name] || ex.weight) * 0.9 * 2) / 2);
newFails[ex.name] = 0;
}
}
return { name: ex.name, weight: ex.weight, success };
});
setWeights(newWeights); setFailCounts(newFails);
setMainResults(results);

```
// 보조운동 여부 선택으로 이동
if (accessoryChoice === "yes") {
  setSessionPhase("accessory");
} else if (accessoryChoice === "no") {
  // 바로 저장
  setHistory(prev => [{ type: session.type, date: session.date, results, accessoryResults: [] }].concat(prev.slice(0, 49)));
  setNextWorkout(nextWorkout === "A" ? "B" : "A");
  setDone(true);
} else {
  // 아직 선택 안했을 경우 (shouldn't happen)
  setHistory(prev => [{ type: session.type, date: session.date, results, accessoryResults: [] }].concat(prev.slice(0, 49)));
  setNextWorkout(nextWorkout === "A" ? "B" : "A");
  setDone(true);
}
```

};

const finishAccessorySession = (accessoryResults) => {
// 플랭크 자동 증가: 성공 시 단계 증가
const newAccessoryWeights = Object.assign({}, accessoryWeights);
for (const r of accessoryResults) {
const ex = […ACCESSORY_WORKOUTS.A, …ACCESSORY_WORKOUTS.B].find(e => e.name === r.name);
if (ex && ex.isPlank && r.success) {
// plankSeconds level 증가 (0→1→2)
const currentLevel = newAccessoryWeights[r.name] || 0;
if (currentLevel < 2) newAccessoryWeights[r.name] = currentLevel + 1;
}
}
setAccessoryWeights(newAccessoryWeights);
setHistory(prev => [{ type: session.type, date: session.date, results: mainResults, accessoryResults }].concat(prev.slice(0, 49)));
setNextWorkout(nextWorkout === “A” ? “B” : “A”);
setDone(true);
};

const plates = [20, 15, 10, 5, 2.5];
const getPlateCombo = (w) => {
let remaining = Math.max(0, (w - 20) / 2);
const combo = [];
for (const p of plates) {
const count = Math.floor(remaining / p);
if (count > 0) { combo.push({ kg: p, count }); remaining = Math.round((remaining - count * p) * 100) / 100; }
}
return combo;
};

const totalSessions = history.length;
const streak = (() => {
let s = 0;
for (const h of history) {
if (Date.now() - h.date < (s + 1) * 4 * 86400000) s++;
else break;
}
return s;
})();

if (!dataLoaded) return (
<div style={{ minHeight: “100vh”, background: “#0f0f0f”, display: “flex”, alignItems: “center”, justifyContent: “center”, color: “#555” }}>
데이터 불러오는 중…
</div>
);

// 보조운동 중량 설정 화면
if (showAccessoryWeightEdit) return (
<div style={{ minHeight: “100vh”, background: “#0f0f0f”, padding: 20 }}>
<div style={{ maxWidth: 480, margin: “0 auto” }}>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 24, paddingTop: 20 }}>
<h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: “#f0ede8” }}>보조운동 중량 설정</h2>
<button onClick={() => setShowAccessoryWeightEdit(false)} style={{ background: “#222”, border: “1px solid #333”, borderRadius: 8, color: “#aaa”, padding: “6px 14px”, cursor: “pointer” }}>닫기</button>
</div>
{[“A”, “B”].map(wt => (
<div key={wt} style={{ background: “#1a1a1a”, borderRadius: 16, padding: 20, border: “1px solid #2a2a2a”, marginBottom: 16 }}>
<div style={{ fontSize: 13, fontWeight: 700, color: wt === “A” ? “#6db8e8” : “#6de8a0”, marginBottom: 12 }}>워크아웃 {wt} 보조운동</div>
{ACCESSORY_WORKOUTS[wt].map(({ name, isPlank, isBodyweight }) => {
if (isBodyweight) return (
<div key={name} style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, padding: “12px 0”, borderBottom: “1px solid #222” }}>
<span style={{ fontSize: 14, color: “#888” }}>{name}</span>
<span style={{ fontSize: 12, color: “#555” }}>맨몸</span>
</div>
);
if (isPlank) {
const level = accessoryWeights[name] || 0;
const secs = getPlankDuration(level);
return (
<div key={name} style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, padding: “12px 0”, borderBottom: “1px solid #222” }}>
<span style={{ fontSize: 14, color: “#f0ede8” }}>{name}</span>
<div style={{ display: “flex”, alignItems: “center”, gap: 8 }}>
<button onClick={() => setAccessoryWeights(prev => ({ …prev, [name]: Math.max(0, (prev[name] || 0) - 1) }))}
style={{ width: 36, height: 36, borderRadius: 8, background: “#222”, border: “1px solid #444”, color: “#f0ede8”, fontSize: 20, cursor: “pointer” }}>-</button>
<span style={{ fontSize: 14, fontWeight: 700, color: “#6de8a0”, minWidth: 55, textAlign: “center” }}>{secs}초</span>
<button onClick={() => setAccessoryWeights(prev => ({ …prev, [name]: Math.min(2, (prev[name] || 0) + 1) }))}
style={{ width: 36, height: 36, borderRadius: 8, background: “#222”, border: “1px solid #444”, color: “#f0ede8”, fontSize: 20, cursor: “pointer” }}>+</button>
</div>
</div>
);
}
const w = accessoryWeights[name] || 0;
return (
<div key={name} style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, padding: “12px 0”, borderBottom: “1px solid #222” }}>
<span style={{ fontSize: 14, color: “#f0ede8” }}>{name}</span>
<div style={{ display: “flex”, alignItems: “center”, gap: 8 }}>
<button onClick={() => setAccessoryWeights(prev => ({ …prev, [name]: Math.max(0, (prev[name] || 0) - 2.5) }))}
style={{ width: 36, height: 36, borderRadius: 8, background: “#222”, border: “1px solid #444”, color: “#f0ede8”, fontSize: 20, cursor: “pointer” }}>-</button>
<WeightInput
value={w}
onChange={val => setAccessoryWeights(prev => ({ …prev, [name]: val }))}
step={2.5}
/>
<button onClick={() => setAccessoryWeights(prev => ({ …prev, [name]: (prev[name] || 0) + 2.5 }))}
style={{ width: 36, height: 36, borderRadius: 8, background: “#222”, border: “1px solid #444”, color: “#f0ede8”, fontSize: 20, cursor: “pointer” }}>+</button>
</div>
</div>
);
})}
</div>
))}
<button onClick={() => setShowAccessoryWeightEdit(false)} style={{ width: “100%”, padding: “14px”, background: “linear-gradient(135deg, #e8c96d, #d4a843)”, border: “none”, borderRadius: 12, fontSize: 15, fontWeight: 800, color: “#111”, cursor: “pointer” }}>
저장 완료
</button>
<p style={{ textAlign: “center”, color: “#555”, fontSize: 12, marginTop: 12 }}>변경사항은 자동으로 저장돼요</p>
</div>
</div>
);

if (showWeightEdit) return (
<div style={{ minHeight: “100vh”, background: “#0f0f0f”, padding: 20 }}>
<div style={{ maxWidth: 480, margin: “0 auto” }}>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, marginBottom: 24, paddingTop: 20 }}>
<h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: “#f0ede8” }}>중량 설정</h2>
<button onClick={() => setShowWeightEdit(false)} style={{ background: “#222”, border: “1px solid #333”, borderRadius: 8, color: “#aaa”, padding: “6px 14px”, cursor: “pointer” }}>닫기</button>
</div>
<div style={{ background: “#1a1a1a”, borderRadius: 16, padding: 20, border: “1px solid #2a2a2a”, marginBottom: 16 }}>
{Object.entries(weights).map(([name, w]) => (
<div key={name} style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, padding: “12px 0”, borderBottom: “1px solid #222” }}>
<span style={{ fontSize: 14, color: “#f0ede8” }}>{name}</span>
<div style={{ display: “flex”, alignItems: “center”, gap: 8 }}>
<button onClick={() => setWeights(prev => Object.assign({}, prev, { [name]: Math.max(0, prev[name] - 5) }))} style={{ width: 36, height: 36, borderRadius: 8, background: “#222”, border: “1px solid #444”, color: “#f0ede8”, fontSize: 20, cursor: “pointer” }}>-</button>
<span style={{ fontSize: 16, fontWeight: 700, color: “#e8c96d”, minWidth: 55, textAlign: “center” }}>{w}kg</span>
<button onClick={() => setWeights(prev => Object.assign({}, prev, { [name]: prev[name] + 5 }))} style={{ width: 36, height: 36, borderRadius: 8, background: “#222”, border: “1px solid #444”, color: “#f0ede8”, fontSize: 20, cursor: “pointer” }}>+</button>
</div>
</div>
))}
</div>
<button onClick={() => setShowWeightEdit(false)} style={{ width: “100%”, padding: “14px”, background: “linear-gradient(135deg, #e8c96d, #d4a843)”, border: “none”, borderRadius: 12, fontSize: 15, fontWeight: 800, color: “#111”, cursor: “pointer” }}>
저장 완료
</button>
<p style={{ textAlign: “center”, color: “#555”, fontSize: 12, marginTop: 12 }}>변경사항은 자동으로 저장돼요</p>
</div>
</div>
);

return (
<div style={{ minHeight: “100vh”, background: “#0f0f0f”, color: “#f0ede8”, fontFamily: “sans-serif”, maxWidth: 480, width: “100%”, margin: “0 auto”, paddingBottom: 80, overflowX: “hidden”, boxSizing: “border-box” }}>
{showAdmin && <AdminPanel currentUid={uid} onClose={() => setShowAdmin(false)} />}
{descExercise && <ExerciseDescPanel name={descExercise} onClose={() => setDescExercise(null)} />}
{showProfile && <ProfilePanel uid={uid} onClose={() => setShowProfile(false)} />}

```
  {/* 헤더 */}
  <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #111 100%)", padding: "28px 24px 20px", borderBottom: "1px solid #222" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 28 }}>🏋️</span>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f0ede8" }}>SetUp</h1>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {isAdmin && <button onClick={() => setShowAdmin(true)} style={{ padding: "6px 10px", background: "#2e2a1a", border: "1px solid #e8c96d44", borderRadius: 8, color: "#e8c96d", fontSize: 11, cursor: "pointer" }}>관리</button>}
        <button onClick={onLogout} style={{ padding: "6px 10px", background: "#1e1e1e", border: "1px solid #333", borderRadius: 8, color: "#666", fontSize: 11, cursor: "pointer" }}>로그아웃</button>
      </div>
    </div>
    <button onClick={() => setShowProfile(true)} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, marginTop: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#e8c96d22", border: "1px solid #e8c96d44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#e8c96d" }}>{uid[0].toUpperCase()}</div>
      <span style={{ fontSize: 12, color: "#888" }}>{uid}</span>
      {isAdmin && <span style={{ fontSize: 10, color: "#e8c96d", background: "#2e2a1a", padding: "1px 6px", borderRadius: 20 }}>관리자</span>}
      <span style={{ fontSize: 14, color: "#666", marginLeft: 4 }}>✎</span>
    </button>
    <div style={{ display: "flex", gap: 16 }}>
      {[{ label: "총 세션", val: totalSessions }, { label: "연속", val: streak + "회" }, { label: "다음", val: nextWorkout }].map(s => (
        <div key={s.label} style={{ background: "#1e1e1e", borderRadius: 10, padding: "8px 14px", flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#e8c96d" }}>{s.val}</div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  </div>

  {/* 탭 */}
  <div style={{ display: "flex", background: "#161616", borderBottom: "1px solid #222" }}>
    {TABS.map((t, i) => (
      <button key={t} onClick={() => setTab(i)} style={{ flex: 1, padding: "14px 4px", background: "none", border: "none", color: tab === i ? "#e8c96d" : "#555", fontWeight: tab === i ? 700 : 400, fontSize: 12, cursor: "pointer", borderBottom: tab === i ? "2px solid #e8c96d" : "2px solid transparent" }}>
        {t}
      </button>
    ))}
  </div>

  <div style={{ padding: "20px 16px", overflowX: "hidden" }}>

    {/* ===== 오늘 운동 탭 ===== */}
    {tab === 0 && (
      <div>
        {!session ? (
          <div>
            {/* 운동 카드 */}
            <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, marginBottom: 16, border: "2px solid #2e2e2e" }}>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>다음 운동</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#e8c96d", marginBottom: 16 }}>워크아웃 {nextWorkout}</div>
              <div style={{ border: "1.5px solid #333", borderRadius: 12, overflow: "hidden" }}>
                {getWorkouts(lowerChoice || "bulgarian")[nextWorkout].map((ex, idx, arr) => {
                  const w = weights[ex.name] || DEFAULT_WEIGHTS[ex.name];
                  const warmups = getWarmupSets(w, ex.isBulgarian);
                  return (
                    <div key={ex.name} style={{ padding: "12px 14px", borderBottom: idx < arr.length - 1 ? "1px solid #252525" : "none", background: "#111" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{ex.name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, color: "#aaa" }}>{ex.sets}x{ex.reps} <span style={{ color: "#e8c96d", fontWeight: 700 }}>{w}kg</span></span>
                          <button onClick={() => setDescExercise(ex.name)}
                            style={{ padding: "3px 8px", background: "#222", border: "1px solid #333", borderRadius: 6, color: "#888", fontSize: 10, cursor: "pointer" }}>
                            자세
                          </button>
                        </div>
                      </div>
                      {ex.note && <div style={{ fontSize: 11, color: "#6db8e8", marginTop: 3 }}>💡 {ex.note}</div>}
                      <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>
                        웜업: {warmups.map(ws => ws.weight === 0 ? "맨몸" : ws.weight + "kg").join(" → ")} → 본세트
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* 보조운동 미리보기 */}
              {accessoryChoice === "yes" && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#111", borderRadius: 10, border: "1px solid #b06de822" }}>
                  <div style={{ fontSize: 12, color: "#b06de8", fontWeight: 700, marginBottom: 6 }}>+ 보조운동 ({nextWorkout})</div>
                  {ACCESSORY_WORKOUTS[nextWorkout].map(ex => (
                    <div key={ex.name} style={{ fontSize: 11, color: "#555", padding: "2px 0" }}>
                      {ex.name} · {ex.isPlank ? `${getPlankDuration(accessoryWeights[ex.name] || 0)}초` : ex.isBodyweight ? `${ex.minReps}회` : `${ex.minReps}~${ex.maxReps}회 ${accessoryWeights[ex.name] > 0 ? accessoryWeights[ex.name] + "kg" : ""}`}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {lowerChoice === null ? (
              <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a" }}>
                <div style={{ fontSize: 14, color: "#888", marginBottom: 14, textAlign: "center" }}>오늘 하체 운동을 선택하세요</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setLowerChoice("bulgarian")}
                    style={{ flex: 1, padding: "16px 8px", background: "#111", border: "2px solid #2a2a2a", borderRadius: 12, color: "#f0ede8", fontSize: 13, fontWeight: 600, cursor: "pointer", lineHeight: 1.6, textAlign: "center" }}>
                    불가리안 스플릿 스쿼트
                  </button>
                  <button onClick={() => setLowerChoice("squat")}
                    style={{ flex: 1, padding: "16px 8px", background: "#111", border: "2px solid #2a2a2a", borderRadius: 12, color: "#f0ede8", fontSize: 13, fontWeight: 600, cursor: "pointer", lineHeight: 1.6, textAlign: "center" }}>
                    스쿼트
                  </button>
                </div>
              </div>
            ) : accessoryChoice === null ? (
              /* 보조운동 Yes/No 선택 */
              <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a" }}>
                <div style={{ fontSize: 14, color: "#888", marginBottom: 6, textAlign: "center" }}>오늘 보조운동도 할까요?</div>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 16, textAlign: "center" }}>메인 운동 완료 후 보조 4가지 추가</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setAccessoryChoice("yes")}
                    style={{ flex: 1, padding: "16px 8px", background: "#111", border: "2px solid #b06de844", borderRadius: 12, color: "#b06de8", fontSize: 14, fontWeight: 700, cursor: "pointer", textAlign: "center" }}>
                    💪 Yes
                  </button>
                  <button onClick={() => setAccessoryChoice("no")}
                    style={{ flex: 1, padding: "16px 8px", background: "#111", border: "2px solid #2a2a2a", borderRadius: 12, color: "#555", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
                    오늘은 패스
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => startSession(lowerChoice)}
                  style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #e8c96d, #d4a843)", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 800, color: "#111", cursor: "pointer" }}>
                  💪 운동 시작 ({lowerChoice === "bulgarian" ? "불가리안" : "스쿼트"})
                </button>
                <button onClick={() => { setLowerChoice(null); setAccessoryChoice(null); }}
                  style={{ width: "100%", padding: "13px", background: "none", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 14, color: "#555", cursor: "pointer" }}>
                  ← 다시 선택
                </button>
              </div>
            )}
          </div>
        ) : done ? (
          /* 완료 화면 */
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: "#e8c96d", fontSize: 24, marginBottom: 8 }}>운동 완료!</h2>
            <p style={{ color: "#888", marginBottom: 24 }}>훌륭해요! 다음 세션이 기다리고 있습니다.</p>
            <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 16, marginBottom: 12, textAlign: "left" }}>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>메인 운동</div>
              {session.exercises.map((ex, i) => {
                const success = isMainAllDone(i, ex.sets);
                return (
                  <div key={ex.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #222" }}>
                    <span>{ex.name}</span>
                    <span style={{ color: success ? "#6de8a0" : "#e86d6d" }}>{success ? "성공" : "실패"}</span>
                  </div>
                );
              })}
            </div>
            {history[0] && history[0].accessoryResults && history[0].accessoryResults.length > 0 && (
              <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 16, marginBottom: 20, textAlign: "left" }}>
                <div style={{ fontSize: 12, color: "#b06de8", marginBottom: 8 }}>보조운동</div>
                {history[0].accessoryResults.map(r => (
                  <div key={r.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #222" }}>
                    <span style={{ fontSize: 13 }}>{r.name}</span>
                    <span style={{ color: r.success ? "#6de8a0" : "#e86d6d", fontSize: 13 }}>{r.success ? "완료" : "부분"}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setSession(null)} style={{ padding: "14px 32px", background: "#222", border: "1px solid #444", borderRadius: 12, color: "#f0ede8", fontSize: 15, cursor: "pointer" }}>홈으로</button>
          </div>
        ) : sessionPhase === "accessory" ? (
          /* 보조운동 세션 */
          <AccessorySession
            workoutType={session.type}
            accessoryWeights={accessoryWeights}
            onFinish={finishAccessorySession}
            onSkip={() => {
              setHistory(prev => [{ type: session.type, date: session.date, results: mainResults, accessoryResults: [] }].concat(prev.slice(0, 49)));
              setNextWorkout(nextWorkout === "A" ? "B" : "A");
              setDone(true);
            }}
          />
        ) : (
          /* 메인 운동 세션 */
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>워크아웃 {session.type}</h2>
              <span style={{ fontSize: 12, color: "#666" }}>{formatDate(session.date)}</span>
            </div>
            {accessoryChoice === "yes" && (
              <div style={{ background: "#1a1020", border: "1px solid #b06de822", borderRadius: 10, padding: "8px 14px", marginBottom: 14, fontSize: 12, color: "#b06de8" }}>
                💜 메인 완료 후 보조운동이 이어져요
              </div>
            )}
            {session.exercises.map((ex, exIdx) => {
              const warmupSets = getWarmupSets(ex.weight, ex.isBulgarian);
              const warmupOpen = showWarmup[exIdx] !== false;
              const warmupDone = isWarmupAllDone(exIdx, warmupSets.length);
              const mainDone = isMainAllDone(exIdx, ex.sets);
              return (
                <div key={ex.name} style={{ background: mainDone ? "#1a2a1a" : "#1a1a1a", borderRadius: 14, padding: 16, marginBottom: 14, border: "1px solid " + (mainDone ? "#2a4a2a" : "#2a2a2a") }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{ex.name}</div>
                        <button onClick={() => setDescExercise(ex.name)}
                          style={{ padding: "2px 7px", background: "#222", border: "1px solid #333", borderRadius: 6, color: "#888", fontSize: 10, cursor: "pointer" }}>
                          자세
                        </button>
                      </div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                        본세트 {ex.sets}x{ex.reps} <span style={{ color: "#e8c96d" }}>{ex.weight}kg</span>
                        {ex.isBulgarian && <span style={{ color: "#6db8e8" }}> (한 손 {ex.weight / 2}kg)</span>}
                      </div>
                    </div>
                    {mainDone && <span style={{ color: "#6de8a0", fontSize: 22 }}>✓</span>}
                  </div>
                  {/* 웜업 */}
                  <div style={{ marginBottom: 12 }}>
                    <button onClick={() => setShowWarmup(prev => Object.assign({}, prev, { [exIdx]: !warmupOpen }))}
                      style={{ width: "100%", background: warmupDone ? "#1a2e1a" : "#141414", border: "1px solid " + (warmupDone ? "#2a4a2a" : "#252525"), borderRadius: warmupOpen ? "10px 10px 0 0" : "10px", padding: "9px 12px", color: warmupDone ? "#6de8a0" : "#777", fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>웜업 세트 {warmupDone ? "완료" : "(" + warmupSets.length + "세트)"}</span>
                      <span style={{ fontSize: 11 }}>{warmupOpen ? "접기" : "펼치기"}</span>
                    </button>
                    {warmupOpen && (
                      <div style={{ background: "#111", borderRadius: "0 0 10px 10px", padding: "8px 12px", border: "1px solid #252525", borderTop: "none" }}>
                        {warmupSets.map((ws, wi) => {
                          const isDone = completedSets["w-" + exIdx + "-" + wi];
                          return (
                            <div key={wi} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: wi < warmupSets.length - 1 ? "1px solid #1a1a1a" : "none" }}>
                              <div>
                                <span style={{ fontSize: 13, color: isDone ? "#6de8a0" : "#bbb", fontWeight: 500 }}>{ws.label}</span>
                                <span style={{ fontSize: 12, color: "#555", marginLeft: 8 }}>{ws.weight === 0 ? "맨몸" : ws.weight + "kg"} x {ws.reps}회</span>
                                {ex.isBulgarian && ws.weight > 0 && <span style={{ fontSize: 11, color: "#6db8e8", marginLeft: 4 }}>(한 손 {ws.weight / 2}kg)</span>}
                              </div>
                              <button onClick={() => toggleSet("w", exIdx, wi)}
                                style={{ width: 34, height: 34, borderRadius: 8, border: "2px solid " + (isDone ? "#6de8a0" : "#2a2a2a"), background: isDone ? "#1e3a2a" : "#1a1a1a", color: isDone ? "#6de8a0" : "#444", fontSize: 15, cursor: "pointer" }}>
                                {isDone ? "✓" : "○"}
                              </button>
                            </div>
                          );
                        })}
                        <div style={{ fontSize: 11, color: "#555", marginTop: 8, paddingTop: 8, borderTop: "1px solid #1a1a1a", textAlign: "center" }}>웜업 세트 사이에는 휴식 없이 바로 진행하세요</div>
                      </div>
                    )}
                  </div>
                  {/* 본세트 */}
                  <div>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                      본 세트 {ex.weight}kg x {ex.reps}회
                      {ex.isBulgarian && <span style={{ color: "#6db8e8" }}> 한 손 {ex.weight / 2}kg</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {Array.from({ length: ex.sets }, (_, i) => {
                        const isDone = completedSets["m-" + exIdx + "-" + i];
                        const diff = difficulty[exIdx + "-" + i];
                        const diffOpt = DIFFICULTY_OPTIONS.find(d => d.key === diff);
                        const isNextSet = !isDone && Array.from({ length: i }, (_, j) => completedSets["m-" + exIdx + "-" + j]).every(Boolean);
                        return (
                          <div key={i} style={{ flex: 1 }}>
                            <button onClick={() => { if (!isDone) toggleSet("m", exIdx, i); }}
                              style={{ width: "100%", aspectRatio: "1", borderRadius: 10, border: "2px solid " + (isDone ? (diffOpt ? diffOpt.color : "#6de8a0") : isNextSet ? "#555" : "#2a2a2a"), background: isDone ? (diffOpt ? diffOpt.bg : "#1e3a2a") : "#111", color: isDone ? (diffOpt ? diffOpt.color : "#6de8a0") : isNextSet ? "#888" : "#444", fontSize: isDone ? 16 : 13, fontWeight: 700, cursor: isDone ? "default" : "pointer" }}>
                              {isDone ? (diffOpt ? diffOpt.emoji : "✓") : i + 1}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {Array.from({ length: ex.sets }, (_, i) => {
                      const isDone = completedSets["m-" + exIdx + "-" + i];
                      const hasDiff = difficulty[exIdx + "-" + i];
                      const isLastSet = i === ex.sets - 1;
                      if (!isDone || hasDiff) return null;
                      return (
                        <div key={i} style={{ marginTop: 10, background: "#161616", borderRadius: 10, padding: "12px", border: "1px solid #2a2a2a" }}>
                          <div style={{ fontSize: 12, color: "#888", marginBottom: 8, textAlign: "center" }}>
                            {i + 1}세트 완료! {isLastSet ? "마지막 세트예요" : "난이도는?"}
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {DIFFICULTY_OPTIONS.map(opt => (
                              <button key={opt.key}
                                onClick={() => isLastSet ? setDifficulty(prev => Object.assign({}, prev, { [exIdx + "-" + i]: opt.key })) : startRest(exIdx, i, opt.seconds, opt.key)}
                                style={{ flex: 1, padding: "8px 4px", background: opt.bg, border: "1px solid " + opt.color + "33", borderRadius: 8, color: opt.color, fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "center", lineHeight: 1.4 }}>
                                {opt.emoji}<br />{opt.label}{!isLastSet && <><br /><span style={{ fontSize: 10, opacity: 0.7 }}>{opt.seconds}초</span></>}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {restTimer && restTimer.exIdx === exIdx && (
                      <div style={{ marginTop: 10, background: "#111", borderRadius: 10, padding: "14px", border: "1px solid #2a2a2a", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>휴식 중...</div>
                        <div style={{ fontSize: 36, fontWeight: 800, color: restTimer.remaining <= 10 ? "#e86d6d" : "#e8c96d", letterSpacing: 2, marginBottom: 8 }}>
                          {formatTime(restTimer.remaining)}
                        </div>
                        <div style={{ height: 4, background: "#222", borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: (restTimer.remaining / restTimer.seconds * 100) + "%", background: restTimer.remaining <= 10 ? "#e86d6d" : "#e8c96d", borderRadius: 2, transition: "width 1s linear" }} />
                        </div>
                        {restTimer.remaining === 0 ? (
                          <div style={{ color: "#6de8a0", fontWeight: 700, fontSize: 14 }}>휴식 완료! 다음 세트 시작하세요</div>
                        ) : (
                          <button onClick={skipRest} style={{ padding: "7px 20px", background: "#1e1e1e", border: "1px solid #333", borderRadius: 8, color: "#666", fontSize: 12, cursor: "pointer" }}>건너뛰기</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <button onClick={finishMainSession} style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg, #e8c96d, #d4a843)", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, color: "#111", cursor: "pointer", marginTop: 8 }}>
              {accessoryChoice === "yes" ? "메인 완료 → 보조운동 시작 💜" : "운동 완료 & 저장"}
            </button>
            <button onClick={() => setSession(null)} style={{ width: "100%", padding: "12px", background: "none", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 14, color: "#555", cursor: "pointer", marginTop: 8 }}>
              취소
            </button>
          </div>
        )}
      </div>
    )}

    {/* ===== 기록 탭 ===== */}
    {tab === 1 && (
      <div>
        {/* 그래프 모드 선택 */}
        <div style={{ display: "flex", background: "#1a1a1a", borderRadius: 10, padding: 3, marginBottom: 16, border: "1px solid #2a2a2a" }}>
          {[["main", "메인 운동"], ["accessory", "보조운동"]].map(([v, label]) => (
            <button key={v} onClick={() => setGraphMode(v)}
              style={{ flex: 1, padding: "9px", border: "none", borderRadius: 8, background: graphMode === v ? (v === "main" ? "#e8c96d" : "#b06de8") : "none", color: graphMode === v ? "#111" : "#555", fontWeight: graphMode === v ? 700 : 400, fontSize: 13, cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>

        {graphMode === "main" ? (
          <>
            {/* 메인 그래프 */}
            <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 16, border: "1px solid #2a2a2a", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, color: "#f0ede8", fontWeight: 700 }}>중량 성장 그래프</h3>
                <span style={{ fontSize: 11, color: "#444" }}>● 성공 ● 실패</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {EXERCISE_NAMES.map(name => (
                  <button key={name} onClick={() => setSelectedExercise(name)}
                    style={{ padding: "5px 10px", borderRadius: 20, border: "1px solid " + (selectedExercise === name ? EXERCISE_COLORS[name] : "#2a2a2a"), background: selectedExercise === name ? EXERCISE_COLORS[name] + "22" : "none", color: selectedExercise === name ? EXERCISE_COLORS[name] : "#555", fontSize: 11, cursor: "pointer", fontWeight: selectedExercise === name ? 700 : 400 }}>
                    {name}
                  </button>
                ))}
              </div>
              <div style={{ background: "#111", borderRadius: 10, padding: "12px 8px" }}>
                <WeightGraph history={history} exerciseName={selectedExercise} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <span style={{ fontSize: 11, color: "#444" }}>현재: <span style={{ color: EXERCISE_COLORS[selectedExercise], fontWeight: 700 }}>{weights[selectedExercise] || "-"}kg</span></span>
                <span style={{ fontSize: 11, color: "#444" }}>최고: <span style={{ color: "#e8c96d", fontWeight: 700 }}>
                  {(() => {
                    const vals = history.flatMap(h => h.results ? h.results.filter(r => r.name === selectedExercise).map(r => r.weight) : []);
                    return vals.length ? Math.max(...vals) + "kg" : "-";
                  })()}
                </span></span>
              </div>
            </div>
            {/* 현재 중량 */}
            <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#888", fontWeight: 500 }}>현재 중량</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {Object.entries(weights).map(([name, w]) => (
                <div key={name} style={{ background: "#1a1a1a", borderRadius: 12, padding: "12px 14px", border: "1px solid #2a2a2a" }}>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>{name}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#e8c96d" }}>{w}kg</div>
                  {name === "불가리안 스플릿 스쿼트" && <div style={{ fontSize: 11, color: "#6db8e8", marginTop: 2 }}>한 손 {w / 2}kg</div>}
                  {failCounts[name] > 0 && <div style={{ fontSize: 11, color: "#e87a6d", marginTop: 3 }}>실패 {failCounts[name]}/3</div>}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* 보조운동 그래프 */}
            <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 16, border: "1px solid #2a2a2a", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, color: "#f0ede8", fontWeight: 700 }}>보조운동 성장 그래프</h3>
                <span style={{ fontSize: 11, color: "#444" }}>● 완료 ● 부분</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {ACCESSORY_NAMES.map(name => (
                  <button key={name} onClick={() => setSelectedAccessoryExercise(name)}
                    style={{ padding: "5px 10px", borderRadius: 20, border: "1px solid " + (selectedAccessoryExercise === name ? EXERCISE_COLORS[name] : "#2a2a2a"), background: selectedAccessoryExercise === name ? EXERCISE_COLORS[name] + "22" : "none", color: selectedAccessoryExercise === name ? EXERCISE_COLORS[name] : "#555", fontSize: 11, cursor: "pointer", fontWeight: selectedAccessoryExercise === name ? 700 : 400 }}>
                    {name}
                  </button>
                ))}
              </div>
              <div style={{ background: "#111", borderRadius: 10, padding: "12px 8px" }}>
                <AccessoryGraph history={history} exerciseName={selectedAccessoryExercise} />
              </div>
            </div>
            {/* 보조운동 현재 중량 */}
            <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#888", fontWeight: 500 }}>보조운동 현재 중량</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {ACCESSORY_NAMES.map(name => {
                const ex = [...ACCESSORY_WORKOUTS.A, ...ACCESSORY_WORKOUTS.B].find(e => e.name === name);
                const isPlank = ex && ex.isPlank;
                const isBodyweight = ex && ex.isBodyweight;
                const w = accessoryWeights[name] || 0;
                return (
                  <div key={name} style={{ background: "#1a1a1a", borderRadius: 12, padding: "12px 14px", border: "1px solid #2a2a2a" }}>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>{name}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: EXERCISE_COLORS[name] || "#e8c96d" }}>
                      {isPlank ? getPlankDuration(w) + "초" : isBodyweight ? "맨몸" : w + "kg"}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 최근 세션 */}
        <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#888", fontWeight: 500 }}>최근 세션</h3>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", color: "#333", padding: "40px 0" }}>아직 기록이 없습니다.</div>
        ) : history.slice(0, 10).map((h, i) => (
          <div key={i} style={{ background: "#1a1a1a", borderRadius: 12, padding: 14, marginBottom: 10, border: "1px solid #2a2a2a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "#e8c96d" }}>워크아웃 {h.type}</span>
              <span style={{ fontSize: 12, color: "#555" }}>{formatDate(h.date)}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(h.results || []).map(r => (
                <span key={r.name} style={{ fontSize: 12, padding: "3px 8px", borderRadius: 20, background: r.success ? "#1e3a2a" : "#3a1e1e", color: r.success ? "#6de8a0" : "#e86d6d" }}>
                  {r.name} {r.weight}kg {r.success ? "✓" : "✗"}
                </span>
              ))}
            </div>
            {h.accessoryResults && h.accessoryResults.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {h.accessoryResults.map(r => (
                  <span key={r.name} style={{ fontSize: 11, padding: "2px 7px", borderRadius: 20, background: "#1a1030", color: "#b06de8", border: "1px solid #b06de822" }}>
                    {r.name} {r.success ? "✓" : "△"}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* 설정 버튼들 */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #1e1e1e" }}>
          <button onClick={() => setShowWeightEdit(true)} style={{ width: "100%", padding: "13px", background: "none", border: "1px solid #2a4a2a", borderRadius: 12, color: "#6de8a0", fontSize: 14, cursor: "pointer", marginBottom: 10 }}>
            메인 운동 중량 설정
          </button>
          <button onClick={() => setShowAccessoryWeightEdit(true)} style={{ width: "100%", padding: "13px", background: "none", border: "1px solid #b06de844", borderRadius: 12, color: "#b06de8", fontSize: 14, cursor: "pointer", marginBottom: 10 }}>
            보조운동 중량 설정
          </button>
          {!resetConfirm ? (
            <button onClick={() => setResetConfirm(true)} style={{ width: "100%", padding: "13px", background: "none", border: "1px solid #3a2020", borderRadius: 12, color: "#e87a6d", fontSize: 14, cursor: "pointer" }}>
              내 기록 초기화
            </button>
          ) : (
            <div style={{ background: "#1e1010", borderRadius: 12, padding: 16, border: "1px solid #4a2020" }}>
              <p style={{ color: "#e87a6d", fontSize: 14, margin: "0 0 12px", textAlign: "center" }}>모든 기록과 중량이 초기화됩니다. 정말 리셋할까요?</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setResetConfirm(false)} style={{ flex: 1, padding: "11px", background: "#222", border: "1px solid #333", borderRadius: 10, color: "#aaa", fontSize: 14, cursor: "pointer" }}>취소</button>
                <button onClick={handleReset} style={{ flex: 1, padding: "11px", background: "#3a1010", border: "1px solid #5a2020", borderRadius: 10, color: "#e87a6d", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>초기화</button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* ===== 중량 계산기 탭 ===== */}
    {tab === 2 && (
      <div>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#888", fontWeight: 500 }}>바벨 원판 계산기</h3>
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a", marginBottom: 16 }}>
          <label style={{ fontSize: 14, color: "#888", display: "block", marginBottom: 12 }}>목표 중량</label>
          <div style={{ textAlign: "center", fontSize: 40, fontWeight: 800, color: "#e8c96d", marginBottom: 16 }}>{calcWeight}kg</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {[-10, -5, 5, 10].map(delta => (
              <button key={delta} onClick={() => setCalcWeight(w => Math.max(20, w + delta))}
                style={{ padding: "12px 0", background: delta < 0 ? "#1e1e1e" : "#2e2a1a", border: "1px solid " + (delta < 0 ? "#333" : "#e8c96d44"), borderRadius: 10, color: delta < 0 ? "#aaa" : "#e8c96d", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {delta > 0 ? "+" : ""}{delta}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#555" }}>바벨 무게</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#aaa" }}>20kg (기본 바)</div>
          </div>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>한쪽 당 원판</div>
          {getPlateCombo(calcWeight).length === 0 ? (
            <div style={{ color: "#444", fontSize: 14 }}>원판 없음 (빈 바)</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {getPlateCombo(calcWeight).map(({ kg, count }) => (
                <div key={kg} style={{ background: "#111", borderRadius: 10, padding: "8px 14px", border: "1px solid #2a2a2a", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#e8c96d" }}>{kg}kg</div>
                  <div style={{ fontSize: 12, color: "#555" }}>x {count}개</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #1e1e1e", fontSize: 13, color: "#555" }}>
            총 중량: <span style={{ color: "#e8c96d", fontWeight: 700 }}>20 + {getPlateCombo(calcWeight).reduce((a, p) => a + p.kg * p.count * 2, 0)}kg = {calcWeight}kg</span>
          </div>
        </div>
      </div>
    )}

    {/* ===== 가이드 탭 ===== */}
    {tab === 3 && (
      <div>
        {/* 앱 소개 */}
        <div style={{ background: "linear-gradient(135deg, #1e1a10, #1a1a1a)", borderRadius: 14, padding: 20, border: "1px solid #e8c96d22", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 28 }}>🏋️</span>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#e8c96d" }}>SetUp</h3>
          </div>
          <p style={{ color: "#bbb", fontSize: 14, lineHeight: 1.8, margin: "0 0 10px" }}>
            SetUp은 근력 운동을 처음 시작하거나 체계적으로 기록하고 싶은 분들을 위한 앱이에요.
          </p>
          <p style={{ color: "#bbb", fontSize: 14, lineHeight: 1.8, margin: 0 }}>
            복잡한 루틴 없이 <span style={{ color: "#e8c96d", fontWeight: 700 }}>6가지 핵심 운동</span>만으로 전신 근력을 균형 있게 키울 수 있어요. 성공하면 자동으로 중량이 올라가고, 실패하면 자동으로 조정돼요.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {[{ emoji: "📈", text: "자동 중량 증가" }, { emoji: "⏱️", text: "휴식 타이머" }, { emoji: "📊", text: "성장 그래프" }, { emoji: "🧮", text: "원판 계산기" }, { emoji: "💜", text: "보조운동" }].map((f, i) => (
              <div key={i} style={{ background: "#111", borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{f.emoji}</span>
                <span style={{ fontSize: 11, color: "#888" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* StrongLifts 5x5 설명 */}
        <div style={{ background: "linear-gradient(135deg, #0f1a2e, #1a1a1a)", borderRadius: 14, padding: 20, border: "1px solid #6db8e822", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 22 }}>💡</span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#6db8e8" }}>StrongLifts 5x5 기반 프로그램</h3>
          </div>
          <p style={{ color: "#bbb", fontSize: 13, lineHeight: 1.8, margin: "0 0 12px" }}>
            SetUp은 전 세계적으로 검증된 <span style={{ color: "#6db8e8", fontWeight: 700 }}>StrongLifts 5x5</span> 프로그램을 바탕으로 만들어졌어요.
          </p>
          <div style={{ background: "#111", borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#6db8e8", marginBottom: 8 }}>StrongLifts 5x5란?</div>
            <p style={{ color: "#888", fontSize: 12, lineHeight: 1.8, margin: 0 }}>
              5가지 핵심 바벨 운동(스쿼트, 벤치프레스, 바벨 로우, 오버헤드 프레스, 데드리프트)을 5세트 5회씩 수행하며, 매 세션마다 중량을 조금씩 올려가는 선형 점진 과부하 프로그램이에요. 초보자부터 중급자까지 전 세계 수백만 명이 사용해온 방법이에요.
            </p>
          </div>
          <div style={{ background: "#111", borderRadius: 10, padding: 14, border: "1px solid #6de8a022" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#6de8a0", marginBottom: 8 }}>SetUp만의 차이점</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { emoji: "🦵", text: "스쿼트 랙이 없어도 OK — 불가리안 스플릿 스쿼트로 대체 가능해요" },
                { emoji: "📱", text: "매 세션 하체 운동을 자유롭게 선택할 수 있어요" },
                { emoji: "💜", text: "메인 완료 후 보조운동 4가지로 부족한 근육을 추가 자극해요" },
                { emoji: "📊", text: "중량 성장 그래프와 자동 원판 계산기가 내장돼 있어요" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{item.emoji}</span>
                  <span style={{ fontSize: 12, color: "#888", lineHeight: 1.7 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 운동 구성 */}
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a", marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 16, color: "#e8c96d", fontWeight: 800 }}>운동 구성</h3>
          <p style={{ color: "#555", fontSize: 12, margin: "0 0 14px" }}>A, B 워크아웃을 번갈아 진행해요 · 주 3회</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            {[
              { title: "워크아웃 A", color: "#6db8e8", exercises: ["하체 운동", "벤치프레스 5x5", "바벨 로우 5x5"] },
              { title: "워크아웃 B", color: "#6de8a0", exercises: ["하체 운동", "오버헤드 프레스 5x5", "데드리프트 1x5"] },
            ].map(w => (
              <div key={w.title} style={{ flex: 1, background: "#111", borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 700, color: w.color, marginBottom: 10, fontSize: 13 }}>{w.title}</div>
                {w.exercises.map(e => (
                  <div key={e} style={{ fontSize: 12, color: "#777", padding: "5px 0", borderBottom: "1px solid #1a1a1a" }}>{e}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ background: "#111", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>하체 운동은 매일 선택해요</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6de8a0" }}>불가리안 스플릿 스쿼트</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>3세트 x 8회 (단다리)</div>
              </div>
              <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6db8e8" }}>스쿼트</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>5세트 x 5회</div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 보조운동 가이드 섹션 ===== */}
        <div style={{ background: "linear-gradient(135deg, #0f0a1e, #1a1a2e)", borderRadius: 14, padding: 20, border: "1px solid #b06de833", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 22 }}>💜</span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#b06de8" }}>보조운동 가이드</h3>
          </div>
          <p style={{ color: "#bbb", fontSize: 13, lineHeight: 1.8, margin: "0 0 14px" }}>
            메인 5x5 운동을 보완하는 고립 운동이에요. 메인으로 덜 자극되는 근육을 집중 공략해요.
          </p>

          {/* 더블 프로그레션 설명 */}
          <div style={{ background: "#111", borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#b06de8", marginBottom: 8 }}>더블 프로그레션이란?</div>
            <p style={{ color: "#888", fontSize: 12, lineHeight: 1.8, margin: "0 0 10px" }}>
              메인과 달리 <span style={{ color: "#b06de8", fontWeight: 700 }}>횟수를 먼저 채우고, 다 채우면 중량 올리기</span> 방식을 써요.
            </p>
            <div style={{ background: "#1a1030", borderRadius: 8, padding: 12, border: "1px solid #b06de822" }}>
              <div style={{ fontSize: 12, color: "#b06de8", fontWeight: 700, marginBottom: 6 }}>예시: 덤벨 컬 15kg</div>
              {[
                { label: "1주차", desc: "8→8→8 · 아직 목표 미달, 중량 유지" },
                { label: "2주차", desc: "10→10→10 · 조금 더 왔어요" },
                { label: "3주차", desc: "12→12→12 · 목표 달성! 다음 세션 중량 UP ↑" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "5px 0", borderBottom: i < 2 ? "1px solid #2a2040" : "none" }}>
                  <span style={{ fontSize: 12, color: "#888", minWidth: 55, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: 12, color: i === 2 ? "#6de8a0" : "#666" }}>{row.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 워크아웃별 보조운동 */}
          {["A", "B"].map(wt => (
            <div key={wt} style={{ background: "#111", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: wt === "A" ? "#6db8e8" : "#6de8a0", marginBottom: 10 }}>
                워크아웃 {wt} 보조운동
              </div>
              {ACCESSORY_WORKOUTS[wt].map((ex, i) => (
                <div key={ex.name} style={{ padding: "10px 0", borderBottom: i < ACCESSORY_WORKOUTS[wt].length - 1 ? "1px solid #1a1a2a" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: EXERCISE_COLORS[ex.name] || "#f0ede8", marginBottom: 2 }}>{ex.name}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>
                        {ex.isPlank
                          ? "3세트 × 60→75→90초 · 자동 증가"
                          : ex.isBodyweight
                            ? `3세트 × ${ex.minReps}회 · 맨몸`
                            : `3세트 × ${ex.minReps}~${ex.maxReps}회 · 더블 프로그레션`
                        }
                      </div>
                    </div>
                    <button onClick={() => setDescExercise(ex.name)}
                      style={{ marginLeft: 10, padding: "4px 9px", background: "#222", border: "1px solid #333", borderRadius: 6, color: "#888", fontSize: 10, cursor: "pointer", flexShrink: 0 }}>
                      자세히
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div style={{ background: "#1a1030", borderRadius: 10, padding: 12, border: "1px solid #b06de822", marginTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#b06de8", marginBottom: 6 }}>⏱️ 보조운동 휴식 시간</div>
            <div style={{ fontSize: 12, color: "#888" }}>세트 간 <span style={{ color: "#e8c96d" }}>60~90초</span> 휴식해요. 메인 운동보다 짧게 쉬어도 돼요.</div>
          </div>
        </div>

        {/* 메인 운동별 가이드 */}
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a", marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 16, color: "#e8c96d", fontWeight: 800 }}>메인 운동별 가이드</h3>
          <p style={{ color: "#555", fontSize: 12, margin: "0 0 14px" }}>핵심 포인트를 확인하고 자세히 버튼으로 상세 설명을 봐요</p>
          {[
            { name: "벤치프레스", emoji: "🏋️", point: "바를 가슴 중앙으로 내리고, 팔꿈치 45~75도 유지", target: "가슴 · 삼두 · 전면 어깨" },
            { name: "스쿼트", emoji: "🦵", point: "허벅지가 바닥과 평행될 때까지, 무릎은 발끝 방향으로", target: "대퇴사두 · 둔근 · 햄스트링" },
            { name: "불가리안 스플릿 스쿼트", emoji: "🦵", point: "앞 무릎 90도까지 수직으로, 앞발 뒤꿈치로 밀어내기", target: "대퇴사두 · 둔근 (단다리 집중)" },
            { name: "바벨 로우", emoji: "💪", point: "상체 45~90도 숙이고, 배꼽 쪽으로 끌어당기기", target: "광배근 · 승모근 · 이두" },
            { name: "오버헤드 프레스", emoji: "🙌", point: "코어와 둔근 조이고, 바를 수직으로 머리 위로", target: "전면/측면 어깨 · 삼두" },
            { name: "데드리프트", emoji: "⬆️", point: "척추 중립 유지, 바를 몸에 붙여서 올리기 (1세트만)", target: "허리 · 둔근 · 햄스트링 · 전신" },
          ].map((ex, i) => (
            <div key={ex.name} style={{ padding: "14px 0", borderBottom: i < 5 ? "1px solid #222" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{ex.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: EXERCISE_COLORS[ex.name] || "#f0ede8" }}>{ex.name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 5 }}>{ex.target}</div>
                  <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>👉 {ex.point}</div>
                </div>
                <button onClick={() => setDescExercise(ex.name)}
                  style={{ marginLeft: 10, padding: "5px 10px", background: "#222", border: "1px solid #333", borderRadius: 6, color: "#888", fontSize: 10, cursor: "pointer", flexShrink: 0 }}>
                  자세히
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 중량 시스템 */}
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a", marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, color: "#e8c96d", fontWeight: 800 }}>중량 시스템</h3>
          {[
            { color: "#6de8a0", bg: "#1a2e1a", emoji: "✅", title: "성공하면", desc: "다음 세션에 자동으로 5kg 올라가요." },
            { color: "#e8c96d", bg: "#2e2a1a", emoji: "⚠️", title: "3회 연속 실패하면", desc: "중량이 자동으로 10% 내려가요. 기록 탭에서 직접 조정도 가능해요." },
            { color: "#b06de8", bg: "#1a1030", emoji: "💜", title: "보조운동 더블 프로그레션", desc: "3세트 모두 목표 횟수 달성 시 '중량 올릴 타이밍' 알림이 떠요. 중량은 기록 탭에서 직접 올려요." },
            { color: "#e86d6d", bg: "#2e1a1a", emoji: "😴", title: "정체기가 오면", desc: "수면과 단백질 섭취를 점검해보세요. 체중 1kg당 1.6~2g 단백질, 7~8시간 수면이 목표예요." },
          ].map(item => (
            <div key={item.title} style={{ background: item.bg, borderRadius: 10, padding: 14, marginBottom: 10, border: "1px solid " + item.color + "33" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>{item.emoji}</span>
                <span style={{ fontWeight: 700, color: item.color, fontSize: 14 }}>{item.title}</span>
              </div>
              <div style={{ color: "#aaa", fontSize: 13, lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* 이런 분께 추천 */}
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a", marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, color: "#e8c96d", fontWeight: 800 }}>이런 분께 추천해요</h3>
          {[
            { emoji: "🌱", text: "헬스를 처음 시작하는 분" },
            { emoji: "📝", text: "운동 기록을 체계적으로 관리하고 싶은 분" },
            { emoji: "💪", text: "꾸준히 중량을 올려가며 성장하고 싶은 분" },
            { emoji: "⏰", text: "주 3회, 1시간 이내로 효율적으로 운동하고 싶은 분" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 3 ? "1px solid #222" : "none" }}>
              <span style={{ fontSize: 20 }}>{item.emoji}</span>
              <span style={{ fontSize: 13, color: "#aaa" }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* 꼭 기억하세요 */}
        <div style={{ background: "#1a2e1a", borderRadius: 14, padding: 20, border: "1px solid #2a4a2a", marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, color: "#6de8a0", fontWeight: 800 }}>꼭 기억하세요</h3>
          {[
            { emoji: "🔥", title: "웜업은 필수", desc: "부상 방지를 위해 웜업 세트를 절대 건너뛰지 마세요." },
            { emoji: "😤", title: "가볍게 시작", desc: "처음엔 무조건 가벼운 중량으로 시작해요. 꾸준히 올리는 게 답이에요." },
            { emoji: "🥩", title: "단백질 + 수면", desc: "체중 1kg당 1.6~2g 단백질, 7~8시간 수면을 지켜주세요." },
            { emoji: "📌", title: "불가리안 중량 입력 주의", desc: "양손 합산 중량을 입력해요. 한 손에 10kg이면 20kg으로 입력!" },
          ].map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 3 ? "1px solid #1a3a1a" : "none" }}>
              <span style={{ fontSize: 20 }}>{tip.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#6de8a0", marginBottom: 3 }}>{tip.title}</div>
                <div style={{ fontSize: 12, color: "#4a8a5a", lineHeight: 1.6 }}>{tip.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
</div>
```

);
}

import LandingPage from “./LandingPage”;
import PrivacyPolicy from “./PrivacyPolicy”;

export default function App() {
const [user, setUser] = useState(null);
const [page, setPage] = useState(“landing”);
const [authChecked, setAuthChecked] = useState(false);

useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
if (firebaseUser) {
const email = firebaseUser.email;
const snap = await getDocs(collection(db, “users”));
let foundUid = null;
let isAdmin = false;
snap.forEach(d => {
if (d.data().email === email) {
foundUid = d.id;
isAdmin = d.data().isAdmin || false;
}
});
if (foundUid) {
setUser({ uid: foundUid, isAdmin });
setPage(“app”);
}
}
setAuthChecked(true);
});
return () => unsubscribe();
}, []);

if (!authChecked) return (
<div style={{ minHeight: “100vh”, background: “#0f0f0f”, display: “flex”, alignItems: “center”, justifyContent: “center” }}>
<div style={{ color: “#555”, fontSize: 14 }}>불러오는 중…</div>
</div>
);

if (page === “privacy”) return <PrivacyPolicy />;
if (page === “login”) return (
<LoginScreen onLogin={(uid, isAdmin) => { setUser({ uid, isAdmin }); setPage(“app”); }} />
);
if (page === “app” && user) return (
<WorkoutApp uid={user.uid} isAdmin={user.isAdmin} onLogout={() => { setUser(null); setPage(“landing”); auth.signOut(); }} />
);
return <LandingPage onStart={() => setPage(“login”)} />;
}
