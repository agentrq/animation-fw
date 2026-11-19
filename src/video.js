// Scene -> video. A frame is "pause every CSS animation, set them all to this
// moment, take a picture", so frames do not depend on each other: several
// browsers draw them at once and one ffmpeg receives them in order.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { frames as stills } from './render.js';
import { videoSize } from './media.js';

// Calls render(i, lane) for i in 0..count-1 on `workers` lanes and write(result, i)
// strictly in order, one at a time (so write can wait for a pipe to drain). At
// most `window` frames are finished but unwritten, which bounds memory when one
// frame is slow. The first failure stops the rest and is thrown.
export async function inOrder({ count, workers, render, write, window = workers * 4 }) {
  let next = 0;
  let written = 0;
  let pumping = false;
  let failed = null;
  const done = new Map();
  const waiters = [];
  const wake = () => { while (waiters.length) waiters.shift()(); };
  const sleep = () => new Promise((r) => waiters.push(r));
  const fail = (e) => { failed ??= e; wake(); };

  const pump = async () => {
    if (pumping) return;
    pumping = true;
    try {
      while (done.has(written) && !failed) {
        const item = done.get(written);
        done.delete(written);
        await write(item, written);
        written++;
        wake();
      }
    } catch (e) { fail(e); }
    pumping = false;
    // A frame may have landed while the last write was in flight.
    if (done.has(written) && !failed) await pump();
  };

  const lane = async (k) => {
    while (!failed) {
      const i = next++;
      if (i >= count) return;
      while (i - written >= window && !failed) await sleep();
      if (failed) return;
      try { done.set(i, await render(i, k)); } catch (e) { fail(e); return; }
      pump();
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, Math.min(workers, count)) }, (_, k) => lane(k)));
  while (written < count && !failed) await sleep();
  if (failed) throw failed;
}

// A browser showing the scene with every animation paused and ready to be seeked.
async function openStage(svgPath, { width, height, scale }) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await page.goto(pathToFileURL(svgPath).href);
  // A pause completes a frame later and then sets its own time, undoing a
  // seek made before it: pause everything once and wait for that.
  await page.evaluate(async () => {
    await document.fonts.ready;
    const all = document.getAnimations();
    await Promise.all(all.map((a) => { a.pause(); return a.ready; }));
    window.__animations = all; // listing them is the slow part of a seek
  });
  return { browser, page };
}

// Renders scene.svg (scene: { width, height }) over `seconds` into out.mp4, with
// the voice muxed in when `audio` is given.
export async function renderVideo({
  svgPath, scene, seconds, out, audio, quality, workers, ffmpeg, onProgress = () => {},
}) {
  const size = quality.height ? { width: quality.width, height: quality.height } : videoSize(scene.width, scene.height, quality.width);
  const count = Math.round(seconds * quality.fps);
  const scale = size.width / scene.width;
  const jpeg = quality.shot === 'jpeg';

  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(quality.fps), '-c:v', jpeg ? 'mjpeg' : 'png', '-i', '-'];
  if (audio) args.push('-i', audio);
  args.push('-vf', `scale=${size.width}:${size.height}:flags=lanczos`, '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-crf', String(quality.crf), '-preset', quality.preset, '-movflags', '+faststart');
  if (audio) args.push('-c:a', 'aac', '-b:a', quality.audioBitrate, '-shortest');
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  args.push(out);

  const started = Date.now();
  const ff = spawn(ffmpeg, args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const closed = new Promise((resolve) => ff.on('close', resolve));
  ff.stdin.on('error', () => {}); // ffmpeg dying is reported by its exit code below

  const n = Math.max(1, Math.min(workers, count));
  const stages = await Promise.all(Array.from({ length: n }, () => openStage(svgPath, { width: scene.width, height: scene.height, scale })));
  try {
    let drawn = 0;
    await inOrder({
      count,
      workers: n,
      render: async (i, k) => {
        const { page } = stages[k];
        await page.evaluate((ms) => { for (const a of window.__animations) a.currentTime = ms; }, (i / quality.fps) * 1000);
        const buf = await page.screenshot(jpeg ? { type: 'jpeg', quality: 88 } : { type: 'png' });
        onProgress(++drawn, count);
        return buf;
      },
      write: (buf) => (ff.stdin.write(buf) ? undefined : new Promise((r) => ff.stdin.once('drain', r))),
    });
  } catch (e) {
    ff.kill();
    throw e;
  } finally {
    await Promise.all(stages.map(({ browser }) => browser.close()));
  }
  ff.stdin.end();
  const code = await closed;
  if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);
  return { out, frames: count, seconds, workers: n, ms: Date.now() - started, ...size };
}

// The poster: the frame at `t`, as a full-size PNG and a smaller JPEG for places
// that want a light file.
export async function makePosters({ svgPath, scene, t, outDir, name, width = 1920, jpegWidth = 1280 }) {
  const size = videoSize(scene.width, scene.height, width);
  const [png] = await stills(svgPath, [t], { width: scene.width, height: scene.height, scale: size.width / scene.width });
  const small = videoSize(scene.width, scene.height, jpegWidth);
  const files = {
    png: path.join(outDir, `${name}-poster.png`),
    jpg: path.join(outDir, `${name}-poster-${small.width}x${small.height}.jpg`),
  };
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(files.png, png);
  fs.writeFileSync(files.jpg, await sharp(png).resize(small.width, small.height).jpeg({ quality: 90 }).toBuffer());
  return files;
}

// A small copy to attach where uploads are capped (a task reply takes 4 MB): 480 p,
// mono voice, and a second try at a lower quality if it is still too big.
export function makePreview({ video, out, ffmpeg, maxBytes = 3_800_000 }) {
  for (const crf of [27, 32, 37]) {
    const r = spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', video, '-vf', 'scale=-2:480', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(crf),
      '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-ac', '1', '-movflags', '+faststart', out], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`ffmpeg could not make the preview: ${r.stderr}`);
    if (fs.statSync(out).size <= maxBytes) break;
  }
  return out;
}
