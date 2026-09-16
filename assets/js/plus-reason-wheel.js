(() => {
  const box = document.querySelector('[data-reason-wheel]');
  const form = document.querySelector('[data-note-form]');
  if (!box || !form) return;
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
  const rotor = box.querySelector('[data-wheel-rotor]');
  const spin = box.querySelector('[data-wheel-spin]');
  const result = box.querySelector('[data-wheel-result]');
  const apply = box.querySelector('[data-wheel-apply]');
  let selected = '', angle = 0, timer;
  reasons.forEach((reason, i) => {
    const number = document.createElement('span');
    number.textContent = String(i + 1);
    number.style.setProperty('--wheel-index', i);
    rotor.append(number);
    const item = document.createElement('li');
    item.textContent = reason;
    box.querySelector('[data-wheel-list]').append(item);
  });
  const reset = () => {
    clearTimeout(timer); selected = ''; spin.disabled = false;
    apply.hidden = true; result.textContent = 'Roztoč kolo pro návrh formulace.';
    box.removeAttribute('aria-busy');
  };
  spin.addEventListener('click', () => {
    if (spin.disabled) return;
    // Visual inspiration only. No network, credentials, storage or submit.
    const index = Math.floor(Math.random() * reasons.length);
    selected = ''; apply.hidden = true; spin.disabled = true;
    box.setAttribute('aria-busy', 'true'); result.textContent = 'Kolo se otáčí…';
    angle = Math.ceil(angle / 360) * 360 + 1800 + (360 - index * 18) % 360;
    rotor.style.transform = `rotate(${angle}deg)`;
    timer = setTimeout(() => {
      selected = reasons[index]; result.textContent = `${index + 1}. ${selected}`;
      spin.disabled = false; apply.hidden = false; box.removeAttribute('aria-busy');
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 3700);
  });
  apply.addEventListener('click', () => {
    if (!selected) return;
    const reason = form.elements.reason;
    reason.value = selected;
    reason.dispatchEvent(new Event('input', { bubbles: true }));
    reason.focus();
    result.textContent = 'Text vložen do návrhu. Uprav jej podle skutečnosti; nic nebylo odesláno.';
  });
  document.querySelector('[data-dashboard-close]')?.addEventListener('click', () => { reset(); box.open = false; });
  reset();
})();
