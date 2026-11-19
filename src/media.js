// What the video pipeline needs from the machine, and how good a render should be.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Encoding is cheap next to drawing the frames, so the default is the best one.
// `draft` is for checking timing and layout: seconds instead of minutes.
export const QUALITY = {
  draft: { width: 960, fps: 15, shot: 'jpeg', crf: 30, preset: 'ultrafast', audioBitrate: '96k' },
  web: { width: 1920, fps: 30, shot: 'png', crf: 20, preset: 'medium', audioBitrate: '160k' },
  hq: { width: 1920, fps: 30, shot: 'png', crf: 14, preset: 'slow', audioBitrate: '192k' },
};

// A scene is drawn at its own size and shown at `width`, so a 1200x675 scene
// at 1920 wide is 1920x1080. Video sizes must be even.
export function videoSize(sceneWidth, sceneHeight, width) {
  const even = (n) => Math.max(2, Math.round(n / 2) * 2);
  return { width: even(width), height: even((width * sceneHeight) / sceneWidth) };
}

// Quality name plus overrides ({ fps, size: '1920x1080', crf, preset }) -> settings.
export function resolveQuality(name = 'hq', overrides = {}) {
  const base = QUALITY[name];
  if (!base) throw new Error(`unknown quality "${name}": use ${Object.keys(QUALITY).join(', ')}`);
  const q = { name, ...base };
  if (overrides.fps != null) q.fps = Number(overrides.fps);
  if (overrides.crf != null) q.crf = Number(overrides.crf);
  if (overrides.preset) q.preset = overrides.preset;
  if (overrides.size) {
    const m = /^(\d+)x(\d+)$/.exec(overrides.size);
    if (!m) throw new Error(`--size wants WIDTHxHEIGHT, got "${overrides.size}"`);
    q.width = Number(m[1]);
    q.height = Number(m[2]);
  }
  if (!(q.fps > 0)) throw new Error('fps must be a positive number');
  return q;
}

// Each Chromium costs about 300 MB; past 8 the machine, not the count, is the limit.
export function defaultWorkers(cpus = os.availableParallelism()) {
  return Math.min(8, Math.max(1, Math.floor(cpus / 2)));
}

const runs = (bin) => !spawnSync(bin, ['-version'], { stdio: 'ignore' }).error;

// $FFMPEG, then ffmpeg on the PATH, then the ffmpeg-static npm package.
export function ffmpegBin(env = process.env) {
  if (env.FFMPEG) return env.FFMPEG;
  if (runs('ffmpeg')) return 'ffmpeg';
  try {
    const bin = createRequire(import.meta.url)('ffmpeg-static');
    if (bin && runs(bin)) return bin;
  } catch { /* not installed */ }
  throw new Error('no ffmpeg: install it, set FFMPEG=/path/to/ffmpeg, or run npm install (ffmpeg-static)');
}

// Where `node bin/video.js setup` puts the voice, and where the pipeline looks.
export const voiceHome = (env = process.env) => env.ANIMFW_VOICE_HOME ?? path.join(os.homedir(), '.cache/animfw/voice');
export const VOICE_MODEL = 'en_US-ryan-high';

// $PIPER and $PIPER_VOICE (or $VOICE, as the landing repo's script had it), else the setup's.
export function voiceTools(env = process.env) {
  const home = voiceHome(env);
  const piper = env.PIPER ?? path.join(home, 'piper/piper');
  const voice = env.PIPER_VOICE ?? env.VOICE ?? path.join(home, `${VOICE_MODEL}.onnx`);
  const missing = [piper, voice].filter((f) => !fs.existsSync(f));
  if (missing.length) {
    throw new Error(`no voice: ${missing.join(' and ')} not found. Run "node bin/video.js setup", or set PIPER and PIPER_VOICE`);
  }
  return { piper, voice };
}
