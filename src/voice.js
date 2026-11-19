// The voice track: a narration script spoken by a local Piper voice (nothing
// leaves the machine), measured line by line, and turned into the two things a
// video needs: timeline.json (when each beat starts, which sentence is on screen
// when) and voice.wav (the speech, placed on those beats).
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ffmpegBin, voiceTools } from './media.js';

// The voice starts a beat after the captions so it lands with the animation.
export const LEAD = 1.0;
export const TAIL = 0.4;
const LENGTH_SCALE = 0.93;
const SENTENCE_SILENCE = 0.22;

// Piper reads "agentrq" as "agentek", so a script spells the name the way it is
// said and the captions put it back the way it is written.
export const DEFAULT_CAPTIONS = { 'Agent R Q dot com': 'agentrq.com', 'Agent R Q': 'AgentRQ' };

const r3 = (n) => Number(n.toFixed(3));

export function captionText(text, map = DEFAULT_CAPTIONS) {
  return Object.entries(map)
    .sort((a, b) => b[0].length - a[0].length)
    .reduce((s, [said, written]) => s.replaceAll(said, written), text);
}

// Piper gives no word timings, so a sentence gets its share of the line's audio
// by length (plus a little for the pause after it).
export function splitSentences(text, from, seconds, map = DEFAULT_CAPTIONS) {
  const parts = text.split(/(?<=[.?!])\s+/);
  const weights = parts.map((p) => p.length + 10);
  const total = weights.reduce((a, b) => a + b, 0);
  let at = from;
  return parts.map((p, i) => {
    const len = (seconds * weights[i]) / total;
    const out = { text: captionText(p, map), from: r3(at), to: r3(at + len) };
    at += len;
    return out;
  });
}

// The length of a WAV file in seconds, from its header.
export function wavSeconds(buf) {
  if (buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WAVE') throw new Error('not a WAV file');
  let byteRate = 0;
  for (let at = 12; at + 8 <= buf.length;) {
    const id = buf.toString('latin1', at, at + 4);
    let size = buf.readUInt32LE(at + 4);
    if (id === 'fmt ') byteRate = buf.readUInt32LE(at + 16);
    if (id === 'data') {
      // A stream writes 0 or 0xFFFFFFFF before it knows the size: take what is there.
      if (size === 0 || size === 0xffffffff || at + 8 + size > buf.length) size = buf.length - at - 8;
      if (!byteRate) throw new Error('WAV has no fmt chunk before its data');
      return size / byteRate;
    }
    at += 8 + size + (size % 2);
  }
  throw new Error('WAV has no data chunk');
}

// lines: [{ id, min, text }]; seconds[i] is how long line i takes to say. A beat
// lasts as long as its speech needs, but never less than its `min`.
export function buildTimeline(lines, seconds, { lead = LEAD, tail = TAIL, captions = DEFAULT_CAPTIONS } = {}) {
  const starts = [];
  const sentences = [];
  const clips = [];
  let t = 0;
  lines.forEach((l, i) => {
    const len = Math.max(l.min ?? 0, lead + seconds[i] + tail);
    starts.push(r3(t));
    clips.push({ id: l.id, at: t + lead });
    sentences.push(splitSentences(l.text, t + lead, seconds[i], captions));
    t += len;
  });
  return { timeline: { starts, end: r3(t), nominal: lines.map((l) => l.min), sentences }, clips };
}

// ffmpeg filter_complex that puts each clip at its moment and mixes them into
// one track as long as the video. level=disabled keeps the limiter from
// turning speech up to full scale.
export function mixFilter(clips, total) {
  const delayed = clips.map((c, i) => `[${i}:a]aresample=44100,adelay=${Math.round(c.at * 1000)}:all=1[a${i}]`).join(';');
  const inputs = clips.map((_, i) => `[a${i}]`).join('');
  return `${delayed};${inputs}amix=inputs=${clips.length}:normalize=0,apad=whole_dur=${total.toFixed(3)},alimiter=limit=0.8:level=disabled[o]`;
}

export function validateNarration(data, file = 'narration') {
  const lines = data?.lines;
  if (!Array.isArray(lines) || !lines.length) throw new Error(`${file}: "lines" must be a non-empty list`);
  const seen = new Set();
  for (const [i, l] of lines.entries()) {
    const where = `${file}: line ${i + 1}`;
    if (typeof l.id !== 'string' || !l.id) throw new Error(`${where} needs an id`);
    if (seen.has(l.id)) throw new Error(`${where}: id "${l.id}" is used twice`);
    seen.add(l.id);
    if (typeof l.text !== 'string' || !l.text.trim()) throw new Error(`${where} ("${l.id}") needs text`);
    if (l.min != null && !(l.min > 0)) throw new Error(`${where} ("${l.id}"): min is a length in seconds`);
    if (/agentrq/.test(l.text)) throw new Error(`${where} ("${l.id}"): write the name as "Agent R Q" so it is spoken right; the captions show AgentRQ`);
  }
  return { lines, captions: { ...DEFAULT_CAPTIONS, ...(data.captions ?? {}) } };
}

const sha = (x) => createHash('sha256').update(typeof x === 'string' ? x : JSON.stringify(x)).digest('hex').slice(0, 20);

function say(piper, voice, text, wav) {
  const r = spawnSync(piper, ['--model', voice, '--output_file', wav, '--length_scale', String(LENGTH_SCALE), '--sentence_silence', String(SENTENCE_SILENCE)],
    { input: text, encoding: 'utf8', cwd: path.dirname(piper) });
  if (r.status !== 0) throw new Error(`piper failed: ${r.stderr || r.error}`);
}

// Speaks `narrationFile` into outDir (timeline.json and voice.wav). Each line's
// audio is kept by what it says, so changing one line speaks only that line, and
// an unchanged script is not spoken again at all.
export function buildVoice({ narrationFile, outDir, env = process.env, log = console.log }) {
  const { lines, captions } = validateNarration(JSON.parse(fs.readFileSync(narrationFile, 'utf8')), path.basename(narrationFile));
  const { piper, voice } = voiceTools(env);
  const ffmpeg = ffmpegBin(env);
  const vst = fs.statSync(voice);
  const voiceId = [path.basename(voice), vst.size];
  const key = sha({ lines, captions, lead: LEAD, tail: TAIL, voiceId, LENGTH_SCALE, SENTENCE_SILENCE });
  const timelineFile = path.join(outDir, 'timeline.json');
  const audioFile = path.join(outDir, 'voice.wav');
  const keyFile = path.join(outDir, 'voice.key');
  fs.mkdirSync(path.join(outDir, 'lines'), { recursive: true });

  if (fs.existsSync(keyFile) && fs.readFileSync(keyFile, 'utf8') === key && fs.existsSync(timelineFile) && fs.existsSync(audioFile)) {
    log('voice: script unchanged, reusing the last voice track');
    return { timelineFile, audioFile, timeline: JSON.parse(fs.readFileSync(timelineFile, 'utf8')), cached: true };
  }

  const seconds = lines.map((l) => {
    const wav = path.join(outDir, 'lines', `${sha([l.text, voiceId, LENGTH_SCALE, SENTENCE_SILENCE])}.wav`);
    if (!fs.existsSync(wav)) say(piper, voice, l.text, wav);
    const d = wavSeconds(fs.readFileSync(wav));
    log(`voice: ${l.id} ${d.toFixed(2)} s`);
    return { wav, d };
  });
  const { timeline, clips } = buildTimeline(lines, seconds.map((x) => x.d), { captions });
  fs.writeFileSync(timelineFile, JSON.stringify(timeline));

  const args = ['-y', '-loglevel', 'error'];
  seconds.forEach((x) => args.push('-i', x.wav));
  args.push('-filter_complex', mixFilter(clips, timeline.end), '-map', '[o]', '-t', timeline.end.toFixed(3), audioFile);
  const r = spawnSync(ffmpeg, args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg could not mix the voice: ${r.stderr}`);
  fs.writeFileSync(keyFile, key);
  log(`voice: ${timeline.end.toFixed(1)} s in ${lines.length} beats`);
  return { timelineFile, audioFile, timeline, cached: false };
}
