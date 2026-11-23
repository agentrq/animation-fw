import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { check } from '../src/check.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'animfw-story-'));
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

// A voice timeline for `lines` in the shape build-voice.mjs writes: one 11 s beat per
// line over a 10 s line, each with its sentence as the caption.
function useTimeline(lines) {
  const starts = lines.map((_, i) => i * 11);
  const file = path.join(tmp, `timeline-${lines.length}-${lines[0].id}.json`);
  fs.writeFileSync(file, JSON.stringify({
    starts,
    end: lines.length * 11,
    nominal: lines.map(() => 10),
    sentences: starts.map((s, i) => [{ text: `Line ${lines[i].id}.`, from: s + 0.5, to: s + 10 }]),
  }));
  process.env.VIDEO_TIMELINE = file;
}

// Every story in videos/stories has its wrapper and its voice script, and builds.
const slugs = fs.readdirSync('videos/stories').filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();

test('there is a story for each of the 70 scripts', () => {
  assert.equal(slugs.length, 70);
});

for (const slug of slugs) {
  test(`story ${slug} builds on its voice timeline and passes check`, async () => {
    const data = read(`videos/stories/${slug}.json`);
    const { lines } = read(`videos/${slug}.narration.json`);
    assert.deepEqual(lines, data.lines.map(({ id, min, text }) => ({ id, min, text })), 'the voice script is the story\'s');
    useTimeline(data.lines);
    const { default: make } = await import(pathToFileURL(path.resolve(`videos/${slug}.js`)).href);
    const scene = make();
    assert.deepEqual([scene.width, scene.height], [1200, 675]);
    assert.equal(scene.videoEnd, data.lines.length * 11);
    const svg = scene.toSVG();
    assert.match(svg, new RegExp(`>Line ${data.lines.at(-1).id}\\.<`), 'captions');
    assert.deepEqual(check(svg, { maxBytes: 1_000_000 }), []);
  });
}

// A made-up story that leaves out every optional field and names an unknown element,
// so each falls back to its default.
const bare = {
  title: 'Bare Story',
  lines: [
    { id: 'one', min: 5, hed: ['One'], text: 'One.', scene: [
      { k: 'card', title: 'No dot, no sub, no chip' },
      { k: 'msg', from: 'agent', text: 'No name given' },
      { k: 'msg', from: 'user', text: 'Nor here' },
      { k: 'term', lines: [['plain', 'q']] },
    ] },
    { id: 'two', min: 5, hed: ['Two'], text: 'Two.', scene: [
      { k: 'kbd', keys: ['#'] },
      { k: 'bar', segs: [['all', 100, 'q']] },
      { k: 'count' },
    ] },
    { id: 'three', min: 5, hed: ['Three'], text: 'Three.', scene: [{ k: 'unknown' }] },
  ],
};

test('a story falls back to its defaults for anything it leaves out', async () => {
  const { storyScene } = await import('../videos/story.js');
  useTimeline(bare.lines);
  const svg = storyScene('bare', bare).toSVG();
  assert.match(svg, />bare story</, 'the kicker is the title, lower case');
  assert.match(svg, />No dot, no sub, no chip</);
  assert.match(svg, />Agent</, 'a message names its sender');
  assert.match(svg, />You</);
  for (const n of ['claude', 'codex', 'agy']) assert.match(svg, new RegExp(`>${n}<`), 'the default agents stand on the ground');
  assert.deepEqual(check(svg, { maxBytes: 600_000 }), []);
});

test('a story says when its voice or its stage does not fit', async () => {
  const { storyScene } = await import('../videos/story.js');
  useTimeline(bare.lines.slice(0, 1));
  assert.throws(() => storyScene('bare', bare), /bare: voice has 1 beats, story has 3/);
  const tall = { ...bare, lines: [{ ...bare.lines[0], scene: Array(6).fill({ k: 'btns', code: 'x', buttons: [] }) }] };
  useTimeline(tall.lines);
  assert.throws(() => storyScene('tall', tall), /tall beat "one": stage overflows by \d+px/);
});

test('story-wrap writes a story\'s wrapper and voice script, and says how to call it', () => {
  const cwd = fs.mkdtempSync(path.join(tmp, 'wrap-'));
  fs.mkdirSync(path.join(cwd, 'videos/stories'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'videos/stories/bare.json'), JSON.stringify(bare));
  const tool = path.resolve('tools/story-wrap.mjs');
  const out = execFileSync(process.execPath, [tool, 'bare'], { cwd, encoding: 'utf8' });
  assert.match(out, /wrote videos\/bare\.js and videos\/bare\.narration\.json \(3 words\)/);
  assert.equal(fs.readFileSync(path.join(cwd, 'videos/bare.js'), 'utf8'), "import { storyScene } from './story.js';\nexport default () => storyScene('bare');\n");
  assert.deepEqual(read(path.join(cwd, 'videos/bare.narration.json')), { lines: [{ id: 'one', min: 5, text: 'One.' }, { id: 'two', min: 5, text: 'Two.' }, { id: 'three', min: 5, text: 'Three.' }] });
  assert.throws(() => execFileSync(process.execPath, [tool], { cwd, stdio: 'pipe' }), (e) => e.status === 2 && /usage: story-wrap\.mjs <slug>/.test(e.stderr));
});
