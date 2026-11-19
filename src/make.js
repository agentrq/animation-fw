// One call from a story to a finished set: voice, video, posters, a small preview.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ffmpegBin, resolveQuality, defaultWorkers } from './media.js';
import { buildVoice } from './voice.js';
import { renderVideo, makePosters, makePreview } from './video.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// videos/overview.js speaks videos/overview.narration.json.
export const narrationFor = (scenePath) => scenePath.replace(/\.js$/, '.narration.json');

// The voice for a scene: the one it was told to use (--audio with --timeline, or
// $VIDEO_TIMELINE), else the narration file beside it spoken now. Spoken audio is
// kept in .cache/voice/<name> and only redone when the script changes.
export function voiceFor({ scenePath, audio, timeline, env = process.env, log = console.log }) {
  const name = path.basename(scenePath, '.js');
  const given = timeline ?? env.VIDEO_TIMELINE;
  if (given && (audio || !fs.existsSync(narrationFor(scenePath)))) return { timelineFile: path.resolve(given), audioFile: audio ? path.resolve(audio) : '' };
  const narrationFile = narrationFor(scenePath);
  if (!fs.existsSync(narrationFile)) {
    throw new Error(`no voice for ${name}: write ${path.relative('.', narrationFile)}, or pass --audio and --timeline`);
  }
  const outDir = path.join(env.ANIMFW_VOICE_CACHE ?? path.join(root, '.cache/voice'), name);
  const v = buildVoice({ narrationFile, outDir, env, log });
  return { timelineFile: v.timelineFile, audioFile: v.audioFile };
}

export async function makeVideo({
  scenePath, quality: qualityName = 'hq', overrides = {}, outDir = 'out', outFile, audio, timeline, workers, posterAt, pack = true,
  distDir = 'dist', env = process.env, log = console.log,
}) {
  const t0 = Date.now();
  const name = path.basename(scenePath, '.js');
  const ffmpeg = ffmpegBin(env);
  const quality = resolveQuality(qualityName, overrides);
  const draft = qualityName === 'draft';

  const voice = voiceFor({ scenePath, audio, timeline, env, log });
  process.env.VIDEO_TIMELINE = voice.timelineFile; // the scene reads its timing from here
  const mod = await import(`${pathToFileURL(path.resolve(scenePath)).href}?t=${Date.now()}`);
  const scene = await mod.default();
  fs.mkdirSync(distDir, { recursive: true });
  const svgPath = path.resolve(distDir, `${name}.svg`);
  fs.writeFileSync(svgPath, scene.toSVG());

  const seconds = scene.videoEnd ?? scene.loop;
  const video = outFile ?? path.join(outDir, `${name}${draft ? '-draft' : ''}.mp4`);
  const n = workers ?? defaultWorkers();
  log(`render: ${name}, ${seconds.toFixed(1)} s, ${qualityName}${quality.height ? '' : ` ${quality.width} wide`} at ${quality.fps} fps, ${n} browsers`);
  let lastTenth = -1;
  const rendered = await renderVideo({
    svgPath, scene, seconds, out: video, audio: voice.audioFile || undefined, quality, workers: n, ffmpeg,
    onProgress: (done, total) => {
      const tenth = Math.floor((done * 10) / total);
      if (tenth !== lastTenth && done < total) { lastTenth = tenth; log(`render: ${tenth * 10}%`); }
    },
  });
  log(`video: ${video} (${(fs.statSync(video).size / 1e6).toFixed(1)} MB, ${(rendered.ms / 1000).toFixed(0)} s to render)`);

  const files = { video };
  if (pack && !draft) {
    const dir = path.dirname(video);
    const stem = path.basename(video, '.mp4');
    const t = posterAt ?? scene.thumbnail ?? scene.poster ?? seconds * 0.4;
    Object.assign(files, await makePosters({ svgPath, scene, t, outDir: dir, name: stem }));
    files.preview = makePreview({ video, out: path.join(dir, `${stem}-preview.mp4`), ffmpeg });
    log(`poster: ${files.png}, ${files.jpg} (frame at ${t.toFixed(1)} s)`);
    log(`preview: ${files.preview} (${(fs.statSync(files.preview).size / 1e6).toFixed(1)} MB)`);
  }
  log(`done in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  return { files, seconds, rendered, ms: Date.now() - t0 };
}
