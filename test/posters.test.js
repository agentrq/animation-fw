import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { check } from '../src/check.js';
import { POSTERS, headlineSize, cropHref, posterScene, main } from '../videos/posters.js';

const manifest = (slug) => JSON.parse(fs.readFileSync(`videos/screens/${slug}/manifest.json`, 'utf8'));

test('every poster crops a shot its video has, inside the shot', () => {
  for (const p of POSTERS) {
    const m = manifest(p.slug);
    assert.ok(m.shots[p.shot], `${p.slug}: no shot ${p.shot}`);
    const [x, y, w, h] = p.crop;
    assert.ok(x >= 0 && y >= 0 && x + w <= m.viewport.width && y + h <= m.viewport.height, `${p.slug}: the crop leaves the shot`);
    assert.equal(p.headline.length, 2);
  }
});

test('a headline is at most 88px, smaller when a line is long', () => {
  assert.equal(headlineSize(['See every', 'agent.']), 88);
  const long = headlineSize(['Agents that', 'work together.']);
  assert.ok(long < 88);
  assert.ok(14 * 0.52 * long <= 520, 'the longest line fits before the screen');
});

test('a crop comes back as a WebP data URI, and an unknown shot says so', async () => {
  const href = await cropHref('run-anywhere', 'term-4', [60, 30, 100, 50]);
  assert.match(href, /^data:image\/webp;base64,/);
  await assert.rejects(cropHref('run-anywhere', 'no-such-shot', [0, 0, 10, 10]), /no shot "no-such-shot"/);
});

test('a poster is one still frame that passes check', () => {
  for (const p of POSTERS) {
    const svg = posterScene(p, 'data:image/webp;base64,AAAA').toSVG();
    assert.ok(svg.includes(`>${p.headline[1]}<`), `${p.slug}: its headline`);
    assert.ok(svg.includes(`>${p.chip}<`), `${p.slug}: its chip`);
    assert.deepEqual(check(svg, { maxBytes: 2_000_000 }), []);
  }
});

test('the CLI renders the posters it is given, at 1280x720', async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'posters-'));
  const said = [];
  const files = await main([out, 'run-anywhere'], (x) => said.push(x));
  assert.deepEqual(files, [path.join(out, 'run-anywhere-youtube.jpg')]);
  assert.equal(said[0], files[0]);
  for (const ext of ['jpg', 'png']) {
    const meta = await sharp(path.join(out, `run-anywhere-youtube.${ext}`)).metadata();
    assert.deepEqual([meta.width, meta.height], [1280, 720]);
  }
});
