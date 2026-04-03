import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
doc, getDoc, setDoc, deleteDoc, collection, getDocs
} from "firebase/firestore";

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// \uc6b4\ub3d9 \ub370\uc774\ud130
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const WORKOUTS = {
A: [
{ name: "\ubd88\uac00\ub9ac\uc548 \uc2a4\ud50c\ub9bf \uc2a4\ucffc\ud2b8", sets: 3, reps: 8, increment: 5, note: "\uc591\uc190 \ud569\uc0b0 \u00b7 \uac01 \ub2e4\ub9ac", isBulgarian: true },
{ name: "\ubca4\uce58\ud504\ub808\uc2a4", sets: 5, reps: 5, increment: 10 },
{ name: "\ubc14\ubca8 \ub85c\uc6b0", sets: 5, reps: 5, increment: 10 },
],
B: [
{ name: "\ubd88\uac00\ub9ac\uc548 \uc2a4\ud50c\ub9bf \uc2a4\ucffc\ud2b8", sets: 3, reps: 8, increment: 5, note: "\uc591\uc190 \ud569\uc0b0 \u00b7 \uac01 \ub2e4\ub9ac", isBulgarian: true },
{ name: "\uc624\ubc84\ud5e4\ub4dc \ud504\ub808\uc2a4", sets: 5, reps: 5, increment: 10 },
{ name: "\ub370\ub4dc\ub9ac\ud504\ud2b8", sets: 1, reps: 5, increment: 10 },
],
};

const DEFAULT_WEIGHTS = {
"\ubd88\uac00\ub9ac\uc548 \uc2a4\ud50c\ub9bf \uc2a4\ucffc\ud2b8": 20,
\ubca4\uce58\ud504\ub808\uc2a4: 40,
"\ubc14\ubca8 \ub85c\uc6b0": 40,
"\uc624\ubc84\ud5e4\ub4dc \ud504\ub808\uc2a4": 20,
\ub370\ub4dc\ub9ac\ud504\ud2b8: 60,
};

const TABS = ["\uc624\ub298 \uc6b4\ub3d9", "\uae30\ub85d", "\uc911\ub7c9 \uacc4\uc0b0\uae30"];

const formatDate = (d) =>
new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" });

const getWarmupSets = (weight, isBulgarian) => {
if (isBulgarian) {
return [
{ label: "\ub9e8\ubab8", weight: 0, reps: 10 },
{ label: "\uc6dc\uc5c5 1", weight: Math.max(2, Math.round(weight * 0.25 / 2) * 2), reps: 8 },
{ label: "\uc6dc\uc5c5 2", weight: Math.max(4, Math.round(weight * 0.5 / 2) * 2), reps: 5 },
];
}
return [
{ label: "\uc6dc\uc5c5 1", weight: Math.max(20, Math.round(weight * 0.4 / 10) * 10), reps: 5 },
{ label: "\uc6dc\uc5c5 2", weight: Math.max(20, Math.round(weight * 0.6 / 10) * 10), reps: 3 },
{ label: "\uc6dc\uc5c5 3", weight: Math.max(20, Math.round(weight * 0.8 / 10) * 10), reps: 2 },
];
};

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Firebase DB \ud5ec\ud37c
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

// \uc720\uc800 \ub85c\uadf8\uc778 \ud655\uc778
async function loginUser(uid, pw) {
const ref = doc(db, "users", uid);
const snap = await getDoc(ref);
if (!snap.exists()) return { ok: false, error: "\uc874\uc7ac\ud558\uc9c0 \uc54a\ub294 \uc544\uc774\ub514\uc608\uc694." };
if (snap.data().pw !== pw) return { ok: false, error: "\ube44\ubc00\ubc88\ud638\uac00 \ud2c0\ub838\uc5b4\uc694." };
return { ok: true, isAdmin: snap.data().isAdmin || false };
}

// \uc720\uc800 \ud68c\uc6d0\uac00\uc785
async function registerUser(uid, pw) {
const ref = doc(db, "users", uid);
const snap = await getDoc(ref);
if (snap.exists()) return { ok: false, error: "\uc774\ubbf8 \uc0ac\uc6a9 \uc911\uc778 \uc544\uc774\ub514\uc608\uc694." };
if (pw.length < 4) return { ok: false, error: "\ube44\ubc00\ubc88\ud638\ub294 4\uc790 \uc774\uc0c1\uc774\uc5b4\uc57c \ud574\uc694." };

// \uccab \ubc88\uc9f8 \uc720\uc800\uba74 \uad00\ub9ac\uc790
const allUsers = await getDocs(collection(db, "users"));
const isAdmin = allUsers.empty;

await setDoc(ref, { pw, isAdmin });
return { ok: true, isAdmin };
}

// \uc720\uc800 \ub370\uc774\ud130 \ubd88\ub7ec\uc624\uae30
async function loadUserData(uid) {
const ref = doc(db, "userData", uid);
const snap = await getDoc(ref);
return snap.exists() ? snap.data() : null;
}

// \uc720\uc800 \ub370\uc774\ud130 \uc800\uc7a5
async function saveUserData(uid, data) {
await setDoc(doc(db, "userData", uid), data);
}

// \uc720\uc800 \uc0ad\uc81c (\uad00\ub9ac\uc790\uc6a9)
async function deleteUser(uid) {
await deleteDoc(doc(db, "users", uid));
await deleteDoc(doc(db, "userData", uid));
}

// \uc804\uccb4 \uc720\uc800 \ubaa9\ub85d (\uad00\ub9ac\uc790\uc6a9)
async function getAllUsers() {
const snap = await getDocs(collection(db, "users"));
const result = {};
snap.forEach(d => { result[d.id] = d.data(); });
return result;
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// \ub85c\uadf8\uc778 \ud654\uba74
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function LoginScreen({ onLogin }) {
const [id, setId] = useState("");
const [pw, setPw] = useState("");
const [mode, setMode] = useState("login");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

const handle = async () => {
if (!id.trim() || !pw.trim()) { setError("\uc544\uc774\ub514\uc640 \ube44\ubc00\ubc88\ud638\ub97c \uc785\ub825\ud574\uc8fc\uc138\uc694."); return; }
setLoading(true);
setError("");
try {
if (mode === "login") {
const res = await loginUser(id.trim(), pw);
if (!res.ok) { setError(res.error); return; }
onLogin(id.trim(), res.isAdmin);
} else {
const res = await registerUser(id.trim(), pw);
if (!res.ok) { setError(res.error); return; }
onLogin(id.trim(), res.isAdmin);
}
} catch (e) {
setError("\uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc5b4\uc694. Firebase \uc124\uc815\uc744 \ud655\uc778\ud574\uc8fc\uc138\uc694.");
} finally {
setLoading(false);
}
};

return (
<div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
<div style={{ width: "100%", maxWidth: 400 }}>
<div style={{ textAlign: "center", marginBottom: 36 }}>
<div style={{ fontSize: 48, marginBottom: 8 }}>\u1f3cb\ufe0f</div>
<h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#f0ede8" }}>StrongLifts 5\u00d75</h1>
<p style={{ color: "#555", fontSize: 13, marginTop: 6 }}>\ub098\ub9cc\uc758 \uc6b4\ub3d9 \uae30\ub85d\uc744 \uad00\ub9ac\ud558\uc138\uc694</p>
</div>
<div style={{ display: "flex", background: "#1a1a1a", borderRadius: 12, padding: 4, marginBottom: 24 }}>
{[["login", "\ub85c\uadf8\uc778"], ["register", "\ud68c\uc6d0\uac00\uc785"]].map(([v, label]) => (
<button key={v} onClick={() => { setMode(v); setError(""); }}
style={{ flex: 1, padding: "10px", border: "none", borderRadius: 9, background: mode === v ? "#e8c96d" : "none", color: mode === v ? "#111" : "#555", fontWeight: mode === v ? 700 : 400, fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}>
{label}
</button>
))}
</div>
<div style={{ background: "#1a1a1a", borderRadius: 16, padding: 24, border: "1px solid #2a2a2a" }}>
<div style={{ marginBottom: 16 }}>
<label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>\uc544\uc774\ub514</label>
<input value={id} onChange={e => setId(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} placeholder="\uc544\uc774\ub514 \uc785\ub825"
style={{ width: "100%", padding: "12px 14px", background: "#111", border: "1px solid #333", borderRadius: 10, color: "#f0ede8", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
</div>
<div style={{ marginBottom: 20 }}>
<label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>\ube44\ubc00\ubc88\ud638</label>
<input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} placeholder="\ube44\ubc00\ubc88\ud638 \uc785\ub825"
style={{ width: "100%", padding: "12px 14px", background: "#111", border: "1px solid #333", borderRadius: 10, color: "#f0ede8", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
</div>
{error && (
<div style={{ background: "#2e1a1a", border: "1px solid #5a2020", borderRadius: 8, padding: "10px 14px", color: "#e87a6d", fontSize: 13, marginBottom: 16 }}>{error}</div>
)}
<button onClick={handle} disabled={loading}
style={{ width: "100%", padding: "14px", background: loading ? "#555" : "linear-gradient(135deg, #e8c96d, #d4a843)", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, color: "#111", cursor: loading ? "default" : "pointer" }}>
{loading ? "\ucc98\ub9ac \uc911..." : mode === "login" ? "\ub85c\uadf8\uc778" : "\ud68c\uc6d0\uac00\uc785"}
</button>
</div>
<p style={{ textAlign: "center", color: "#333", fontSize: 12, marginTop: 20 }}>\uccab \ubc88\uc9f8 \uac00\uc785\uc790\ub294 \uc790\ub3d9\uc73c\ub85c \uad00\ub9ac\uc790\uac00 \ub429\ub2c8\ub2e4</p>
</div>
</div>
);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// \uad00\ub9ac\uc790 \ud328\ub110
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function AdminPanel({ currentUid, onClose }) {
const [users, setUsers] = useState({});
const [loading, setLoading] = useState(true);
const [confirm, setConfirm] = useState(null);

useEffect(() => { getAllUsers().then(u => { setUsers(u); setLoading(false); }); }, []);

const handleDelete = async (uid) => {
await deleteUser(uid);
const updated = { ...users };
delete updated[uid];
setUsers(updated);
setConfirm(null);
};

return (
<div style={{ position: "fixed", inset: 0, background: "#0f0f0f", zIndex: 100, overflowY: "auto" }}>
<div style={{ maxWidth: 480, margin: "0 auto", padding: 20 }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
<h2 style={{ margin: 0, color: "#e8c96d", fontSize: 18 }}>\u1f451 \uad00\ub9ac\uc790 \ud328\ub110</h2>
<button onClick={onClose} style={{ background: "#222", border: "1px solid #333", borderRadius: 8, color: "#aaa", padding: "6px 14px", cursor: "pointer" }}>\ub2eb\uae30</button>
</div>
<div style={{ background: "#1a1a1a", borderRadius: 14, border: "1px solid #2a2a2a", overflow: "hidden" }}>
<div style={{ padding: "12px 16px", borderBottom: "1px solid #2a2a2a", color: "#555", fontSize: 13 }}>\uc804\uccb4 \uc720\uc800 ({Object.keys(users).length}\uba85)</div>
{loading ? (
<div style={{ padding: 20, textAlign: "center", color: "#444" }}>\ubd88\ub7ec\uc624\ub294 \uc911...</div>
) : Object.entries(users).map(([uid, info]) => (
<div key={uid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #1e1e1e" }}>
<div>
<span style={{ fontWeight: 600, color: uid === currentUid ? "#e8c96d" : "#f0ede8" }}>{uid}</span>
{info.isAdmin && <span style={{ marginLeft: 6, fontSize: 11, color: "#e8c96d", background: "#2e2a1a", padding: "2px 7px", borderRadius: 20 }}>\uad00\ub9ac\uc790</span>}
{uid === currentUid && <span style={{ marginLeft: 6, fontSize: 11, color: "#6db8e8" }}>\ub098</span>}
</div>
{uid !== currentUid && !info.isAdmin && (
confirm === uid ? (
<div style={{ display: "flex", gap: 6 }}>
<button onClick={() => setConfirm(null)} style={{ padding: "5px 10px", background: "#222", border: "1px solid #333", borderRadius: 6, color: "#aaa", fontSize: 12, cursor: "pointer" }}>\ucde8\uc18c</button>
<button onClick={() => handleDelete(uid)} style={{ padding: "5px 10px", background: "#3a1010", border: "1px solid #5a2020", borderRadius: 6, color: "#e87a6d", fontSize: 12, cursor: "pointer" }}>\uc0ad\uc81c</button>
</div>
) : (
<button onClick={() => setConfirm(uid)} style={{ padding: "5px 12px", background: "none", border: "1px solid #3a2020", borderRadius: 6, color: "#e87a6d", fontSize: 12, cursor: "pointer" }}>\uc0ad\uc81c</button>
)
)}
</div>
))}
</div>
</div>
</div>
);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// \uba54\uc778 \uc6b4\ub3d9 \uc571
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function WorkoutApp({ uid, isAdmin, onLogout }) {
const [tab, setTab] = useState(0);
const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS });
const [history, setHistory] = useState([]);
const [nextWorkout, setNextWorkout] = useState("A");
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

const DIFFICULTY_OPTIONS = [
{ key: "easy", label: "\uc801\ub2f9\ud588\uc5b4\uc694", seconds: 90, color: "#6de8a0", bg: "#1a2e1a", emoji: "\u1f60a" },
{ key: "hard", label: "\ud798\ub4e4\uc5c8\uc5b4\uc694", seconds: 180, color: "#e8c96d", bg: "#2e2a1a", emoji: "\u1f605" },
{ key: "fail", label: "\uc2e4\ud328\ud588\uc5b4\uc694", seconds: 300, color: "#e86d6d", bg: "#2e1a1a", emoji: "\u1f624" },
];

// Firebase\uc5d0\uc11c \uc720\uc800 \ub370\uc774\ud130 \ub85c\ub4dc
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

// \ub370\uc774\ud130 \ubcc0\uacbd\uc2dc Firebase\uc5d0 \uc800\uc7a5
useEffect(() => {
if (!dataLoaded) return;
saveUserData(uid, { weights, history, next: nextWorkout, fails: failCounts });
}, [weights, history, nextWorkout, failCounts, dataLoaded]);

// \ud734\uc2dd \ud0c0\uc774\uba38
useEffect(() => {
if (!restTimer || restTimer.remaining <= 0) return;
const id = setTimeout(() => setRestTimer(prev => prev ? { ...prev, remaining: prev.remaining - 1 } : null), 1000);
return () => clearTimeout(id);
}, [restTimer]);

const startRest = (exIdx, setIdx, seconds, diffKey) => {
setDifficulty(prev => ({ ...prev, [`${exIdx}-${setIdx}`]: diffKey }));
setRestTimer({ seconds, remaining: seconds, exIdx, setIdx });
};
const skipRest = () => setRestTimer(null);
const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const handleReset = async () => {
const fresh = { weights: { ...DEFAULT_WEIGHTS }, history: [], next: "A", fails: {} };
setWeights(fresh.weights);
setHistory(fresh.history);
setNextWorkout(fresh.next);
setFailCounts(fresh.fails);
setSession(null);
setResetConfirm(false);
await saveUserData(uid, fresh);
};

const startSession = () => {
const exercises = WORKOUTS[nextWorkout].map(e => ({ ...e, weight: weights[e.name] || DEFAULT_WEIGHTS[e.name] }));
const initialWarmup = {};
exercises.forEach((_, i) => { initialWarmup[i] = true; });
setSession({ type: nextWorkout, exercises, date: Date.now() });
setCompletedSets({});
setShowWarmup(initialWarmup);
setDone(false);
};

const toggleSet = (prefix, exIdx, setIdx) => {
const key = `${prefix}-${exIdx}-${setIdx}`;
setCompletedSets(prev => ({ ...prev, [key]: !prev[key] }));
};

const isWarmupAllDone = (exIdx, count) =>
Array.from({ length: count }, (_, i) => completedSets[`w-${exIdx}-${i}`]).every(Boolean);

const isMainAllDone = (exIdx, totalSets) =>
Array.from({ length: totalSets }, (_, i) => completedSets[`m-${exIdx}-${i}`]).every(Boolean);

const finishSession = () => {
if (!session) return;
const newWeights = { ...weights };
const newFails = { ...failCounts };
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
setHistory(prev => [{ type: session.type, date: session.date, results }, ...prev.slice(0, 49)]);
setNextWorkout(nextWorkout === "A" ? "B" : "A");
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
<div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>
\ub370\uc774\ud130 \ubd88\ub7ec\uc624\ub294 \uc911...
</div>
);
}

return (
<div style={{ minHeight: "100vh", background: "#0f0f0f", color: "#f0ede8", fontFamily: "'Noto Sans KR', sans-serif", maxWidth: 480, margin: "0 auto", paddingBottom: 80 }}>
{showAdmin && <AdminPanel currentUid={uid} onClose={() => setShowAdmin(false)} />}

```
  {/* \ud5e4\ub354 */}
  <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #111 100%)", padding: "28px 24px 20px", borderBottom: "1px solid #222" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 28 }}>\u1f3cb\ufe0f</span>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: "#f0ede8" }}>StrongLifts 5\u00d75</h1>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {isAdmin && (
          <button onClick={() => setShowAdmin(true)}
            style={{ padding: "6px 10px", background: "#2e2a1a", border: "1px solid #e8c96d44", borderRadius: 8, color: "#e8c96d", fontSize: 11, cursor: "pointer" }}>
            \u1f451 \uad00\ub9ac
          </button>
        )}
        <button onClick={onLogout}
          style={{ padding: "6px 10px", background: "#1e1e1e", border: "1px solid #333", borderRadius: 8, color: "#666", fontSize: 11, cursor: "pointer" }}>
          \ub85c\uadf8\uc544\uc6c3
        </button>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, marginTop: 6 }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#e8c96d22", border: "1px solid #e8c96d44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#e8c96d" }}>
        {uid[0].toUpperCase()}
      </div>
      <span style={{ fontSize: 12, color: "#888" }}>{uid}</span>
      {isAdmin && <span style={{ fontSize: 10, color: "#e8c96d", background: "#2e2a1a", padding: "1px 6px", borderRadius: 20 }}>\uad00\ub9ac\uc790</span>}
    </div>
    <div style={{ display: "flex", gap: 16 }}>
      {[{ label: "\ucd1d \uc138\uc158", val: totalSessions }, { label: "\uc5f0\uc18d", val: `${streak}\ud68c` }, { label: "\ub2e4\uc74c", val: `\uc6cc\ud06c\uc544\uc6c3 ${nextWorkout}` }].map(s => (
        <div key={s.label} style={{ background: "#1e1e1e", borderRadius: 10, padding: "8px 14px", flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#e8c96d" }}>{s.val}</div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  </div>

  {/* \ud0ed */}
  <div style={{ display: "flex", background: "#161616", borderBottom: "1px solid #222" }}>
    {TABS.map((t, i) => (
      <button key={t} onClick={() => setTab(i)} style={{ flex: 1, padding: "14px 4px", background: "none", border: "none", color: tab === i ? "#e8c96d" : "#555", fontWeight: tab === i ? 700 : 400, fontSize: 13, cursor: "pointer", borderBottom: tab === i ? "2px solid #e8c96d" : "2px solid transparent", transition: "all 0.2s" }}>
        {t}
      </button>
    ))}
  </div>

  <div style={{ padding: "20px 16px" }}>
    {/* \uc624\ub298 \uc6b4\ub3d9 \ud0ed */}
    {tab === 0 && (
      <div>
        {!session ? (
          <div>
            <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, marginBottom: 16, border: "1px solid #2a2a2a" }}>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>\ub2e4\uc74c \uc6b4\ub3d9</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#e8c96d", marginBottom: 12 }}>\uc6cc\ud06c\uc544\uc6c3 {nextWorkout}</div>
              {WORKOUTS[nextWorkout].map(ex => {
                const w = weights[ex.name] || DEFAULT_WEIGHTS[ex.name];
                const warmups = getWarmupSets(w, ex.isBulgarian);
                return (
                  <div key={ex.name} style={{ padding: "12px 0", borderBottom: "1px solid #1e1e1e" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{ex.name}</span>
                      <span style={{ fontSize: 13, color: "#aaa" }}>{ex.sets}\u00d7{ex.reps} \u00b7 <span style={{ color: "#e8c96d", fontWeight: 700 }}>{w}kg</span></span>
                    </div>
                    {ex.note && <div style={{ fontSize: 11, color: "#6db8e8", marginTop: 3 }}>\u1f4a1 {ex.note}</div>}
                    <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>
                      \u1f525 \uc6dc\uc5c5: {warmups.map(ws => ws.weight === 0 ? "\ub9e8\ubab8" : `${ws.weight}kg`).join(" \u2192 ")} \u2192 \ubcf8\uc138\ud2b8
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={startSession} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #e8c96d, #d4a843)", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 800, color: "#111", cursor: "pointer" }}>
              \u1f4aa \uc6b4\ub3d9 \uc2dc\uc791
            </button>
          </div>
        ) : done ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>\u1f389</div>
            <h2 style={{ color: "#e8c96d", fontSize: 24, marginBottom: 8 }}>\uc6b4\ub3d9 \uc644\ub8cc!</h2>
            <p style={{ color: "#888", marginBottom: 24 }}>\ud6cc\ub96d\ud574\uc694! \ub2e4\uc74c \uc138\uc158\uc774 \uae30\ub2e4\ub9ac\uace0 \uc788\uc2b5\ub2c8\ub2e4.</p>
            <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 16, marginBottom: 20, textAlign: "left" }}>
              {session.exercises.map((ex, i) => {
                const success = isMainAllDone(i, ex.sets);
                return (
                  <div key={ex.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #222" }}>
                    <span>{ex.name}</span>
                    <span style={{ color: success ? "#6de8a0" : "#e86d6d" }}>{success ? "\u2713 \uc131\uacf5" : "\u2717 \uc2e4\ud328"}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setSession(null)} style={{ padding: "14px 32px", background: "#222", border: "1px solid #444", borderRadius: 12, color: "#f0ede8", fontSize: 15, cursor: "pointer" }}>
              \ud648\uc73c\ub85c
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>\uc6cc\ud06c\uc544\uc6c3 {session.type}</h2>
              <span style={{ fontSize: 12, color: "#666" }}>{formatDate(session.date)}</span>
            </div>
            {session.exercises.map((ex, exIdx) => {
              const warmupSets = getWarmupSets(ex.weight, ex.isBulgarian);
              const warmupOpen = showWarmup[exIdx] !== false;
              const warmupDone = isWarmupAllDone(exIdx, warmupSets.length);
              const mainDone = isMainAllDone(exIdx, ex.sets);
              return (
                <div key={ex.name} style={{ background: mainDone ? "#1a2a1a" : "#1a1a1a", borderRadius: 14, padding: 16, marginBottom: 14, border: `1px solid ${mainDone ? "#2a4a2a" : "#2a2a2a"}`, transition: "all 0.3s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{ex.name}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                        \ubcf8\uc138\ud2b8 {ex.sets}\u00d7{ex.reps} \u00b7 <span style={{ color: "#e8c96d" }}>{ex.weight}kg</span>
                        {ex.isBulgarian && <span style={{ color: "#6db8e8" }}> (\ud55c \uc190 {ex.weight / 2}kg)</span>}
                      </div>
                    </div>
                    {mainDone && <span style={{ color: "#6de8a0", fontSize: 22 }}>\u2713</span>}
                  </div>
                  {/* \uc6dc\uc5c5 */}
                  <div style={{ marginBottom: 12 }}>
                    <button onClick={() => setShowWarmup(prev => ({ ...prev, [exIdx]: !warmupOpen }))}
                      style={{ width: "100%", background: warmupDone ? "#1a2e1a" : "#141414", border: `1px solid ${warmupDone ? "#2a4a2a" : "#252525"}`, borderRadius: warmupOpen ? "10px 10px 0 0" : "10px", padding: "9px 12px", color: warmupDone ? "#6de8a0" : "#777", fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>\u1f525 \uc6dc\uc5c5 \uc138\ud2b8 {warmupDone ? "\u2713 \uc644\ub8cc" : `(${warmupSets.length}\uc138\ud2b8)`}</span>
                      <span style={{ fontSize: 11 }}>{warmupOpen ? "\u25b2 \uc811\uae30" : "\u25bc \ud3bc\uce58\uae30"}</span>
                    </button>
                    {warmupOpen && (
                      <div style={{ background: "#111", borderRadius: "0 0 10px 10px", padding: "8px 12px", border: "1px solid #252525", borderTop: "none" }}>
                        {warmupSets.map((ws, wi) => {
                          const isDone = completedSets[`w-${exIdx}-${wi}`];
                          return (
                            <div key={wi} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: wi < warmupSets.length - 1 ? "1px solid #1a1a1a" : "none" }}>
                              <div>
                                <span style={{ fontSize: 13, color: isDone ? "#6de8a0" : "#bbb", fontWeight: 500 }}>{ws.label}</span>
                                <span style={{ fontSize: 12, color: "#555", marginLeft: 8 }}>{ws.weight === 0 ? "\ub9e8\ubab8" : `${ws.weight}kg`} \u00d7 {ws.reps}\ud68c</span>
                                {ex.isBulgarian && ws.weight > 0 && <span style={{ fontSize: 11, color: "#6db8e8", marginLeft: 4 }}>(\ud55c \uc190 {ws.weight / 2}kg)</span>}
                              </div>
                              <button onClick={() => toggleSet("w", exIdx, wi)}
                                style={{ width: 34, height: 34, borderRadius: 8, border: `2px solid ${isDone ? "#6de8a0" : "#2a2a2a"}`, background: isDone ? "#1e3a2a" : "#1a1a1a", color: isDone ? "#6de8a0" : "#444", fontSize: 15, cursor: "pointer" }}>
                                {isDone ? "\u2713" : "\u25cb"}
                              </button>
                            </div>
                          );
                        })}
                        <div style={{ fontSize: 11, color: "#333", marginTop: 6, paddingTop: 6, borderTop: "1px solid #1a1a1a" }}>\u23f1 \uc6dc\uc5c5 \uc138\ud2b8 \uac04 \ud734\uc2dd \uc5c6\uc774 \ubc14\ub85c \uc9c4\ud589</div>
                      </div>
                    )}
                  </div>
                  {/* \ubcf8 \uc138\ud2b8 */}
                  <div>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                      \u1f4aa \ubcf8 \uc138\ud2b8 \u2014 {ex.weight}kg \u00d7 {ex.reps}\ud68c
                      {ex.isBulgarian && <span style={{ color: "#6db8e8" }}> \u00b7 \ud55c \uc190 {ex.weight / 2}kg</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {Array.from({ length: ex.sets }, (_, i) => {
                        const isDone = completedSets[`m-${exIdx}-${i}`];
                        const diff = difficulty[`${exIdx}-${i}`];
                        const diffOpt = DIFFICULTY_OPTIONS.find(d => d.key === diff);
                        const isNextSet = !isDone && Array.from({ length: i }, (_, j) => completedSets[`m-${exIdx}-${j}`]).every(Boolean);
                        return (
                          <div key={i} style={{ flex: 1 }}>
                            <button onClick={() => { if (!isDone) toggleSet("m", exIdx, i); }}
                              style={{ width: "100%", aspectRatio: "1", borderRadius: 10, border: `2px solid ${isDone ? (diffOpt?.color || "#6de8a0") : isNextSet ? "#555" : "#2a2a2a"}`, background: isDone ? (diffOpt?.bg || "#1e3a2a") : "#111", color: isDone ? (diffOpt?.color || "#6de8a0") : isNextSet ? "#888" : "#444", fontSize: isDone ? 16 : 13, fontWeight: 700, cursor: isDone ? "default" : "pointer" }}>
                              {isDone ? (diffOpt?.emoji || "\u2713") : i + 1}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {Array.from({ length: ex.sets }, (_, i) => {
                      const isDone = completedSets[`m-${exIdx}-${i}`];
                      const hasDiff = difficulty[`${exIdx}-${i}`];
                      const isLastSet = i === ex.sets - 1;
                      if (!isDone || hasDiff) return null;
                      return (
                        <div key={i} style={{ marginTop: 10, background: "#161616", borderRadius: 10, padding: "12px", border: "1px solid #2a2a2a" }}>
                          <div style={{ fontSize: 12, color: "#888", marginBottom: 8, textAlign: "center" }}>
                            {i + 1}\uc138\ud2b8 \uc644\ub8cc! {isLastSet ? "\ub9c8\uc9c0\ub9c9 \uc138\ud2b8\uc608\uc694 \u1f44f" : "\ub09c\uc774\ub3c4\ub294 \uc5b4\ub560\ub098\uc694?"}
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {DIFFICULTY_OPTIONS.map(opt => (
                              <button key={opt.key}
                                onClick={() => isLastSet ? setDifficulty(prev => ({ ...prev, [`${exIdx}-${i}`]: opt.key })) : startRest(exIdx, i, opt.seconds, opt.key)}
                                style={{ flex: 1, padding: "8px 4px", background: opt.bg, border: `1px solid ${opt.color}33`, borderRadius: 8, color: opt.color, fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "center", lineHeight: 1.4 }}>
                                {opt.emoji}<br />{opt.label}{!isLastSet && <><br /><span style={{ fontSize: 10, opacity: 0.7 }}>{opt.seconds}\ucd08</span></>}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {restTimer && restTimer.exIdx === exIdx && (
                      <div style={{ marginTop: 10, background: "#111", borderRadius: 10, padding: "14px", border: "1px solid #2a2a2a", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>\u23f1 \ud734\uc2dd \uc911...</div>
                        <div style={{ fontSize: 36, fontWeight: 800, color: restTimer.remaining <= 10 ? "#e86d6d" : "#e8c96d", letterSpacing: 2, marginBottom: 8 }}>
                          {formatTime(restTimer.remaining)}
                        </div>
                        <div style={{ height: 4, background: "#222", borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(restTimer.remaining / restTimer.seconds) * 100}%`, background: restTimer.remaining <= 10 ? "#e86d6d" : "#e8c96d", borderRadius: 2, transition: "width 1s linear" }} />
                        </div>
                        {restTimer.remaining === 0 ? (
                          <div style={{ color: "#6de8a0", fontWeight: 700, fontSize: 14 }}>\u2713 \ud734\uc2dd \uc644\ub8cc! \ub2e4\uc74c \uc138\ud2b8 \uc2dc\uc791\ud558\uc138\uc694</div>
                        ) : (
                          <button onClick={skipRest} style={{ padding: "7px 20px", background: "#1e1e1e", border: "1px solid #333", borderRadius: 8, color: "#666", fontSize: 12, cursor: "pointer" }}>\uac74\ub108\ub6f0\uae30</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <button onClick={finishSession} style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg, #e8c96d, #d4a843)", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, color: "#111", cursor: "pointer", marginTop: 8 }}>
              \uc6b4\ub3d9 \uc644\ub8cc & \uc800\uc7a5
            </button>
            <button onClick={() => setSession(null)} style={{ width: "100%", padding: "12px", background: "none", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 14, color: "#555", cursor: "pointer", marginTop: 8 }}>
              \ucde8\uc18c
            </button>
          </div>
        )}
      </div>
    )}

    {/* \uae30\ub85d \ud0ed */}
    {tab === 1 && (
      <div>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#888", fontWeight: 500 }}>\ud604\uc7ac \uc911\ub7c9</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {Object.entries(weights).map(([name, w]) => (
            <div key={name} style={{ background: "#1a1a1a", borderRadius: 12, padding: "12px 14px", border: "1px solid #2a2a2a" }}>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>{name}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#e8c96d" }}>{w}kg</div>
              {name === "\ubd88\uac00\ub9ac\uc548 \uc2a4\ud50c\ub9bf \uc2a4\ucffc\ud2b8" && <div style={{ fontSize: 11, color: "#6db8e8", marginTop: 2 }}>\ud55c \uc190 {w / 2}kg</div>}
              {failCounts[name] > 0 && <div style={{ fontSize: 11, color: "#e87a6d", marginTop: 3 }}>\uc2e4\ud328 {failCounts[name]}/3</div>}
            </div>
          ))}
        </div>
        <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#888", fontWeight: 500 }}>\ucd5c\uadfc \uc138\uc158</h3>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", color: "#333", padding: "40px 0" }}>\uc544\uc9c1 \uae30\ub85d\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</div>
        ) : history.slice(0, 10).map((h, i) => (
          <div key={i} style={{ background: "#1a1a1a", borderRadius: 12, padding: 14, marginBottom: 10, border: "1px solid #2a2a2a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "#e8c96d" }}>\uc6cc\ud06c\uc544\uc6c3 {h.type}</span>
              <span style={{ fontSize: 12, color: "#555" }}>{formatDate(h.date)}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {h.results.map(r => (
                <span key={r.name} style={{ fontSize: 12, padding: "3px 8px", borderRadius: 20, background: r.success ? "#1e3a2a" : "#3a1e1e", color: r.success ? "#6de8a0" : "#e86d6d" }}>
                  {r.name} {r.weight}kg {r.success ? "\u2713" : "\u2717"}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #1e1e1e" }}>
          {!resetConfirm ? (
            <button onClick={() => setResetConfirm(true)} style={{ width: "100%", padding: "13px", background: "none", border: "1px solid #3a2020", borderRadius: 12, color: "#e87a6d", fontSize: 14, cursor: "pointer" }}>
              \u1f5d1 \ub0b4 \uae30\ub85d \ucd08\uae30\ud654
            </button>
          ) : (
            <div style={{ background: "#1e1010", borderRadius: 12, padding: 16, border: "1px solid #4a2020" }}>
              <p style={{ color: "#e87a6d", fontSize: 14, margin: "0 0 12px", textAlign: "center" }}>\u26a0\ufe0f \ubaa8\ub4e0 \uae30\ub85d\uacfc \uc911\ub7c9\uc774 \ucd08\uae30\ud654\ub429\ub2c8\ub2e4.<br />\uc815\ub9d0 \ub9ac\uc14b\ud560\uae4c\uc694?</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setResetConfirm(false)} style={{ flex: 1, padding: "11px", background: "#222", border: "1px solid #333", borderRadius: 10, color: "#aaa", fontSize: 14, cursor: "pointer" }}>\ucde8\uc18c</button>
                <button onClick={handleReset} style={{ flex: 1, padding: "11px", background: "#3a1010", border: "1px solid #5a2020", borderRadius: 10, color: "#e87a6d", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>\ucd08\uae30\ud654</button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* \uc911\ub7c9 \uacc4\uc0b0\uae30 \ud0ed */}
    {tab === 2 && (
      <div>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#888", fontWeight: 500 }}>\ubc14\ubca8 \uc6d0\ud310 \uacc4\uc0b0\uae30</h3>
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a", marginBottom: 16 }}>
          <label style={{ fontSize: 14, color: "#888", display: "block", marginBottom: 8 }}>\ubaa9\ud45c \uc911\ub7c9 (kg)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setCalcWeight(Math.max(20, calcWeight - 5))} style={{ width: 40, height: 40, borderRadius: 10, background: "#222", border: "1px solid #444", color: "#f0ede8", fontSize: 20, cursor: "pointer" }}>\u2212</button>
            <input type="number" value={calcWeight} onChange={e => setCalcWeight(parseFloat(e.target.value) || 20)}
              style={{ flex: 1, padding: "10px", background: "#111", border: "1px solid #333", borderRadius: 10, color: "#e8c96d", fontSize: 22, fontWeight: 800, textAlign: "center", outline: "none" }} />
            <button onClick={() => setCalcWeight(calcWeight + 5)} style={{ width: 40, height: 40, borderRadius: 10, background: "#222", border: "1px solid #444", color: "#f0ede8", fontSize: 20, cursor: "pointer" }}>+</button>
          </div>
        </div>
        <div style={{ background: "#1a1a1a", borderRadius: 14, padding: 20, border: "1px solid #2a2a2a" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#555" }}>\ubc14\ubca8 \ubb34\uac8c</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#aaa" }}>20kg (\uae30\ubcf8 \ubc14)</div>
          </div>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>\ud55c\ucabd \ub2f9 \uc6d0\ud310</div>
          {getPlateCombo(calcWeight).length === 0 ? (
            <div style={{ color: "#444", fontSize: 14 }}>\uc6d0\ud310 \uc5c6\uc74c (\ube48 \ubc14)</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {getPlateCombo(calcWeight).map(({ kg, count }) => (
                <div key={kg} style={{ background: "#111", borderRadius: 10, padding: "8px 14px", border: "1px solid #2a2a2a", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#e8c96d" }}>{kg}kg</div>
                  <div style={{ fontSize: 12, color: "#555" }}>\u00d7 {count}\uac1c</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #1e1e1e", fontSize: 13, color: "#555" }}>
            \ucd1d \uc911\ub7c9: <span style={{ color: "#e8c96d", fontWeight: 700 }}>20 + {getPlateCombo(calcWeight).reduce((a, p) => a + p.kg * p.count * 2, 0)}kg = {calcWeight}kg</span>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
``

);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// \ub8e8\ud2b8
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
export default function App() {
const [user, setUser] = useState(null);
return !user
? <LoginScreen onLogin={(uid, isAdmin) => setUser({ uid, isAdmin })} />
: <WorkoutApp uid={user.uid} isAdmin={user.isAdmin} onLogout={() => setUser(null)} />;
}
