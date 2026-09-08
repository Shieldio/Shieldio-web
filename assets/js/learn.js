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
    root.querySelector("[data-question-list]").innerHTML = questions.map(question => `
      <a class="learn-question-row" href="${questionHref(question.slug)}">
        <span class="learn-question-number">${question.number}</span>
        <span><b>${question.title}</b><small>${question.summary}</small></span>
        <span class="learn-question-state ${progress.completed.includes(question.slug) ? "is-done" : ""}">${progress.completed.includes(question.slug) ? "Hotovo" : (question.status === "outline" ? "Osnova" : "Otevřít")}</span>
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
    const footerNote = document.querySelector(".learn-footer span");
    if (footerNote) footerNote.textContent = "SPŠ Zlín · obor 26-41-M/01 Elektrotechnika · školní rok 2025/26";
    if (question.status === "outline") {
      root.querySelector("[data-question-summary]").insertAdjacentHTML("beforebegin", '<span class="learn-status-badge">Připravená osnova · obsah se doplňuje</span>');
    }
    const sectionRoot = root.querySelector("[data-question-sections]");
    if (question.template === "memory-lab") renderMemoryLab(sectionRoot, question);
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

  function renderMemoryLab(root, question) {
    root.innerHTML = `
      <section class="memory-levels" aria-label="Úroveň podpory">
        <button class="is-active" data-memory-level="L0">Potřebuji základy</button>
        <button data-memory-level="L2">Standard SPŠ</button>
        <button data-memory-level="L3">Maturitní režim</button>
        <button data-memory-level="L4">Do hloubky</button>
      </section>
      <section class="memory-hero-lab" aria-labelledby="memory-hierarchy-title">
        <div><span class="learn-eyebrow">Interaktivní model</span><h2 id="memory-hierarchy-title">Jak daleko jsou data od CPU?</h2><p data-hierarchy-copy>Registry drží právě zpracovávané hodnoty přímo v procesoru.</p></div>
        <input type="range" min="0" max="4" value="0" step="1" aria-label="Vrstva paměťové hierarchie" data-hierarchy>
        <div class="memory-hierarchy" data-hierarchy-items>
          <button class="is-active">Registry</button><button>Cache</button><button>RAM</button><button>SSD</button><button>HDD</button>
        </div>
        <div class="memory-meters"><span>Rychlost <b data-speed></b></span><span>Kapacita <b data-capacity></b></span><span>Trvalost <b data-persistence></b></span></div>
      </section>
      ${question.sections.map(section => `<section class="learn-answer-section memory-content" data-level="${section.level}"><span class="memory-level-tag">${section.level}</span><h2>${section.title}</h2><p>${section.body}</p></section>`).join("")}
      <section class="memory-lab-grid">
        <article class="memory-tool"><span class="learn-eyebrow">DRAM</span><h2>Co udělá refresh?</h2><div class="dram-cell"><span data-charge></span></div><p data-refresh-copy>Náboj reprezentuje uložený bit. Bez obnovování postupně klesá.</p><button class="memory-action" data-refresh>Spustit bez refreshe</button></article>
        <article class="memory-tool"><span class="learn-eyebrow">Adresování</span><h2>Kolik adres vytvoří n bitů?</h2><label>Počet adresních bitů <input type="number" min="1" max="32" value="8" data-address-bits></label><p class="memory-result"><strong data-address-result>256</strong> různých adres</p><p>Výpočet: 2<sup data-address-power>8</sup></p></article>
      </section>
      <section class="memory-tool"><span class="learn-eyebrow">Třídění pojmů</span><h2>Co je technologie, formát, rozhraní nebo protokol?</h2><div class="memory-classifier" data-classifier>${["M.2","NVMe","PCIe","SATA","NAND Flash","2,5 palce"].map(x => `<button data-term="${x}">${x}</button>`).join("")}</div><p class="memory-classifier-answer" data-classifier-answer>Vyber pojem a zkus ho nejdřív zařadit sám.</p></section>
      <section class="memory-tool"><span class="learn-eyebrow">Maturita nanečisto</span><h2>Osnova souvislé odpovědi</h2><ol class="memory-oral"><li>Definuj paměť a vysvětli důvod hierarchie.</li><li>Rozděl paměti podle volatility a principu záznamu.</li><li>Porovnej registry, cache, RAM a sekundární úložiště.</li><li>Vysvětli SRAM, DRAM, refresh, SDRAM a DDR.</li><li>Popiš ROM rodinu, Flash, HDD, SSD a optická média.</li><li>Odděl formát M.2, rozhraní PCIe/SATA a protokol NVMe.</li><li>Uzavři parametry, praktickou volbou a diagnostikou.</li></ol><details><summary>Kontrolní chytáky</summary><p>SSD není RAM. M.2 není synonymum NVMe. Firmware není automaticky „ROM“. USB označuje komunikaci, Flash technologii uložení. Vinyl není optické médium.</p></details></section>`;

    const hierarchy = [
      ["Registry drží právě zpracovávané hodnoty přímo v procesoru.",95,5,5],
      ["Cache zachytává pravděpodobně potřebná data blízko CPU.",82,15,5],
      ["RAM je pracovní prostor spuštěných programů; bez napájení data ztratí.",58,55,5],
      ["SSD uchovává soubory trvale v NAND Flash bez mechanických částí.",32,82,100],
      ["HDD nabízí velkou kapacitu, ale náhodný přístup zpomaluje mechanika.",18,95,100]
    ];
    const slider=root.querySelector("[data-hierarchy]");
    const updateHierarchy=()=>{ const i=Number(slider.value),v=hierarchy[i]; root.querySelector("[data-hierarchy-copy]").textContent=v[0]; root.querySelectorAll("[data-hierarchy-items] button").forEach((b,n)=>b.classList.toggle("is-active",n===i)); [["speed",v[1]],["capacity",v[2]],["persistence",v[3]]].forEach(([n,x])=>root.querySelector(`[data-${n}]`).style.width=x+"%"); };
    slider.addEventListener("input",updateHierarchy); root.querySelectorAll("[data-hierarchy-items] button").forEach((b,i)=>b.addEventListener("click",()=>{slider.value=i;updateHierarchy();})); updateHierarchy();
    root.querySelectorAll("[data-memory-level]").forEach(button=>button.addEventListener("click",()=>{ const level=button.dataset.memoryLevel; root.querySelectorAll("[data-memory-level]").forEach(b=>b.classList.toggle("is-active",b===button)); root.querySelectorAll("[data-level]").forEach(s=>s.hidden=level!=="L4" && Number(s.dataset.level.slice(1))>Number(level.slice(1))); }));
    const bits=root.querySelector("[data-address-bits]"); const updateAddress=()=>{const n=Math.max(1,Math.min(32,Number(bits.value)||1)); root.querySelector("[data-address-result]").textContent=(2**n).toLocaleString("cs-CZ"); root.querySelector("[data-address-power]").textContent=n;}; bits.addEventListener("input",updateAddress);
    root.querySelector("[data-refresh]").addEventListener("click",event=>{const charge=root.querySelector("[data-charge]"); charge.classList.toggle("is-draining"); event.currentTarget.textContent=charge.classList.contains("is-draining")?"Obnovit refresh":"Spustit bez refreshe"; root.querySelector("[data-refresh-copy]").textContent=charge.classList.contains("is-draining")?"Bez refreshe náboj klesá a reprezentovaný stav by se ztratil. Refresh neznamená načtení ze SSD.":"Refresh periodicky obnovuje náboj dřív, než se uložený stav ztratí.";});
    const classes={"M.2":"fyzický formát modulu a konektoru","NVMe":"komunikační protokol pro nevolatilní paměti","PCIe":"vysokorychlostní sériová sběrnice / rozhraní","SATA":"rozhraní pro HDD a SATA SSD","NAND Flash":"polovodičová technologie uchování dat","2,5 palce":"fyzický formát zařízení"}; root.querySelectorAll("[data-term]").forEach(b=>b.addEventListener("click",()=>{root.querySelector("[data-classifier-answer]").innerHTML=`<strong>${b.dataset.term}</strong> je ${classes[b.dataset.term]}.`; }));
    root.querySelector("[data-memory-level='L0']").click();
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
