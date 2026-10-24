#!/usr/bin/env node
// animfw build   <scene.js...> [--out dist] [--max-kb 800]
// animfw preview <scene.js...> [--out dist] [--fps 10] [--frames 8] [--width 600]
// animfw check   <file.svg...> [--max-kb 800]
//
// A scene module's default export returns a Scene. build writes dist/<name>.svg
// and checks it; preview also writes <name>.gif, <name>-sheet.png (labelled
// frames) and <name>-poster.png.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { check } from '../src/check.js';

const [cmd, ...rest] = process.argv.slice(2);
const files = rest.filter((a, i) => !a.startsWith('--') && !rest[i - 1]?.startsWith('--'));
const opt = (name, def) => {
  const i = rest.indexOf(`--${name}`);
  return i < 0 ? def : rest[i + 1];
};
const out = opt('out', 'dist');
const maxBytes = Number(opt('max-kb', 800)) * 1000;

function report(name, svg) {
  const problems = check(svg, { maxBytes });
  const kb = (Buffer.byteLength(svg) / 1000).toFixed(0);
  console.log(`${problems.length ? '✗' : '✓'} ${name} ${kb} KB`);
  for (const p of problems) console.log(`  - ${p}`);
  return problems.length === 0;
}

async function build(file) {
  const mod = await import(pathToFileURL(path.resolve(file)).href);
  const scene = await mod.default();
  const svg = scene.toSVG();
  const name = path.basename(file, '.js');
  fs.mkdirSync(out, { recursive: true });
  const svgPath = path.resolve(out, `${name}.svg`);
  fs.writeFileSync(svgPath, svg);
  return { name, scene, svg, svgPath, ok: report(name, svg) };
}

async function preview(file) {
  const { frames, gif, sheet } = await import('../src/render.js');
  const b = await build(file);
  const { loop, poster, width, height } = b.scene;
  const fps = Number(opt('fps', 10));
  const w = Number(opt('width', 600));
  const n = Number(opt('frames', 8));

  const all = Array.from({ length: Math.round(loop * fps) }, (_, i) => i / fps);
  const picks = Array.from({ length: n }, (_, i) => +((i * loop) / n).toFixed(2));
  const pngs = await frames(b.svgPath, [poster, ...picks, ...all], { width, height });
  const [posterPng, ...restPngs] = pngs;
  fs.writeFileSync(path.join(out, `${b.name}-poster.png`), posterPng);
  fs.writeFileSync(path.join(out, `${b.name}-sheet.png`), await sheet(restPngs.slice(0, n), picks, { width: w }));
  fs.writeFileSync(path.join(out, `${b.name}.gif`), await gif(restPngs.slice(n), { fps, width: w }));
  console.log(`  previews in ${out}/${b.name}{.gif,-sheet.png,-poster.png}`);
  return b;
}

const run = { build, preview };
let ok = true;
if (cmd === 'check') {
  for (const f of files) ok = report(f, fs.readFileSync(f, 'utf8')) && ok;
} else if (run[cmd] && files.length) {
  for (const f of files) ok = (await run[cmd](f)).ok && ok;
} else {
  console.error('usage: animfw build|preview <scene.js...> | animfw check <file.svg...>');
  ok = false;
}
process.exit(ok ? 0 : 1);
