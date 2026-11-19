#!/usr/bin/env node
// node bin/video.js <scene.js> [flags]     narration -> voice -> video, posters and a preview
// node bin/video.js new <name>             start a story: videos/<name>.js + <name>.narration.json
// node bin/video.js setup                  fetch the local voice (Piper), once
//
// A video is a scene (videos/x.js) with its script beside it (videos/x.narration.json).
// The script is spoken by a local voice, the scene is timed to the speech, every
// frame is drawn by several browsers at once, and ffmpeg joins them with the voice.
// Out comes out/<name>.mp4, <name>-poster.png, <name>-poster-1280x720.jpg and
// <name>-preview.mp4 (small enough to attach to a chat).
//
//   --draft              a rough cut (960 wide, 15 fps): seconds, for checking timing; no posters
//   --quality hq|web|draft   hq (default): 1920x1080, 30 fps, crf 14, slow. web: crf 20, medium
//   --out <dir>          where the files go (default out)
//   --workers <n>        browsers drawing frames at once (default: half the CPUs, at most 8)
//   --poster-at <s>      the poster frame (default: the scene's thumbnail)
//   --no-pack            the video only
//   --fps, --size 1920x1080, --crf, --preset   override the quality's settings
//   --audio <wav> --timeline <json>   use a voice made elsewhere instead of the narration file
//   an explicit second argument ending in .mp4 names the video file.
import { parseArgs } from '../src/args.js';
import { makeVideo } from '../src/make.js';
import { scaffoldVideo } from '../src/scaffold.js';
import { setupVoice } from '../src/setup.js';

const USAGE = 'usage: video.js <scene.js> [--draft] [--quality hq|web|draft] [--out dir] [--workers n] | video.js new <name> | video.js setup';

async function main() {
  const { opts, pos } = parseArgs(process.argv.slice(2));
  const [first, second] = pos;
  if (opts.help || !first) { console.error(USAGE); return opts.help ? 0 : 2; }
  if (first === 'setup') { await setupVoice(); return 0; }
  if (first === 'new') {
    if (!second) { console.error('usage: video.js new <name>'); return 2; }
    for (const f of scaffoldVideo(second)) console.log(`wrote ${f}`);
    console.log(`next: edit the narration, then  node bin/video.js videos/${second}.js --draft`);
    return 0;
  }
  await makeVideo({
    scenePath: first,
    quality: opts.draft ? 'draft' : opts.quality ?? 'hq',
    overrides: { fps: opts.fps, size: opts.size, crf: opts.crf, preset: opts.preset },
    outDir: opts.out ?? 'out',
    outFile: second?.endsWith('.mp4') ? second : undefined,
    audio: opts.audio,
    timeline: opts.timeline,
    workers: opts.workers ? Number(opts.workers) : undefined,
    posterAt: opts['poster-at'] ? Number(opts['poster-at']) : undefined,
    pack: !opts['no-pack'],
  });
  return 0;
}

main().then((code) => process.exit(code), (e) => { console.error(e.message ?? e); process.exit(1); });
