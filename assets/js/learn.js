// Shieldio Learn — topic catalogue and progress stay in this browser only.
(function () {
  const DATA_URL = "/assets/data/learn-questions.json";
  const STORAGE_KEY = "shieldio-learn-progress-v1";
  const THEME_KEY = "shieldio-theme";

  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (_) { return null; }
  }

  function preferredTheme() {
    return storedTheme() || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll(".learn-brand img").forEach(image => {
      image.src = `/assets/icons/${theme === "dark" ? "logo-full-white.svg" : "logo-full-color.svg"}`;
    });
    const toggle = document.querySelector("[data-learn-theme]");
    if (toggle) {
      toggle.textContent = theme === "dark" ? "☀" : "☾";
      toggle.setAttribute("aria-label", theme === "dark" ? "Přepnout na světlý režim" : "Přepnout na tmavý režim");
    }
  }

  applyTheme(preferredTheme());

  function ensureThemeToggle() {
    const nav = document.querySelector(".learn-nav") || document.querySelector(".learn-header-inner");
    if (!nav || nav.querySelector("[data-learn-theme]")) return;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "learn-theme-toggle";
    toggle.dataset.learnTheme = "";
    toggle.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
      applyTheme(next);
    });
    nav.appendChild(toggle);
    applyTheme(preferredTheme());
  }

  function internalHref(path) {
    return (location.hostname === "127.0.0.1" || location.hostname === "localhost") ? "/learn" + path : path;
  }

  function questionHref(slug) {
    if (location.hostname === "127.0.0.1" || location.hostname === "localhost") {
      return `/learn/maturita/otazka/index.html?slug=${encodeURIComponent(slug)}`;
    }
    return `/maturita/otazka/${slug}/`;
  }

  function fixLocalLinks() {
    if (!(location.hostname === "127.0.0.1" || location.hostname === "localhost") || !location.pathname.startsWith("/learn/")) return;
    document.querySelectorAll('a[href^="/"]').forEach(link => {
      const href = link.getAttribute("href");
      if (!href.startsWith("/assets/")) link.href = internalHref(href);
    });
  }

  function ensurePrivacyLink() {
    const footer = document.querySelector(".learn-footer-inner");
    if (!footer || footer.querySelector('[href*="privacy"]')) return;
    const link = document.createElement("a");
    link.href = "https://shieldio.cz/company/privacy.html";
    link.textContent = "Ochrana soukromí";
    footer.appendChild(link);
  }

  function getProgress() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { completed: [] }; }
    catch (_) { return { completed: [] }; }
  }

  function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function subjectStats(subject, data, progress) {
    const slugs = subject.questionSlugs;
    const completed = slugs.filter(slug => progress.completed.includes(slug)).length;
    return { total: slugs.length, completed, percent: slugs.length ? Math.round(completed / slugs.length * 100) : 0 };
  }

  function progressMarkup(stats) {
    return `<div class="learn-progress" aria-label="Dokončeno ${stats.percent} %"><span style="width:${stats.percent}%"></span></div><p class="learn-progress-label">${stats.completed} z ${stats.total} dokončeno</p>`;
  }

  function renderDashboard(data, progress) {
    const pageHead = document.querySelector(".learn-page-head");
    if (pageHead && document.querySelector("[data-overall-progress]")) {
      pageHead.querySelector(".learn-eyebrow").textContent = "SPŠ Zlín · Elektrotechnika · 2025/26";
      pageHead.querySelector("p").textContent = "50 připravených okruhů z elektroniky a automatizace. Výklady, animace, grafy a interaktivní úlohy budeme doplňovat postupně.";
    }
    document.querySelectorAll("[data-subject-card]").forEach(card => {
      const subject = data.subjects.find(item => item.id === card.dataset.subjectCard);
      if (!subject) return;
      const stats = subjectStats(subject, data, progress);
      card.querySelector("[data-question-count]").textContent = `${stats.total} maturitních okruhů`;
      card.querySelector("[data-progress-slot]").innerHTML = progressMarkup(stats);
    });
    const all = data.questions.length;
    const done = data.questions.filter(question => progress.completed.includes(question.slug)).length;
    document.querySelector("[data-overall-progress]")?.style.setProperty("--learn-progress", `${all ? done / all * 100 : 0}%`);
    const overall = document.querySelector("[data-overall-copy]");
    if (overall) overall.textContent = `${done} z ${all} okruhů dokončeno`;
  }

  function renderSubject(data, progress) {
    const root = document.querySelector("[data-subject-page]");
    if (!root) return;
    const subject = data.subjects.find(item => item.id === root.dataset.subjectPage);
    if (!subject) return;
    const questions = subject.questionSlugs.map(slug => data.questions.find(question => question.slug === slug)).filter(Boolean);
    root.querySelector("[data-subject-title]").textContent = subject.title;
    root.querySelector("[data-subject-description]").textContent = subject.description;
    root.querySelector("[data-subject-progress]").innerHTML = progressMarkup(subjectStats(subject, data, progress));
    root.querySelector("[data-question-list]").innerHTML = questions.map(question => {
      const available = question.status !== "outline";
      const done = progress.completed.includes(question.slug);
      const state = done ? "Hotovo" : question.status === "complete" ? "Vypracováno" : question.status === "in-progress" ? "Rozpracováno" : "Připravuje se";
      const tag = available ? "a" : "div";
      const href = available ? ` href="${questionHref(question.slug)}"` : "";
      return `
      <${tag} class="learn-question-row ${available ? "is-available" : "is-locked"} ${done ? "is-studied" : ""}"${href}${available ? "" : ' aria-disabled="true"'}>
        <span class="learn-question-number">${question.number}</span>
        <span><b>${question.title}</b><small>${question.summary}</small></span>
        <span class="learn-question-state ${done ? "is-done" : available ? "is-ready" : ""}">${state}</span>
      </${tag}>`;
    }).join("");
  }

  function renderQuestion(data, progress) {
    const root = document.querySelector("[data-question-page]");
    if (!root) return;
    const parts = location.pathname.split("/").filter(Boolean);
    const isGenericQuestionPage = /\/otazka\/(?:index\.html)?$/.test(location.pathname);
    const slug = isGenericQuestionPage ? new URLSearchParams(location.search).get("slug") : parts[parts.length - 1];
    const question = data.questions.find(item => item.slug === slug);
    if (!question) {
      root.innerHTML = `<div class="learn-empty"><span class="eyebrow">Nenalezeno</span><h1>Tahle otázka zatím neexistuje.</h1><a class="learn-button" href="${internalHref("/maturita/")}">Zpět na maturitu</a></div>`;
      return;
    }
    const subject = data.subjects.find(item => item.id === question.subject);
    document.title = `${question.title} | Shieldio Learn`;
    root.querySelector("[data-question-subject]").textContent = subject.title;
    root.querySelector("[data-question-title]").textContent = question.title;
    root.querySelector("[data-question-summary]").textContent = question.summary;
    const footerNote = document.querySelector(".learn-footer span");
    if (footerNote) footerNote.textContent = "SPŠ Zlín · obor 26-41-M/01 Elektrotechnika · školní rok 2025/26";
    if (question.status === "outline") {
      root.querySelector("[data-question-summary]").insertAdjacentHTML("beforebegin", '<span class="learn-status-badge">Připravená osnova · obsah se doplňuje</span>');
    }
    const sectionRoot = root.querySelector("[data-question-sections]");
    if (question.template === "memory-lab") renderMemoryLab(sectionRoot, question);
    else if (question.template === "rlc-study") renderRlcStudy(sectionRoot, question);
    else sectionRoot.innerHTML = question.sections.map(section => `<section class="learn-answer-section"><h2>${section.title}</h2><p>${section.body}</p></section>`).join("");
    const button = root.querySelector("[data-complete-question]");
    if (question.status === "outline") {
      button.textContent = "Obsah se připravuje";
      button.disabled = true;
      return;
    }
    const updateButton = () => {
      const done = progress.completed.includes(question.slug);
      button.textContent = done ? "✓ Označeno jako hotové" : "Označit jako hotové";
      button.classList.toggle("is-complete", done);
      button.setAttribute("aria-pressed", String(done));
    };
    button.addEventListener("click", () => {
      const index = progress.completed.indexOf(question.slug);
      if (index >= 0) progress.completed.splice(index, 1); else progress.completed.push(question.slug);
      saveProgress(progress); updateButton();
    });
    updateButton();
  }

  function renderMemoryLab(root) {
    root.textContent = "Načítám kapitoly pamětí…";
    const load = src => new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src; script.onload = resolve; script.onerror = reject;
      document.head.appendChild(script);
    });
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "/assets/css/learn-memory-v2.css";
    document.head.appendChild(css);
    load("/assets/js/learn-memory-data-v2.js").then(() => load("/assets/js/learn-memory-v2.js"))
      .then(() => window.renderShieldioMemory(root))
      .catch(() => { root.textContent = "Lekci se nepodařilo načíst. Obnov stránku a zkontroluj připojení."; });
  }

  function renderRlcStudy(root) {
    root.textContent = "Načítám učební materiál RLC…";
    const load = src => new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src; script.onload = resolve; script.onerror = reject;
      document.head.appendChild(script);
    });
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "/assets/css/learn-rlc-v2.css";
    document.head.appendChild(css);
    if (!document.querySelector('link[href*="katex.min.css"]')) {
      const mathCss = document.createElement("link");
      mathCss.rel = "stylesheet"; mathCss.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
      document.head.appendChild(mathCss);
    }
    const mathReady = window.katex ? Promise.resolve() : load("https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js");
    mathReady.then(() => load("/assets/js/learn-rlc-data-v3.js?v=4")).then(() => load("/assets/js/learn-rlc-v2.js?v=4")).then(() => load("/assets/js/learn-rlc-diagrams-v4.js?v=4"))
      .then(() => window.renderShieldioRlc(root))
      .catch(() => { root.textContent = "Lekci se nepodařilo načíst. Obnov stránku a zkontroluj připojení."; });
  }

  function renderPractice(data, progress) {
    const root = document.querySelector("[data-practice-page]");
    if (!root) return;
    const available = data.questions.filter(question => question.status !== "outline");
    if (!available.length) {
      root.querySelector("[data-practice-title]").textContent = "První procvičování se připravuje";
      root.querySelector("[data-practice-summary]").textContent = "Osnova všech 50 okruhů je založená. Procvičování zpřístupníme spolu s prvním dokončeným výkladem.";
      root.querySelector("[data-practice-link]").hidden = true;
      return;
    }
    const unanswered = available.filter(question => !progress.completed.includes(question.slug));
    const pool = unanswered.length ? unanswered : available;
    const question = pool[Math.floor(Math.random() * pool.length)];
    const link = root.querySelector("[data-practice-link]");
    link.href = questionHref(question.slug);
    root.querySelector("[data-practice-title]").textContent = question.title;
    root.querySelector("[data-practice-summary]").textContent = question.summary;
  }

  async function init() {
    fixLocalLinks();
    ensureThemeToggle();
    ensurePrivacyLink();
    try {
      const response = await fetch(DATA_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const progress = getProgress();
      renderDashboard(data, progress);
      renderSubject(data, progress);
      renderQuestion(data, progress);
      renderPractice(data, progress);
    } catch (error) {
      document.querySelectorAll("[data-learn-error]").forEach(node => {
        node.hidden = false;
        node.textContent = "Demo data se nepodařilo načíst. Obnov stránku nebo zkontroluj připojení.";
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  // Every Learn route loads this shared file, so the timer follows the user
  // without duplicating a script tag across all static page shells.
  const timerScript = document.createElement("script");
  timerScript.src = "/assets/js/study-timer.js";
  timerScript.defer = true;
  document.head.appendChild(timerScript);
})();
