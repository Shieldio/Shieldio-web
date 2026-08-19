// Shieldio — interactive step-by-step guide engine
// Generic — driven entirely by window.SHIELDIO_GUIDE data (see guide-data-*.js).
// A new guide = a new data file. This file should not need to change.

(() => {
  const DATA = window.SHIELDIO_GUIDE;
  const root = document.getElementById("guide-app");
  if (!DATA || !root) return;

  const tier = DATA.meta.tier || "red";
  root.classList.add(`tier-${tier}`);

  const STORAGE_KEY = `shieldio-guide-${DATA.id}`;
  const DEFAULT_MODE = { lang: "blocks", depth: "detailed", kit: "assembled" };
  const supportsKit = tier === "red";

  const state = loadState();

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

  function findWiringGroups() {
    const groups = [];
    let i = 0;
    while (i < DATA.steps.length) {
      if (DATA.steps[i].type === "wiring") {
        let j = i;
        while (j < DATA.steps.length && DATA.steps[j].type === "wiring") j++;
        if (j - i > 1) groups.push([i, j]);
        i = j;
      } else {
        i++;
      }
    }
    return groups;
  }
  const wiringGroups = findWiringGroups();
  const supportsDepth = wiringGroups.length > 0;

  function mergeWiringSteps(group) {
    const items = group.flatMap(s => (s.troubleshoot ? s.troubleshoot.items : []));
    return {
      id: "merged-" + group.map(s => s.id).join("-"),
      title: "Sestav podle obrázku",
      type: "wiring",
      photo: (group.find(s => s.photo) || {}).photo || null,
      instructions: group.map(s => s.instructions).join("<br><br>"),
      troubleshoot: items.length ? { title: "Nejčastější chyby", items } : null,
    };
  }

  function getSteps() {
    if (state.mode.depth !== "fast" || !supportsDepth) return DATA.steps;
    const result = [];
    let i = 0;
    while (i < DATA.steps.length) {
      const group = wiringGroups.find(([s]) => s === i);
      if (group) {
        result.push(mergeWiringSteps(DATA.steps.slice(group[0], group[1])));
        i = group[1];
      } else {
        result.push(DATA.steps[i]);
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
    return `
      <div class="guide-progress-label">${state.stepIndex >= total ? "Hotovo" : `Krok ${state.stepIndex + 1} z ${total}`}</div>
      <div class="guide-progress-track"><div class="guide-progress-fill" style="width:${Math.min(pct, 100)}%"></div></div>
    `;
  }

  // ---------- intro ----------

  function renderModePicker() {
    return `
      <div class="guide-mode-picker">
        ${supportsKit ? `
        <div class="guide-mode-group">
          <span class="guide-mode-label">Tvoje sada</span>
          <div class="guide-mode-toggle" data-mode-group="kit">
            <button type="button" class="guide-mode-btn ${state.mode.kit === "assembled" ? "active" : ""}" data-mode-value="assembled">Sestavená</button>
            <button type="button" class="guide-mode-btn ${state.mode.kit === "unassembled" ? "active" : ""}" data-mode-value="unassembled">Nesestavená (pájím)</button>
          </div>
        </div>` : ""}
        ${supportsLang ? `
        <div class="guide-mode-group">
          <span class="guide-mode-label">Programovací jazyk</span>
          <div class="guide-mode-toggle" data-mode-group="lang">
            <button type="button" class="guide-mode-btn ${state.mode.lang === "blocks" ? "active" : ""}" data-mode-value="blocks">Bloky (mBlock)</button>
            <button type="button" class="guide-mode-btn ${state.mode.lang === "arduino" ? "active" : ""}" data-mode-value="arduino">Arduino C</button>
          </div>
        </div>` : ""}
        ${supportsDepth ? `
        <div class="guide-mode-group">
          <span class="guide-mode-label">Úroveň návodu</span>
          <div class="guide-mode-toggle" data-mode-group="depth">
            <button type="button" class="guide-mode-btn ${state.mode.depth === "detailed" ? "active" : ""}" data-mode-value="detailed">Podrobně</button>
            <button type="button" class="guide-mode-btn ${state.mode.depth === "fast" ? "active" : ""}" data-mode-value="fast">Rychle</button>
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
        <p><b>Tahle sada vyžaduje pájení.</b> Součástky ještě nejsou na desce připájené, uděláš to sám. Než začneš, projdi si základy.</p>
        <details class="guide-accordion">
          <summary>Co budeš potřebovat a jak na to</summary>
          <p><b>Potřebuješ:</b> pájku nebo pájecí stanici (kolem 350&nbsp;°C), cín s tavidlem, odsávačku nebo odpájecí knot pro opravy, malé kleště a ochranné brýle. Pracuj ve větrané místnosti.</p>
          <p><b>Postup:</b> součástku zasuň do správných otvorů podle popisků přímo na desce, hrot pájky přilož zároveň k nožičce i plošce, po 1 až 2 vteřinách přidej cín, pájku odtáhni a spoj nech bez pohybu ztuhnout. Spoj má být lesklý, ne kulička nebo matný cín. Přebytečné nožičky nakonec odstřihni.</p>
          <p><b>Bezpečnost:</b> hrot pájky má 300 až 400&nbsp;°C, nedotýkej se ho, pracuj na žáruvzdorné podložce a dým z tavidla nevdechuj.</p>
        </details>
      </div>
    `;
  }

  function renderIntro() {
    const m = DATA.meta;
    return `
      <div class="guide-card guide-intro fade-up visible">
        <div class="guide-intro-photo">${photoOrPlaceholder(m.image, m.title)}</div>
        <div class="guide-intro-body">
          <span class="eyebrow" style="color:var(--tier-${tier}-deep); border-color:var(--tier-${tier});">${m.difficulty}</span>
          <h1>${m.title}</h1>
          <div class="guide-meta-row">
            <div class="stat"><b>${m.duration}</b><span>Doba stavby</span></div>
            <div class="stat"><b>${totalSteps()}</b><span>Kroky</span></div>
          </div>
          <p class="lead" style="font-size:16px;">Co se naučíš:</p>
          <ul class="guide-learn-list">${m.learn.map(l => `<li>${l}</li>`).join("")}</ul>
          ${(supportsLang || supportsDepth || supportsKit) ? renderModePicker() : ""}
          ${(supportsKit && state.mode.kit === "unassembled") ? renderSolderWarning() : ""}
          <button type="button" class="btn btn-primary" data-action="start">Začít stavět</button>
        </div>
      </div>
    `;
  }

  // ---------- parts-check step ----------

  function renderPartsCheck(step) {
    const parts = step.parts.map(partById).filter(Boolean);
    const cards = parts.map(p => `
      <div class="guide-part-card">
        <div class="guide-part-photo">${photoOrPlaceholder(p.photo, p.name)}</div>
        <div class="guide-part-name">${p.name}
          <button type="button" class="guide-info-btn" data-part="${p.id}" aria-label="Více o součástce ${p.name}">?</button>
        </div>
      </div>
    `).join("");

    return `
      <div class="guide-parts-grid">${cards}</div>
      <div class="guide-missing-panel" hidden>
        <p><b>Označ, co ti chybí:</b></p>
        <div class="guide-missing-list">
          ${parts.map(p => `<label class="guide-missing-item"><input type="checkbox" value="${p.id}"> ${p.name}</label>`).join("")}
        </div>
      </div>
      <div class="guide-step-actions">
        <button type="button" class="btn btn-primary" data-action="ok">Mám připraveno</button>
        <button type="button" class="btn btn-ghost" data-action="missing">Něco mi chybí</button>
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
    const items = troubleshoot.items.slice(0, 3).map((t, i) => `
      <div class="guide-tip" data-tip="${i}">
        <p>${t}</p>
        <button type="button" class="btn btn-ghost guide-tip-tried" data-tip-btn="${i}">Vyzkoušel jsem</button>
      </div>
    `).join("");
    return `
      <details class="guide-accordion">
        <summary>${troubleshoot.title}</summary>
        <div class="guide-tip-list">${items}</div>
        <a class="guide-more-help" href="../../../../index.html#kontakt">Další pomoc</a>
      </details>
    `;
  }

  function renderWiring(step) {
    return `
      <div class="guide-wiring-media">${photoOrPlaceholder(step.photo, step.title.replace(/<[^>]+>/g, ""))}</div>
      <p class="guide-instructions">${step.instructions}</p>
      <div class="guide-help-slot"></div>
      <div class="guide-step-actions">
        <button type="button" class="btn btn-primary" data-action="ok">Zapojeno</button>
        <button type="button" class="btn btn-ghost" data-action="fail">Nedaří se mi</button>
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
            btn.textContent = "Zkusil jsem";
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
        <summary>${d.title}</summary>
        <div class="guide-tip-list">
          ${d.items.slice(0, 3).map((t, j) => `
            <div class="guide-tip">
              <p>${t}</p>
            </div>
          `).join("")}
        </div>
        <a class="guide-more-help" href="../../../../index.html#kontakt">Další pomoc</a>
      </details>
    `).join("");

    const actionArea = useArduino
      ? (content.code
          ? `<pre class="guide-code-block"><code>${escapeHtml(content.code)}</code></pre>`
          : `<p class="guide-instructions">${content.note || "Ukázkový Arduino kód pro tento projekt zatím připravujeme. Než bude hotový, doporučujeme začít s blokovým programováním v mBlocku."}</p>`)
      : (content.blocksEditorHref
          ? `<a class="btn btn-primary" href="${content.blocksEditorHref}">Otevřít v blokovém editoru</a>`
          : `<a class="btn btn-primary" href="https://mblock.cc" target="_blank" rel="noopener">Otevřít projekt</a>`);

    return `
      <div class="guide-wiring-media">${photoOrPlaceholder(content.screenshot, useArduino ? "Arduino IDE" : "mBlock")}</div>
      ${actionArea}
      <div class="guide-step-actions" style="margin-top:24px;">
        <button type="button" class="btn btn-primary" data-action="ok">Program je nahraný</button>
        <button type="button" class="btn btn-ghost" data-action="fail">Hlásí chybu</button>
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

  function renderTreeNode(node) {
    if (typeof node === "string") {
      return `<div class="guide-tree-result"><p>${node}</p></div>`;
    }
    return `
      <div class="guide-tree-node">
        <p class="guide-tree-question">${node.question}</p>
        <div class="guide-step-actions">
          <button type="button" class="btn btn-primary guide-tree-yes">ANO</button>
          <button type="button" class="btn btn-ghost guide-tree-no">NE</button>
        </div>
      </div>
    `;
  }

  function renderDiagnosticTree(step) {
    return `
      <p class="guide-instructions">${step.instructions}</p>
      <div class="guide-step-actions" data-role="root-actions">
        <button type="button" class="btn btn-primary" data-action="ok">Hotovo</button>
        <button type="button" class="btn btn-ghost" data-action="fail">Potřebuji pomoc</button>
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
    if (typeof node === "string") return;
    slot.querySelector(".guide-tree-yes").addEventListener("click", () => {
      const next = node.yes !== undefined ? node.yes : (node.yesResult || "Zkus to znovu podle kroků výše.");
      renderTreeStep(slot, next);
    });
    slot.querySelector(".guide-tree-no").addEventListener("click", () => {
      const next = node.no !== undefined ? node.no : (node.noResult || "Zkus to znovu podle kroků výše.");
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
    card.innerHTML = `<h2 class="guide-step-title">${step.title}</h2>` + (r ? r.render(step) : "<p>Neznámý typ kroku.</p>");
    if (r) r.wire(card, step);
    card.querySelectorAll(".term").forEach(t => {
      t.addEventListener("click", () => openTermModal(t.dataset.term));
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
          <div class="guide-done-check">✓</div>
          <h1>Projekt je hotový.</h1>
          <p class="lead">Dnes ses naučil:</p>
          <ul class="guide-learn-list guide-learn-list-done">
            ${DATA.meta.learn.map(l => `<li>${l}</li>`).join("")}
          </ul>
        </div>

        ${hasNext ? `
        <div class="guide-card guide-next fade-up visible">
          <h2 class="guide-step-title">Co dál?</h2>
          <div class="guide-next-grid">
            ${tryDifferent.length ? `
            <div class="guide-next-col">
              <h3>Zkus jinak</h3>
              <ul class="guide-next-list">${tryDifferent.map(t => `<li>${t.text}</li>`).join("")}</ul>
            </div>` : ""}
            ${moreProjects.length ? `
            <div class="guide-next-col">
              <h3>Další projekt</h3>
              <ul class="guide-next-list guide-next-links">${moreProjects.map(p => `<li><a href="${p.href}">${p.title}</a></li>`).join("")}</ul>
            </div>` : ""}
            ${levelUp ? `
            <div class="guide-next-col">
              <h3>Posuň se dál</h3>
              <p>${levelUp.text}</p>
              <a class="guide-more-help" href="${levelUp.href}">${levelUp.title}</a>
            </div>` : ""}
          </div>
        </div>` : ""}

        <div class="guide-card guide-community fade-up visible">
          <h3>Chceš se pochlubit, co jsi postavil?</h3>
          <p>Komunitní galerii teprve připravujeme, zatím nám klidně <a href="../../../../index.html#kontakt">napiš</a>, rádi se podíváme.</p>
        </div>

        <div class="guide-step-actions" style="justify-content:center;">
          <button type="button" class="btn btn-ghost" data-action="reset">Spustit znovu</button>
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
    document.getElementById("guide-modal-card").innerHTML = `<button type="button" class="modal-close" aria-label="Zavřít">&times;</button>${html}`;
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
      <div class="term-modal-photo">${photoOrPlaceholder(g.photo, g.term)}</div>
      <h3>${g.term}</h3>
      <p>${g.text}</p>
      ${g.fact ? `<p class="term-modal-fact">${g.fact}</p>` : ""}
      ${g.datasheet ? `<a href="${g.datasheet}" target="_blank" rel="noopener">Zjistit více</a>` : ""}
    `);
  }

  function openPartModal(part) {
    if (!part) return;
    openModal(`
      <div class="term-modal-photo">${photoOrPlaceholder(part.photo, part.name)}</div>
      <h3>${part.name}</h3>
      <p><b>Co to je:</b> ${part.what}</p>
      <p><b>Jak to funguje:</b> ${part.how}</p>
      ${part.fact ? `<p class="term-modal-fact">${part.fact}</p>` : ""}
      ${part.datasheet ? `<a href="${part.datasheet}" target="_blank" rel="noopener">Datasheet</a>` : ""}
    `);
  }

  // ---------- flow control ----------

  function advance() {
    state.stepIndex = Math.min(state.stepIndex + 1, totalSteps());
    saveState();
    renderCurrent();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderCurrent() {
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

  renderCurrent();
})();
