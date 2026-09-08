// Shieldio Learn Study Timer — timestamp-based timer, local statistics and compact UI.
(function () {
  "use strict";

  const STATE_KEY = "shieldio-study-timer-v1";
  const STATS_KEY = "shieldio-study-stats-v1";
  const DAY_GOAL_KEY = "shieldio-study-goal-v1";
  const presets = { 25: 5, 45: 10, 60: 10 };
  let intervalId = null;
  let lastVisibleTick = Date.now();
  let audioContext = null;

  const freshState = () => ({
    mode: "study", status: "idle", durationSec: 25 * 60, breakSec: 5 * 60,
    remainingSec: 25 * 60, endAt: null, activeSec: 0, minimized: true,
    topic: "Obecné studium", notice: ""
  });

  function read(key, fallback) {
    try { return Object.assign({}, fallback, JSON.parse(localStorage.getItem(key)) || {}); }
    catch (_) { return fallback; }
  }

  let state = read(STATE_KEY, freshState());
  let stats = read(STATS_KEY, { sessions: 0, totalSec: 0, days: {}, topics: {} });

  function save() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function saveStats() {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (_) {}
  }

  function todayKey() {
    return new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  }

  function currentTopic() {
    const title = document.querySelector("[data-question-title]")?.textContent.trim();
    return title && title !== "Načítám otázku…" ? title : "Obecné studium";
  }

  function remainingNow() {
    if (state.status === "running" && state.endAt) return Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
    return Math.max(0, state.remainingSec);
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.round(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  function formatMinutes(seconds) {
    return Math.round(seconds / 60).toLocaleString("cs-CZ");
  }

  function setPreset(minutes, customBreak) {
    if (state.status === "running") return;
    const studyMinutes = Math.max(1, Math.min(180, Number(minutes) || 25));
    const breakMinutes = Math.max(1, Math.min(60, Number(customBreak) || presets[studyMinutes] || 10));
    state.mode = "study";
    state.status = "idle";
    state.durationSec = studyMinutes * 60;
    state.breakSec = breakMinutes * 60;
    state.remainingSec = state.durationSec;
    state.endAt = null;
    state.activeSec = 0;
    state.notice = `${studyMinutes} min studium · ${breakMinutes} min pauza`;
    save(); render();
  }

  function start() {
    if (state.status === "running") return;
    const remaining = remainingNow() || (state.mode === "study" ? state.durationSec : state.breakSec);
    state.remainingSec = remaining;
    state.endAt = Date.now() + remaining * 1000;
    state.status = "running";
    state.notice = "";
    if (state.mode === "study" && state.activeSec === 0) state.topic = currentTopic();
    lastVisibleTick = Date.now();
    try { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
    save(); schedule(); render();
  }

  function pause() {
    if (state.status !== "running") return;
    state.remainingSec = remainingNow();
    state.endAt = null;
    state.status = "paused";
    save(); stopSchedule(); render();
  }

  function reset() {
    state.status = "idle";
    state.endAt = null;
    state.activeSec = 0;
    state.remainingSec = state.mode === "study" ? state.durationSec : state.breakSec;
    state.notice = "Časovač byl resetován.";
    save(); stopSchedule(); render();
  }

  function switchMode(mode, notice) {
    state.mode = mode;
    state.status = "idle";
    state.endAt = null;
    state.activeSec = 0;
    state.remainingSec = mode === "study" ? state.durationSec : state.breakSec;
    state.notice = notice || "";
    save(); stopSchedule(); render();
  }

  function finish() {
    const finishedMode = state.mode;
    if (finishedMode === "study") {
      const credited = Math.min(state.durationSec, Math.round(state.activeSec));
      const day = todayKey();
      stats.sessions += 1;
      stats.totalSec += credited;
      stats.days[day] = (stats.days[day] || 0) + credited;
      stats.topics[state.topic] = (stats.topics[state.topic] || 0) + credited;
      saveStats();
      switchMode("break", `Studijní blok dokončen · započítáno ${formatMinutes(credited)} min aktivního času. Pauza je připravená.`);
    } else {
      switchMode("study", "Pauza skončila. Další studijní blok je připravený.");
    }
    alertFinish(finishedMode);
  }

  function alertFinish(mode) {
    document.querySelector("[data-study-timer]")?.classList.add("is-alerting");
    setTimeout(() => document.querySelector("[data-study-timer]")?.classList.remove("is-alerting"), 1800);
    try { navigator.vibrate?.([120, 80, 120]); } catch (_) {}
    try {
      if (audioContext?.state === "suspended") audioContext.resume();
      const osc = audioContext?.createOscillator();
      const gain = audioContext?.createGain();
      if (osc && gain) {
        osc.connect(gain); gain.connect(audioContext.destination); osc.frequency.value = mode === "study" ? 660 : 520;
        gain.gain.setValueAtTime(0.035, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + .35);
        osc.start(); osc.stop(audioContext.currentTime + .36);
      }
    } catch (_) {}
  }

  function tick() {
    if (state.status !== "running") return;
    const now = Date.now();
    if (!document.hidden && state.mode === "study") state.activeSec += Math.min(2, Math.max(0, (now - lastVisibleTick) / 1000));
    lastVisibleTick = now;
    state.remainingSec = remainingNow();
    if (state.remainingSec <= 0) finish();
    else { save(); render(); }
  }

  function schedule() {
    stopSchedule();
    intervalId = window.setInterval(tick, 1000);
  }
  function stopSchedule() { if (intervalId) clearInterval(intervalId); intervalId = null; }

  function template() {
    const host = document.createElement("aside");
    host.className = "study-timer";
    host.dataset.studyTimer = "";
    host.setAttribute("aria-label", "Studijní časovač");
    host.innerHTML = `
      <button class="study-timer-chip" data-timer-expand aria-expanded="false"><span data-chip-mode>Studium</span><b data-chip-time>25:00</b></button>
      <div class="study-timer-panel" data-timer-panel>
        <div class="study-timer-head"><div><span class="study-timer-kicker" data-timer-mode>STUDIUM</span><small data-timer-topic>Obecné studium</small></div><button data-timer-minimize aria-label="Minimalizovat časovač">−</button></div>
        <div class="study-timer-clock" data-timer-clock role="timer" aria-live="off"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52"></circle><circle class="study-timer-progress" cx="60" cy="60" r="52" data-timer-ring></circle></svg><strong data-timer-time>25:00</strong></div>
        <p class="study-timer-notice" data-timer-notice aria-live="polite"></p>
        <div class="study-timer-main-actions"><button class="study-timer-primary" data-timer-primary>Start</button><button data-timer-reset>Reset</button><button data-timer-skip>Přejít na pauzu</button></div>
        <div class="study-timer-presets" aria-label="Délka studia"><button data-preset="25">25 / 5</button><button data-preset="45">45 / 10</button><button data-preset="60">60 / 10</button><button data-custom-toggle>Vlastní</button></div>
        <form class="study-timer-custom" data-custom-form hidden><label>Studium <input name="study" type="number" min="1" max="180" value="25"> min</label><label>Pauza <input name="break" type="number" min="1" max="60" value="5"> min</label><button type="submit">Nastavit</button></form>
        <div class="study-timer-today"><div><span>Dnes</span><b><span data-today>0</span> / <span data-goal>60</span> min</b></div><div class="study-timer-goal"><i data-goal-bar></i></div><label>Denní cíl <input data-goal-input type="number" min="10" max="600" step="10" value="60"> min</label><small data-stats></small></div>
      </div>`;
    document.body.appendChild(host);
    bind(host);
  }

  function bind(host) {
    host.querySelector("[data-timer-expand]").addEventListener("click", () => { state.minimized = false; save(); render(); });
    host.querySelector("[data-timer-minimize]").addEventListener("click", () => { state.minimized = true; save(); render(); });
    host.querySelector("[data-timer-primary]").addEventListener("click", () => state.status === "running" ? pause() : start());
    host.querySelector("[data-timer-reset]").addEventListener("click", reset);
    host.querySelector("[data-timer-skip]").addEventListener("click", () => switchMode(state.mode === "study" ? "break" : "study", state.mode === "study" ? "Pauza je připravená." : "Studijní blok je připravený."));
    host.querySelectorAll("[data-preset]").forEach(button => button.addEventListener("click", () => setPreset(button.dataset.preset)));
    host.querySelector("[data-custom-toggle]").addEventListener("click", () => { const form = host.querySelector("[data-custom-form]"); form.hidden = !form.hidden; });
    host.querySelector("[data-custom-form]").addEventListener("submit", event => { event.preventDefault(); setPreset(event.currentTarget.elements.study.value, event.currentTarget.elements.break.value); event.currentTarget.hidden = true; });
    const goal = host.querySelector("[data-goal-input]");
    goal.addEventListener("change", () => { const value = Math.max(10, Math.min(600, Number(goal.value) || 60)); localStorage.setItem(DAY_GOAL_KEY, String(value)); render(); });
  }

  function render() {
    const host = document.querySelector("[data-study-timer]");
    if (!host) return;
    const seconds = remainingNow();
    const total = state.mode === "study" ? state.durationSec : state.breakSec;
    const progress = Math.max(0, Math.min(1, 1 - seconds / total));
    const circumference = 2 * Math.PI * 52;
    const modeLabel = state.mode === "study" ? "Studium" : "Pauza";
    host.classList.toggle("is-minimized", state.minimized);
    host.classList.toggle("is-break", state.mode === "break");
    host.querySelector("[data-timer-expand]").setAttribute("aria-expanded", String(!state.minimized));
    host.querySelector("[data-chip-mode]").textContent = modeLabel;
    host.querySelector("[data-chip-time]").textContent = formatTime(seconds);
    host.querySelector("[data-timer-mode]").textContent = state.mode === "study" ? "STUDIJNÍ BLOK" : "PAUZA";
    host.querySelector("[data-timer-topic]").textContent = state.mode === "study" ? state.topic : "Čas na odpočinek";
    host.querySelector("[data-timer-time]").textContent = formatTime(seconds);
    host.querySelector("[data-timer-clock]").setAttribute("aria-label", `${modeLabel}, zbývá ${formatTime(seconds)}`);
    host.querySelector("[data-timer-ring]").style.strokeDasharray = circumference;
    host.querySelector("[data-timer-ring]").style.strokeDashoffset = circumference * (1 - progress);
    host.querySelector("[data-timer-primary]").textContent = state.status === "running" ? "Pozastavit" : state.status === "paused" ? "Pokračovat" : "Start";
    host.querySelector("[data-timer-skip]").textContent = state.mode === "study" ? "Přejít na pauzu" : "Ukončit pauzu";
    host.querySelector("[data-timer-notice]").textContent = state.notice;
    const goal = Math.max(10, Math.min(600, Number(localStorage.getItem(DAY_GOAL_KEY)) || 60));
    const todayMin = Math.round((stats.days[todayKey()] || 0) / 60);
    host.querySelector("[data-today]").textContent = todayMin;
    host.querySelector("[data-goal]").textContent = goal;
    host.querySelector("[data-goal-input]").value = goal;
    host.querySelector("[data-goal-bar]").style.width = `${Math.min(100, todayMin / goal * 100)}%`;
    host.querySelector("[data-stats]").textContent = `${stats.sessions} dokončených bloků · celkem ${formatMinutes(stats.totalSec)} min${todayMin >= goal ? " · dnešní cíl splněn" : ""}`;
  }

  function init() {
    template();
    if (state.status === "running") {
      if (remainingNow() <= 0) finish(); else schedule();
    }
    document.addEventListener("visibilitychange", () => { lastVisibleTick = Date.now(); });
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
