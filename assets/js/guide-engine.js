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
  const totalSteps = DATA.steps.length;

  const state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore corrupt storage */ }
    return { started: false, stepIndex: 0, missingParts: [] };
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function partById(id) { return DATA.parts.find(p => p.id === id); }

  // ---------- markup helpers ----------

  function photoOrPlaceholder(src, label) {
    if (src) return `<img src="${src}" alt="${label}">`;
    return `<div class="founder-photo-placeholder">FOTO<br>${label.toUpperCase()}</div>`;
  }

  function renderProgress() {
    const pct = DATA.steps.length ? Math.round((state.stepIndex / totalSteps) * 100) : 0;
    return `
      <div class="guide-progress-label">${state.stepIndex >= totalSteps ? "Hotovo" : `Krok ${state.stepIndex + 1} z ${totalSteps}`}</div>
      <div class="guide-progress-track"><div class="guide-progress-fill" style="width:${Math.min(pct, 100)}%"></div></div>
    `;
  }

  // ---------- intro ----------

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
            <div class="stat"><b>${totalSteps}</b><span>Kroky</span></div>
          </div>
          <p class="lead" style="font-size:16px;">Co se naučíš:</p>
          <ul class="guide-learn-list">${m.learn.map(l => `<li>${l}</li>`).join("")}</ul>
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
        <button type="button" class="btn btn-primary" data-action="ok">✅ Mám připraveno</button>
        <button type="button" class="btn btn-ghost" data-action="missing">❌ Něco mi chybí</button>
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
        <a class="guide-more-help" href="../../../../index.html#kontakt">Další pomoc →</a>
      </details>
    `;
  }

  function renderWiring(step) {
    return `
      <div class="guide-wiring-media">${photoOrPlaceholder(step.photo, step.title.replace(/<[^>]+>/g, ""))}</div>
      <p class="guide-instructions">${step.instructions}</p>
      <div class="guide-help-slot"></div>
      <div class="guide-step-actions">
        <button type="button" class="btn btn-primary" data-action="ok">✅ Zapojeno</button>
        <button type="button" class="btn btn-ghost" data-action="fail">❌ Nedaří se mi</button>
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
            btn.textContent = "✓ Zkusil jsem";
            btn.disabled = true;
          });
        });
      }
    });
  }

  // ---------- upload step ----------

  function renderUpload(step) {
    const diag = step.diagnostics.map((d, i) => `
      <details class="guide-accordion">
        <summary>${d.title}</summary>
        <div class="guide-tip-list">
          ${d.items.slice(0, 3).map((t, j) => `
            <div class="guide-tip">
              <p>${t}</p>
            </div>
          `).join("")}
        </div>
        <a class="guide-more-help" href="../../../../index.html#kontakt">Další pomoc →</a>
      </details>
    `).join("");

    return `
      <div class="guide-wiring-media">${photoOrPlaceholder(step.screenshot, "mBlock")}</div>
      <a class="btn btn-primary" href="https://mblock.cc" target="_blank" rel="noopener">📥 Otevřít projekt</a>
      <div class="guide-step-actions" style="margin-top:24px;">
        <button type="button" class="btn btn-primary" data-action="ok">✅ Program je nahraný</button>
        <button type="button" class="btn btn-ghost" data-action="fail">❌ Hlásí chybu</button>
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
        <button type="button" class="btn btn-primary" data-action="ok">✅ Hotovo</button>
        <button type="button" class="btn btn-ghost" data-action="fail">❌ Potřebuji pomoc</button>
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
    return `
      <div class="guide-card guide-done fade-up visible">
        <div class="guide-done-check">✓</div>
        <h1>Projekt je hotový.</h1>
        <p class="lead">Dnes ses naučil:</p>
        <ul class="guide-learn-list guide-learn-list-done">
          ${DATA.meta.learn.map(l => `<li>✓ ${l}</li>`).join("")}
        </ul>
        <a class="btn btn-primary" href="../index.html">Další projekt</a>
      </div>
    `;
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
      ${g.fact ? `<p class="term-modal-fact">💡 ${g.fact}</p>` : ""}
      ${g.datasheet ? `<a href="${g.datasheet}" target="_blank" rel="noopener">Zjistit více →</a>` : ""}
    `);
  }

  function openPartModal(part) {
    if (!part) return;
    openModal(`
      <div class="term-modal-photo">${photoOrPlaceholder(part.photo, part.name)}</div>
      <h3>${part.name}</h3>
      <p><b>Co to je:</b> ${part.what}</p>
      <p><b>Jak to funguje:</b> ${part.how}</p>
      ${part.fact ? `<p class="term-modal-fact">💡 ${part.fact}</p>` : ""}
      ${part.datasheet ? `<a href="${part.datasheet}" target="_blank" rel="noopener">Datasheet →</a>` : ""}
    `);
  }

  // ---------- flow control ----------

  function advance() {
    state.stepIndex = Math.min(state.stepIndex + 1, totalSteps);
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
      stepsEl.appendChild(wrap(renderIntro()));
      stepsEl.querySelector('[data-action="start"]').addEventListener("click", () => {
        state.started = true;
        saveState();
        renderCurrent();
      });
      return;
    }

    progressEl.style.display = "";
    progressEl.innerHTML = renderProgress();

    if (state.stepIndex >= totalSteps) {
      stepsEl.appendChild(wrap(renderDone()));
      return;
    }

    stepsEl.appendChild(renderStep(DATA.steps[state.stepIndex]));
  }

  function wrap(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.firstElementChild;
  }

  renderCurrent();
})();
