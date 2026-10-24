import test from 'node:test';
import assert from 'node:assert/strict';
import { el, raw, esc, num } from '../src/svg.js';
import { keyframes, normalize, repeat, easing } from '../src/timeline.js';
import { parseGrid, rects, sprite, size } from '../src/pixel.js';
import { check } from '../src/check.js';

test('el escapes text and attributes, keeps raw markup, drops empty attributes', () => {
  assert.equal(String(el('text', { x: 1.234, a: undefined, b: false, hidden: true }, 'a<b & "c"')),
    '<text x="1.23" hidden>a&lt;b &amp; &quot;c&quot;</text>');
  assert.equal(String(el('g', {}, raw('<rect/>'), null, [el('circle')])), '<g><rect/><circle/></g>');
  assert.equal(String(el('rect', { title: 'x"y' })), '<rect title="x&quot;y"/>');
  assert.equal(esc('<'), '&lt;');
  assert.equal(num(3), '3');
  assert.equal(num(0.125), '0.13');
});

test('keyframes hold the first key from 0% and the last until 100%', () => {
  const css = keyframes('a', [[2, { x: 10, opacity: 0 }], [4, { opacity: 1 }]], 8);
  assert.equal(css,
    '@keyframes a{0%{transform:translate(10px,0px) rotate(0deg) scale(1);opacity:0;animation-timing-function:steps(1,end)}'
    + '25%{transform:translate(10px,0px) rotate(0deg) scale(1);opacity:0}'
    + '50%{transform:translate(10px,0px) rotate(0deg) scale(1);opacity:1}'
    + '100%{transform:translate(10px,0px) rotate(0deg) scale(1);opacity:1}}');
});

test('keyframes put the arriving ease on the stop before, and back-fill late props', () => {
  const css = keyframes('b', [[0, { opacity: 1 }], [1, { fill: '#f00' }, 'step'], [2, { fill: '#0f0' }, 'inOut']], 2);
  assert.equal(css,
    '@keyframes b{0%{opacity:1;fill:#f00;animation-timing-function:steps(1,end)}'
    + '50%{opacity:1;fill:#f00;animation-timing-function:cubic-bezier(.6,0,.4,1)}'
    + '100%{opacity:1;fill:#0f0}}');
});

test('normalize merges keys at one second and refuses keys outside the period', () => {
  assert.deepEqual(normalize([[1, { x: 1 }], [0, { y: 2 }], [1, { y: 3 }, 'step']], 2),
    [{ t: 0, props: { y: 2 }, ease: undefined }, { t: 1, props: { x: 1, y: 3 }, ease: 'step' }]);
  assert.throws(() => normalize([[3, {}]], 2), /outside the 2s period/);
  assert.throws(() => keyframes('c', [], 2), /at least one key/);
});

test('repeat tiles a track and easing passes unknown curves through', () => {
  assert.deepEqual(repeat([[0, { y: 0 }], [0.5, { y: -2 }, 'step']], 1, 2),
    [[0, { y: 0 }, undefined], [0.5, { y: -2 }, 'step'], [1, { y: 0 }, undefined], [1.5, { y: -2 }, 'step']]);
  assert.equal(easing('ease-in'), 'ease-in');
  assert.equal(easing(), 'linear');
});

test('sprites merge runs across and down, and skip transparent pixels', () => {
  const art = `
    .##.
    .##.
    #..#
  `;
  assert.deepEqual(parseGrid(art), ['.##.', '.##.', '#..#']);
  assert.deepEqual(rects(parseGrid(art), { '#': 'red' }), [
    { x: 1, y: 0, w: 2, h: 2, fill: 'red' },
    { x: 0, y: 2, w: 1, h: 1, fill: 'red' },
    { x: 3, y: 2, w: 1, h: 1, fill: 'red' },
  ]);
  // A gap row breaks a column into two shapes.
  assert.equal(rects(['#', '.', '#'], { '#': 'red' }).length, 2);
  assert.throws(() => rects(['x'], {}), /no colour for 'x'/);
  assert.equal(String(sprite('#', { '#': 'red' }, { px: 2, x: 5 })),
    '<g class="px" transform="translate(5 0)"><rect x="0" y="0" width="2" height="2" fill="red"/></g>');
  assert.deepEqual(size(art, 3), { width: 12, height: 9 });
});

const ok = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" role="img" aria-label="x" data-loop="12"><title>x</title>'
  + "<defs><style>@font-face{font-family:'F-a';src:url(data:font/woff2;base64,AA)}.a0{animation:a0 3s linear infinite}</style></defs>"
  + '<use href="#p"/><text font-family="F-a,sans-serif">hi</text></svg>';

test('check passes a self-contained scene', () => {
  assert.deepEqual(check(ok), []);
});

test('check names everything an <img> will not run or load', () => {
  const bad = '<svg xmlns="http://www.w3.org/2000/svg" data-loop="12"><script>x</script><rect onclick="x"/>'
    + '<foreignObject/><style>@import url(https://x/y.css);.a{animation:b 5s linear}</style>'
    + '<image href="https://x/y.png"/><text font-family="Comic,serif">x</text></svg>';
  assert.deepEqual(check(bad, { maxBytes: 10 }), [
    `${(Buffer.byteLength(bad) / 1000).toFixed(0)} KB is over the 0 KB budget`,
    'has a <script>: GitHub strips it',
    'has an on* event attribute: GitHub strips it',
    'has a <foreignObject>: it does not render in an <img>',
    'has an @import: an <img> loads nothing from outside',
    'refers to https://x/y.css: an <img> loads nothing from outside',
    'refers to https://x/y.png: an <img> loads nothing from outside',
    'the root has no viewBox',
    'the root needs role="img" and an aria-label',
    'has no <title>',
    'b runs every 5s, which does not divide the 12s loop',
    'font Comic is not embedded',
  ]);
});
