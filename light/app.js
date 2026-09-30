document.querySelectorAll('form.web3form').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.form-status');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Odesílám…';
    status.className = 'form-status';
    status.textContent = '';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error('Odeslání se nezdařilo');
      status.classList.add('success');
      status.textContent = 'Děkujeme. Zpráva byla odeslána.';
      form.reset();
    } catch (error) {
      status.classList.add('error');
      status.textContent = 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu později.';
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
});
