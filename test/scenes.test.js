import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { check } from '../src/check.js';
import { W, H, LOOP } from '../kit/agentrq.js';

// Every scene keeps to the house canvas and loop, and ships GitHub-safe.
const dir = new URL('../scenes/', import.meta.url);
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  test(`${file} builds in the house style and passes check`, async () => {
    const scene = await (await import(pathToFileURL(path.join(dir.pathname, file)).href)).default();
    assert.deepEqual([scene.width, scene.height, scene.loop], [W, H, LOOP]);
    assert.ok(scene.poster > 0 && scene.poster < LOOP, 'the poster frame is a moment inside the loop');
    assert.deepEqual(check(scene.toSVG(), { maxBytes: 300_000 }), []);
  });
}

test('a mascot can say a bubble of its own', async () => {
  const { newScene, mascot, MASCOTS } = await import('../kit/agentrq.js');
  const s = newScene({ description: 'x', poster: 1 });
  mascot(s, MASCOTS[0], 0, { say: [['zZ', [[0, 2]]], ['!!', [[3, 4]], '#f00']] });
  const svg = s.toSVG();
  assert.match(svg, />zZ</);
  assert.match(svg, /width="38"[^>]*fill="#f00"/);
});

test('a sleeping mascot keeps its eyes shut, and only when asked', async () => {
  const { newScene, mascot, MASCOTS } = await import('../kit/agentrq.js');
  const draw = (opts) => {
    const s = newScene({ description: 'x', poster: 1 });
    mascot(s, MASCOTS[0], 0, opts);
    return s.toSVG();
  };
  const awake = draw({});
  const asleep = draw({ sleep: [[0, 5]] });
  assert.equal((awake.match(/@keyframes/g) ?? []).length + 1, (asleep.match(/@keyframes/g) ?? []).length);
  assert.equal((asleep.match(/fill="#d97757"/g) ?? []).length, (awake.match(/fill="#d97757"/g) ?? []).length + 2);
});
