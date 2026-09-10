const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { webcrypto } = require('node:crypto');

const source = fs.readFileSync(path.join(__dirname, '..', 'learn', 'worker.js'), 'utf8')
  .replace('export default {', 'globalThis.worker = {');
const context = { URL, Request, Response, TextEncoder, crypto: webcrypto };
vm.runInNewContext(source, context);

const env = {
  LEARN_BETA_CODE: '12345',
  LEARN_SESSION_SECRET: 'test-secret',
  ASSETS: { fetch: async () => new Response('asset-ok') }
};

(async () => {
  const protectedUrl = 'https://learn.shieldio.cz/maturita/otazka/elektronika-08-prechodne-deje-v-elektronickych-obvodech/';
  const gate = await context.worker.fetch(new Request(protectedUrl), env);
  assert.equal(gate.status, 200);
  assert.match(await gate.text(), /Pětimístný přístupový kód/);
  assert.equal(gate.headers.get('x-robots-tag'), 'noindex, nofollow');

  const wrong = await context.worker.fetch(new Request('https://learn.shieldio.cz/maturita/pristup/', {
    method: 'POST', body: new URLSearchParams({ code: '00000', next: '/maturita/elektronika/' })
  }), env);
  assert.equal(wrong.status, 401);

  const login = await context.worker.fetch(new Request('https://learn.shieldio.cz/maturita/pristup/', {
    method: 'POST', body: new URLSearchParams({ code: '12345', next: '/maturita/elektronika/' }), redirect: 'manual'
  }), env);
  assert.equal(login.status, 303);
  assert.match(login.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);

  const cookie = login.headers.get('set-cookie').split(';')[0];
  const unlocked = await context.worker.fetch(new Request('https://learn.shieldio.cz/maturita/elektronika/', { headers: { cookie } }), env);
  assert.equal(await unlocked.text(), 'asset-ok');
  console.log('Beta přístup k elektronice OK');
})().catch(error => { console.error(error); process.exit(1); });
