#!/usr/bin/env node
// node bin/video.js <scene.js> <out.mp4> [--audio voice.wav] [--size 1920x1080] [--fps 24]
//
// Renders a scene as a video: every CSS animation is paused and set to the
// same moment per frame (as frames() does), the frames are piped to ffmpeg,
// and the voice track is muxed in. A scene says how long it runs with
// scene.videoEnd (seconds); otherwise it is the loop.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const [file, out] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i < 0 ? def : args[i + 1]; };
if (!file || !out) { console.error('usage: video.js <scene.js> <out.mp4> [--audio voice.wav] [--size 1920x1080] [--fps 24]'); process.exit(2); }

const [outW, outH] = opt('size', '1920x1080').split('x').map(Number);
const fps = Number(opt('fps', 24));
const audio = opt('audio', '');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';

const scene = await (await import(pathToFileURL(path.resolve(file)).href)).default();
const svgPath = path.resolve('dist', `${path.basename(file, '.js')}.svg`);
fs.mkdirSync(path.dirname(svgPath), { recursive: true });
fs.writeFileSync(svgPath, scene.toSVG());

const seconds = scene.videoEnd ?? scene.loop;
const frames = Math.round(seconds * fps);

const ffArgs = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
if (audio) ffArgs.push('-i', audio);
ffArgs.push('-vf', `scale=${outW}:${outH}:flags=lanczos`, '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart');
if (audio) ffArgs.push('-c:a', 'aac', '-b:a', '160k', '-shortest');
ffArgs.push(out);
const ff = spawn(ffmpeg, ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: scene.width, height: scene.height }, deviceScaleFactor: outW / scene.width });
  await page.goto(pathToFileURL(svgPath).href);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().map((a) => { a.pause(); return a.ready; }));
  });
  for (let i = 0; i < frames; i++) {
    await page.evaluate((ms) => { for (const a of document.getAnimations()) a.currentTime = ms; }, (i / fps) * 1000);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 240 === 0) console.log(`frame ${i}/${frames}`);
  }
} finally {
  await browser.close();
  ff.stdin.end();
}
await new Promise((r) => ff.on('close', r));
console.log(`wrote ${out} (${frames} frames, ${seconds.toFixed(1)} s)`);
