// Shieldio Learn prototype — demo content and progress stay in this browser only.
(function () {
  const DATA_URL = "/assets/data/learn-questions.json";
  const STORAGE_KEY = "shieldio-learn-progress-v1";

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
    document.querySelectorAll("[data-subject-card]").forEach(card => {
      const subject = data.subjects.find(item => item.id === card.dataset.subjectCard);
      if (!subject) return;
      const stats = subjectStats(subject, data, progress);
      card.querySelector("[data-question-count]").textContent = `${stats.total} demo ${stats.total === 1 ? "otázka" : "otázky"}`;
      card.querySelector("[data-progress-slot]").innerHTML = progressMarkup(stats);
    });
    const all = data.questions.length;
    const done = data.questions.filter(question => progress.completed.includes(question.slug)).length;
    document.querySelector("[data-overall-progress]")?.style.setProperty("--learn-progress", `${all ? done / all * 100 : 0}%`);
    const overall = document.querySelector("[data-overall-copy]");
    if (overall) overall.textContent = `${done} z ${all} demo otázek dokončeno`;
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
    root.querySelector("[data-question-list]").innerHTML = questions.map(question => `
      <a class="learn-question-row" href="${questionHref(question.slug)}">
        <span class="learn-question-number">${question.number}</span>
        <span><b>${question.title}</b><small>${question.summary}</small></span>
        <span class="learn-question-state ${progress.completed.includes(question.slug) ? "is-done" : ""}">${progress.completed.includes(question.slug) ? "Hotovo" : "Otevřít"}</span>
      </a>`).join("");
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
    root.querySelector("[data-question-sections]").innerHTML = question.sections.map(section => `<section class="learn-answer-section"><h2>${section.title}</h2><p>${section.body}</p></section>`).join("");
    const button = root.querySelector("[data-complete-question]");
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

  function renderPractice(data, progress) {
    const root = document.querySelector("[data-practice-page]");
    if (!root) return;
    const unanswered = data.questions.filter(question => !progress.completed.includes(question.slug));
    const pool = unanswered.length ? unanswered : data.questions;
    const question = pool[Math.floor(Math.random() * pool.length)];
    const link = root.querySelector("[data-practice-link]");
    link.href = questionHref(question.slug);
    root.querySelector("[data-practice-title]").textContent = question.title;
    root.querySelector("[data-practice-summary]").textContent = question.summary;
  }

  async function init() {
    fixLocalLinks();
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
})();
