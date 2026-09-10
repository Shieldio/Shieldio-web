(() => {
  const data = window.ShieldioTransientData;
  const esc = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const number = (value, digits = 2) => value.toLocaleString('cs-CZ', {maximumFractionDigits: digits});
  const curve = (mode, tau, timeMax = 5, width = 600, height = 250) => Array.from({length:101}, (_, index) => {
    const t = index / 100 * timeMax;
    const ratio = mode === 'rise' ? 1 - Math.exp(-t / tau) : Math.exp(-t / tau);
    return `${index ? 'L' : 'M'}${55 + index / 100 * (width - 80)} ${height - 35 - ratio * (height - 75)}`;
  }).join(' ');
  const graph = (labelA, labelB) => `<svg class="tr-graph" viewBox="0 0 600 250" role="img" aria-label="Exponenciální průběh"><path class="tr-grid" d="M55 25v190h520M55 177h520M55 139h520M55 101h520M55 63h520"/><path class="tr-axis" d="M55 20v195h525"/><path class="tr-curve-a" data-tr-curve-a/><path class="tr-curve-b" data-tr-curve-b/><line class="tr-guide" data-tr-guide x1="159" x2="159" y1="25" y2="215"/><circle class="tr-point" data-tr-point r="6"/><text x="12" y="30">${labelA}</text><text x="500" y="238">t →</text><text class="tr-label-a" x="430" y="55">${labelA}</text><text class="tr-label-b" x="430" y="195">${labelB}</text></svg>`;
  function simulation(type) {
    const rc = type === 'rc';
    return `<section class="tr-simulator" data-kind="${type}"><h3>${rc ? 'Nasimuluj nabíjení RC' : 'Nasimuluj zapnutí RL'}</h3><div class="tr-controls"><label>${rc ? 'R [kΩ]' : 'R [Ω]'}<input data-p="r" type="range" min="${rc ? 1 : 10}" max="${rc ? 100 : 200}" value="${rc ? 10 : 40}"></label><label>${rc ? 'C [µF]' : 'L [mH]'}<input data-p="x" type="range" min="1" max="500" value="${rc ? 100 : 200}"></label><label>Čas [${rc ? 's' : 'ms'}]<input data-p="t" type="range" min="0" max="${rc ? 5 : 25}" step="0.1" value="${rc ? 1 : 5}"></label></div>${graph(rc ? 'uC' : 'iL', rc ? 'i' : 'uL')}<output class="tr-result" data-tr-result></output></section>`;
  }
  function updateSimulator(box) {
    const rc = box.dataset.kind === 'rc', r = +box.querySelector('[data-p="r"]').value, x = +box.querySelector('[data-p="x"]').value, t = +box.querySelector('[data-p="t"]').value;
    const tau = rc ? r * 1000 * x / 1e6 : (x / 1000) / r * 1000;
    const n = t / tau, rise = 1 - Math.exp(-n), fall = Math.exp(-n), timeMax = rc ? 5 : 25;
    box.querySelector('[data-tr-curve-a]').setAttribute('d', curve('rise', tau, timeMax));
    box.querySelector('[data-tr-curve-b]').setAttribute('d', curve('fall', tau, timeMax));
    const px = 55 + Math.min(1, t / (rc ? 5 : 25)) * 520, py = 215 - rise * 175;
    const point = box.querySelector('[data-tr-point]'); point.setAttribute('cx', px); point.setAttribute('cy', py);
    const guide = box.querySelector('[data-tr-guide]'); guide.setAttribute('x1', px); guide.setAttribute('x2', px);
    box.querySelector('[data-tr-result]').textContent = rc ? `τ = ${number(tau)} s · v čase ${number(t)} s: uC = ${number(12 * rise)} V, i = ${number(12 / (r * 1000) * fall * 1000)} mA` : `τ = ${number(tau)} ms · v čase ${number(t)} ms: iL = ${number(12 / r * rise, 3)} A, uL = ${number(12 * fall)} V`;
  }
  function widgets(panel) {
    panel.querySelectorAll('[data-tr-sim]').forEach(node => { node.innerHTML = simulation(node.dataset.trSim); updateSimulator(node.firstElementChild); });
    const tau = panel.querySelector('[data-tr-tau]');
    if (tau) tau.innerHTML = `<section class="tr-simulator"><label>Násobek τ: <b data-tr-tau-label>1,0</b><input data-tr-tau-input type="range" min="0" max="5" value="1" step="0.1"></label>${graph('narůstání', 'pokles')}<output class="tr-result" data-tr-tau-out></output></section>`;
    const protection = panel.querySelector('[data-tr-protection]');
    if (protection) protection.innerHTML = `<div class="tr-protection-visual"><div class="tr-coil">L</div><div class="tr-switch">spínač</div><div class="tr-diode">↤|</div></div><label><input type="checkbox" data-tr-diode> Připojit volnoběžnou diodu</label><output class="tr-result" data-tr-protection-out>Bez ochrany: při rozepnutí hrozí vysoké napětí a jiskření.</output>`;
    const damping = panel.querySelector('[data-tr-damping]');
    if (damping) damping.innerHTML = `<section class="tr-simulator"><label>Tlumení R: <b data-tr-damping-label>kritické</b><input data-tr-damping-input type="range" min="0" max="2" step="1" value="1"></label><svg class="tr-graph" viewBox="0 0 600 250"><path class="tr-grid" d="M55 25v190h520M55 120h520"/><path class="tr-axis" d="M55 20v195h525"/><path class="tr-curve-a" data-tr-damping-curve/></svg><output class="tr-result">Sleduj překmit a dobu ustálení.</output></section>`;
    updateTau(panel); updateDamping(panel);
  }
  function updateTau(panel) {
    const input = panel.querySelector('[data-tr-tau-input]'); if (!input) return;
    const n = +input.value, rise = 1 - Math.exp(-n), px = 55 + n / 5 * 520;
    panel.querySelector('[data-tr-tau-label]').textContent = number(n, 1);
    panel.querySelector('[data-tr-tau-out]').textContent = `Narůstání: ${number(rise * 100, 1)} % · pokles: ${number(Math.exp(-n) * 100, 1)} %`;
    panel.querySelector('[data-tr-curve-a]').setAttribute('d', curve('rise', 1)); panel.querySelector('[data-tr-curve-b]').setAttribute('d', curve('fall', 1));
    const point = panel.querySelector('[data-tr-point]'); point.setAttribute('cx', px); point.setAttribute('cy', 215 - rise * 175);
    const guide = panel.querySelector('[data-tr-guide]'); guide.setAttribute('x1', px); guide.setAttribute('x2', px);
  }
  function updateDamping(panel) {
    const input = panel.querySelector('[data-tr-damping-input]'); if (!input) return;
    const mode = +input.value, names = ['podkritické', 'kritické', 'nadkritické']; panel.querySelector('[data-tr-damping-label]').textContent = names[mode];
    const path = Array.from({length:121}, (_, i) => { const t=i/20; let y; if(mode===0)y=1-Math.exp(-.45*t)*Math.cos(2.8*t); else if(mode===1)y=1-(1+t)*Math.exp(-t); else y=1-.7*Math.exp(-.35*t)-.3*Math.exp(-2*t); return `${i?'L':'M'}${55+i/120*520} ${215-y*150}`; }).join(' ');
    panel.querySelector('[data-tr-damping-curve]').setAttribute('d', path);
  }
  window.renderShieldioTransient = root => {
    root.className = 'tr-study'; let current = 0;
    root.innerHTML = `<nav class="tr-nav" aria-label="Kapitoly přechodných dějů">${data.chapters.map((chapter,index)=>`<button type="button" data-tr-chapter="${index}">${String(index+1).padStart(2,'0')} ${esc(chapter.title)}</button>`).join('')}</nav><div data-tr-panel></div><div class="tr-footer"><button type="button" data-tr-nav="prev">← Předchozí</button><button type="button" data-tr-nav="next">Další →</button></div>`;
    const panel = root.querySelector('[data-tr-panel]');
    const render = (index, scroll = false) => { current = Math.max(0, Math.min(data.chapters.length-1,index)); const chapter=data.chapters[current]; root.querySelectorAll('[data-tr-chapter]').forEach((button,i)=>button.setAttribute('aria-current',String(i===current))); panel.innerHTML=`<article class="tr-chapter"><span class="tr-kicker">${current+1} / ${data.chapters.length} · maturitní otázka</span><h2>${chapter.title}</h2><p class="tr-lead">${chapter.lead}</p>${chapter.html}</article>`; root.querySelector('[data-tr-nav="prev"]').disabled=current===0; const next=root.querySelector('[data-tr-nav="next"]'); next.disabled=current===data.chapters.length-1; next.textContent=next.disabled?'Hotovo ✓':'Další →'; panel.querySelectorAll('[data-tr-math]').forEach(node=>window.katex.render(node.dataset.trMath,node,{displayMode:true,throwOnError:false,strict:false})); widgets(panel); if(scroll)root.scrollIntoView({behavior:'smooth',block:'start'}); };
    root.addEventListener('click', event => { const chapter=event.target.closest('[data-tr-chapter]'); if(chapter){render(+chapter.dataset.trChapter,true);return;} const nav=event.target.closest('[data-tr-nav]'); if(nav){render(current+(nav.dataset.trNav==='next'?1:-1),true);return;} if(event.target.matches('[data-tr-check]')){const value=+panel.querySelector('[data-tr-answer]').value, output=panel.querySelector('[data-tr-check-out]'); output.textContent=Math.abs(value-1.386)<.06?'Správně: t ≈ 1,39 s.':'Zkus znovu. Použij −ln(1−9/12), protože RC = 1 s.';} });
    root.addEventListener('input', event => { const simulator=event.target.closest('.tr-simulator[data-kind]'); if(simulator)updateSimulator(simulator); if(event.target.matches('[data-tr-tau-input]'))updateTau(panel); if(event.target.matches('[data-tr-damping-input]'))updateDamping(panel); });
    root.addEventListener('change', event => { if(event.target.matches('[data-tr-diode]')){panel.querySelector('[data-tr-protection]').classList.toggle('is-safe',event.target.checked); panel.querySelector('[data-tr-protection-out]').textContent=event.target.checked?'S diodou: proud cívky má uzavřenou cestu a napětí na spínači je omezené.':'Bez ochrany: při rozepnutí hrozí vysoké napětí a jiskření.';} });
    render(0);
  };
})();
