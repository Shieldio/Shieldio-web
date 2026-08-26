// Shieldio — interactive step-by-step guide engine
// Generic — driven entirely by window.SHIELDIO_GUIDE data (see guide-data-*.js).
// A new guide = a new data file. This file should not need to change.
//
// i18n: guide-data text fields may be a plain string (Czech-only, legacy/not yet
// translated) or an { cs, en } object. t() resolves either against the shared
// site-wide language (same localStorage key + toggle as assets/js/lang.js).
// Fixed engine-authored UI strings (buttons, labels) live in the UI dict below.

(() => {
  const DATA = window.SHIELDIO_GUIDE;
  const root = document.getElementById("guide-app");
  if (!DATA || !root) return;

  const tier = DATA.meta.tier || "red";
  root.classList.add(`tier-${tier}`);

  // ---------- i18n ----------

  function currentUiLang() {
    try {
      return localStorage.getItem("shieldio-lang") === "en" ? "en" : "cs";
    } catch (e) {
      return "cs";
    }
  }

  function t(field) {
    if (field && typeof field === "object" && !Array.isArray(field) && ("cs" in field || "en" in field)) {
      return field[state.uiLang] || field.cs || field.en || "";
    }
    return field;
  }

  const UI = {
    back_to_guides: { cs: "Zpět na výběr návodu", en: "Back to guide picker" },
    step_back: { cs: "← Krok zpět", en: "← Previous step" },
    step_forward: { cs: "Krok vpřed →", en: "Next step →" },
    step_back_aria: { cs: "Krok zpět", en: "Previous step" },
    step_forward_aria: { cs: "Krok vpřed", en: "Next step" },
    step_of: { cs: (i, n) => `Krok ${i} z ${n}`, en: (i, n) => `Step ${i} of ${n}` },
    done_label: { cs: "Hotovo", en: "Done" },
    skill_label: { cs: "Umíš pájet?", en: "Can you solder?" },
    skill_beginner: { cs: "Neumím pájet", en: "I can't solder" },
    skill_experienced: { cs: "Umím pájet", en: "I can solder" },
    kit_label: { cs: "Tvoje sada", en: "Your kit" },
    kit_assembled: { cs: "Sestavená", en: "Assembled" },
    kit_unassembled: { cs: "Nesestavená (pájím)", en: "Unassembled (soldering)" },
    lang_label: { cs: "Programovací jazyk", en: "Programming language" },
    lang_blocks: { cs: "Bloky (mBlock)", en: "Blocks (mBlock)" },
    lang_arduino: { cs: "Arduino C", en: "Arduino C" },
    depth_label: { cs: "Úroveň návodu", en: "Guide detail" },
    depth_detailed: { cs: "Podrobně", en: "Detailed" },
    depth_fast: { cs: "Rychle", en: "Quick" },
    solder_title: { cs: "Tahle sada vyžaduje pájení.", en: "This kit needs soldering." },
    solder_p1: { cs: "Součástky ještě nejsou na desce připájené, uděláš to sám. Než začneš, projdi si základy.", en: "The parts aren't soldered onto the board yet, you'll do that yourself. Before you start, go over the basics." },
    solder_summary: { cs: "Co budeš potřebovat a jak na to", en: "What you'll need and how to do it" },
    solder_need: { cs: "<b>Potřebuješ:</b> pájku nebo pájecí stanici (kolem 350&nbsp;°C), cín s tavidlem, odsávačku nebo odpájecí knot pro opravy, malé kleště a ochranné brýle. Pracuj ve větrané místnosti.", en: "<b>You'll need:</b> a soldering iron or station (around 350&nbsp;°C), flux-core solder, a desoldering pump or wick for fixes, small cutters, and safety glasses. Work in a ventilated room." },
    solder_steps: { cs: "<b>Postup:</b> součástku zasuň do správných otvorů podle popisků přímo na desce, hrot pájky přilož zároveň k nožičce i plošce, po 1 až 2 vteřinách přidej cín, pájku odtáhni a spoj nech bez pohybu ztuhnout. Spoj má být lesklý, ne kulička nebo matný cín. Přebytečné nožičky nakonec odstřihni.", en: "<b>Steps:</b> insert the part into the right holes according to the labels on the board, touch the iron's tip to both the leg and the pad at once, add solder after 1–2 seconds, pull the iron away and let the joint set without moving. A good joint is shiny, not a blob or dull solder. Trim the excess legs afterward." },
    solder_safety: { cs: "<b>Bezpečnost:</b> hrot pájky má 300 až 400&nbsp;°C, nedotýkej se ho, pracuj na žáruvzdorné podložce a dým z tavidla nevdechuj.", en: "<b>Safety:</b> the iron's tip reaches 300–400&nbsp;°C, don't touch it, work on a heatproof mat, and don't breathe the flux smoke directly." },
    solder_open_guide: { cs: "Otevřít podrobný fotonávod na sestavení a pájení", en: "Open the detailed photo guide to assembly and soldering" },
    build_time: { cs: "Doba stavby", en: "Build time" },
    steps_label: { cs: "Kroky", en: "Steps" },
    what_you_learn: { cs: "Co se naučíš:", en: "What you'll learn:" },
    start_building: { cs: "Začít stavět", en: "Start building" },
    mark_missing: { cs: "Označ, co ti chybí:", en: "Mark what you're missing:" },
    have_it_ready: { cs: "Mám připraveno", en: "I have it ready" },
    something_missing: { cs: "Něco mi chybí", en: "Something's missing" },
    common_mistakes: { cs: "Nejčastější chyby", en: "Common mistakes" },
    tried_it: { cs: "Vyzkoušel jsem", en: "I tried it" },
    tried_done: { cs: "Zkusil jsem", en: "Tried it" },
    more_help: { cs: "Další pomoc", en: "More help" },
    merged_step_title: { cs: "Sestav podle obrázku", en: "Assemble it as shown in the photo" },
    why_like_this: { cs: "Proč to tak je", en: "Why it's like this" },
    connected_default: { cs: "Zapojeno", en: "Connected" },
    not_working: { cs: "Nedaří se mi", en: "It's not working" },
    program_uploaded: { cs: "Program je nahraný", en: "The program uploaded" },
    shows_error: { cs: "Hlásí chybu", en: "It shows an error" },
    tree_yes: { cs: "ANO", en: "YES" },
    tree_no: { cs: "NE", en: "NO" },
    tree_retry: { cs: "Zkus to znovu podle kroků výše.", en: "Try again following the steps above." },
    tree_done: { cs: "Hotovo", en: "Done" },
    tree_need_help: { cs: "Potřebuji pomoc", en: "I need help" },
    first_mblock: { cs: "Poprvé v mBlocku? Přečti si návod, jak ho otevřít a používat", en: "First time in mBlock? Read the guide on how to open and use it" },
    open_blocks_editor: { cs: "Otevřít v blokovém editoru", en: "Open in the block editor" },
    open_project: { cs: "Otevřít projekt", en: "Open project" },
    arduino_code_soon: { cs: "Ukázkový Arduino kód pro tento projekt zatím připravujeme. Než bude hotový, doporučujeme začít s blokovým programováním v mBlocku.", en: "We're still preparing sample Arduino code for this project. Until it's ready, we recommend starting with block programming in mBlock." },
    done_result_alt: { cs: "Hotový výsledek", en: "Finished result" },
    done_title: { cs: "Projekt je hotový.", en: "The project is done." },
    done_learned: { cs: "Dnes ses naučil:", en: "Today you learned:" },
    whats_next: { cs: "Co dál?", en: "What's next?" },
    try_different: { cs: "Zkus jinak", en: "Try it differently" },
    more_projects: { cs: "Další projekt", en: "More projects" },
    level_up: { cs: "Posuň se dál", en: "Level up" },
    show_off_h3: { cs: "Chceš se pochlubit, co jsi postavil?", en: "Want to show off what you built?" },
    show_off_p: { cs: "Komunitní galerii teprve připravujeme, zatím nám klidně napiš, rádi se podíváme.", en: "We're still building the community gallery, feel free to write to us in the meantime, we'd love to see it." },
    restart: { cs: "Spustit znovu", en: "Start over" },
    find_out_more: { cs: "Zjistit více", en: "Find out more" },
    datasheet: { cs: "Datasheet", en: "Datasheet" },
    part_what: { cs: "Co to je:", en: "What it is:" },
    part_how: { cs: "Jak to funguje:", en: "How it works:" },
    modal_close: { cs: "Zavřít", en: "Close" },
    unknown_step: { cs: "Neznámý typ kroku.", en: "Unknown step type." },
  };

  function ui(key, ...args) {
    const entry = UI[key];
    if (!entry) return key;
    const val = entry[state.uiLang] || entry.cs;
    return typeof val === "function" ? val(...args) : val;
  }

  // persistent link back to the guide picker — lives outside the re-rendered
  // #guide-progress/#guide-steps area, so it survives every renderCurrent() call
  let backLinkEl = null;
  function renderBackLink() {
    if (!DATA.meta.parentHref) return;
    const wrap = root.querySelector(".wrap");
    if (!wrap) return;
    if (!backLinkEl) {
      backLinkEl = document.createElement("a");
      backLinkEl.className = "guide-back-link";
      backLinkEl.href = DATA.meta.parentHref;
      wrap.insertBefore(backLinkEl, wrap.firstChild);
    }
    backLinkEl.textContent = "← " + (DATA.meta.parentLabel ? t(DATA.meta.parentLabel) : ui("back_to_guides"));
  }

  const STORAGE_KEY = `shieldio-guide-${DATA.id}`;
  const DEFAULT_MODE = { lang: "blocks", depth: "detailed", kit: "assembled", skill: "beginner" };
  const supportsKit = tier === "red" && DATA.id !== "sestaveni-red";
  const supportsSkill = !!(DATA.meta && DATA.meta.skillCheck);

  const state = loadState();
  state.uiLang = currentUiLang();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { started: false, stepIndex: 0, missingParts: [], ...parsed, mode: { ...DEFAULT_MODE, ...(parsed.mode || {}) } };
      }
    } catch (e) { /* ignore corrupt storage */ }
    const kitParam = new URLSearchParams(window.location.search).get("kit");
    const initialMode = { ...DEFAULT_MODE };
    if (kitParam === "assembled" || kitParam === "unassembled") initialMode.kit = kitParam;
    return { started: false, stepIndex: 0, missingParts: [], mode: initialMode };
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function partById(id) { return DATA.parts.find(p => p.id === id); }

  // ---------- mode (programming language / guide depth) ----------

  function stepHasArduino(step) { return step.type === "upload" && step.arduino; }
  const supportsLang = DATA.steps.some(stepHasArduino);

  function findWiringGroups(steps) {
    const groups = [];
    let i = 0;
    while (i < steps.length) {
      if (steps[i].type === "wiring") {
        let j = i;
        while (j < steps.length && steps[j].type === "wiring") j++;
        if (j - i > 1) groups.push([i, j]);
        i = j;
      } else {
        i++;
      }
    }
    return groups;
  }
  // a step tagged with `kit: "assembled"` or `kit: "unassembled"` only shows up
  // for that kit selection; steps without a kit tag always show (backward compatible)
  function kitFilteredSteps() {
    if (!supportsKit) return DATA.steps;
    return DATA.steps.filter(s => !s.kit || s.kit === state.mode.kit);
  }
  const supportsDepth = ["assembled", "unassembled"].some(kit =>
    findWiringGroups(DATA.steps.filter(s => !s.kit || s.kit === kit)).length > 0
  );

  function mergeWiringSteps(group) {
    const items = group.flatMap(s => (s.troubleshoot ? s.troubleshoot.items : []));
    return {
      id: "merged-" + group.map(s => s.id).join("-"),
      title: ui("merged_step_title"),
      type: "wiring",
      photo: (group.find(s => s.photo) || {}).photo || null,
      instructions: group.map(s => t(s.instructions)).join("<br><br>"),
      troubleshoot: items.length ? { title: ui("common_mistakes"), items } : null,
    };
  }

  function getSteps() {
    const base = kitFilteredSteps();
    if (state.mode.depth !== "fast" || !supportsDepth) return base;
    const groups = findWiringGroups(base);
    const result = [];
    let i = 0;
    while (i < base.length) {
      const group = groups.find(([s]) => s === i);
      if (group) {
        result.push(mergeWiringSteps(base.slice(group[0], group[1])));
        i = group[1];
      } else {
        result.push(base[i]);
        i++;
      }
    }
    return result;
  }

  function totalSteps() { return getSteps().length; }

  function escapeHtml(str) {
    return String(str).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  // ---------- markup helpers ----------

  function photoOrPlaceholder(src, label) {
    if (src) return `<img src="${src}" alt="${label}">`;
    return `<div class="founder-photo-placeholder">FOTO<br>${label.toUpperCase()}</div>`;
  }

  function renderProgress() {
    const total = totalSteps();
    const pct = total ? Math.round((state.stepIndex / total) * 100) : 0;
    const canGoBack = state.stepIndex > 0;
    const canGoForward = state.stepIndex < total;
    return `
      <div class="guide-progress-row">
        <button type="button" class="guide-progress-nav" data-action="back" ${canGoBack ? "" : "disabled"} aria-label="${ui("step_back_aria")}">${ui("step_back")}</button>
        <div class="guide-progress-label">${state.stepIndex >= total ? ui("done_label") : ui("step_of", state.stepIndex + 1, total)}</div>
        <button type="button" class="guide-progress-nav" data-action="forward" ${canGoForward ? "" : "disabled"} aria-label="${ui("step_forward_aria")}">${ui("step_forward")}</button>
      </div>
      <div class="guide-progress-track"><div class="guide-progress-fill" style="width:${Math.min(pct, 100)}%"></div></div>
    `;
  }

  // ---------- intro ----------

  function renderModePicker() {
    return `
      <div class="guide-mode-picker">
        ${supportsSkill ? `
        <div class="guide-mode-group">
          <span class="guide-mode-label">${ui("skill_label")}</span>
          <div class="guide-mode-toggle" data-mode-group="skill">
            <button type="button" class="guide-mode-btn ${state.mode.skill === "beginner" ? "active" : ""}" data-mode-value="beginner">${ui("skill_beginner")}</button>
            <button type="button" class="guide-mode-btn ${state.mode.skill === "experienced" ? "active" : ""}" data-mode-value="experienced">${ui("skill_experienced")}</button>
          </div>
        </div>` : ""}
        ${supportsKit ? `
        <div class="guide-mode-group">
          <span class="guide-mode-label">${ui("kit_label")}</span>
          <div class="guide-mode-toggle" data-mode-group="kit">
            <button type="button" class="guide-mode-btn ${state.mode.kit === "assembled" ? "active" : ""}" data-mode-value="assembled">${ui("kit_assembled")}</button>
            <button type="button" class="guide-mode-btn ${state.mode.kit === "unassembled" ? "active" : ""}" data-mode-value="unassembled">${ui("kit_unassembled")}</button>
          </div>
        </div>` : ""}
        ${supportsLang ? `
        <div class="guide-mode-group">
          <span class="guide-mode-label">${ui("lang_label")}</span>
          <div class="guide-mode-toggle" data-mode-group="lang">
            <button type="button" class="guide-mode-btn ${state.mode.lang === "blocks" ? "active" : ""}" data-mode-value="blocks">${ui("lang_blocks")}</button>
            <button type="button" class="guide-mode-btn ${state.mode.lang === "arduino" ? "active" : ""}" data-mode-value="arduino">${ui("lang_arduino")}</button>
          </div>
        </div>` : ""}
        ${supportsDepth ? `
        <div class="guide-mode-group">
          <span class="guide-mode-label">${ui("depth_label")}</span>
          <div class="guide-mode-toggle" data-mode-group="depth">
            <button type="button" class="guide-mode-btn ${state.mode.depth === "detailed" ? "active" : ""}" data-mode-value="detailed">${ui("depth_detailed")}</button>
            <button type="button" class="guide-mode-btn ${state.mode.depth === "fast" ? "active" : ""}" data-mode-value="fast">${ui("depth_fast")}</button>
          </div>
        </div>` : ""}
      </div>
    `;
  }

  function wireModePicker(container) {
    container.querySelectorAll(".guide-mode-toggle").forEach(toggle => {
      const group = toggle.dataset.modeGroup;
      toggle.querySelectorAll(".guide-mode-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          state.mode[group] = btn.dataset.modeValue;
          saveState();
          renderCurrent();
        });
      });
    });
  }

  function renderSolderWarning() {
    return `
      <div class="guide-solder-warning">
        <p><b>${ui("solder_title")}</b> ${ui("solder_p1")}</p>
        <details class="guide-accordion">
          <summary>${ui("solder_summary")}</summary>
          <p>${ui("solder_need")}</p>
          <p>${ui("solder_steps")}</p>
          <p>${ui("solder_safety")}</p>
        </details>
        <a class="btn btn-ghost" style="margin-top:14px;" href="../sestaveni/index.html">${ui("solder_open_guide")}</a>
      </div>
    `;
  }

  function renderIntro() {
    const m = DATA.meta;
    return `
      <div class="guide-card guide-intro fade-up visible">
        <div class="guide-intro-photo">${photoOrPlaceholder(m.image, t(m.title))}</div>
        <div class="guide-intro-body">
          <span class="eyebrow" style="color:var(--tier-${tier}-deep); border-color:var(--tier-${tier});">${t(m.difficulty)}</span>
          <h1>${t(m.title)}</h1>
          <div class="guide-meta-row">
            <div class="stat"><b>${t(m.duration)}</b><span>${ui("build_time")}</span></div>
            <div class="stat"><b>${totalSteps()}</b><span>${ui("steps_label")}</span></div>
          </div>
          <p class="lead" style="font-size:16px;">${ui("what_you_learn")}</p>
          <ul class="guide-learn-list">${m.learn.map(l => `<li>${t(l)}</li>`).join("")}</ul>
          ${(supportsLang || supportsDepth || supportsKit || supportsSkill) ? renderModePicker() : ""}
          ${(supportsKit && state.mode.kit === "unassembled") ? renderSolderWarning() : ""}
          <button type="button" class="btn btn-primary" data-action="start">${ui("start_building")}</button>
        </div>
      </div>
    `;
  }

  // ---------- parts-check step ----------

  function renderPartsCheck(step) {
    const parts = step.parts.map(partById).filter(Boolean);
    const cards = parts.map(p => `
      <div class="guide-part-card">
        <div class="guide-part-photo">${photoOrPlaceholder(p.photo, t(p.name))}</div>
        <div class="guide-part-name">${t(p.name)}
          <button type="button" class="guide-info-btn" data-part="${p.id}" aria-label="${t(p.name)}">?</button>
        </div>
      </div>
    `).join("");

    return `
      <div class="guide-parts-grid">${cards}</div>
      <div class="guide-missing-panel" hidden>
        <p><b>${ui("mark_missing")}</b></p>
        <div class="guide-missing-list">
          ${parts.map(p => `<label class="guide-missing-item"><input type="checkbox" value="${p.id}"> ${t(p.name)}</label>`).join("")}
        </div>
      </div>
      <div class="guide-step-actions">
        <button type="button" class="btn btn-primary" data-action="ok">${ui("have_it_ready")}</button>
        <button type="button" class="btn btn-ghost" data-action="missing">${ui("something_missing")}</button>
      </div>
    `;
  }

  function wirePartsCheck(container, step) {
    container.querySelectorAll(".guide-info-btn").forEach(btn => {
      btn.addEventListener("click", () => openPartModal(partById(btn.dataset.part)));
    });
    const missingBtn = container.querySelector('[data-action="missing"]');
    const missingPanel = container.querySelector(".guide-missing-panel");
    missingBtn.addEventListener("click", () => {
      missingPanel.hidden = !missingPanel.hidden;
    });
    container.querySelector('[data-action="ok"]').addEventListener("click", () => advance());
  }

  // ---------- wiring step ----------

  function renderTroubleshoot(troubleshoot) {
    const items = troubleshoot.items.slice(0, 3).map((t2, i) => `
      <div class="guide-tip" data-tip="${i}">
        <p>${t(t2)}</p>
        <button type="button" class="btn btn-ghost guide-tip-tried" data-tip-btn="${i}">${ui("tried_it")}</button>
      </div>
    `).join("");
    return `
      <details class="guide-accordion">
        <summary>${t(troubleshoot.title) || ui("common_mistakes")}</summary>
        <div class="guide-tip-list">${items}</div>
        <a class="guide-more-help" href="../../../../index.html#kontakt">${ui("more_help")}</a>
      </details>
    `;
  }

  function renderWiring(step) {
    const warning = step.warning ? `<div class="guide-step-warning"><p>${t(step.warning)}</p></div>` : "";
    const theory = step.theory ? `
      <details class="guide-accordion" ${state.mode.skill === "beginner" ? "open" : ""}>
        <summary>${ui("why_like_this")}</summary>
        ${t(step.theory)}
      </details>` : "";
    return `
      <div class="guide-wiring-media">${photoOrPlaceholder(step.photo, t(step.title).replace(/<[^>]+>/g, ""))}</div>
      <p class="guide-instructions">${t(step.instructions)}</p>
      ${warning}
      ${theory}
      <div class="guide-help-slot"></div>
      <div class="guide-step-actions">
        <button type="button" class="btn btn-primary" data-action="ok">${step.actionLabel ? t(step.actionLabel) : ui("connected_default")}</button>
        <button type="button" class="btn btn-ghost" data-action="fail">${ui("not_working")}</button>
      </div>
    `;
  }

  function wireWiring(container, step) {
    container.querySelector('[data-action="ok"]').addEventListener("click", () => advance());
    container.querySelector('[data-action="fail"]').addEventListener("click", () => {
      const slot = container.querySelector(".guide-help-slot");
      if (!slot.dataset.filled) {
        slot.innerHTML = renderTroubleshoot(step.troubleshoot);
        slot.dataset.filled = "1";
        slot.querySelectorAll(".guide-tip-tried").forEach(btn => {
          btn.addEventListener("click", () => {
            btn.closest(".guide-tip").classList.add("guide-tip-done");
            btn.textContent = ui("tried_done");
            btn.disabled = true;
          });
        });
      }
    });
  }

  // ---------- upload step ----------

  function renderUpload(step) {
    const useArduino = state.mode.lang === "arduino" && step.arduino;
    const content = useArduino ? step.arduino : step;

    const diag = (content.diagnostics || []).map((d, i) => `
      <details class="guide-accordion">
        <summary>${t(d.title)}</summary>
        <div class="guide-tip-list">
          ${d.items.slice(0, 3).map((it, j) => `
            <div class="guide-tip">
              <p>${t(it)}</p>
            </div>
          `).join("")}
        </div>
        <a class="guide-more-help" href="../../../../index.html#kontakt">${ui("more_help")}</a>
      </details>
    `).join("");

    const actionArea = useArduino
      ? (content.code
          ? `<pre class="guide-code-block"><code>${escapeHtml(content.code)}</code></pre>`
          : `<p class="guide-instructions">${content.note ? t(content.note) : ui("arduino_code_soon")}</p>`)
      : (content.blocksEditorHref
          ? `<a class="btn btn-primary" href="${content.blocksEditorHref}">${ui("open_blocks_editor")}</a>`
          : `<a class="btn btn-primary" href="https://mblock.cc" target="_blank" rel="noopener">${ui("open_project")}</a>`);

    const mblockHelp = (!useArduino && DATA.meta.mblockGuideHref)
      ? `<p style="margin-top:12px;"><a class="learn-theory-link" href="${DATA.meta.mblockGuideHref}">${ui("first_mblock")}</a>.</p>`
      : "";

    return `
      <div class="guide-wiring-media">${photoOrPlaceholder(content.screenshot, useArduino ? "Arduino IDE" : "mBlock")}</div>
      ${actionArea}
      ${mblockHelp}
      <div class="guide-step-actions" style="margin-top:24px;">
        <button type="button" class="btn btn-primary" data-action="ok">${ui("program_uploaded")}</button>
        <button type="button" class="btn btn-ghost" data-action="fail">${ui("shows_error")}</button>
      </div>
      <div class="guide-help-slot" data-content="${encodeURIComponent(diag)}"></div>
    `;
  }

  function wireUpload(container) {
    container.querySelector('[data-action="ok"]').addEventListener("click", () => advance());
    container.querySelector('[data-action="fail"]').addEventListener("click", () => {
      const slot = container.querySelector(".guide-help-slot");
      if (!slot.dataset.filled) {
        slot.innerHTML = decodeURIComponent(slot.dataset.content);
        slot.dataset.filled = "1";
      }
    });
  }

  // ---------- diagnostic tree step ----------

  function isTreeLeaf(node) {
    return typeof node === "string" || !node || typeof node !== "object" || node.question === undefined;
  }

  function renderTreeNode(node) {
    if (isTreeLeaf(node)) {
      return `<div class="guide-tree-result"><p>${t(node)}</p></div>`;
    }
    return `
      <div class="guide-tree-node">
        <p class="guide-tree-question">${t(node.question)}</p>
        <div class="guide-step-actions">
          <button type="button" class="btn btn-primary guide-tree-yes">${ui("tree_yes")}</button>
          <button type="button" class="btn btn-ghost guide-tree-no">${ui("tree_no")}</button>
        </div>
      </div>
    `;
  }

  function renderDiagnosticTree(step) {
    return `
      <p class="guide-instructions">${t(step.instructions)}</p>
      <div class="guide-step-actions" data-role="root-actions">
        <button type="button" class="btn btn-primary" data-action="ok">${ui("tree_done")}</button>
        <button type="button" class="btn btn-ghost" data-action="fail">${ui("tree_need_help")}</button>
      </div>
      <div class="guide-tree-slot"></div>
    `;
  }

  function wireDiagnosticTree(container, step) {
    container.querySelector('[data-action="ok"]').addEventListener("click", () => advance());
    container.querySelector('[data-action="fail"]').addEventListener("click", () => {
      container.querySelector('[data-role="root-actions"]').hidden = true;
      const slot = container.querySelector(".guide-tree-slot");
      renderTreeStep(slot, step.tree);
    });
  }

  function renderTreeStep(slot, node) {
    slot.innerHTML = renderTreeNode(node);
    if (isTreeLeaf(node)) return;
    slot.querySelector(".guide-tree-yes").addEventListener("click", () => {
      const next = node.yes !== undefined ? node.yes : (node.yesResult !== undefined ? node.yesResult : ui("tree_retry"));
      renderTreeStep(slot, next);
    });
    slot.querySelector(".guide-tree-no").addEventListener("click", () => {
      const next = node.no !== undefined ? node.no : (node.noResult !== undefined ? node.noResult : ui("tree_retry"));
      renderTreeStep(slot, next);
    });
  }

  // ---------- step dispatch ----------

  const RENDERERS = {
    "parts-check": { render: renderPartsCheck, wire: wirePartsCheck },
    "wiring": { render: renderWiring, wire: wireWiring },
    "upload": { render: renderUpload, wire: wireUpload },
    "diagnostic-tree": { render: renderDiagnosticTree, wire: wireDiagnosticTree },
  };

  function renderStep(step) {
    const r = RENDERERS[step.type];
    const card = document.createElement("div");
    card.className = "guide-card fade-up visible";
    card.innerHTML = `<h2 class="guide-step-title">${t(step.title)}</h2>` + (r ? r.render(step) : `<p>${ui("unknown_step")}</p>`);
    if (r) r.wire(card, step);
    card.querySelectorAll(".term").forEach(el => {
      el.addEventListener("click", () => openTermModal(el.dataset.term));
    });
    return card;
  }

  // ---------- completion ----------

  function renderDone() {
    const next = DATA.next || {};
    const tryDifferent = next.tryDifferent || [];
    const moreProjects = next.moreProjects || [];
    const levelUp = next.levelUp || null;
    const hasNext = tryDifferent.length || moreProjects.length || levelUp;

    return `
      <div class="guide-done-wrap">
        <div class="guide-card guide-done fade-up visible">
          ${DATA.meta.doneImage ? `<div class="guide-done-photo"><img src="${DATA.meta.doneImage}" alt="${ui("done_result_alt")}"></div>` : ""}
          ${DATA.meta.doneVideo ? `<div class="guide-done-photo"><video src="${DATA.meta.doneVideo}" poster="${DATA.meta.doneVideoPoster || ""}" muted loop playsinline autoplay controls preload="metadata"></video></div>` : ""}
          <div class="guide-done-check">✓</div>
          <h1>${ui("done_title")}</h1>
          <p class="lead">${ui("done_learned")}</p>
          <ul class="guide-learn-list guide-learn-list-done">
            ${DATA.meta.learn.map(l => `<li>${t(l)}</li>`).join("")}
          </ul>
        </div>

        ${hasNext ? `
        <div class="guide-card guide-next fade-up visible">
          <h2 class="guide-step-title">${ui("whats_next")}</h2>
          <div class="guide-next-grid">
            ${tryDifferent.length ? `
            <div class="guide-next-col">
              <h3>${ui("try_different")}</h3>
              <ul class="guide-next-list">${tryDifferent.map(x => `<li>${t(x.text)}</li>`).join("")}</ul>
            </div>` : ""}
            ${moreProjects.length ? `
            <div class="guide-next-col">
              <h3>${ui("more_projects")}</h3>
              <ul class="guide-next-list guide-next-links">${moreProjects.map(p => `<li><a href="${p.href}">${t(p.title)}</a></li>`).join("")}</ul>
            </div>` : ""}
            ${levelUp ? `
            <div class="guide-next-col">
              <h3>${ui("level_up")}</h3>
              <p>${t(levelUp.text)}</p>
              <a class="guide-more-help" href="${levelUp.href}">${t(levelUp.title)}</a>
            </div>` : ""}
          </div>
        </div>` : ""}

        <div class="guide-card guide-community fade-up visible">
          <h3>${ui("show_off_h3")}</h3>
          <p>${ui("show_off_p")}</p>
        </div>

        <div class="guide-step-actions" style="justify-content:center;">
          <button type="button" class="btn btn-ghost" data-action="reset">${ui("restart")}</button>
        </div>
      </div>
    `;
  }

  function wireDone(container) {
    container.querySelector('[data-action="reset"]').addEventListener("click", resetGuide);
  }

  function resetGuide() {
    state.started = false;
    state.stepIndex = 0;
    state.missingParts = [];
    saveState();
    renderCurrent();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- modals ----------

  function openModal(html) {
    let overlay = document.getElementById("guide-modal-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "guide-modal-overlay";
      overlay.className = "modal-overlay";
      overlay.innerHTML = `<div class="modal-card" id="guide-modal-card"></div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
      });
    }
    document.getElementById("guide-modal-card").innerHTML = `<button type="button" class="modal-close" aria-label="${ui("modal_close")}">&times;</button>${html}`;
    overlay.querySelector(".modal-close").addEventListener("click", closeModal);
    overlay.classList.add("active");
  }

  function closeModal() {
    const overlay = document.getElementById("guide-modal-overlay");
    if (overlay) overlay.classList.remove("active");
  }

  function openTermModal(termKey) {
    const g = DATA.glossary[termKey];
    if (!g) return;
    openModal(`
      <div class="term-modal-photo">${photoOrPlaceholder(g.photo, t(g.term))}</div>
      <h3>${t(g.term)}</h3>
      <p>${t(g.text)}</p>
      ${g.fact ? `<p class="term-modal-fact">${t(g.fact)}</p>` : ""}
      ${g.datasheet ? `<a href="${g.datasheet}" target="_blank" rel="noopener">${ui("find_out_more")}</a>` : ""}
    `);
  }

  function openPartModal(part) {
    if (!part) return;
    openModal(`
      <div class="term-modal-photo">${photoOrPlaceholder(part.photo, t(part.name))}</div>
      <h3>${t(part.name)}</h3>
      <p><b>${ui("part_what")}</b> ${t(part.what)}</p>
      <p><b>${ui("part_how")}</b> ${t(part.how)}</p>
      ${part.fact ? `<p class="term-modal-fact">${t(part.fact)}</p>` : ""}
      ${part.datasheet ? `<a href="${part.datasheet}" target="_blank" rel="noopener">${ui("datasheet")}</a>` : ""}
    `);
  }

  // ---------- flow control ----------

  function advance() {
    state.stepIndex = Math.min(state.stepIndex + 1, totalSteps());
    saveState();
    renderCurrent();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goBack() {
    if (state.stepIndex <= 0) return;
    state.stepIndex -= 1;
    saveState();
    renderCurrent();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderCurrent() {
    renderBackLink();
    const stepsEl = document.getElementById("guide-steps");
    const progressEl = document.getElementById("guide-progress");
    stepsEl.innerHTML = "";

    if (!state.started) {
      progressEl.style.display = "none";
      const introEl = wrap(renderIntro());
      stepsEl.appendChild(introEl);
      wireModePicker(introEl);
      introEl.querySelector('[data-action="start"]').addEventListener("click", () => {
        state.started = true;
        saveState();
        renderCurrent();
      });
      return;
    }

    progressEl.style.display = "";
    progressEl.innerHTML = renderProgress();
    const backBtn = progressEl.querySelector('[data-action="back"]');
    const forwardBtn = progressEl.querySelector('[data-action="forward"]');
    if (backBtn) backBtn.addEventListener("click", goBack);
    if (forwardBtn) forwardBtn.addEventListener("click", advance);

    if (state.stepIndex >= totalSteps()) {
      const doneEl = wrap(renderDone());
      stepsEl.appendChild(doneEl);
      wireDone(doneEl);
      return;
    }

    stepsEl.appendChild(renderStep(getSteps()[state.stepIndex]));
  }

  function wrap(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.firstElementChild;
  }

  document.addEventListener("shieldio-lang-change", (e) => {
    state.uiLang = e.detail && e.detail.lang === "en" ? "en" : "cs";
    renderCurrent();
  });

  renderCurrent();
})();
