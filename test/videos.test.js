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

// The videos told over real screens of the app, with a caption to find and a chapter chip.
for (const [name, line, chip] of [['pano-collaboration', 'kanban', '05 / STATUS'], ['teams-collaboration', 'merge', '07 / YOU STAY IN CONTROL'], ['workspaces-memory-skills', 'mem-save', '05 / YOU STAY IN CONTROL'], ['see-every-agent', 'wait-allow', '06 / YOU STAY IN CONTROL'], ['automate-work', 'ev-trigger', '05 / YOU STAY IN CONTROL'], ['run-anywhere', 'start-term', '05 / YOU STAY IN CONTROL'], ['into-your-tools', 'slack-t', '05 / YOU STAY IN CONTROL']]) {
  test(`${name} builds on real screens, with its own ground and caption band`, async () => {
    // One beat per narration line, 11 s each, so every stage event lands inside its beat.
    const ids = JSON.parse(fs.readFileSync(`videos/${name}.narration.json`, 'utf8')).lines.map((l) => l.id);
    const beats = ids.map((_, i) => i * 11);
    const long = {
      starts: beats,
      end: ids.length * 11,
      nominal: ids.map(() => 10),
      sentences: beats.map((s, i) => [{ text: `Line ${ids[i]}.`, from: s + 0.5, to: s + 10 }]),
    };
    const saved = process.env.VIDEO_TIMELINE;
    const own = path.join(path.dirname(file), `${name}-timeline.json`);
    fs.writeFileSync(own, JSON.stringify(long));
    process.env.VIDEO_TIMELINE = own;
    try {
      const { default: make, SHOTS } = await import(pathToFileURL(path.resolve(`videos/${name}.js`)).href);
      const scene = make();
      assert.equal(scene.loop % 12, 0);
      const svg = scene.toSVG();
      const shots = JSON.parse(fs.readFileSync(path.join(SHOTS, 'manifest.json'), 'utf8')).shots;
      for (const shot of Object.keys(shots)) assert.match(svg, new RegExp(`<image id="shot-${shot}" `), `shot ${shot} is used`);
      assert.match(svg, new RegExp(`>Line ${line}\\.<`), 'captions');
      assert.match(svg, /<rect x="0" y="595" width="1200" height="80"/, 'the caption band sits under the screens');
      assert.ok(svg.includes(`>${chip}<`), 'the chapter chip');
      assert.deepEqual(check(svg, { maxBytes: 12_000_000 }), []);
    } finally {
      process.env.VIDEO_TIMELINE = saved;
    }
  });
}

test('beatsById names beats by their narration ids', async () => {
  const { loadTimeline, beatsById } = await import('../videos/lib.js');
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, ['intro', 'middle']);
  assert.equal(start('middle'), 7);
  assert.equal(end('intro'), 7);
  assert.equal(at('middle'), 7);
  assert.equal(at('middle', 2), tl.T(1, 2));
  assert.throws(() => at('outro'), /no beat "outro" in the narration/);
});
