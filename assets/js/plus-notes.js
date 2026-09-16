(() => {
  const form = document.querySelector('[data-note-form]');
  const login = document.querySelector('[data-edupage-probe]');
  if (!form || !login) return;
  const preview = form.querySelector('[data-note-preview]');
  const text = form.querySelector('[data-note-text]');
  const status = form.querySelector('[data-note-status]');
  const open = form.querySelector('[data-note-open]');
  const periods = form.querySelector('[data-note-periods]');
  const confirm = form.querySelector('[data-note-confirm]');
  const send = form.querySelector('[data-note-send]');
  const account = form.querySelector('[data-note-account]');
  const blockedDays = new Set();
  let outgoing = null;
  let sending = false;
  let draft = '';
  const clear = () => { outgoing = null; draft = ''; text.textContent = ''; preview.hidden = true; status.textContent = ''; open.removeAttribute('href'); confirm.hidden = true; form.elements.notePassword.value = ''; form.elements.noteConsent.checked = false; form.elements.notePassword.disabled = true; form.elements.noteConsent.disabled = true; };
  const sync = () => {
    const partial = form.elements.scope.value === 'periods';
    periods.hidden = !partial;
    for (const name of ['first', 'last']) { form.elements[name].disabled = !partial; form.elements[name].required = partial; }
    form.elements.to.readOnly = partial;
    if (partial) form.elements.to.value = form.elements.from.value;
    form.elements.to.min = form.elements.from.value;
    clear();
  };
  form.addEventListener('input', event => { if (!['notePassword', 'noteConsent'].includes(event.target.name)) sync(); });
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
    if (scope.value === 'periods' && from.value === to.value && !blockedDays.has(`${school}:${from.value}`)) {
      outgoing = { school, username: login.elements.username.value.trim(), note: { date: from.value, first: Number(first.value), last: Number(last.value), reason: reason.value.trim() } };
      account.textContent = `Škola: ${school}.edupage.org · účet: ${outgoing.username}`;
      confirm.hidden = false;
      form.elements.notePassword.disabled = false;
      form.elements.noteConsent.disabled = false;
    }
    status.textContent = 'Návrh je připravený pouze v tomto prohlížeči. Nic nebylo odesláno.';
  });
  send.addEventListener('click', async () => {
    if (!outgoing || sending) return;
    const password = form.elements.notePassword;
    const consent = form.elements.noteConsent;
    if (!password.value || !consent.checked) { status.textContent = 'Zadej znovu heslo a potvrď odeslání zkontrolované omluvenky.'; if (!password.value) password.focus(); else consent.focus(); return; }
    const payload = { ...outgoing, password: password.value, privacyConsent: true, submissionConsent: true };
    const dayKey = `${outgoing.school}:${outgoing.note.date}`;
    const controls = Array.from(form.elements).concat(document.querySelector('[data-dashboard-close]') || []);
    const previous = controls.map(control => control.disabled);
    sending = true; controls.forEach(control => { control.disabled = true; });
    status.textContent = 'Přihlašuji se, kontroluji existující omluvenky a odesílám. Počkej; neopakuj odeslání.';
    try {
      const response = await fetch('/api/edupage/absence-note', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      status.textContent = result.message || 'Výsledek není potvrzený. Zkontroluj EduPage a odeslání neopakuj.';
      // Only explicit pre-write failures allow another attempt in this page.
      const safe = ['notes-consent','notes-disabled','notes-input','notes-account','notes-protocol','credentials','captcha','twofactor','input','consent','origin','rate','rate-config','school','protocol'];
      if (result.ok || !safe.includes(result.code)) { blockedDays.add(dayKey); outgoing = null; confirm.hidden = true; }
    } catch {
      blockedDays.add(dayKey); outgoing = null; confirm.hidden = true;
      status.textContent = 'Spojení se přerušilo. Omluvenka mohla být uložena. Neposílej ji znovu a zkontroluj EduPage.';
    } finally {
      payload.password = ''; password.value = ''; consent.checked = false;
      controls.forEach((control, index) => { control.disabled = previous[index]; });
      sending = false;
    }
  });
  form.querySelector('[data-note-copy]').addEventListener('click', async () => {
    if (!draft) return;
    try { await navigator.clipboard.writeText(draft); status.textContent = 'Návrh zkopírován. V EduPage vlož důvod a nastav odpovídající data a hodiny. Nic nebylo odesláno.'; }
    catch { status.textContent = 'Kopírování není dostupné. Označ návrh a zkopíruj jej ručně.'; }
  });
  document.querySelector('[data-dashboard-close]')?.addEventListener('click', () => { form.reset(); sync(); });
  sync();
})();
