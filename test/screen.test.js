import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { check } from '../src/check.js';
import { newScene } from '../kit/agentrq.js';
import { ease, fit, part, loadShots, Screen } from '../videos/screen.js';

// Two shots of a 400x200 app, with a few regions each. The images are only
// bytes here: the scene embeds them as they are.
function shotsDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'animfw-screen-'));
  const regions = { top: [0, 0, 400, 40], card: [20, 60, 100, 80], corner: [360, 160, 40, 40] };
  const manifest = {
    viewport: { width: 400, height: 200 },
    scale: 1,
    shots: {
      a: { file: 'a.webp', route: '/a', width: 400, height: 200, regions },
      b: { file: 'b.webp', route: '/b', width: 400, height: 200, regions: { ...regions, extra: [200, 100, 50, 50] } },
    },
  };
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(dir, 'a.webp'), 'AAAA');
  fs.writeFileSync(path.join(dir, 'b.webp'), 'BBBB');
  return dir;
}

const SAFE = { x: 0, y: 0, w: 800, h: 400 };
const screen = (opts = {}) => {
  const s = newScene({ description: 'screen test', loop: 24 });
  return { s, sc: new Screen(s, loadShots(shotsDir()), { safe: SAFE, pad: 0, ...opts }) };
};

test('ease follows the timeline curves', () => {
  assert.equal(ease('inOut', -1), 0);
  assert.equal(ease('inOut', 2), 1);
  assert.equal(ease('step', 0.5), 0);
  assert.ok(Math.abs(ease('linear', 0.3) - 0.3) < 1e-6);
  assert.ok(Math.abs(ease(undefined, 0.3) - 0.3) < 1e-6, 'no name is linear');
  assert.ok(Math.abs(ease('wobble', 0.3) - 0.3) < 1e-6, 'an unknown name is linear');
  assert.ok(Math.abs(ease('inOut', 0.5) - 0.5) < 1e-6);
  assert.ok(ease('in', 0.3) < 0.3 && ease('out', 0.3) > 0.3);
  assert.ok([0.5, 0.6, 0.7].some((p) => ease('back', p) > 1), 'back overshoots');
});

test('fit centres a box and keeps a close-up inside the window', () => {
  assert.deepEqual(fit([0, 0, 400, 200], SAFE), { x: 0, y: 0, scale: 2 });
  assert.deepEqual(fit([0, 0, 400, 200], SAFE, { pad: 50 }), { x: 100, y: 50, scale: 1.5 });
  // A corner box zoomed 4x would show past the left and top edges: it slides back in.
  assert.deepEqual(fit([0, 0, 100, 100], SAFE, { bounds: [0, 0, 400, 200] }), { x: 0, y: 0, scale: 4 });
  assert.deepEqual(fit([300, 100, 100, 100], SAFE, { bounds: [0, 0, 400, 200] }), { x: -800, y: -400, scale: 4 });
  // Smaller than the frame: no clamp, it stays centred.
  assert.deepEqual(fit([0, 0, 800, 800], SAFE, { bounds: [0, 0, 800, 800] }), { x: 200, y: 0, scale: 0.5 });
});

test('part grows a box or takes a fraction of it', () => {
  assert.deepEqual(part([10, 10, 100, 50]), [10, 10, 100, 50]);
  assert.deepEqual(part([10, 10, 100, 50], { by: 5 }), [5, 5, 110, 60]);
  assert.deepEqual(part([10, 10, 100, 50], { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }), [60, 35, 50, 25]);
});

test('loadShots reads the manifest and embeds each image once', () => {
  const dir = shotsDir();
  const shots = loadShots(dir);
  assert.deepEqual(shots.names, ['a', 'b']);
  assert.deepEqual(shots.viewport, { width: 400, height: 200 });
  assert.equal(shots.get('a').route, '/a');
  assert.throws(() => shots.get('zz'), /no shot "zz" in/);
  const href = shots.href('a');
  assert.equal(href, `data:image/webp;base64,${Buffer.from('AAAA').toString('base64')}`);
  fs.writeFileSync(path.join(dir, 'a.webp'), 'CHANGED');
  assert.equal(shots.href('a'), href, 'read once');
});

test('a screen says what is missing', () => {
  const { sc } = screen();
  assert.throws(() => sc.stateAt(0), /call show\(\) first/);
  assert.throws(() => sc.build(), /the screen shows nothing: call show\(\) first/);
  assert.throws(() => sc.show('zz', 0), /no shot "zz"/);
  sc.show('a', 0);
  assert.throws(() => sc.rect('nope', 0), /shot "a" has no region "nope"/);
  assert.throws(() => sc.rect({ region: 'nope', shot: 'b' }, 0), /shot "b" has no region "nope"/);
  assert.throws(() => sc.build(), /never on stage: call visible\(\) first/);
});

test('rect reads the window, boxes, regions and parts of them', () => {
  const { sc } = screen();
  sc.show('a', 0).show('b', 5);
  assert.deepEqual(sc.bounds, [0, -30, 400, 230]);
  assert.deepEqual(sc.rect('window', 0), [-12, -42, 424, 254]);
  assert.deepEqual(sc.rect([1, 2, 3, 4], 0), [1, 2, 3, 4]);
  assert.deepEqual(sc.rect('card', 0), [20, 60, 100, 80]);
  assert.deepEqual(sc.rect({ region: 'extra', shot: 'b', by: 10 }, 0), [190, 90, 70, 70]);
  assert.deepEqual(sc.rect({ region: 'card', y: 0.5, h: 0.5 }, 6), [20, 100, 100, 40]);
  assert.throws(() => sc.rect('extra', 1), /shot "a" has no region "extra"/, 'the region of the shot showing then');
  assert.equal(sc.stateAt(-1).name, 'a', 'before the first state, the first state');
});

test('the camera holds, moves on its curve and arrives', () => {
  const { sc } = screen();
  const home = sc.cameraAt(3);
  assert.deepEqual(home, fit([-12, -42, 424, 254], SAFE), 'with no moves, the whole window');
  sc.show('a', 0).cut(1, 'window').look(2, [0, 0, 200, 100], { dur: 2, ease: 'linear' });
  const start = sc.cameraAt(0);
  assert.deepEqual(start, sc.cameraAt(1.5), 'it holds the first framing until its first move');
  assert.deepEqual(sc.cameraAt(10), { x: 0, y: 0, scale: 4 });
  const mid = sc.cameraAt(3);
  assert.ok(Math.abs(mid.scale - (start.scale + 4) / 2) < 1e-6, 'half way, half the zoom');
  assert.equal(sc.moving(2.5, 3), true);
  assert.equal(sc.moving(4, 5), false);
  assert.deepEqual(sc.toScene(10, [10, 10]), [40, 40, 0, 0]);
  assert.throws(() => sc.callout(2.5, 3.5, 'card', { label: 'here' }), /callout "here" at 2.5s: the camera moves while it shows/);
  assert.throws(() => sc.callout(2.5, 3.5, 'card'), /callout "card"/);
});

test('a built screen has the window, each state, callouts and the pointer', () => {
  const { s, sc } = screen();
  sc.show('a', 0, { fade: 0 })
    .cut(0, [0, 0, 400, 200])
    .show('b', 4, { wipe: 1.5 })
    .show('a', 8)
    .callout(1, 3, 'card', { label: 'auto below' })
    .callout(1, 3, [0, 160, 400, 40], { label: 'auto above' })
    .callout(1, 3, [0, 0, 200, 200], { label: 'auto right' })
    .callout(1, 3, [200, 0, 200, 200], { label: 'auto left' })
    .callout(1, 3, 'corner', { label: 'left', side: 'left' })
    .callout(1, 3, 'card', { label: 'right', side: 'right' })
    .callout(1, 3, 'card', { label: 'above', side: 'above', dim: true })
    .callout(1, 3, 'corner')
    .away(1)
    .click(2, 'card')
    .click(3, 'corner', { glide: 0.5 })
    .away(3.5)
    .visible([[0, 6], [7, 12]], { fade: 0.3 })
    .build();
  const svg = s.toSVG();
  assert.match(svg, /<image id="shot-a" href="data:image\/webp;base64,/);
  assert.equal(svg.match(/<image /g).length, 2, 'each shot embedded once, however often it shows');
  assert.match(svg, /<clipPath id="wipe-1"><rect width="400" height="200" class="a a\d+"/);
  assert.match(svg, /clip-path="url\(#wipe-1\)"/);
  assert.match(svg, />app\.agentrq\.com\/b</);
  for (const label of ['auto below', 'auto above', 'auto right', 'auto left', 'left', 'right', 'above']) assert.match(svg, new RegExp(`>${label}<`));
  assert.match(svg, /fill-rule="evenodd"/, 'dim darkens the rest');
  assert.equal(svg.match(/<circle r="18"/g).length, 2, 'a ripple per click');
  assert.deepEqual(check(svg, { maxBytes: 200_000 }), []);
});

test('a screen without a pointer or moves still builds', () => {
  const { s, sc } = screen({ host: 'example.test' });
  sc.show('b', 2).visible([[1, 5]]).build();
  const svg = s.toSVG();
  assert.match(svg, />example\.test\/b</);
  assert.doesNotMatch(svg, /<circle r="18"/);
});
