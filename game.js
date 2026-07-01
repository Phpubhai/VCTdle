'use strict';

/* ---------- Static maps ---------- */
// nationality -> ISO2 (flagcdn lowercase codes)
const FLAG = {
  "United States":"us","Canada":"ca","Brazil":"br","Argentina":"ar","Chile":"cl",
  "Peru":"pe","Colombia":"co","Dominican Republic":"do","Kyrgyzstan":"kg","Morocco":"ma",
  "Turkey":"tr","United Kingdom":"gb","Poland":"pl","Belgium":"be","Russia":"ru",
  "France":"fr","Czech Republic":"cz","India":"in","Kazakhstan":"kz","Egypt":"eg",
  "Lithuania":"lt","Romania":"ro","Finland":"fi","Saudi Arabia":"sa","Germany":"de",
  "Serbia":"rs","Spain":"es","Japan":"jp","South Korea":"kr","Thailand":"th",
  "Philippines":"ph","Singapore":"sg","Indonesia":"id","Malaysia":"my","Vietnam":"vn",
  "Australia":"au","China":"cn","Taiwan":"tw","Hong Kong":"hk","Switzerland":"ch"
};
const flagUrl = (nat) => FLAG[nat] ? `https://flagcdn.com/48x36/${FLAG[nat]}.png` : null;

// official VCT league logos (drop PNGs into assets/regions/)
const REGION_LOGO = {
  "Americas": "assets/regions/americas.png",
  "EMEA":     "assets/regions/emea.png",
  "Pacific":  "assets/regions/pacific.png",
  "China":    "assets/regions/china.png",
};

// Columns definition
const COLUMNS = [
  { key: "player",    label: "Player" },
  { key: "nationality", label: "สัญชาติ" },
  { key: "region",    label: "Region" },
  { key: "age",       label: "อายุ" },
  { key: "team",      label: "ทีม" },
  { key: "role",      label: "Role" },
  { key: "igl",       label: "IGL" },
  { key: "hasInternational", label: "Intl 🏆" },
  { key: "hasRegional",      label: "Regional" },
];

/* ---------- State ---------- */
let PLAYERS = [];
let AGENT_ICONS = {};          // lowercased agent name -> icon url
let answer = null;
let guessed = [];              // handles already guessed
let shareHistory = [];         // chronological array of state-rows for share grid
let activeRegions = new Set(["Americas","EMEA","Pacific","China"]);
let finished = false;
let acIndex = -1;              // autocomplete keyboard highlight

const $ = (id) => document.getElementById(id);

/* ---------- Init ---------- */
function initSplash() {
  const s = $("splash");
  if (!s) return;
  const hide = () => { s.classList.add("hide"); setTimeout(() => s.remove(), 600); };
  const t = setTimeout(hide, 2000);
  s.addEventListener("click", () => { clearTimeout(t); hide(); });
}

async function init() {
  initSplash();
  buildHeader();
  loadStats();
  if (Array.isArray(window.__PLAYERS__)) {
    PLAYERS = window.__PLAYERS__;          // loaded via <script> — works from file://
  } else {
    try {
      const res = await fetch("players.json");
      PLAYERS = await res.json();
    } catch (e) {
      $("guessInput").placeholder = "โหลดข้อมูลไม่สำเร็จ (players.json)";
      console.error(e);
      return;
    }
  }
  wireEvents();
  newGame();
}

async function fetchAgentIcons() {
  try {
    const r = await fetch("https://valorant-api.com/v1/agents?isPlayableCharacter=true");
    const j = await r.json();
    for (const a of j.data) AGENT_ICONS[a.displayName.toLowerCase()] = a.displayIcon;
    // re-render existing rows to pick up icons
    renderAllGuesses();
  } catch (e) { /* fall back to text */ }
}

function agentIcon(name) {
  if (!name) return null;
  return AGENT_ICONS[name.toLowerCase()] || null;
}

/* ---------- Header ---------- */
function buildHeader() {
  $("gridHeader").innerHTML = COLUMNS.map(c => `<div class="gh">${c.label}</div>`).join("");
}

/* ---------- New game ---------- */
function pool() {
  return PLAYERS.filter(p => activeRegions.has(p.region));
}
function newGame() {
  const p = pool();
  if (!p.length) { alert("เลือกอย่างน้อย 1 ภูมิภาค"); return; }
  answer = p[Math.floor(Math.random() * p.length)];
  guessed = [];
  shareHistory = [];
  finished = false;
  $("gridBody").innerHTML = "";
  $("winCard").classList.add("hidden");
  $("guessInput").value = "";
  $("guessInput").disabled = false;
  updateGuessCount();
  $("guessInput").focus();
  // console cheat for testing
  // console.log("answer:", answer.handle);
}

function updateGuessCount() {
  $("guessCount").textContent = guessed.length ? `เดาไปแล้ว ${guessed.length} ครั้ง` : "";
}

/* ---------- Comparison ---------- */
function cmp(field, guess) {
  const a = answer[field], g = guess[field];
  switch (field) {
    case "nationality":
      if (g === a) return "g";
      return guess.region === answer.region ? "y" : "r";
    case "age": {
      if (g == null || a == null) return "n";
      if (g === a) return "g";
      return Math.abs(g - a) === 1 ? "y" : "r";
    }
    default:
      return g === a ? "g" : "r";
  }
}

/* ---------- Render a guess row ---------- */
function makeTile(col, guess, i) {
  const key = col.key;
  const tile = document.createElement("div");
  tile.className = "tile";
  tile.style.animationDelay = (i * 0.11) + "s";

  if (key === "player") {
    tile.classList.add("player-tile");
    const img = document.createElement("img");
    img.src = guess.photoUrl || silhouette;
    img.alt = guess.handle;
    img.onerror = () => { img.src = silhouette; };
    img.title = guess.handle + " — " + guess.realName;
    tile.appendChild(img);
    return tile;
  }

  const state = cmp(key, guess);
  tile.classList.add(state);

  if (key === "nationality") {
    const f = flagUrl(guess.nationality);
    tile.innerHTML =
      (f ? `<img class="flag" src="${f}" alt="">` : "") +
      `<span class="sub">${shortNat(guess.nationality)}</span>`;
  } else if (key === "region") {
    const rl = REGION_LOGO[guess.region];
    tile.innerHTML =
      (rl ? `<img class="regionlogo" src="${rl}" alt="" onerror="this.style.display='none'">` : "") +
      `<span class="sub">${guess.region}</span>`;
  } else if (key === "age") {
    if (guess.age == null) { tile.innerHTML = `<span class="agebig">?</span>`; }
    else {
      let arrow = "";
      if (state !== "g" && answer.age != null) arrow = answer.age > guess.age ? "▲" : "▼";
      tile.innerHTML = `<span class="agebig">${guess.age}</span>` + (arrow ? `<span class="arrow">${arrow}</span>` : "");
    }
  } else if (key === "team") {
    tile.innerHTML =
      (guess.teamLogoUrl ? `<img class="teamlogo" src="${guess.teamLogoUrl}" alt="" onerror="this.style.display='none'">` : "") +
      `<span class="sub">${shortTeam(guess.team)}</span>`;
  } else if (key === "role") {
    tile.textContent = guess.role;
  } else if (key === "igl") {
    tile.innerHTML = `<span class="yn">${guess.igl ? "✓" : "✗"}</span>`;
  } else if (key === "signatureAgent") {
    const ic = agentIcon(guess.signatureAgent);
    tile.innerHTML =
      (ic ? `<img class="agenticon" src="${ic}" alt="">` : "") +
      `<span class="sub">${guess.signatureAgent}</span>`;
  } else if (key === "hasInternational" || key === "hasRegional") {
    tile.innerHTML = `<span class="yn">${guess[key] ? "✓" : "✗"}</span>`;
  }
  return tile;
}

function renderGuessRow(guess, prepend) {
  const row = document.createElement("div");
  row.className = "grid-row";
  COLUMNS.forEach((c, i) => row.appendChild(makeTile(c, guess, i)));
  const body = $("gridBody");
  if (prepend && body.firstChild) body.insertBefore(row, body.firstChild);
  else body.appendChild(row);
}

function renderAllGuesses() {
  $("gridBody").innerHTML = "";
  // newest on top
  for (const h of guessed) {
    const g = PLAYERS.find(p => p.handle === h);
    if (g) renderGuessRow(g, false);
  }
}

/* ---------- Make a guess ---------- */
function submitGuess(player) {
  if (finished || !player) return;
  if (guessed.includes(player.handle)) return;
  guessed.unshift(player.handle);
  shareHistory.push(COLUMNS.filter(c => c.key !== "player").map(c => cmp(c.key, player)));
  renderGuessRow(player, true);
  updateGuessCount();
  $("guessInput").value = "";
  closeAutocomplete();

  if (player.handle === answer.handle) win();
}

/* ---------- Win ---------- */
function win() {
  finished = true;
  $("guessInput").disabled = true;
  recordWin(guessed.length);
  const card = $("winCard");
  card.classList.remove("hidden", "lose");
  const flag = flagUrl(answer.nationality);
  const rlogo = REGION_LOGO[answer.region];
  card.innerHTML = `
    ${rlogo ? `<img class="wc-region" src="${rlogo}" onerror="this.style.display='none'" alt="">` : ""}
    <h2>🎉 ถูกต้อง!</h2>
    <div class="wc-count">เดา ${guessed.length} ครั้ง</div>
    <div class="wc-body">
      <img class="wc-photo" src="${answer.photoUrl || silhouette}" onerror="this.src='${silhouette}'" alt="">
      <div class="wc-info">
        <div class="wc-handle">${answer.handle}</div>
        <div class="wc-sub">${flag ? `<img class="wc-flag" src="${flag}" alt="">` : ""}${answer.realName} · อายุ ${answer.age ?? "?"}</div>
        <div class="wc-team">
          ${answer.teamLogoUrl ? `<img src="${answer.teamLogoUrl}" onerror="this.style.display='none'" alt="">` : ""}
          ${answer.team} · ${answer.role}${answer.igl ? " · IGL" : ""}
        </div>
      </div>
    </div>
    <div class="wc-actions">
      <button class="wc-again" id="againBtn">▶ เล่นอีกครั้ง</button>
      <button class="wc-share" id="shareBtn">📋 แชร์ผล</button>
    </div>
  `;
  $("againBtn").onclick = newGame;
  $("shareBtn").onclick = copyShare;
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  launchConfetti();
}

/* ---------- Share (Wordle-style) ---------- */
function buildShareText() {
  const emoji = { g: "🟩", y: "🟨", r: "🟥", n: "⬛" };
  const rows = shareHistory.map(r => r.map(s => emoji[s] || "⬛").join("")).join("\n");
  return `VCTdle 🎯 ${guessed.length} ครั้ง\n${rows}\nhttps://phpubhai.github.io/VCTdle/`;
}
function copyShare() {
  const txt = buildShareText();
  const btn = $("shareBtn");
  const done = () => { if (btn) { btn.textContent = "✓ คัดลอกแล้ว!"; setTimeout(() => { btn.textContent = "📋 แชร์ผล"; }, 1800); } };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(done, () => fallbackCopy(txt, done));
  } else fallbackCopy(txt, done);
}
function fallbackCopy(txt, done) {
  const ta = document.createElement("textarea");
  ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); done(); } catch (e) {}
  ta.remove();
}

/* ---------- Confetti ---------- */
function launchConfetti() {
  const colors = ["#ff4655", "#35d07f", "#f0c04a", "#2ad4d4", "#ffffff"];
  const box = document.createElement("div");
  box.className = "confetti";
  for (let i = 0; i < 70; i++) {
    const s = document.createElement("span");
    s.style.left = (Math.random() * 100) + "%";
    s.style.background = colors[i % colors.length];
    s.style.animationDelay = (Math.random() * 0.7) + "s";
    s.style.animationDuration = (1.6 + Math.random() * 1.6) + "s";
    s.style.transform = `rotate(${Math.random() * 360}deg)`;
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3600);
}

/* ---------- Autocomplete ---------- */
function openAutocomplete(q) {
  const box = $("autocomplete");
  const query = q.trim().toLowerCase();
  if (!query) { closeAutocomplete(); return; }
  const matches = PLAYERS
    .filter(p => !guessed.includes(p.handle) &&
      (p.handle.toLowerCase().includes(query) || (p.realName && p.realName.toLowerCase().includes(query))))
    .sort((a, b) => {
      const ai = a.handle.toLowerCase().startsWith(query) ? 0 : 1;
      const bi = b.handle.toLowerCase().startsWith(query) ? 0 : 1;
      return ai - bi || a.handle.localeCompare(b.handle);
    })
    .slice(0, 8);

  if (!matches.length) { closeAutocomplete(); return; }
  acIndex = -1;
  box.innerHTML = matches.map((p, i) => `
    <div class="ac-item" data-handle="${encodeURIComponent(p.handle)}" data-i="${i}">
      <img class="ac-photo" src="${p.photoUrl || silhouette}" onerror="this.src='${silhouette}'" alt="">
      <span class="ac-name">${p.handle}</span>
      <span class="ac-meta">
        ${p.teamLogoUrl ? `<img class="ac-teamlogo" src="${p.teamLogoUrl}" onerror="this.style.display='none'" alt="">` : ""}
        ${shortTeam(p.team)}
      </span>
    </div>
  `).join("");
  box.classList.add("open");
  box.querySelectorAll(".ac-item").forEach(el => {
    el.addEventListener("click", () => {
      const h = decodeURIComponent(el.dataset.handle);
      submitGuess(PLAYERS.find(p => p.handle === h));
    });
  });
}
function closeAutocomplete() {
  $("autocomplete").classList.remove("open");
  $("autocomplete").innerHTML = "";
  acIndex = -1;
}
function moveAc(dir) {
  const items = [...$("autocomplete").querySelectorAll(".ac-item")];
  if (!items.length) return;
  acIndex = (acIndex + dir + items.length) % items.length;
  items.forEach((el, i) => el.classList.toggle("active", i === acIndex));
  items[acIndex].scrollIntoView({ block: "nearest" });
}
function chooseAc() {
  const items = [...$("autocomplete").querySelectorAll(".ac-item")];
  if (!items.length) return false;
  const el = items[acIndex >= 0 ? acIndex : 0];
  submitGuess(PLAYERS.find(p => p.handle === decodeURIComponent(el.dataset.handle)));
  return true;
}

/* ---------- Events ---------- */
function wireEvents() {
  const input = $("guessInput");
  input.addEventListener("input", () => openAutocomplete(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); moveAc(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveAc(-1); }
    else if (e.key === "Enter") { e.preventDefault(); if (!chooseAc()) {} }
    else if (e.key === "Escape") closeAutocomplete();
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-box")) closeAutocomplete();
  });

  $("filterChips").querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const r = chip.dataset.region;
      if (activeRegions.has(r)) {
        if (activeRegions.size === 1) return; // keep at least one
        activeRegions.delete(r); chip.classList.remove("active");
      } else { activeRegions.add(r); chip.classList.add("active"); }
      newGame();
    });
  });

  $("newGameBtn").addEventListener("click", () => {
    if (!finished && guessed.length) {
      if (!confirm("เริ่มเกมใหม่? เกมปัจจุบันจะถูกยกเลิก")) return;
    }
    newGame();
  });
}

/* ---------- Stats (localStorage) ---------- */
const STATS_KEY = "vctdle_stats";
let stats = { played: 0, wins: 0, streak: 0, best: 0 };
function loadStats() {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); if (s) stats = s; } catch {}
  renderStats();
}
function recordWin() {
  stats.played++; stats.wins++; stats.streak++;
  if (stats.streak > stats.best) stats.best = stats.streak;
  saveStats(); renderStats();
}
function saveStats() { try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {} }
function renderStats() {
  $("statPlayed").textContent = stats.played;
  $("statWins").textContent = stats.wins;
  $("statStreak").textContent = stats.streak;
  $("statBest").textContent = stats.best;
}

/* ---------- Helpers ---------- */
function shortTeam(t) {
  const map = {
    "100 Thieves":"100T","Evil Geniuses":"EG","Sentinels":"SEN","Cloud9":"C9","G2 Esports":"G2",
    "LEVIATÁN":"LEV","KRÜ Esports":"KRÜ","Natus Vincere":"NAVI","Team Heretics":"TH","Team Liquid":"TL",
    "Team Vitality":"VIT","Karmine Corp":"KC","Gentle Mates":"M8","Eternal Fire":"EF","BBL Esports":"BBL",
    "FUT Esports":"FUT","PCIFIC Esports":"PCF","Paper Rex":"PRX","Rex Regum Qeon":"RRQ",
    "DetonatioN FocusMe":"DFM","KIWOOM DRX":"DRX","Global Esports":"GE","Team Secret":"TS",
    "ZETA DIVISION":"ZETA","Nongshim RedForce":"NS","FULL SENSE":"FS","EDward Gaming":"EDG",
    "Bilibili Gaming":"BLG","All Gamers":"AG","FunPlus Phoenix":"FPX","JDG Esports":"JDG",
    "Nova Esports":"NOVA","Titan Esports Club":"TEC","Trace Esports":"TRC","Wolves Esports":"WOL",
    "Xi Lai Gaming":"XLG","Dragon Ranger Gaming":"DRG"
  };
  return map[t] || t;
}
function shortNat(n) {
  const map = { "United States":"USA","United Kingdom":"UK","South Korea":"Korea",
    "Dominican Republic":"DR","Saudi Arabia":"KSA","Czech Republic":"Czech","Hong Kong":"HK" };
  return map[n] || n;
}

// inline SVG silhouette fallback
const silhouette = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='#0c0e11'/><circle cx='40' cy='30' r='15' fill='#2c333d'/><path d='M12 78c0-18 14-28 28-28s28 10 28 28' fill='#2c333d'/></svg>`
);

init();
