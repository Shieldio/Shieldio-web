(() => {
  const original = window.renderShieldioRlc;
  const diagrams = {
    R: {
      label: 'Náhradní schéma reálného rezistoru',
      note: 'Lpar je v sérii s odporovou částí. Cpar je paralelně k vlastnímu odporu R.',
      svg: `<svg viewBox="0 0 640 250" role="img" aria-label="Náhradní schéma reálného rezistoru"><g class="wire"><path d="M30 125H85M205 125H245M245 125V62M245 125v63M245 62h45M390 62h45M245 188h55M380 188h55M435 62v126M435 125h175"/><path class="coil" d="M85 125c0-28 30-28 30 0c0-28 30-28 30 0c0-28 30-28 30 0c0-28 30-28 30 0"/><rect x="290" y="42" width="100" height="40"/><path d="M300 188h27m0-25v50m26-50v50m0-25h27"/><circle cx="245" cy="125" r="5"/><circle cx="435" cy="125" r="5"/></g><g class="labels"><text x="116" y="82">L<tspan baseline-shift="sub">par</tspan></text><text x="326" y="34">R</text><text x="310" y="238">C<tspan baseline-shift="sub">par</tspan></text><text x="25" y="151">A</text><text x="600" y="151">B</text></g></svg>`
    },
    C: {
      label: 'Náhradní schéma reálného kondenzátoru',
      note: 'Indukčnost vývodů a ztrátový odpor jsou v sérii s ideální kapacitou. Izolační odpor je paralelní svod přes dielektrikum.',
      svg: `<svg viewBox="0 0 760 300" role="img" aria-label="Náhradní schéma reálného kondenzátoru"><g class="wire"><path d="M25 150h55M200 150h35M335 150h95M430 150V90M430 90h65M535 90h115M430 150v70M430 220h50M600 220h50M650 90v130M650 150h85"/><path class="coil" d="M80 150c0-34 40-34 40 0c0-34 40-34 40 0c0-34 40-34 40 0"/><rect x="235" y="126" width="100" height="48"/><path d="M495 58v64M535 58v64"/><rect x="480" y="196" width="120" height="48"/><circle cx="430" cy="150" r="6"/><circle cx="650" cy="150" r="6"/></g><g class="labels"><text x="91" y="101">L vývodů</text><text x="238" y="112">R ztrát</text><text x="505" y="46">C</text><text x="483" y="278">R izolace</text><text x="20" y="180">A</text><text x="716" y="180">B</text></g></svg>`
    },
    L: {
      label: 'Náhradní schéma reálné cívky',
      note: 'RCu modeluje odpor vinutí. Ideální L má tři oblouky; Cpar představuje kapacitu mezi závity a leží paralelně k celé vinuté části.',
      svg: `<svg viewBox="0 0 680 270" role="img" aria-label="Náhradní schéma reálné cívky"><g class="wire"><path d="M25 135h55M180 135h55M355 135h90M80 135V62M80 135v73M80 62h150M450 62h150M80 208h190M410 208h190M600 62v146M600 135h55"/><rect x="80" y="115" width="100" height="40"/><path class="coil" d="M235 135c0-34 40-34 40 0c0-34 40-34 40 0c0-34 40-34 40 0"/><path d="M270 208h45m0-28v56m35-56v56m0-28h60"/><circle cx="80" cy="135" r="5"/><circle cx="600" cy="135" r="5"/></g><g class="labels"><text x="105" y="105">R<tspan baseline-shift="sub">Cu</tspan></text><text x="285" y="92">L</text><text x="305" y="260">C<tspan baseline-shift="sub">par</tspan></text></g></svg>`
    }
  };
  function draw(box) {
    const select = box.closest('[data-rlc-model]').querySelector('[data-model]');
    const item = diagrams[select.value];
    box.innerHTML = item.svg;
    box.querySelector('svg').setAttribute('aria-label', item.label);
    const result = box.closest('[data-rlc-model]').querySelector('[data-result]');
    result.textContent = item.note;
  }
  window.renderShieldioRlc = root => {
    original(root);
    const observer = new MutationObserver(() => {
      const box = root.querySelector('[data-model-diagram]');
      if (!box || box.dataset.cleanDiagram) return;
      box.dataset.cleanDiagram = 'true';
      const select = box.closest('[data-rlc-model]').querySelector('[data-model]');
      select.addEventListener('change', () => draw(box));
      draw(box);
    });
    observer.observe(root, {childList:true, subtree:true});
  };
})();
