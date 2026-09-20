(() => {
  const box = document.querySelector('[data-note-form]');
  if (!box) return;
  const get = name => box.querySelector(`[name="${name}"]`);
  const periods = box.querySelector('[data-note-periods]');
  const preview = box.querySelector('[data-note-preview]');
  const text = box.querySelector('[data-note-text]');
  const status = box.querySelector('[data-note-status]');
  let draft = '';
  const format = value => new Intl.DateTimeFormat('cs-CZ').format(new Date(`${value}T12:00:00`));
  const sync = () => { const partial = get('scope').value === 'periods'; periods.hidden = !partial; if (partial) get('to').value = get('from').value; get('to').readOnly = partial; preview.hidden = true; };
  get('scope').addEventListener('change', sync); get('from').addEventListener('change', sync);
  box.querySelector('[data-note-create]').addEventListener('click', () => {
    const inputs = [...box.querySelectorAll('[required]')];
    if (!inputs.every(input => input.checkValidity())) { inputs.find(input => !input.checkValidity())?.reportValidity(); return; }
    const from = get('from'), to = get('to'), first = get('first'), last = get('last'), reason = get('reason'), scope = get('scope');
    if (to.value < from.value || (scope.value === 'periods' && Number(last.value) < Number(first.value))) { status.textContent = 'Zkontroluj datum nebo rozsah hodin.'; return; }
    draft = `Absence: ${from.value === to.value ? format(from.value) : `${format(from.value)} – ${format(to.value)}`}\n${scope.value === 'periods' ? `Vyučovací hodiny: ${first.value}–${last.value}` : 'Rozsah: celé dny'}\nDůvod: ${reason.value.trim()}`;
    text.textContent = draft; preview.hidden = false; status.textContent = 'Návrh vznikl pouze v tomto prohlížeči. Nic nebylo odesláno.';
  });
  box.querySelector('[data-note-copy]').addEventListener('click', async () => { if (!draft) return; try { await navigator.clipboard.writeText(draft); status.textContent = 'Text zkopírován. Případné odeslání potvrďte sami v EduPage.'; } catch { status.textContent = 'Text označte a zkopírujte ručně.'; } });
  sync();
})();
