(() => {
  const form = document.querySelector('[data-note-form]');
  const login = document.querySelector('[data-edupage-probe]');
  if (!form || !login) return;
  const preview = form.querySelector('[data-note-preview]');
  const text = form.querySelector('[data-note-text]');
  const status = form.querySelector('[data-note-status]');
  const open = form.querySelector('[data-note-open]');
  const periods = form.querySelector('[data-note-periods]');
  let draft = '';
  const clear = () => { draft = ''; text.textContent = ''; preview.hidden = true; status.textContent = ''; open.removeAttribute('href'); };
  const sync = () => {
    const partial = form.elements.scope.value === 'periods';
    periods.hidden = !partial;
    for (const name of ['first', 'last']) { form.elements[name].disabled = !partial; form.elements[name].required = partial; }
    form.elements.to.readOnly = partial;
    if (partial) form.elements.to.value = form.elements.from.value;
    form.elements.to.min = form.elements.from.value;
    clear();
  };
  form.addEventListener('input', sync);
  const format = value => new Intl.DateTimeFormat('cs-CZ').format(new Date(`${value}T12:00:00`));
  form.addEventListener('submit', event => {
    event.preventDefault(); clear();
    if (!form.reportValidity()) return;
    const { from, to, first, last, reason, scope } = form.elements;
    if (to.value < from.value) { status.textContent = 'Konec absence nemůže být před začátkem.'; return; }
    if (scope.value === 'periods' && Number(last.value) < Number(first.value)) { status.textContent = 'Poslední hodina nemůže být před první.'; return; }
    if (!reason.value.trim()) { status.textContent = 'Doplň stručný důvod absence.'; return; }
    const school = (login.elements.schoolChoice.value === 'custom' ? login.elements.customSchool.value : 'spszl').trim().toLowerCase().replace(/\.edupage\.org\/?$/, '');
    if (!/^[a-z0-9-]{1,63}$/.test(school)) { status.textContent = 'Adresa školy není platná. Znovu připoj svou školu.'; return; }
    const range = from.value === to.value ? format(from.value) : `${format(from.value)} – ${format(to.value)}`;
    draft = `Absence: ${range}\n${scope.value === 'periods' ? `Vyučovací hodiny: ${first.value}–${last.value}` : 'Rozsah: celé dny'}\nDůvod: ${reason.value.trim()}`;
    text.textContent = draft;
    open.href = `https://${school}.edupage.org/dashboard/eb.php?mode=attendance`;
    preview.hidden = false;
    status.textContent = 'Návrh je připravený pouze v tomto prohlížeči. Nic nebylo odesláno.';
  });
  form.querySelector('[data-note-copy]').addEventListener('click', async () => {
    if (!draft) return;
    try { await navigator.clipboard.writeText(draft); status.textContent = 'Návrh zkopírován. V EduPage vlož důvod a nastav odpovídající data a hodiny. Nic nebylo odesláno.'; }
    catch { status.textContent = 'Kopírování není dostupné. Označ návrh a zkopíruj jej ručně.'; }
  });
  document.querySelector('[data-dashboard-close]')?.addEventListener('click', () => { form.reset(); sync(); });
  sync();
})();
