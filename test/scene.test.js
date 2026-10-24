import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Scene, FONTS, check, sprite } from '../src/index.js';
import { frames, gif, sheet } from '../src/render.js';

function demo() {
  const s = new Scene({ width: 200, height: 100, loop: 4, description: 'A red square slides right.', background: '#000', poster: 2 })
    .font('pixel', FONTS.silkscreen)
    .font('bold', FONTS.inter, { axes: { wght: 700, opsz: 28 } });
  s.add(
    s.text('Hi', { x: 10, y: 20, font: 'pixel', size: 16 }),
    s.anim(sprite('##\n##', { '#': '#f00' }, { px: 10 }), [[0, { x: 0, y: 50 }], [2, { x: 150 }, 'inOut']]),
    s.anim(s.text('!', { font: 'bold' }), [[0, { opacity: 1 }], [0.5, { opacity: 0 }, 'step']], { period: 1, origin: 'center' }),
  );
  return s;
}

test('a scene embeds only the fonts it uses, cut to their characters, and passes check', () => {
  process.env.ANIMFW_CACHE = fs.mkdtempSync(path.join(os.tmpdir(), 'animfw-cache-'));
  const s = demo().font('unused', FONTS.jetbrainsMono);
  const svg = s.toSVG();
  assert.deepEqual(check(svg), []);
  assert.equal((svg.match(/@font-face/g) || []).length, 2);
  assert.match(svg, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 200 100" width="200" height="100" role="img" aria-label="A red square slides right." data-loop="4"><title>/);
  assert.match(svg, /\.a1\{animation:a1 1s linear infinite;transform-box:fill-box;transform-origin:center\}/);
  assert.match(svg, /animation-delay:-2s!important/);
  assert.ok(Buffer.byteLength(svg) < 20_000, `${Buffer.byteLength(svg)} bytes: fonts were not cut down`);
  // Cached on the second build.
  assert.equal(fs.readdirSync(process.env.ANIMFW_CACHE).length, 2);
  assert.equal(demo().toSVG(), svg);
  fs.rmSync(process.env.ANIMFW_CACHE, { recursive: true });
  delete process.env.ANIMFW_CACHE;
});

test('a scene refuses what would break the loop or the alt text', () => {
  assert.throws(() => new Scene({ width: 1, height: 1, loop: 4 }), /needs a description/);
  const s = demo();
  assert.throws(() => s.anim('x', [[0, {}]], { period: 3 }), /does not divide the 4s loop/);
  assert.throws(() => s.text('x', { font: 'nope' }), /font "nope" is not registered/);
});

test('render gives exact frames, a GIF and a labelled sheet', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'animfw-'));
  const file = path.join(dir, 'demo.svg');
  fs.writeFileSync(file, demo().toSVG());
  // The first frame asked for is not the start: it must be exact too.
  const [end, start] = await frames(file, [2, 0], { width: 200, height: 100 });
  const sharp = (await import('sharp')).default;
  const red = async (png) => {
    const { data } = await sharp(png).extract({ left: 160, top: 60, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
    return data[0] > 200 && data[1] < 50;
  };
  assert.equal(await red(start), false);
  assert.equal(await red(end), true);
  const anim = await sharp(await gif([start, end], { width: 100 }), { animated: true }).metadata();
  assert.equal(anim.pages, 2);
  assert.equal(anim.width, 100);
  const sh = await sharp(await sheet([start, end], [0, 2], { cols: 2, width: 100 })).metadata();
  assert.equal(sh.width, 200);
  fs.rmSync(dir, { recursive: true });
});
