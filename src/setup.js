// `node bin/video.js setup`: fetch the speech engine once. Piper (MIT) is a small
// local text-to-speech program; the voice is en_US-ryan-high from rhasspy/piper-voices.
// Both come over HTTPS from their projects' own releases and are kept in voiceHome().
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { spawnSync } from 'node:child_process';
import { voiceHome, VOICE_MODEL } from './media.js';

export const PIPER_RELEASE = '2023.11.14-2';
const ASSETS = {
  'linux-x64': 'piper_linux_x86_64.tar.gz',
  'linux-arm64': 'piper_linux_aarch64.tar.gz',
  'darwin-x64': 'piper_macos_x64.tar.gz',
  'darwin-arm64': 'piper_macos_aarch64.tar.gz',
};
const VOICE_BASE = `https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/high/${VOICE_MODEL}`;

export function piperAsset(platform = process.platform, arch = process.arch) {
  const asset = ASSETS[`${platform}-${arch}`];
  if (!asset) throw new Error(`no Piper build for ${platform}/${arch}: install it yourself and set PIPER and PIPER_VOICE`);
  return asset;
}

async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const tmp = `${file}.part`;
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(tmp));
  fs.renameSync(tmp, file);
}

export async function setupVoice({ env = process.env, log = console.log } = {}) {
  const home = voiceHome(env);
  fs.mkdirSync(home, { recursive: true });
  const piper = path.join(home, 'piper/piper');
  if (!fs.existsSync(piper)) {
    const archive = path.join(home, piperAsset());
    log(`setup: fetching Piper ${PIPER_RELEASE}`);
    await download(`https://github.com/rhasspy/piper/releases/download/${PIPER_RELEASE}/${path.basename(archive)}`, archive);
    const r = spawnSync('tar', ['-xzf', archive, '-C', home], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`could not unpack ${archive}: ${r.stderr}`);
    fs.rmSync(archive);
    fs.chmodSync(piper, 0o755);
  }
  const model = path.join(home, `${VOICE_MODEL}.onnx`);
  for (const file of [model, `${model}.json`]) {
    if (fs.existsSync(file)) continue;
    log(`setup: fetching ${path.basename(file)}`);
    await download(`${VOICE_BASE}${file.endsWith('.json') ? '.onnx.json' : '.onnx'}`, file);
  }
  // Say one word, to know it works before a video depends on it.
  const wav = path.join(home, 'check.wav');
  const r = spawnSync(piper, ['--model', model, '--output_file', wav], { input: 'Ready.', encoding: 'utf8', cwd: path.dirname(piper) });
  if (r.status !== 0 || !fs.existsSync(wav)) throw new Error(`Piper did not run: ${r.stderr || r.error}`);
  fs.rmSync(wav);
  log(`setup: voice ready in ${home}`);
  return { piper, voice: model };
}
