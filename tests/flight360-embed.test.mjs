import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker, {securityHeaders} from '../workers/flight360.mjs';

const base = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('experiments/flight360/videos.json', base), 'utf8'));
const page = await readFile(new URL('experiments/flight360/index.html', base), 'utf8');
const requests = [];
const env = {ASSETS: {async fetch(request) {
  const path = new URL(request.url).pathname;
  requests.push(path);
  if (path === '/videos.json') return Response.json(manifest);
  if (path === '/') return new Response(page, {headers: {'X-Frame-Options': 'DENY'}});
  return new Response('static asset');
}}};
const fetchEmbed = (path, method = 'GET', bindings = env) => worker.fetch(new Request('https://flight360.shieldio.cz' + path, {method}), bindings);

test('published embed uses shared player and permits framing without inherited XFO', async () => {
  const response = await fetchEmbed('/embed/stitna-zapad-slunce');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Frame-Options'), null);
  assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors \*/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
  const html = await response.text();
  assert.match(html, /<body class="embed">/);
  assert.match(html, /<canvas id="view"/);
  assert.match(html, /src="\/app.js/);
  assert.doesNotMatch(html, /(?:src|href)="\.\//);
});

test('missing, unpublished and malformed routes never substitute a published scene', async () => {
  for (const path of ['/embed/no-such-scene', '/embed', '/embed/', '/embed/a/b', '/embed/%3Cscript%3E']) {
    const response = await fetchEmbed(path);
    assert.equal(response.status, 404, path);
    assert.doesNotMatch(await response.text(), /<video|<script/);
  }
});

test('path determines scene even with conflicting query, and trailing slash works', async () => {
  assert.equal((await fetchEmbed('/embed/let-nad-obci/?scene=no-such-scene')).status, 200);
});

test('HEAD retains headers and status without a body; unsupported methods return 405', async () => {
  const response = await fetchEmbed('/embed/let-nad-obci', 'HEAD');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
  assert.equal((await fetchEmbed('/embed/missing', 'HEAD')).status, 404);
  const post = await fetchEmbed('/embed/let-nad-obci', 'POST');
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('Allow'), 'GET, HEAD');
});

test('asset failures are retryable 503 responses with framing and security headers', async () => {
  const broken = {ASSETS: {fetch: async () => new Response('unavailable', {status: 503})}};
  const response = await fetchEmbed('/embed/let-nad-obci', 'GET', broken);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('X-Frame-Options'), null);
  assert.equal(response.headers.get('Content-Security-Policy'), securityHeaders['Content-Security-Policy']);
});

test('non-embed routes pass through to static assets', async () => {
  const response = await fetchEmbed('/app.js');
  assert.equal(await response.text(), 'static asset');
  assert.equal(requests.at(-1), '/app.js');
});

test('static and Worker security policies stay consistent', async () => {
  const headers = await readFile(new URL('experiments/flight360/_headers', base), 'utf8');
  for (const [key, value] of Object.entries(securityHeaders)) assert.ok(headers.includes(`${key}: ${value}`));
  assert.match(headers, /! X-Frame-Options/);
});

test('published church exterior has validated source and tracked landmarks', async () => {
  const church = manifest.find(s => s.id === 'stitna-kostel-exterier');
  assert.equal(church.published, true);
  assert.equal(church.url, 'https://flight360-media.shieldio.cz/kostel%20exterier.mov');
  assert.ok(church.hotspots.length >= 10);
  assert.equal(new Set(manifest.map(s => s.id)).size, manifest.length);
  for (const point of church.hotspots) {
    assert.ok(point.keyframes.length >= 2, point.id);
    assert.equal(point.keyframes[0].time, point.start);
    assert.equal(point.keyframes.at(-1).time, point.end);
    assert.ok(point.keyframes.every(key => key.u >= 0 && key.u <= 1 && key.v >= 0 && key.v <= 1), point.id);
  }
  assert.equal((await fetchEmbed('/embed/stitna-kostel-exterier')).status, 200);
});

test('unpublished scenes cannot be embedded even when they have a media URL', async () => {
  const hidden = {id: 'not-public', title: 'Nezveřejněný záznam', published: false, url: 'https://flight360-media.shieldio.cz/example.mov'};
  const bindings = {ASSETS: {async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === '/videos.json') return Response.json([...manifest, hidden]);
    if (path === '/') return new Response(page);
    return new Response('static');
  }}};
  assert.equal((await fetchEmbed('/embed/not-public', 'GET', bindings)).status, 404);
});
