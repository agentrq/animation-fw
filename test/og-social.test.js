import test from 'node:test';
import assert from 'node:assert/strict';
import { check } from '../src/check.js';

// The animated social image: the GitHub og size, one loop, GitHub-safe, and
// every part cut from inside the source image.
test('the og-social slide is a 1280 x 640 loop that passes check', async () => {
  const { default: build, W, H, LOOP, PARTS, HOLES, T } = await import('../slides/og-social.js');
  const s = await build();
  assert.deepEqual([s.width, s.height, s.loop], [W, H, LOOP]);
  assert.ok(s.poster > T.full + 0.5 && s.poster < T.out, 'the poster is the settled, whole image');
  assert.equal(PARTS.tiles.length, 12);
  for (const [x, y, w, h] of [PARTS.logo, PARTS.title, ...PARTS.pills, PARTS.card, PARTS.banner, ...PARTS.chips, ...PARTS.ticks, ...PARTS.tiles, ...HOLES]) {
    assert.ok(x >= 1 && y >= 1 && x + w < W && y + h < H, `${[x, y, w, h]} sits inside the image with a border to fill from`);
  }
  assert.deepEqual(check(s.toSVG()), []);
});

test('plate fills a box from the pixels around it', async () => {
  const { plate } = await import('../slides/og-social.js');
  // A 4 x 3 grey ramp, one channel, with a hole in the middle two pixels.
  const data = Buffer.from([0, 10, 20, 30, 0, 255, 255, 30, 0, 10, 20, 30]);
  const out = plate(data, 4, 1, [[1, 1, 2, 1]]);
  assert.deepEqual([...out.subarray(4, 8)], [0, 10, 20, 30]);
  assert.deepEqual([...data.subarray(5, 7)], [255, 255], 'the input is left alone');
});
