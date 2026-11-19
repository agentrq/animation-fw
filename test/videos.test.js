import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { check } from '../src/check.js';

// A voice timeline in the shape build-voice.mjs writes: nine beats of 7 s,
// each with two captioned sentences.
const starts = Array.from({ length: 9 }, (_, i) => i * 7);
const timeline = {
  starts,
  end: 63,
  nominal: Array(9).fill(5),
  sentences: starts.map((s, i) => [
    { text: `Beat ${i} first sentence.`, from: s + 1, to: s + 3.5 },
    { text: `Beat ${i} second sentence.`, from: s + 3.5, to: s + 6 },
  ]),
};
const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'animfw-video-')), 'timeline.json');
fs.writeFileSync(file, JSON.stringify(timeline));
process.env.VIDEO_TIMELINE = file;

for (const name of ['overview', 'status-dots']) {
  test(`${name} video builds on the voice timeline and passes check`, async () => {
    const { default: make } = await import(pathToFileURL(path.resolve(`videos/${name}.js`)).href);
    const scene = make();
    assert.deepEqual([scene.width, scene.height], [1200, 675]);
    assert.equal(scene.loop % 12, 0, 'the loop holds every star blink period');
    assert.ok(scene.videoEnd <= scene.loop);
    const svg = scene.toSVG();
    assert.match(svg, />Beat 4 second sentence\.</, 'the narration is on screen as captions');
    assert.deepEqual(check(svg, { maxBytes: 600_000 }), []);
  });
}

test('without a timeline a video scene says what to set', async () => {
  const saved = process.env.VIDEO_TIMELINE;
  delete process.env.VIDEO_TIMELINE;
  const { loadTimeline } = await import('../videos/lib.js');
  assert.throws(() => loadTimeline(), /VIDEO_TIMELINE/);
  process.env.VIDEO_TIMELINE = saved;
});
