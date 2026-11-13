import test from 'node:test';
import assert from 'node:assert/strict';
import { check } from '../src/check.js';

// A slide is one still 16:9 picture in the house style: no motion, embedded
// fonts, and the same GitHub-safe checks as a scene.
test('the problems-solved slide is a still 1920 x 1080 picture that passes check', async () => {
  const { default: build, CARDS } = await import('../slides/problems-solved.js');
  const s = await build();
  assert.deepEqual([s.width, s.height], [1920, 1080]);
  assert.equal(s.anims, 0, 'a slide has no animation');
  const svg = s.toSVG();
  assert.deepEqual(check(svg, { maxBytes: 300_000 }), []);
  assert.equal(CARDS.length, 10);
  assert.ok(!svg.includes('>NEW<'), 'no card is flagged new');
  for (const line of ['Self-learning task manager and orchestration layer', 'hi@agentrq.com', 'Mustafa Turan', 'Founder @ Contextual, Inc.']) assert.ok(svg.includes(line), line);
});

test('the animated slide is a 16 s loop with the same picture at its poster frame', async () => {
  const { default: build, LOOP } = await import('../slides/problems-solved.js');
  const s = await build({ animated: true });
  assert.deepEqual([s.width, s.height, s.loop], [1920, 1080, LOOP]);
  assert.ok(s.anims > 0, 'the cards, mascots and stars move');
  assert.equal((s.toSVG().match(/fill="#86efac"/g) ?? []).length >= 10, true, 'every card gets a check');
  assert.ok(s.poster > 0 && s.poster < LOOP);
  const svg = s.toSVG();
  assert.deepEqual(check(svg, { maxBytes: 300_000 }), []);
  for (const line of ['Self-learning task manager and orchestration layer', 'hi@agentrq.com', 'agentrq.com']) assert.ok(svg.includes(line), line);
  for (const hidden of ['Mustafa Turan', 'Contextual']) assert.ok(!svg.includes(hidden), `${hidden} is left out of the animation`);
});
