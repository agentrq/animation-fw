import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { check } from '../src/check.js';
import { Scene, el } from '../src/index.js';
import { parseArgs } from '../src/args.js';
import { QUALITY, resolveQuality, videoSize, defaultWorkers, ffmpegBin, voiceTools } from '../src/media.js';
import {
  captionText, splitSentences, wavSeconds, buildTimeline, mixFilter, validateNarration, buildVoice, LEAD, TAIL,
} from '../src/voice.js';
import { inOrder, renderVideo } from '../src/video.js';
import { scaffoldVideo } from '../src/scaffold.js';
import { makeVideo, voiceFor } from '../src/make.js';
import { piperAsset } from '../src/setup.js';

const root = path.resolve(import.meta.dirname, '..');
// Scratch space inside the repo (git-ignored .cache) so scaffolded scenes can import the kit.
const scratch = () => { fs.mkdirSync(path.join(root, '.cache'), { recursive: true }); return fs.mkdtempSync(path.join(root, '.cache/test-')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ffmpeg = null;
try { ffmpeg = ffmpegBin(); } catch { /* the integration tests skip without it */ }
const needsFfmpeg = { skip: ffmpeg ? false : 'no ffmpeg (set FFMPEG or npm install)' };

// A 16-bit mono WAV of silence; `streamed` leaves the sizes unknown, as a pipe does.
function wav(seconds, { rate = 22050, streamed = false } = {}) {
  const data = Math.round(seconds * rate) * 2;
  const b = Buffer.alloc(44 + data);
  b.write('RIFF', 0, 'latin1'); b.writeUInt32LE(streamed ? 0xffffffff : 36 + data, 4); b.write('WAVE', 8, 'latin1');
  b.write('fmt ', 12, 'latin1'); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36, 'latin1'); b.writeUInt32LE(streamed ? 0xffffffff : data, 40);
  return b;
}

// ------------------------------------------------------------------ settings

test('quality names resolve, overrides win, and a typo says what the choices are', () => {
  assert.deepEqual(resolveQuality('hq'), { name: 'hq', ...QUALITY.hq });
  assert.equal(resolveQuality('draft').preset, 'ultrafast');
  const q = resolveQuality('web', { fps: '24', crf: '18', size: '1280x720' });
  assert.deepEqual([q.fps, q.crf, q.width, q.height], [24, 18, 1280, 720]);
  assert.throws(() => resolveQuality('hd'), /unknown quality "hd".*draft, web, hq/);
  assert.throws(() => resolveQuality('hq', { size: '1280' }), /WIDTHxHEIGHT/);
  assert.throws(() => resolveQuality('hq', { fps: '0' }), /fps/);
});

test('a scene is shown at its own aspect ratio, in even pixels', () => {
  assert.deepEqual(videoSize(1200, 675, 1920), { width: 1920, height: 1080 });
  assert.deepEqual(videoSize(1200, 675, 960), { width: 960, height: 540 });
  assert.deepEqual(videoSize(1200, 440, 1000), { width: 1000, height: 366 }); // 366.67 -> the nearest even
});

test('workers are half the CPUs, between 1 and 8', () => {
  assert.equal(defaultWorkers(1), 1);
  assert.equal(defaultWorkers(4), 2);
  assert.equal(defaultWorkers(20), 8);
});

test('the voice tools are looked for where the setup puts them, and a miss says what to run', () => {
  assert.throws(() => voiceTools({ ANIMFW_VOICE_HOME: '/nonexistent/animfw' }), /node bin\/video\.js setup/);
  const dir = scratch();
  fs.writeFileSync(path.join(dir, 'p'), ''); fs.writeFileSync(path.join(dir, 'v.onnx'), '');
  assert.deepEqual(voiceTools({ PIPER: path.join(dir, 'p'), VOICE: path.join(dir, 'v.onnx') }), { piper: path.join(dir, 'p'), voice: path.join(dir, 'v.onnx') });
  fs.rmSync(dir, { recursive: true });
});

test('every platform with a Piper build maps to its release file, others say so', () => {
  assert.equal(piperAsset('linux', 'arm64'), 'piper_linux_aarch64.tar.gz');
  assert.equal(piperAsset('linux', 'x64'), 'piper_linux_x86_64.tar.gz');
  assert.equal(piperAsset('darwin', 'arm64'), 'piper_macos_aarch64.tar.gz');
  assert.throws(() => piperAsset('win32', 'x64'), /no Piper build/);
});

test('command-line flags: values, switches, and what is not allowed', () => {
  const { opts, pos } = parseArgs(['videos/a.js', '--draft', '--workers', '3', '--out', 'x', 'out.mp4']);
  assert.deepEqual(pos, ['videos/a.js', 'out.mp4']);
  assert.deepEqual(opts, { draft: true, workers: '3', out: 'x' });
  assert.throws(() => parseArgs(['--nope']), /unknown option --nope/);
  assert.throws(() => parseArgs(['a.js', '--out']), /--out needs a value/);
  assert.throws(() => parseArgs(['a.js', '--out', '--draft']), /--out needs a value/);
});

// ------------------------------------------------------------------ ordering

test('frames drawn out of order are written in order, one at a time, with a bounded backlog', async () => {
  const written = [];
  let writing = 0;
  let maxWriting = 0;
  let backlog = 0;
  let maxBacklog = 0;
  await inOrder({
    count: 60,
    workers: 5,
    window: 8,
    render: async (i) => { await sleep((i * 7) % 13); backlog++; maxBacklog = Math.max(maxBacklog, backlog); return `frame${i}`; },
    write: async (item, i) => {
      maxWriting = Math.max(maxWriting, ++writing);
      await sleep(i % 3);
      written.push([item, i]);
      writing--; backlog--;
    },
  });
  assert.deepEqual(written.map(([, i]) => i), Array.from({ length: 60 }, (_, i) => i));
  assert.ok(written.every(([item, i]) => item === `frame${i}`));
  assert.equal(maxWriting, 1);
  assert.ok(maxBacklog <= 8 + 5, `at most window + lanes frames held, held ${maxBacklog}`);
});

test('a failing frame stops the render and is the error thrown', async () => {
  const drawn = [];
  await assert.rejects(inOrder({
    count: 100,
    workers: 4,
    render: async (i) => { if (i === 10) throw new Error('boom 10'); await sleep(2); drawn.push(i); return i; },
    write: async () => {},
  }), /boom 10/);
  assert.ok(drawn.length < 100, 'the lanes stopped taking frames');
});

test('a failing write is thrown too, and no frames means nothing to do', async () => {
  await assert.rejects(inOrder({ count: 5, workers: 2, render: async (i) => i, write: async (_, i) => { if (i === 2) throw new Error('pipe closed'); } }), /pipe closed/);
  await inOrder({ count: 0, workers: 3, render: async () => assert.fail('no frames'), write: async () => assert.fail('no frames') });
});

// --------------------------------------------------------------------- voice

test('the spoken name becomes the written one in captions, longest match first', () => {
  assert.equal(captionText('Try it at Agent R Q dot com.'), 'Try it at agentrq.com.');
  assert.equal(captionText('Agent R Q puts them on one board.'), 'AgentRQ puts them on one board.');
  assert.equal(captionText('Say Foo.', { Foo: 'Bar' }), 'Say Bar.');
});

test('a line splits into sentences that share its speech by length and leave no gaps', () => {
  const parts = splitSentences('One. Two words here? A much longer third sentence!', 10, 6);
  assert.equal(parts.length, 3);
  assert.equal(parts[0].from, 10);
  assert.ok(Math.abs(parts.at(-1).to - 16) < 0.01);
  parts.slice(1).forEach((p, i) => assert.ok(Math.abs(p.from - parts[i].to) < 0.002, 'each starts where the last ended'));
  assert.ok(parts[2].to - parts[2].from > parts[0].to - parts[0].from, 'longer text gets more time');
});

test('WAV length comes from the header, including a stream with unknown size', () => {
  assert.ok(Math.abs(wavSeconds(wav(2.5)) - 2.5) < 0.001);
  assert.ok(Math.abs(wavSeconds(wav(1.25, { streamed: true })) - 1.25) < 0.001);
  assert.throws(() => wavSeconds(Buffer.from('not a wav file at all, really')), /not a WAV/);
});

test('beats last as long as their speech needs but never less than their min', () => {
  const lines = [{ id: 'a', min: 4, text: 'Short.' }, { id: 'b', min: 2, text: 'Longer one. And more.' }];
  const { timeline, clips } = buildTimeline(lines, [1, 5]);
  assert.deepEqual(timeline.starts, [0, 4]);                       // 1 + lead + tail < 4
  assert.equal(timeline.end, +(4 + LEAD + 5 + TAIL).toFixed(3));   // speech decides
  assert.deepEqual(timeline.nominal, [4, 2]);
  assert.deepEqual(clips.map((c) => c.at), [LEAD, 4 + LEAD]);
  assert.equal(timeline.sentences[1][0].from, 4 + LEAD);
});

test('the mix puts every clip at its moment and ends when the video does', () => {
  const f = mixFilter([{ at: 1 }, { at: 8.2504 }], 12.5);
  assert.match(f, /\[0:a\]aresample=44100,adelay=1000:all=1\[a0\]/);
  assert.match(f, /adelay=8250:all=1\[a1\]/);
  assert.match(f, /amix=inputs=2:normalize=0,apad=whole_dur=12\.500,alimiter=limit=0\.8:level=disabled\[o\]$/);
});

test('a narration script is checked for the mistakes that cost a render', () => {
  const ok = { lines: [{ id: 'a', min: 4, text: 'Hello.' }] };
  assert.deepEqual(validateNarration(ok).lines, ok.lines);
  assert.throws(() => validateNarration({ lines: [] }), /non-empty/);
  assert.throws(() => validateNarration({ lines: [{ id: 'a', text: 'x.' }, { id: 'a', text: 'y.' }] }), /id "a" is used twice/);
  assert.throws(() => validateNarration({ lines: [{ id: 'a', text: ' ' }] }), /needs text/);
  assert.throws(() => validateNarration({ lines: [{ id: 'a', min: -1, text: 'x.' }] }), /min is a length/);
  assert.throws(() => validateNarration({ lines: [{ id: 'a', text: 'Try agentrq.com.' }] }), /"Agent R Q"/);
  assert.equal(validateNarration({ lines: ok.lines, captions: { Foo: 'Bar' } }).captions.Foo, 'Bar');
});

for (const name of ['overview', 'status-dots']) {
  test(`${name}: the script has a line for each beat the scene shows, and is valid`, () => {
    const { lines } = validateNarration(JSON.parse(fs.readFileSync(`videos/${name}.narration.json`, 'utf8')), name);
    const beats = [...fs.readFileSync(`videos/${name}.js`, 'utf8').matchAll(/\{ at: \[(\d+)/g)].map((m) => Number(m[1]));
    assert.deepEqual(beats, lines.map((_, i) => i), 'one headline per narration line, in order');
  });
}

// A stand-in for Piper: writes a WAV as long as the text is (20 characters a second)
// and notes what it was asked to say.
function fakeVoice(dir) {
  fs.writeFileSync(path.join(dir, 'fake-piper.cjs'), `
const fs = require('fs');
const args = process.argv.slice(2);
const out = args[args.indexOf('--output_file') + 1];
let text = '';
process.stdin.on('data', (d) => { text += d; });
process.stdin.on('end', () => {
  if (process.env.FAKE_PIPER_LOG) fs.appendFileSync(process.env.FAKE_PIPER_LOG, text + '\\n');
  const rate = 22050; const n = Math.round(Math.max(0.5, text.length / 20) * rate);
  const b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(i / 20) * 6000), 44 + i * 2);
  fs.writeFileSync(out, b);
});`);
  const piper = path.join(dir, 'piper');
  fs.writeFileSync(piper, `#!/bin/sh\nexec node "${path.join(dir, 'fake-piper.cjs')}" "$@"\n`, { mode: 0o755 });
  const voice = path.join(dir, 'voice.onnx');
  fs.writeFileSync(voice, 'model');
  return { PIPER: piper, PIPER_VOICE: voice, ANIMFW_VOICE_CACHE: path.join(dir, 'voice-cache') };
}

test('the voice is spoken once per line, reused when unchanged, and only a changed line is spoken again', needsFfmpeg, () => {
  const dir = scratch();
  const env = { ...process.env, ...fakeVoice(dir), FFMPEG: ffmpeg };
  const log = path.join(dir, 'said.log');
  process.env.FAKE_PIPER_LOG = log;
  const narration = path.join(dir, 'x.narration.json');
  const write = (b) => fs.writeFileSync(narration, JSON.stringify({ lines: [{ id: 'a', min: 3, text: 'First line here.' }, { id: 'b', min: 3, text: b }] }));
  const said = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n') : []);
  const quiet = () => {};
  try {
    write('Second line is here.');
    const first = buildVoice({ narrationFile: narration, outDir: path.join(dir, 'out'), env, log: quiet });
    assert.equal(first.cached, false);
    assert.deepEqual(said(), ['First line here.', 'Second line is here.']);
    assert.equal(first.timeline.starts.length, 2);
    const r = spawnSync(ffmpeg, ['-hide_banner', '-i', first.audioFile], { encoding: 'utf8' });
    const [, h, m, s] = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr);
    assert.ok(Math.abs(Number(h) * 3600 + Number(m) * 60 + Number(s) - first.timeline.end) < 0.1, 'the voice track is as long as the video');

    const again = buildVoice({ narrationFile: narration, outDir: path.join(dir, 'out'), env, log: quiet });
    assert.equal(again.cached, true);
    assert.equal(said().length, 2, 'nothing was spoken again');

    write('A different second line.');
    const third = buildVoice({ narrationFile: narration, outDir: path.join(dir, 'out'), env, log: quiet });
    assert.equal(third.cached, false);
    assert.deepEqual(said().slice(2), ['A different second line.'], 'only the changed line was spoken');
  } finally {
    delete process.env.FAKE_PIPER_LOG;
    fs.rmSync(dir, { recursive: true });
  }
});

test('a scene with neither narration nor a given voice says what to write', () => {
  assert.throws(() => voiceFor({ scenePath: 'videos/none.js', env: {} }), /no voice for none: write videos\/none\.narration\.json/);
  const got = voiceFor({ scenePath: 'videos/overview.js', audio: 'a.wav', timeline: 't.json', env: {} });
  assert.deepEqual([path.basename(got.audioFile), path.basename(got.timelineFile)], ['a.wav', 't.json']);
});

// --------------------------------------------------------------------- scaffold

test('a scaffolded story refuses bad or taken names, and its scene builds and passes check', async () => {
  const dir = scratch();
  try {
    assert.throws(() => scaffoldVideo('Bad Name', { dir }), /lower-case words/);
    const [scene, narration] = scaffoldVideo('demo-story', { dir: path.join(dir, 'videos') });
    assert.throws(() => scaffoldVideo('demo-story', { dir: path.join(dir, 'videos') }), /already exists/);
    const { lines } = validateNarration(JSON.parse(fs.readFileSync(narration, 'utf8')), 'demo-story');
    const starts = lines.map((_, i) => i * 7);
    const timeline = path.join(dir, 'timeline.json');
    fs.writeFileSync(timeline, JSON.stringify({
      starts, end: lines.length * 7, nominal: lines.map((l) => l.min),
      sentences: starts.map((s, i) => [{ text: `Sentence ${i}.`, from: s + 1, to: s + 5 }]),
    }));
    process.env.VIDEO_TIMELINE = timeline;
    const mod = await import(`${scene}?t=${Date.now()}`);
    const s = mod.default();
    assert.ok(s.thumbnail > 7 && s.thumbnail < 14, 'the thumbnail is inside the second beat');
    assert.deepEqual(check(s.toSVG(), { maxBytes: 600_000 }), []);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

// ----------------------------------------------------------------- rendering

// A bar that crosses the picture once a second, so a frame's place in the video shows in where the bar is.
function barScene() {
  const s = new Scene({ width: 200, height: 112, loop: 1, background: '#000000', description: 'A bar crossing.' });
  s.add(s.anim(el('rect', { width: 20, height: 112, fill: '#ff0000' }), [[0, { x: 0 }], [1, { x: 180 }]]));
  return s;
}

const barX = async (png) => {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const row = Math.floor(info.height / 2);
  const reds = [];
  for (let x = 0; x < info.width; x++) if (data[(row * info.width + x) * info.channels] > 200) reds.push(x);
  return reds.length ? (reds[0] + reds.at(-1)) / 2 / info.width : -1;
};

function frameOf(video, n, out) {
  const r = spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', video, '-vf', `select=eq(n\\,${n})`, '-frames:v', '1', out], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return fs.readFileSync(out);
}

test('rendered in parallel, frame i shows moment i: the bar moves steadily left to right', needsFfmpeg, async () => {
  const dir = scratch();
  try {
    const svgPath = path.join(dir, 'bar.svg');
    fs.writeFileSync(svgPath, barScene().toSVG());
    const out = path.join(dir, 'bar.mp4');
    const res = await renderVideo({
      svgPath, scene: { width: 200, height: 112 }, seconds: 1, out, ffmpeg, workers: 4,
      quality: { ...resolveQuality('web', { fps: 20 }), width: 200, height: 112, crf: 12, preset: 'ultrafast' },
    });
    assert.equal(res.frames, 20);
    assert.equal(res.workers, 4);
    const r = spawnSync(ffmpeg, ['-i', out, '-map', '0:v:0', '-f', 'null', '-'], { encoding: 'utf8' });
    assert.match(r.stderr, /frame=\s*20\b/, 'twenty frames in the file');
    const xs = [];
    for (const n of [0, 5, 10, 15, 19]) xs.push(await barX(frameOf(out, n, path.join(dir, `f${n}.png`))));
    xs.slice(1).forEach((x, i) => assert.ok(x > xs[i] + 0.1, `the bar advances: ${xs.map((v) => v.toFixed(2)).join(' < ')}`));
    assert.ok(xs[0] < 0.15 && xs.at(-1) > 0.85, 'from the left edge to the right');
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test('one command from a story to video, posters and a small preview, with the voice in it', needsFfmpeg, async () => {
  const dir = scratch();
  const lines = [];
  try {
    const vdir = path.join(dir, 'videos');
    scaffoldVideo('demo', { dir: vdir });
    const env = { ...process.env, ...fakeVoice(dir), FFMPEG: ffmpeg };
    const out = path.join(dir, 'out');
    const res = await makeVideo({
      scenePath: path.join(vdir, 'demo.js'), quality: 'web', overrides: { size: '640x360', fps: 8, crf: 28, preset: 'ultrafast' },
      outDir: out, distDir: path.join(dir, 'dist'), workers: 3, env, log: (l) => lines.push(l),
    });
    const f = res.files;
    for (const file of Object.values(f)) assert.ok(fs.statSync(file).size > 1000, `${path.basename(file)} was written`);
    assert.deepEqual(Object.keys(f).sort(), ['jpg', 'png', 'preview', 'video']);
    assert.equal(path.basename(f.video), 'demo.mp4');
    assert.equal(path.basename(f.png), 'demo-poster.png');
    assert.equal(path.basename(f.jpg), 'demo-poster-1280x720.jpg');
    const poster = await sharp(f.png).metadata();
    assert.deepEqual([poster.width, poster.height], [1920, 1080], 'the poster is full size whatever the video was');
    const probe = spawnSync(ffmpeg, ['-hide_banner', '-i', f.video], { encoding: 'utf8' }).stderr;
    assert.match(probe, /Video: h264.*640x360/);
    assert.match(probe, /Audio: aac/, 'the voice is in the video');
    assert.ok(lines.some((l) => /^voice: /.test(l)) && lines.some((l) => /^video: /.test(l)));

    // A draft is named as one and has no posters.
    const draft = await makeVideo({
      scenePath: path.join(vdir, 'demo.js'), quality: 'draft', outDir: out, distDir: path.join(dir, 'dist'), workers: 2, env, log: () => {},
    });
    assert.equal(path.basename(draft.files.video), 'demo-draft.mp4');
    assert.deepEqual(Object.keys(draft.files), ['video']);
    assert.match(spawnSync(ffmpeg, ['-hide_banner', '-i', draft.files.video], { encoding: 'utf8' }).stderr, /960x540/);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});
