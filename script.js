// ════════════════════════════════════════════════════
//  World Cup 2026 – Prediction League
//  Firebase SDK 10 (Modular) + Firestore + Auth
// ════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ══════════════════════════════════════
//  🔥 FIREBASE CONFIG — Replace with yours
// ══════════════════════════════════════
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// ══════════════════════════════════════
//  ADMIN EMAIL — Change to your admin email
// ══════════════════════════════════════
const ADMIN_EMAIL = "admin@worldcup2026.com";

// ──────────────────────────────────────
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ══════════════════════════════════════
//  WORLD CUP 2026 — 48 Teams Data
// ══════════════════════════════════════
const TEAMS = [
  // Group A (USA hosts)
  { name: "United States", code: "us", rating: 1640 },
  { name: "Mexico", code: "mx", rating: 1633 },
  { name: "Canada", code: "ca", rating: 1627 },
  { name: "Uruguay", code: "uy", rating: 1722 },
  // Group B
  { name: "Brazil", code: "br", rating: 1837 },
  { name: "Argentina", code: "ar", rating: 1888 },
  { name: "Colombia", code: "co", rating: 1692 },
  { name: "Ecuador", code: "ec", rating: 1631 },
  // Group C
  { name: "France", code: "fr", rating: 1842 },
  { name: "Spain", code: "es", rating: 1815 },
  { name: "Germany", code: "de", rating: 1797 },
  { name: "Portugal", code: "pt", rating: 1805 },
  // Group D
  { name: "England", code: "gb-eng", rating: 1792 },
  { name: "Netherlands", code: "nl", rating: 1745 },
  { name: "Belgium", code: "be", rating: 1731 },
  { name: "Italy", code: "it", rating: 1743 },
  // Group E
  { name: "Japan", code: "jp", rating: 1724 },
  { name: "South Korea", code: "kr", rating: 1692 },
  { name: "Australia", code: "au", rating: 1645 },
  { name: "Iran", code: "ir", rating: 1681 },
  // Group F
  { name: "Morocco", code: "ma", rating: 1721 },
  { name: "Senegal", code: "sn", rating: 1694 },
  { name: "Nigeria", code: "ng", rating: 1667 },
  { name: "Egypt", code: "eg", rating: 1643 },
  // Group G
  { name: "Saudi Arabia", code: "sa", rating: 1629 },
  { name: "Qatar", code: "qa", rating: 1597 },
  { name: "Tunisia", code: "tn", rating: 1626 },
  { name: "Cameroon", code: "cm", rating: 1613 },
  // Group H
  { name: "Croatia", code: "hr", rating: 1699 },
  { name: "Poland", code: "pl", rating: 1658 },
  { name: "Switzerland", code: "ch", rating: 1697 },
  { name: "Denmark", code: "dk", rating: 1683 },
  // Group I
  { name: "Serbia", code: "rs", rating: 1668 },
  { name: "Ukraine", code: "ua", rating: 1659 },
  { name: "Czech Republic", code: "cz", rating: 1627 },
  { name: "Slovakia", code: "sk", rating: 1620 },
  // Group J
  { name: "Turkey", code: "tr", rating: 1640 },
  { name: "Hungary", code: "hu", rating: 1612 },
  { name: "Romania", code: "ro", rating: 1621 },
  { name: "Greece", code: "gr", rating: 1606 },
  // Group K
  { name: "China", code: "cn", rating: 1558 },
  { name: "Indonesia", code: "id", rating: 1558 },
  { name: "New Zealand", code: "nz", rating: 1589 },
  { name: "Panama", code: "pa", rating: 1597 },
  // Group L
  { name: "Venezuela", code: "ve", rating: 1609 },
  { name: "Paraguay", code: "py", rating: 1619 },
  { name: "Jamaica", code: "jm", rating: 1601 },
  { name: "Wales", code: "gb-wls", rating: 1617 },
];

const flagUrl = (code) => `https://flagcdn.com/w80/${code.toLowerCase()}.png`;

// ══════════════════════════════════════
//  STATE
// ══════════════════════════════════════
let currentUser = null;
let isAdmin = false;
let allMatches = [];
let myPredictions = {};
let currentFilter = "all";
let editingMatchId = null;
let unsubMatches = null;
let unsubLeaderboard = null;

// ══════════════════════════════════════
//  DOM REFS
// ══════════════════════════════════════
const $ = (id) => document.getElementById(id);
const authScreen = $("auth-screen");
const appScreen = $("app-screen");

// ══════════════════════════════════════
//  UTILS
// ══════════════════════════════════════
function showToast(msg, duration = 2800) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.classList.add("hidden"), 300);
  }, duration);
}

function formatDate(ts) {
  if (!ts) return "–";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusLabel(status) {
  const map = { upcoming: "Sắp diễn ra", live: "Đang diễn ra", finished: "Đã kết thúc" };
  return map[status] || status;
}
function statusClass(status) {
  const map = { upcoming: "status-upcoming", live: "status-live", finished: "status-finished" };
  return map[status] || "status-upcoming";
}

function canPredict(match) {
  if (match.status !== "upcoming") return false;
  const matchTime = match.matchTime?.toDate ? match.matchTime.toDate() : new Date(match.matchTime);
  const now = new Date();
  const diffMin = (matchTime - now) / 60000;
  return diffMin > 30;
}

function calcPoints(predHome, predAway, realHome, realAway) {
  predHome = parseInt(predHome); predAway = parseInt(predAway);
  realHome = parseInt(realHome); realAway = parseInt(realAway);
  if (isNaN(realHome) || isNaN(realAway)) return null;
  // Exact score
  if (predHome === realHome && predAway === realAway) return 5;
  // Correct goal difference
  if ((predHome - predAway) === (realHome - realAway)) return 3;
  // Correct result
  const predResult = Math.sign(predHome - predAway);
  const realResult = Math.sign(realHome - realAway);
  if (predResult === realResult) return 1;
  return 0;
}

function ptsClass(pts) {
  if (pts === 5) return "pts-5";
  if (pts === 3) return "pts-3";
  if (pts === 1) return "pts-1";
  return "pts-0";
}

function setLoading(btn, loading) {
  if (loading) {
    btn.dataset.orig = btn.textContent;
    btn.innerHTML = `<span class="spinner"></span>`;
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.orig || btn.textContent;
    btn.disabled = false;
  }
}

// ══════════════════════════════════════
//  AUTH
// ══════════════════════════════════════
$("btn-login").addEventListener("click", async () => {
  const email = $("login-email").value.trim();
  const pwd = $("login-password").value;
  const errEl = $("auth-error");
  errEl.classList.add("hidden");
  if (!email || !pwd) { errEl.textContent = "Vui lòng nhập đầy đủ thông tin."; errEl.classList.remove("hidden"); return; }
  const btn = $("btn-login");
  setLoading(btn, true);
  try {
    await signInWithEmailAndPassword(auth, email, pwd);
  } catch (e) {
    errEl.textContent = firebaseErrorMsg(e.code);
    errEl.classList.remove("hidden");
    setLoading(btn, false);
  }
});

$("btn-register").addEventListener("click", async () => {
  const name = $("reg-name").value.trim();
  const email = $("reg-email").value.trim();
  const pwd = $("reg-password").value;
  const errEl = $("auth-error");
  errEl.classList.add("hidden");
  if (!name || !email || !pwd) { errEl.textContent = "Vui lòng nhập đầy đủ thông tin."; errEl.classList.remove("hidden"); return; }
  const btn = $("btn-register");
  setLoading(btn, true);
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pwd);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, "users", cred.user.uid), {
      displayName: name,
      email,
      totalPoints: 0,
      totalPredictions: 0,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    errEl.textContent = firebaseErrorMsg(e.code);
    errEl.classList.remove("hidden");
    setLoading(btn, false);
  }
});

$("btn-logout").addEventListener("click", async () => {
  await signOut(auth);
});

function firebaseErrorMsg(code) {
  const map = {
    "auth/invalid-email": "Email không hợp lệ.",
    "auth/user-not-found": "Tài khoản không tồn tại.",
    "auth/wrong-password": "Mật khẩu không đúng.",
    "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
    "auth/email-already-in-use": "Email đã được đăng ký.",
    "auth/weak-password": "Mật khẩu phải có ít nhất 6 ký tự.",
    "auth/too-many-requests": "Quá nhiều lần thử. Vui lòng thử lại sau.",
  };
  return map[code] || "Đã có lỗi xảy ra. Thử lại sau.";
}

// Auth tabs
document.querySelectorAll(".auth-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
    btn.classList.add("active");
    $(`${btn.dataset.tab}-form`).classList.add("active");
    $("auth-error").classList.add("hidden");
  });
});

// ══════════════════════════════════════
//  AUTH STATE OBSERVER
// ══════════════════════════════════════
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    isAdmin = user.email === ADMIN_EMAIL;
    authScreen.classList.remove("active");
    appScreen.classList.add("active");
    $("user-display-name").textContent = user.displayName || user.email;
    if (isAdmin) {
      $("nav-admin").classList.remove("hidden");
      $("mobile-nav-admin").classList.remove("hidden");
    }
    // Ensure user doc exists
    const uRef = doc(db, "users", user.uid);
    const uSnap = await getDoc(uRef);
    if (!uSnap.exists()) {
      await setDoc(uRef, {
        displayName: user.displayName || user.email,
        email: user.email,
        totalPoints: 0,
        totalPredictions: 0,
        createdAt: serverTimestamp(),
      });
    }
    initApp();
  } else {
    currentUser = null;
    isAdmin = false;
    authScreen.classList.add("active");
    appScreen.classList.remove("active");
    if (unsubMatches) unsubMatches();
    if (unsubLeaderboard) unsubLeaderboard();
  }
});

// ══════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════
function switchTab(tab) {
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn, .mobile-nav-btn").forEach(b => b.classList.remove("active"));
  $(`tab-${tab}`).classList.add("active");
  document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b => b.classList.add("active"));
  $("mobile-nav").classList.add("hidden");
}

document.querySelectorAll(".nav-btn, .mobile-nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

$("hamburger").addEventListener("click", () => {
  $("mobile-nav").classList.toggle("hidden");
});

// ══════════════════════════════════════
//  APP INIT
// ══════════════════════════════════════
async function initApp() {
  await loadMyPredictions();
  subscribeMatches();
  subscribeLeaderboard();
  if (isAdmin) populateTeamSelects();
}

// ══════════════════════════════════════
//  LOAD MY PREDICTIONS
// ══════════════════════════════════════
async function loadMyPredictions() {
  const q = query(collection(db, "predictions"), where("userId", "==", currentUser.uid));
  const snap = await getDocs(q);
  myPredictions = {};
  snap.forEach(d => {
    const data = d.data();
    myPredictions[data.matchId] = { ...data, id: d.id };
  });
}

// ══════════════════════════════════════
//  REALTIME MATCH LISTENER
// ══════════════════════════════════════
function subscribeMatches() {
  const q = query(collection(db, "matches"), orderBy("matchTime", "asc"));
  unsubMatches = onSnapshot(q, async (snap) => {
    allMatches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Reload predictions too in case scoring happened
    await loadMyPredictions();
    renderMatches();
    renderMyPredictions();
    if (isAdmin) renderAdminMatches();
  });
}

// ══════════════════════════════════════
//  RENDER MATCHES
// ══════════════════════════════════════
function renderMatches() {
  const filtered = currentFilter === "all"
    ? allMatches
    : allMatches.filter(m => m.status === currentFilter);

  const list = $("matches-list");
  const empty = $("matches-empty");
  list.innerHTML = "";

  if (filtered.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  filtered.forEach((match, i) => {
    list.appendChild(buildMatchCard(match, i * 40, false));
  });
}

function buildMatchCard(match, delay = 0, adminMode = false) {
  const card = document.createElement("div");
  card.className = "match-card";
  card.style.animationDelay = `${delay}ms`;

  const myPred = myPredictions[match.id];
  const hasResult = match.status === "finished" && match.scoreHome !== undefined && match.scoreAway !== undefined;
  const pts = myPred && hasResult ? calcPoints(myPred.predHome, myPred.predAway, match.scoreHome, match.scoreAway) : null;

  const oddsHtml = (match.oddsHome || match.oddsDraw || match.oddsAway) ? `
    <div class="match-odds">
      <div class="odds-chip">1 <span>${match.oddsHome || "–"}</span></div>
      <div class="odds-chip">X <span>${match.oddsDraw || "–"}</span></div>
      <div class="odds-chip">2 <span>${match.oddsAway || "–"}</span></div>
    </div>` : "";

  const predBadge = myPred ? `
    <div class="pred-badge">
      <span>Dự đoán của bạn: <b class="pred-badge-score">${myPred.predHome} – ${myPred.predAway}</b></span>
      ${pts !== null ? `<span class="pred-points ${ptsClass(pts)}">${pts} điểm</span>` : ""}
    </div>` : "";

  let footerHtml = "";
  if (!adminMode) {
    if (!myPred && canPredict(match)) {
      footerHtml = `<button class="btn btn-primary btn-sm predict-btn" data-id="${match.id}">⚡ Dự đoán</button>`;
    } else if (!myPred && match.status === "upcoming") {
      footerHtml = `<span style="font-size:.78rem;color:rgba(255,255,255,.3);">Đã đóng dự đoán (dưới 30 phút)</span>`;
    }
  } else {
    footerHtml = `
      <div class="admin-btn-row">
        <button class="btn btn-outline btn-xs adm-edit-btn" data-id="${match.id}">✏️ Chỉnh sửa</button>
      </div>`;
  }

  card.innerHTML = `
    <div class="match-meta">
      <span class="match-round">${match.round || "Vòng bảng"}</span>
      <span class="match-status ${statusClass(match.status)}">${statusLabel(match.status)}</span>
    </div>
    <div class="match-teams">
      <div class="team">
        <img class="team-flag" src="${flagUrl(match.homeCode)}" alt="${match.homeName}" loading="lazy" onerror="this.src='https://flagcdn.com/w80/un.png'" />
        <span class="team-name">${match.homeName}</span>
      </div>
      <div class="match-score-wrap">
        ${hasResult
          ? `<span class="match-score">${match.scoreHome} – ${match.scoreAway}</span>`
          : `<span class="vs-text">VS</span>`}
        <span class="match-time">${formatDate(match.matchTime)}</span>
      </div>
      <div class="team team-away">
        <img class="team-flag" src="${flagUrl(match.awayCode)}" alt="${match.awayName}" loading="lazy" onerror="this.src='https://flagcdn.com/w80/un.png'" />
        <span class="team-name">${match.awayName}</span>
      </div>
    </div>
    ${oddsHtml}
    ${predBadge}
    ${footerHtml ? `<div class="match-card-footer">${footerHtml}</div>` : ""}
  `;

  // Predict button handler
  if (!adminMode) {
    const predBtn = card.querySelector(".predict-btn");
    if (predBtn) predBtn.addEventListener("click", () => openPredictModal(match));
  } else {
    const editBtn = card.querySelector(".adm-edit-btn");
    if (editBtn) editBtn.addEventListener("click", () => openAdminModal(match.id));
  }

  return card;
}

// ══════════════════════════════════════
//  MY PREDICTIONS
// ══════════════════════════════════════
function renderMyPredictions() {
  const list = $("my-pred-list");
  const empty = $("my-pred-empty");
  list.innerHTML = "";

  const myMatchIds = Object.keys(myPredictions);
  if (myMatchIds.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  const matches = allMatches.filter(m => myMatchIds.includes(m.id));
  matches.forEach((m, i) => list.appendChild(buildMatchCard(m, i * 40, false)));
}

// ══════════════════════════════════════
//  LEADERBOARD
// ══════════════════════════════════════
function subscribeLeaderboard() {
  const q = query(collection(db, "users"), orderBy("totalPoints", "desc"));
  unsubLeaderboard = onSnapshot(q, (snap) => {
    const list = $("leaderboard-list");
    const empty = $("leaderboard-empty");
    list.innerHTML = "";

    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (users.length === 0) { empty.classList.remove("hidden"); return; }
    empty.classList.add("hidden");

    const medals = ["🥇", "🥈", "🥉"];
    users.forEach((u, i) => {
      const row = document.createElement("div");
      row.className = "lb-row" + (u.id === currentUser?.uid ? " lb-me" : "");
      row.style.animationDelay = `${i * 30}ms`;
      const rankDisplay = i < 3 ? `<span class="lb-rank lb-rank-${i + 1}">${medals[i]}</span>` : `<span class="lb-rank">#${i + 1}</span>`;
      row.innerHTML = `
        ${rankDisplay}
        <div style="flex:1;min-width:0">
          <div class="lb-name">${u.displayName || "Người chơi"} ${u.id === currentUser?.uid ? "<small style='color:var(--gold-400)'>(Bạn)</small>" : ""}</div>
          <div class="lb-email">${u.email || ""}</div>
        </div>
        <div class="lb-stats">
          <div class="lb-stat"><div class="lb-stat-val">${u.totalPoints ?? 0}</div><div class="lb-stat-lbl">Điểm</div></div>
          <div class="lb-stat"><div class="lb-stat-val">${u.totalPredictions ?? 0}</div><div class="lb-stat-lbl">Dự đoán</div></div>
        </div>
      `;
      list.appendChild(row);
    });
  });
}

// ══════════════════════════════════════
//  FILTER BUTTONS
// ══════════════════════════════════════
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderMatches();
  });
});

// ══════════════════════════════════════
//  PREDICT MODAL
// ══════════════════════════════════════
let predictingMatch = null;

function openPredictModal(match) {
  predictingMatch = match;
  $("modal-match-info").textContent = `${match.homeName} vs ${match.awayName} · ${formatDate(match.matchTime)}`;
  $("pred-name-home").textContent = match.homeName;
  $("pred-name-away").textContent = match.awayName;
  $("pred-flag-home").src = flagUrl(match.homeCode);
  $("pred-flag-home").alt = match.homeName;
  $("pred-flag-away").src = flagUrl(match.awayCode);
  $("pred-flag-away").alt = match.awayName;
  $("pred-home").value = 0;
  $("pred-away").value = 0;
  $("modal-predict").classList.remove("hidden");
}

$("modal-predict-close").addEventListener("click", () => $("modal-predict").classList.add("hidden"));
$("modal-predict").addEventListener("click", (e) => { if (e.target === $("modal-predict")) $("modal-predict").classList.add("hidden"); });

$("btn-submit-pred").addEventListener("click", async () => {
  if (!predictingMatch) return;
  const home = parseInt($("pred-home").value);
  const away = parseInt($("pred-away").value);
  if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
    showToast("Vui lòng nhập tỉ số hợp lệ.");
    return;
  }
  const btn = $("btn-submit-pred");
  setLoading(btn, true);
  try {
    const predRef = await addDoc(collection(db, "predictions"), {
      userId: currentUser.uid,
      matchId: predictingMatch.id,
      predHome: home,
      predAway: away,
      createdAt: serverTimestamp(),
      points: null,
    });
    // Update user prediction count
    const uRef = doc(db, "users", currentUser.uid);
    const uSnap = await getDoc(uRef);
    const cur = uSnap.data();
    await updateDoc(uRef, { totalPredictions: (cur.totalPredictions || 0) + 1 });

    myPredictions[predictingMatch.id] = { predHome: home, predAway: away, matchId: predictingMatch.id, id: predRef.id };
    $("modal-predict").classList.add("hidden");
    renderMatches();
    renderMyPredictions();
    showToast("✅ Dự đoán đã được lưu!");
  } catch (e) {
    showToast("Lỗi: " + e.message);
  }
  setLoading(btn, false);
});

// ══════════════════════════════════════
//  ADMIN TAB
// ══════════════════════════════════════
function renderAdminMatches() {
  const list = $("admin-matches-list");
  list.innerHTML = "";
  allMatches.forEach((m, i) => list.appendChild(buildMatchCard(m, i * 30, true)));
}

function populateTeamSelects() {
  const selects = ["adm-home-team", "adm-away-team"];
  const opts = TEAMS.map(t => `<option value="${t.code}" data-name="${t.name}">${t.name}</option>`).join("");
  selects.forEach(id => { $(id).innerHTML = `<option value="">-- Chọn đội --</option>` + opts; });
}

$("btn-add-match").addEventListener("click", () => openAdminModal(null));

function openAdminModal(matchId) {
  editingMatchId = matchId;
  $("admin-modal-title").textContent = matchId ? "Chỉnh sửa trận đấu" : "Thêm trận đấu";
  $("admin-form-error").classList.add("hidden");

  if (matchId) {
    const m = allMatches.find(x => x.id === matchId);
    if (!m) return;
    $("adm-home-team").value = m.homeCode;
    $("adm-away-team").value = m.awayCode;
    const dt = m.matchTime?.toDate ? m.matchTime.toDate() : new Date(m.matchTime);
    $("adm-match-time").value = dt.toISOString().slice(0, 16);
    $("adm-round").value = m.round || "";
    $("adm-odds-home").value = m.oddsHome || "";
    $("adm-odds-draw").value = m.oddsDraw || "";
    $("adm-odds-away").value = m.oddsAway || "";
    $("adm-status").value = m.status || "upcoming";
    $("adm-score-home").value = m.scoreHome !== undefined ? m.scoreHome : "";
    $("adm-score-away").value = m.scoreAway !== undefined ? m.scoreAway : "";
  } else {
    ["adm-home-team","adm-away-team","adm-round","adm-odds-home","adm-odds-draw","adm-odds-away","adm-score-home","adm-score-away"].forEach(id => $(id).value = "");
    $("adm-status").value = "upcoming";
    $("adm-match-time").value = "";
  }
  $("modal-admin").classList.remove("hidden");
}

$("modal-admin-close").addEventListener("click", () => $("modal-admin").classList.add("hidden"));
$("btn-admin-cancel").addEventListener("click", () => $("modal-admin").classList.add("hidden"));
$("modal-admin").addEventListener("click", (e) => { if (e.target === $("modal-admin")) $("modal-admin").classList.add("hidden"); });

$("btn-admin-save").addEventListener("click", async () => {
  if (!isAdmin) return;
  const errEl = $("admin-form-error");
  errEl.classList.add("hidden");

  const homeCode = $("adm-home-team").value;
  const awayCode = $("adm-away-team").value;
  const matchTimeStr = $("adm-match-time").value;

  if (!homeCode || !awayCode || !matchTimeStr) {
    errEl.textContent = "Vui lòng điền đầy đủ thông tin bắt buộc.";
    errEl.classList.remove("hidden");
    return;
  }
  if (homeCode === awayCode) {
    errEl.textContent = "Hai đội không thể giống nhau.";
    errEl.classList.remove("hidden");
    return;
  }

  const homeTeam = TEAMS.find(t => t.code === homeCode);
  const awayTeam = TEAMS.find(t => t.code === awayCode);
  const status = $("adm-status").value;
  const scoreHomeRaw = $("adm-score-home").value;
  const scoreAwayRaw = $("adm-score-away").value;
  const newScoreHome = scoreHomeRaw !== "" ? parseInt(scoreHomeRaw) : undefined;
  const newScoreAway = scoreAwayRaw !== "" ? parseInt(scoreAwayRaw) : undefined;

  const data = {
    homeCode,
    homeName: homeTeam?.name || homeCode,
    awayCode,
    awayName: awayTeam?.name || awayCode,
    matchTime: new Date(matchTimeStr),
    round: $("adm-round").value || "Vòng bảng",
    oddsHome: $("adm-odds-home").value || "",
    oddsDraw: $("adm-odds-draw").value || "",
    oddsAway: $("adm-odds-away").value || "",
    status,
    updatedAt: serverTimestamp(),
  };

  if (newScoreHome !== undefined) data.scoreHome = newScoreHome;
  if (newScoreAway !== undefined) data.scoreAway = newScoreAway;

  const btn = $("btn-admin-save");
  setLoading(btn, true);

  try {
    let matchId = editingMatchId;
    if (matchId) {
      await updateDoc(doc(db, "matches", matchId), data);
    } else {
      data.createdAt = serverTimestamp();
      const ref = await addDoc(collection(db, "matches"), data);
      matchId = ref.id;
    }

    // Auto-score if result given and status is finished
    if (status === "finished" && newScoreHome !== undefined && newScoreAway !== undefined) {
      await autoScorePredictions(matchId, newScoreHome, newScoreAway);
    }

    $("modal-admin").classList.add("hidden");
    showToast("✅ Đã lưu trận đấu!");
  } catch (e) {
    errEl.textContent = "Lỗi: " + e.message;
    errEl.classList.remove("hidden");
  }
  setLoading(btn, false);
});

// ══════════════════════════════════════
//  AUTO-SCORE PREDICTIONS
// ══════════════════════════════════════
async function autoScorePredictions(matchId, realHome, realAway) {
  const q = query(collection(db, "predictions"), where("matchId", "==", matchId));
  const snap = await getDocs(q);
  if (snap.empty) return;

  const batch = writeBatch(db);
  // Track delta per user
  const userDeltas = {};

  for (const predDoc of snap.docs) {
    const pred = predDoc.data();
    const pts = calcPoints(pred.predHome, pred.predAway, realHome, realAway);
    if (pred.points !== pts) {
      batch.update(doc(db, "predictions", predDoc.id), { points: pts });
      if (!userDeltas[pred.userId]) userDeltas[pred.userId] = { delta: 0, prevPts: pred.points };
      userDeltas[pred.userId].delta += pts - (pred.points ?? 0);
    }
  }

  await batch.commit();

  // Update user totals
  const userBatch = writeBatch(db);
  for (const [uid, { delta }] of Object.entries(userDeltas)) {
    if (delta === 0) continue;
    const uRef = doc(db, "users", uid);
    const uSnap = await getDoc(uRef);
    if (uSnap.exists()) {
      userBatch.update(uRef, { totalPoints: (uSnap.data().totalPoints || 0) + delta });
    }
  }
  await userBatch.commit();
}

// ══════════════════════════════════════
//  SEED SAMPLE DATA (first-run helper)
// ══════════════════════════════════════
async function seedSampleData() {
  const existing = await getDocs(collection(db, "matches"));
  if (!existing.empty) return; // already seeded

  const now = new Date();
  const sampleMatches = [
    {
      homeName: "Brazil", homeCode: "br",
      awayName: "Argentina", awayCode: "ar",
      matchTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // +2h
      round: "Vòng bảng B", status: "upcoming",
      oddsHome: "2.20", oddsDraw: "3.25", oddsAway: "3.10",
    },
    {
      homeName: "France", homeCode: "fr",
      awayName: "Germany", awayCode: "de",
      matchTime: new Date(now.getTime() + 5 * 60 * 60 * 1000), // +5h
      round: "Vòng bảng C", status: "upcoming",
      oddsHome: "2.05", oddsDraw: "3.40", oddsAway: "3.55",
    },
    {
      homeName: "Spain", homeCode: "es",
      awayName: "Portugal", awayCode: "pt",
      matchTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // -2h (live)
      round: "Vòng bảng C", status: "live",
      oddsHome: "2.15", oddsDraw: "3.30", oddsAway: "3.20",
    },
    {
      homeName: "England", homeCode: "gb-eng",
      awayName: "Netherlands", awayCode: "nl",
      matchTime: new Date(now.getTime() - 4 * 60 * 60 * 1000), // finished
      round: "Vòng bảng D", status: "finished",
      oddsHome: "2.10", oddsDraw: "3.35", oddsAway: "3.40",
      scoreHome: 2, scoreAway: 1,
    },
    {
      homeName: "Japan", homeCode: "jp",
      awayName: "South Korea", awayCode: "kr",
      matchTime: new Date(now.getTime() + 26 * 60 * 60 * 1000), // tomorrow
      round: "Vòng bảng E", status: "upcoming",
      oddsHome: "2.80", oddsDraw: "3.10", oddsAway: "2.65",
    },
    {
      homeName: "Morocco", homeCode: "ma",
      awayName: "Senegal", awayCode: "sn",
      matchTime: new Date(now.getTime() - 24 * 60 * 60 * 1000), // yesterday
      round: "Vòng bảng F", status: "finished",
      oddsHome: "2.40", oddsDraw: "3.20", oddsAway: "3.00",
      scoreHome: 1, scoreAway: 1,
    },
    {
      homeName: "United States", homeCode: "us",
      awayName: "Mexico", awayCode: "mx",
      matchTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // in 3 days
      round: "Vòng bảng A", status: "upcoming",
      oddsHome: "2.55", oddsDraw: "3.20", oddsAway: "2.80",
    },
    {
      homeName: "Croatia", homeCode: "hr",
      awayName: "Switzerland", awayCode: "ch",
      matchTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      round: "Vòng bảng H", status: "upcoming",
      oddsHome: "2.70", oddsDraw: "3.15", oddsAway: "2.70",
    },
  ];

  const batch = writeBatch(db);
  sampleMatches.forEach(m => {
    const ref = doc(collection(db, "matches"));
    batch.set(ref, { ...m, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
  await batch.commit();
  console.log("✅ Sample match data seeded.");
}

// Run seed on first admin login
onAuthStateChanged(auth, (user) => {
  if (user && user.email === ADMIN_EMAIL) {
    setTimeout(() => seedSampleData(), 1500);
  }
});
