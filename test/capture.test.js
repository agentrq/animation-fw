import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { FREEZE_CSS, regionSpec, readManifest, formatManifest, openShooter } from '../src/capture.js';

// A tiny app: it shows the cookie and the stored theme it was given, a button
// that counts its clicks, a field, and a box at a known place.
const PAGE = `<!doctype html><html><head><style>
  body { margin: 0; font: 14px sans-serif; }
  #box { position: absolute; left: 10px; top: 20px; width: 100px; height: 50px; background: #0af; }
  #go { position: absolute; left: 10px; top: 100px; }
  #field { position: absolute; left: 10px; top: 140px; }
</style></head><body>
  <div id="box"></div>
  <p id="seen" style="position:absolute;left:150px;top:10px"></p>
  <button id="go">go</button>
  <input id="field">
  <script>
    document.getElementById('seen').textContent = document.cookie + '|' + localStorage.getItem('theme');
    let n = 0;
    document.getElementById('go').addEventListener('click', () => { document.getElementById('go').textContent = 'clicked ' + (++n); });
  </script>
</body></html>`;

let server;
let baseURL;
test.before(async () => {
  server = http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(PAGE); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  baseURL = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'animfw-capture-'));

test('regionSpec reads a selector, a spec or a fixed box', () => {
  assert.deepEqual(regionSpec('#a'), { sel: '#a', nth: 0, pad: 0 });
  assert.deepEqual(regionSpec({ sel: '.c', nth: 2, optional: true }), { sel: '.c', nth: 2, pad: 0, optional: true });
  assert.deepEqual(regionSpec([1, 2, 3, 4]), { box: [1, 2, 3, 4] });
});

test('readManifest starts empty and formatManifest keeps each box on one line', () => {
  const dir = tmp();
  assert.deepEqual(readManifest(dir), { shots: {} });
  const m = { viewport: { width: 10, height: 5 }, shots: { a: { regions: { r: [1, -2.5, 3, 4] }, file: 'a.webp' } } };
  const text = formatManifest(m);
  assert.match(text, /"r": \[1, -2\.5, 3, 4\]/);
  assert.ok(text.endsWith('\n'));
  assert.deepEqual(JSON.parse(text), m);
  fs.writeFileSync(path.join(dir, 'manifest.json'), text);
  assert.deepEqual(readManifest(dir), m);
});

test('a shooter signs in, acts, measures regions and writes a lossless shot', async () => {
  const outDir = tmp();
  const logs = [];
  const shooter = await openShooter({
    baseURL, outDir, viewport: { width: 320, height: 200 }, scale: 2, settle: 0,
    cookies: [{ name: 'at', value: 'tok', url: baseURL }], storage: { theme: 'dark' }, log: (m) => logs.push(m),
  });
  const shot = await shooter.shoot({
    name: 'home',
    route: '/',
    actions: [
      { click: '#go' }, { fill: '#field', text: 'hi' }, { type: '#field', text: '!' }, { hover: '#go' },
      { press: 'Tab' }, { eval: (t) => { document.title = t; }, arg: 'Shot' }, { waitFor: '#box' }, { wait: 5 },
    ],
    regions: { box: '#box', padded: { sel: '#box', pad: 5 }, fixed: [1, 2, 3, 4], gone: { sel: '#nope', optional: true } },
  });
  assert.equal(await shooter.page.textContent('#seen'), 'at=tok|dark', 'the cookie and the storage reach the page');
  assert.equal(await shooter.page.textContent('#go'), 'clicked 1');
  assert.equal(await shooter.page.inputValue('#field'), 'hi!');
  assert.equal(await shooter.page.title(), 'Shot');
  assert.deepEqual(shot.regions, { box: [10, 20, 100, 50], padded: [5, 15, 110, 60], fixed: [1, 2, 3, 4] });
  assert.deepEqual([shot.file, shot.route, shot.width, shot.height], ['home.webp', '/', 640, 400]);
  const meta = await sharp(path.join(outDir, 'home.webp')).metadata();
  assert.deepEqual([meta.format, meta.width, meta.height], ['webp', 640, 400]);
  assert.match(logs[0], /^shot home \(\d+ KB\)$/);

  // State carries over: a second shot without a route, after a goto action, with the mouse left alone.
  const again = await shooter.shoot({ name: 'again', actions: [{ goto: '/two' }], mouse: null, wait: 0 });
  assert.equal(again.route, '/two');

  await assert.rejects(shooter.shoot({}), /a shot needs a name/);
  await assert.rejects(shooter.shoot({ name: 'x', actions: [{ jump: true }] }), /unknown action \{"jump":true\}/);
  await assert.rejects(shooter.shoot({ name: 'x', regions: { gone: '#nope' } }), /x: region "gone" \(#nope\) is not on the page/);
  const written = await shooter.close();
  assert.deepEqual(Object.keys(written.shots), ['home', 'again']);
  assert.deepEqual(readManifest(outDir), written);
  assert.match(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'), /"box": \[10, 20, 100, 50\]/);

  // A later run adds to the manifest instead of replacing it; no css and the default log.
  const more = await openShooter({ baseURL, outDir, viewport: { width: 320, height: 200 }, scale: 1, css: '', launch: (o) => chromium.launch(o) });
  await more.shoot({ name: 'plain', route: '/' });
  const merged = await more.close();
  assert.deepEqual(Object.keys(merged.shots), ['home', 'again', 'plain']);
  assert.equal(merged.scale, 1);
});

test('the freeze css stops carets, transitions and pulses', () => {
  assert.match(FREEZE_CSS, /caret-color: transparent/);
  assert.match(FREEZE_CSS, /transition: none/);
  assert.match(FREEZE_CSS, /\.animate-pulse/);
});
