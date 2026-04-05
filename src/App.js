import { useState, useEffect } from “react”;
import { db, auth } from “./firebase”;
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from “firebase/firestore”;
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from “firebase/auth”;

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

const TABS = [“오늘 운동”, “기록”, “중량 계산기”, “가이드”];

const formatDate = (d) =>
new Date(d).toLocaleDateString(“ko-KR”, { month: “short”, day: “numeric”, weekday: “short” });

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

async function loginUser(uid, pw) {
const ref = doc(db, “users”, uid);
const snap = await getDoc(ref);
if (!snap.exists()) return { ok: false, error: “존재하지 않는 아이디예요.” };
if (snap.data().pw !== pw) return { ok: false, error: “비밀번호가 틀렸어요.” };
return { ok: true, isAdmin: snap.data().isAdmin || false };
}

async function registerUser(uid, pw, email, initialWeights) {
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
await setDoc(ref, { pw, email, isAdmin });
if (initialWeights) {
await setDoc(doc(db, “userData”, uid), { weights: initialWeights, history: [], next: “A”, fails: {} });
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
const [resetEmail, setResetEmail] = useState(””);
const [resetSent, setResetSent] = useState(false);

const inputStyle = { width: “100%”, padding: “12px 14px”, background: “#111”, border: “1px solid #333”, borderRadius: 10, color: “#f0ede8”, fontSize: 15, outline: “none”, boxSizing: “border-box” };

const handle = async () => {
if (!id.trim() || !pw.trim()) { setError(“아이디와 비밀번호를 입력해주세요.”); return; }
if (mode === “register” && !email.trim()) { setError(“이메일을 입력해주세요.”); return; }
setLoading(true);
setError(””);
try {
if (mode === “login”) {
const res = await loginUser(id.trim(), pw);
if (!res.ok) { setError(res.error); return; }
onLogin(id.trim(), res.isAdmin);
} else {
setPendingUid(id.trim());
setPendingPw(pw);
setPendingEmail(email.trim());
setStep(“weights”);
}
} catch (e) {
setError(“오류가 발생했어요. Firebase 설정을 확인해주세요.”);
} finally {
setLoading(false);
}
};

const handleWeightsDone = async () => {
setLoading(true);
try {
const res = await registerUser(pendingUid, pendingPw, pendingEmail, initWeights);
if (!res.ok) { setError(res.error); setStep(“auth”); return; }
onLogin(pendingUid, res.isAdmin);
} catch (e) {
setError(“오류가 발생했어요.”);
setStep(“auth”);
} finally {
setLoading(false);
}
};

const handleReset = async () => {
if (!resetEmail.trim()) { setError(“이메일을 입력해주세요.”); return; }
setLoading(true);
setError(””);
try {
const res = await resetPassword(resetEmail.trim());
if (!res.ok) { setError(res.error); return; }
setResetSent(true);
} finally {
setLoading(false);
}
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
<div style={{ color: “#888”, fontSize: 13, lineHeight: 1.7 }}>{resetEmail} 로 비밀번호 재설정 링크를 전송했어요. 이메일을 확인해주세요.</div>
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
← 로그인으로 돌아가기
</button>
</div>
)}
</div>
</div>
);

if (step === “weights”) return (
<div style={{ minHeight: “100vh”, background: “#0f0f0f”, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: 20 }}>
<div style={{ width: “100%”, maxWidth: 400 }}>
<div style={{ textAlign: “center”, marginBottom: 24 }}>
<div style={{ fontSize: 40, marginBottom: 8 }}>⚖️</div>
<h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: “#f0ede8” }}>시작 중량 설정</h2>
<p style={{ color: “#555”, fontSize: 13, marginTop: 6 }}>각 운동의 시작 중량을 입력해주세요</p>
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
<button onClick={handleWeightsDone} disabled={loading}
style={{ width: “100%”, padding: “14px”, background: loading ? “#555” : “linear-gradient(135deg, #e8c96d, #d4a843)”, border: “none”, borderRadius: 12, fontSize: 15, fontWeight: 800, color: “#111”, cursor: “pointer” }}>
{loading ? “처리 중…” : “시작하기”}
</button>
</div>
</div>
);

return (
<div style={{ minHeight: “100vh”, background: “#0f0f0f”, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: 20 }}>
<div style={{ width: “100%”, maxWidth: 400 }}>
<div style={{ textAlign: “center”, marginBottom: 36 }}>
<div style={{ fontSize: 48, marginBottom: 8 }}>🏋️</div>
<h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: “#f0ede8” }}>StrongLifts 5x5</h1>
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

useEffect(() => { getAllUsers().then(u => { setUsers(u); setLoading(false); }); }, []);

const handleDelete = async (uid) => {
await deleteUser(uid);
const updated = Object.assign({}, users);
delete updated[uid];
setUsers(updated);
setConfirm(null);
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
<div key={uid} style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, padding: “14px 16px”, borderBottom: “1px solid #1e1e1e” }}>
<div>
<span style={{ fontWeight: 600, color: uid === currentUid ? “#e8c96d” : “#f0ede8” }}>{uid}</span>
{info.isAdmin && <span style={{ marginLeft: 6, fontSize: 11, color: “#e8c96d”, background: “#2e2a1a”, padding: “2px 7px”, borderRadius: 20 }}>관리자</span>}
{uid === currentUid && <span style={{ marginLeft: 6, fontSize: 11, color: “#6db8e8” }}>나</span>}
</div>
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
))}
</div>
</div>
</div>
);
}

function WorkoutApp({ uid, isAdmin, onLogout }) {
const [tab, setTab] = useState(0);
const [weights, setWeights] = useState(Object.assign({}, DEFAULT_WEIGHTS));
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

const DIFFICULTY_OPTIONS = [
{ key: “easy”, label: “적당했어요”, seconds: 90, color: “#6de8a0”, bg: “#1a2e1a”, emoji: “😊” },
{ key: “hard”, label: “힘들었어요”, seconds: 180, color: “#e8c96d”, bg: “#2e2a1a”, emoji: “😅” },
{ key: “fail”, label: “실패했어요”, seconds: 300, color: “#e86d6d”, bg: “#2e1a1a”, emoji: “😤” },
];

useEffect(() => {
loadUserData(uid).then(d => {
if (d) {
if (d.weights) setWeights(d.weights);
if (d.history) setHistory(d.history);
if (d.next) setNextWorkout(d.next);
if (d.fails) setFailCounts(d.fails);
}
setDataLoaded(true);
});
}, [uid]);

useEffect(() => {
if (!dataLoaded) return;
saveUserData(uid, { weights, history, next: nextWorkout, fails: failCounts });
}, [weights, history, nextWorkout, failCounts, dataLoaded]);

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
const fresh = { weights: Object.assign({}, DEFAULT_WEIGHTS), history: [], next: “A”, fails: {} };
setWeights(fresh.weights);
setHistory(fresh.history);
setNextWorkout(fresh.next);
setFailCounts(fresh.fails);
setSession(null);
setResetConfirm(false);
await saveUserData(uid, fresh);
};

const startSession = (lowerType) => {
const WORKOUTS = getWorkouts(lowerType);
const exercises = WORKOUTS[nextWorkout].map(e => Object.assign({}, e, { weight: weights[e.name] || DEFAULT_WEIGHTS[e.name] }));
const initialWarmup = {};
exercises.forEach((_, i) => { initialWarmup[i] = true; });
setSession({ type: nextWorkout, exercises, date: Date.now() });
setCompletedSets({});
setShowWarmup(initialWarmup);
setLowerChoice(null);
setDone(false);
};

const toggleSet = (prefix, exIdx, setIdx) => {
const key = prefix + “-” + exIdx + “-” + setIdx;
setCompletedSets(prev => Object.assign({}, prev, { [key]: !prev[key] }));
};

const isWarmupAllDone = (exIdx, count) =>
Array.from({ length: count }, (_, i) => completedSets[“w-” + exIdx + “-” + i]).every(Boolean);

const isMainAllDone = (exIdx, totalSets) =>
Array.from({ length: totalSets }, (_, i) => completedSets[“m-” + exIdx + “-” + i]).every(Boolean);

const finishSession = () => {
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
setWeights(newWeights);
setFailCounts(newFails);
setHistory(prev => [{ type: session.type, date: session.date, results }].concat(prev.slice(0, 49)));
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

if (!dataLoaded) {
return (
<div style={{ minHeight: “100vh”, background: “#0f0f0f”, display: “flex”, alignItems: “center”, justifyContent: “center”, color: “#555” }}>
데이터 불러오는 중…
</div>
);
}

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

```
  <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #111 100%)", padding: "28px 24px 20px", borderBottom: "1px solid #222" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 28 }}>🏋️</span>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f0ede8" }}>StrongLifts 5x5</h1>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {isAdmin && (
          <button onClick={() => setShowAdmin(true)} style={{ padding: "6px 10px", background: "#2e2a1a", border: "1px solid #e8c96d44", borderRadius: 8, color: "#e8c96d", fontSize: 11, cursor: "pointer" }}>관리</button>
        )}
        <button onClick={onLogout} style={{ padding: "6px 10px", background: "#1e1e1e", border: "1px solid #333", borderRadius: 8, color: "#666", fontSize: 11, cursor: "pointer" }}>로그아웃</button>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, marginTop: 6 }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#e8c96d22", border: "1px solid #e8c96d44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#e8c96d" }}>
        {uid[0].toUpperCase()}
      </div>
      <span style={{ fontSize: 12, color: "#888" }}>{uid}</span>
      {isAdmin && <span style={{ fontSize: 10, color: "#e8c96d", background: "#2e2a1a", padding: "1px 6px", borderRadius: 20 }}>관리자</span>}
    </div>
    <div style={{ display: "flex", gap: 16 }}>
      {[{ label: "총 세션", val: totalSessions }, { label: "연속", val: streak + "회" }, { label: "다음", val: "워크아웃 " + nextWorkout }].map(s => (
        <div key={s.label} style={{ background: "#1e1e1e", borderRadius: 10, padding: "8px 14px", flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#e8c96d" }}>{s.val}</div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  </div>

  <div style={{ display: "flex", background: "#161616", borderBottom: "1px solid #222" }}>
    {TABS.map((t, i) => (
      <button key={t} onClick={() => setTab(i)} style={{ flex: 1, padding: "14px 4px", background: "none", border: "none", color: tab === i ? "#e8c96d" : "#555", fontWeight: tab === i ? 700 : 400, fontSize: 12, cursor: "pointer", borderBottom: tab === i ? "2px solid #e8c96d" : "2px solid transparent" }}>
        {t}
      </button>
    ))}
  </div>

  <div style={{ padding: "20px 16px", overflowX: "hidden" }}>
    {tab === 0 && (
      <div>
        {!session ? (
          <div>
            <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, marginBottom: 16, border: "1px solid #2a2a2a" }}>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>다음 운동</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#e8c96d", marginBottom: 12 }}>워크아웃 {nextWorkout}</div>
              {getWorkouts(lowerChoice || "bulgarian")[nextWorkout].map(ex => {
                const w = weights[ex.name] || DEFAULT_WEIGHTS[ex.name];
                const warmups = getWarmupSets(w, ex.isBulgarian);
                return (
                  <div key={ex.name} style={{ padding: "12px 0", borderBottom: "1px solid #1e1e1e" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{ex.name}</span>
                      <span style={{ fontSize: 13, color: "#aaa" }}>{ex.sets}x{ex.reps} <span style={{ color: "#e8c96d", fontWeight: 700 }}>{w}kg</span></span>
                    </div>
                    {ex.note && <div style={{ fontSize: 11, color: "#6db8e8", marginTop: 3 }}>💡 {ex.note}</div>}
                    <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>
                      웜업: {warmups.map(ws => ws.weight === 0 ? "맨몸" : ws.weight + "kg").join(" → ")} → 본세트
                    </div>
                  </div>
                );
              })}
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
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => startSession(lowerChoice)}
                  style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #e8c96d, #d4a843)", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 800, color: "#111", cursor: "pointer" }}>
                  💪 운동 시작 ({lowerChoice === "bulgarian" ? "불가리안" : "스쿼트"})
                </button>
                <button onClick={() => setLowerChoice(null)}
                  style={{ width: "100%", padding: "13px", background: "none", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 14, color: "#555", cursor: "pointer" }}>
                  ← 하체 운동 다시 선택
                </button>
              </div>
            )}
          </div>
        ) : done ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: "#e8c96d", fontSize: 24, marginBottom: 8 }}>운동 완료!</h2>
            <p style={{ color: "#888", marginBottom: 24 }}>훌륭해요! 다음 세션이 기다리고 있습니다.</p>
            <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 16, marginBottom: 20, textAlign: "left" }}>
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
            <button onClick={() => setSession(null)} style={{ padding: "14px 32px", background: "#222", border: "1px solid #444", borderRadius: 12, color: "#f0ede8", fontSize: 15, cursor: "pointer" }}>
              홈으로
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>워크아웃 {session.type}</h2>
              <span style={{ fontSize: 12, color: "#666" }}>{formatDate(session.date)}</span>
            </div>
            {session.exercises.map((ex, exIdx) => {
              const warmupSets = getWarmupSets(ex.weight, ex.isBulgarian);
              const warmupOpen = showWarmup[exIdx] !== false;
              const warmupDone = isWarmupAllDone(exIdx, warmupSets.length);
              const mainDone = isMainAllDone(exIdx, ex.sets);
              return (
                <div key={ex.name} style={{ background: mainDone ? "#1a2a1a" : "#1a1a1a", borderRadius: 14, padding: 16, marginBottom: 14, border: "1px solid " + (mainDone ? "#2a4a2a" : "#2a2a2a") }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{ex.name}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                        본세트 {ex.sets}x{ex.reps} <span style={{ color: "#e8c96d" }}>{ex.weight}kg</span>
                        {ex.isBulgarian && <span style={{ color: "#6db8e8" }}> (한 손 {ex.weight / 2}kg)</span>}
                      </div>
                    </div>
                    {mainDone && <span style={{ color: "#6de8a0", fontSize: 22 }}>✓</span>}
                  </div>
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
            <button onClick={finishSession} style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg, #e8c96d, #d4a843)", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, color: "#111", cursor: "pointer", marginTop: 8 }}>
              운동 완료 &amp; 저장
            </button>
            <button onClick={() => setSession(null)} style={{ width: "100%", padding: "12px", background: "none", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 14, color: "#555", cursor: "pointer", marginTop: 8 }}>
              취소
            </button>
          </div>
        )}
      </div>
    )}

    {tab === 1 && (
      <div>
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
              {h.results.map(r => (
                <span key={r.name} style={{ fontSize: 12, padding: "3px 8px", borderRadius: 20, background: r.success ? "#1e3a2a" : "#3a1e1e", color: r.success ? "#6de8a0" : "#e86d6d" }}>
                  {r.name} {r.weight}kg {r.success ? "✓" : "✗"}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #1e1e1e" }}>
          <button onClick={() => setShowWeightEdit(true)} style={{ width: "100%", padding: "13px", background: "none", border: "1px solid #2a4a2a", borderRadius: 12, color: "#6de8a0", fontSize: 14, cursor: "pointer", marginBottom: 10 }}>
            중량 설정 변경
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

    {tab === 3 && (
      <div>
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a", marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 18, color: "#e8c96d", fontWeight: 800 }}>StrongLifts 5x5란?</h3>
          <p style={{ color: "#aaa", fontSize: 14, lineHeight: 1.8, margin: "0 0 12px" }}>StrongLifts 5x5는 전 세계 수백만 명이 사용하는 검증된 근력 증가 프로그램이에요. 복잡한 운동 없이 5가지 핵심 복합 운동만으로 전신 근력을 균형 있게 키울 수 있어요.</p>
          <p style={{ color: "#aaa", fontSize: 14, lineHeight: 1.8, margin: "0 0 12px" }}>핵심 원칙은 단순해요. 매 세션마다 5세트 5회씩 반복하고, 성공하면 다음 세션에 5kg씩 중량을 올려요.</p>
          <p style={{ color: "#aaa", fontSize: 14, lineHeight: 1.8, margin: 0 }}>주 3회 (월/수/금 또는 화/목/토) 운동하며, 초보자부터 중급자까지 누구에게나 효과적이에요.</p>
        </div>
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a", marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#e8c96d", fontWeight: 800 }}>프로그램 구성</h3>
          {[
            { title: "워크아웃 A", color: "#6db8e8", exercises: ["하체 운동 (불가리안 or 스쿼트)", "벤치프레스 5x5", "바벨 로우 5x5"] },
            { title: "워크아웃 B", color: "#6de8a0", exercises: ["하체 운동 (불가리안 or 스쿼트)", "오버헤드 프레스 5x5", "데드리프트 1x5"] },
          ].map(w => (
            <div key={w.title} style={{ marginBottom: 14, background: "#111", borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 700, color: w.color, marginBottom: 8, fontSize: 15 }}>{w.title}</div>
              {w.exercises.map(e => (
                <div key={e} style={{ fontSize: 13, color: "#aaa", padding: "4px 0", borderBottom: "1px solid #1a1a1a" }}>{e}</div>
              ))}
            </div>
          ))}
          <p style={{ color: "#666", fontSize: 12, margin: "12px 0 0", lineHeight: 1.6 }}>A - B - A - B 순서로 번갈아 진행해요. 세션 사이에 하루 이상 휴식을 취하세요.</p>
        </div>
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a", marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#e8c96d", fontWeight: 800 }}>중량 증가 원칙</h3>
          {[
            { color: "#6de8a0", bg: "#1a2e1a", title: "성공 시 (+5kg)", desc: "5세트를 모두 완료하면 다음 세션에 자동으로 5kg 증가해요." },
            { color: "#e8c96d", bg: "#2e2a1a", title: "실패 시", desc: "3회 연속 실패하면 중량이 자동으로 10% 감량돼요. 중량 설정 변경에서 직접 내릴 수도 있어요." },
            { color: "#e86d6d", bg: "#2e1a1a", title: "정체기가 오면?", desc: "수면, 식사, 스트레스를 점검해보세요. 단백질 섭취와 충분한 수면이 가장 효과적이에요." },
          ].map(item => (
            <div key={item.title} style={{ background: item.bg, borderRadius: 10, padding: 14, marginBottom: 10, border: "1px solid " + item.color + "33" }}>
              <div style={{ fontWeight: 700, color: item.color, fontSize: 14, marginBottom: 6 }}>{item.title}</div>
              <div style={{ color: "#aaa", fontSize: 13, lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a", marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#e8c96d", fontWeight: 800 }}>앱 사용법</h3>
          {[
            { step: "1", title: "회원가입", desc: "아이디, 이메일, 비밀번호(6자 이상)를 입력하고 회원가입하세요. 이메일은 비밀번호 찾기에 사용돼요." },
            { step: "2", title: "하체 운동 선택", desc: "불가리안 스플릿 스쿼트 또는 스쿼트 중 오늘 할 운동을 선택하세요. 잘못 선택했으면 뒤로가기 버튼을 누르세요." },
            { step: "3", title: "웜업 세트", desc: "본 세트 전에 반드시 웜업을 완료하세요. 부상 예방에 매우 중요해요!" },
            { step: "4", title: "본 세트 완료", desc: "세트 완료 후 난이도를 선택하면 자동으로 휴식 타이머가 시작돼요." },
            { step: "5", title: "운동 저장", desc: "저장하면 성공한 운동은 다음 세션에 자동으로 5kg 올라가요." },
            { step: "6", title: "기록 관리", desc: "기록 탭에서 현재 중량과 세션 기록 확인, 중량 설정 변경도 가능해요." },
          ].map(item => (
            <div key={item.step} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid #222" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#e8c96d22", border: "1px solid #e8c96d66", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#e8c96d", flexShrink: 0 }}>{item.step}</div>
              <div>
                <div style={{ fontWeight: 700, color: "#f0ede8", fontSize: 14, marginBottom: 5 }}>{item.title}</div>
                <div style={{ color: "#888", fontSize: 13, lineHeight: 1.7 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a", marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#e8c96d", fontWeight: 800 }}>휴식 타이머</h3>
          {[
            { emoji: "😊", label: "적당했어요", time: "90초", color: "#6de8a0", desc: "짧은 휴식으로도 다음 세트 가능해요." },
            { emoji: "😅", label: "힘들었어요", time: "3분", color: "#e8c96d", desc: "충분히 쉬고 다음 세트에 집중하세요." },
            { emoji: "😤", label: "실패했어요", time: "5분", color: "#e86d6d", desc: "충분한 휴식 후 도전하세요." },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid #222", alignItems: "center" }}>
              <span style={{ fontSize: 24 }}>{item.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: item.color, fontSize: 14 }}>{item.label}</span>
                  <span style={{ fontSize: 13, color: item.color, fontWeight: 700 }}>{item.time}</span>
                </div>
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "#1a2e1a", borderRadius: 14, padding: 20, border: "1px solid #2a4a2a", marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, color: "#6de8a0", fontWeight: 800 }}>꿀팁</h3>
          {[
            { title: "웜업은 필수!", desc: "웜업 세트를 절대 건너뛰지 마세요." },
            { title: "가볍게 시작하세요", desc: "처음엔 가벼운 중량으로 시작하고 꾸준히 올리는 게 효과적이에요." },
            { title: "스쿼트 깊이", desc: "허벅지가 바닥과 평행이 될 때까지 내려가세요." },
            { title: "불가리안 중량 입력", desc: "양손 합산 중량을 입력해요. 한 손에 10kg이면 20kg 입력!" },
            { title: "데드리프트는 1세트", desc: "1세트만 하지만 가장 무거운 무게로 집중해서 해요." },
            { title: "단백질과 수면", desc: "체중 1kg당 1.6-2g 단백질과 7-8시간 수면을 목표로 하세요." },
          ].map((tip, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < 5 ? "1px solid #1a3a1a" : "none" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#6de8a0", marginBottom: 3 }}>{tip.title}</div>
              <div style={{ fontSize: 12, color: "#4a8a5a", lineHeight: 1.6 }}>{tip.desc}</div>
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

export default function App() {
const [user, setUser] = useState(null);
return !user
? <LoginScreen onLogin={(uid, isAdmin) => setUser({ uid, isAdmin })} />
: <WorkoutApp uid={user.uid} isAdmin={user.isAdmin} onLogout={() => setUser(null)} />;
}
