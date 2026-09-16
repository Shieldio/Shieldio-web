(() => {
  const box = document.querySelector('[data-reason-wheel]');
  const form = document.querySelector('[data-note-form]');
  const opener = document.querySelector('[data-wheel-open]');
  if (!box || !form || !opener) return;
  const reasons = [
    'Návštěva lékaře', 'Návštěva zubního lékaře', 'Plánované lékařské vyšetření',
    'Zdravotní indispozice', 'Rekonvalescence', 'Rehabilitace',
    'Neodkladné rodinné důvody', 'Rodinná událost', 'Pohřeb blízké osoby',
    'Doprovod člena rodiny k lékaři', 'Neodkladné vyřízení úřední záležitosti',
    'Zkouška v autoškole', 'Přijímací zkouška', 'Den otevřených dveří školy',
    'Účast na vzdělávací akci', 'Účast na odborné soutěži',
    'Účast na sportovní soutěži', 'Účast na kulturní akci',
    'Mimořádná dopravní komplikace', 'Stěhování'
  ];
  const jokes = ['Kočka mi zakázala opustit byt.','Postel aktivovala magnetické pole.','Budík měl dnes home office.','Čekám, až se mi aktualizuje motivace.','Pes snědl nejen úkol, ale i můj rozvrh.','Zasekl jsem se v načítací obrazovce.','Gravitace mě drží pod peřinou.','Moje ponožky vyhlásily pátrání po dvojčeti.','Dnes testuji offline režim člověka.','Tramvaj odjela v jiné časové ose.','Mozek hlásí: zařízení není připraveno.','Lednička potřebovala technický dozor.','Mám konflikt s ranním firmwarem.','Dveře čekají na dvoufázové ověření.','Můj batoh přešel do režimu letadlo.','Ve snu jsem už jednu školní směnu odchodil.','Dnes jsem vedoucí oddělení nicnedělání.','Probíhá plánovaná údržba mého vstávání.','Kalendář a já máme tvůrčí neshody.','Domácí Wi-Fi mě nepustila z dosahu.'];
  const items = reasons.map(text => ({text, funny:false})).concat(jokes.map(text => ({text, funny:true})));
  const rotor = box.querySelector('[data-wheel-rotor]');
  const spin = box.querySelector('[data-wheel-spin]');
  const result = box.querySelector('[data-wheel-result]');
  const apply = box.querySelector('[data-wheel-apply]');
  const badge = box.querySelector('[data-wheel-badge]');
  const mode = box.querySelector('[data-wheel-mode]');
  const sound = box.querySelector('[data-wheel-sound]');
  const counter = box.querySelector('[data-wheel-count]');
  let pool = [], selected = null, angle = 0, frame = 0, last = null, audio;
  function tone(frequency, duration = .025, delay = 0) {
    if (!sound.checked || !audio || audio.state !== 'running') return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.035, start); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(start); oscillator.stop(start + duration);
  }
  function reset() {
    cancelAnimationFrame(frame); frame = 0; selected = null;
    spin.disabled = false; mode.disabled = false; apply.hidden = true;
    badge.textContent = '40 nápadů · žádné automatické odeslání'; result.textContent = 'Tak co nám dnes padne?';
    box.classList.remove('is-spinning','is-revealed'); box.removeAttribute('aria-busy');
  }
  function render() {
    reset();
    pool = items.filter(item => mode.value === 'mix' || (mode.value === 'funny') === item.funny);
    rotor.replaceChildren(); box.querySelector('[data-wheel-list]').replaceChildren();
    const step = 360 / pool.length;
    rotor.style.setProperty('--wheel-step', `${step}deg`); rotor.style.setProperty('--wheel-half', `${-step / 2}deg`);
    pool.forEach((item,i) => {
      const number = document.createElement('span'); number.textContent = i + 1;
      number.style.setProperty('--wheel-position', `${i * step}deg`); rotor.append(number);
      const li = document.createElement('li'); li.textContent = `${item.text}${item.funny ? ' · jen pro pobavení' : ''}`;
      box.querySelector('[data-wheel-list]').append(li);
    });
    counter.textContent = pool.length; angle = 0; rotor.style.transform = 'rotate(0deg)';
  }
  opener.addEventListener('click', () => box.showModal());
  box.querySelector('[data-wheel-close]').addEventListener('click', () => box.close());
  box.addEventListener('click', event => {
    const r = box.getBoundingClientRect();
    if (event.target === box && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) box.close();
  });
  box.addEventListener('close', () => { reset(); if (audio) audio.suspend().catch(() => {}); });
  mode.addEventListener('change', render);
  sound.addEventListener('change', () => { if (audio && !sound.checked) audio.suspend().catch(() => {}); });
  spin.addEventListener('click', () => {
    if (spin.disabled) return;
    if (sound.checked) {
      try { const Context = window.AudioContext || window.webkitAudioContext; if (Context) { audio ||= new Context(); audio.resume().catch(() => {}); } } catch { /* Silent fallback. */ }
    }
    const candidates = pool.map((item,i) => i).filter(i => pool[i] !== last);
    const index = candidates[Math.floor(Math.random() * candidates.length)];
    selected = null; apply.hidden = true; spin.disabled = true; mode.disabled = true;
    box.classList.remove('is-revealed'); box.classList.add('is-spinning'); box.setAttribute('aria-busy','true');
    badge.textContent = 'Chvilka napětí'; result.textContent = 'Osud se právě roztáčí…';
    const step = 360 / pool.length, from = angle;
    const to = Math.ceil(angle / 360) * 360 + 2160 + (360 - index * step) % 360;
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 4200;
    const start = performance.now(); let sector = Math.floor(from / step);
    const animate = now => {
      const progress = duration ? Math.min(1,(now - start) / duration) : 1;
      angle = from + (to - from) * (1 - Math.pow(1 - progress,4)); rotor.style.transform = `rotate(${angle}deg)`;
      const current = Math.floor(angle / step); if (current !== sector) { tone(1050); sector = current; }
      if (progress < 1) { frame = requestAnimationFrame(animate); return; }
      frame = 0; selected = pool[index]; last = selected;
      spin.disabled = false; mode.disabled = false;
      badge.textContent = selected.funny ? 'Jen pro pobavení · do omluvenky nepatří' : 'Věcný návrh · použij pouze, pokud je pravdivý';
      result.textContent = selected.text; apply.hidden = selected.funny;
      box.classList.remove('is-spinning'); box.classList.add('is-revealed'); box.removeAttribute('aria-busy');
      [523,659,784].forEach((pitch,i) => tone(pitch,.13,i * .09));
    };
    frame = requestAnimationFrame(animate);
  });
  apply.addEventListener('click', () => {
    // Humor must never flow into a school note, even if the button is revealed.
    if (!selected || selected.funny) return;
    const reason = form.elements.reason;
    reason.value = selected.text;
    reason.dispatchEvent(new Event('input', { bubbles: true }));
    box.close(); reason.focus();
  });
  document.querySelector('[data-dashboard-close]')?.addEventListener('click', () => { if (box.open) box.close(); reset(); });
  render();
})();
