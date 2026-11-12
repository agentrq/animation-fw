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
