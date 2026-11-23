// YouTube posters for the feature videos: 1280x720 thumbnails in the house style.
// Each one is a big two-line headline on the left, a close-up of one real screen
// from its video on the right (tilted, in a window, with a green callout chip),
// and the mascots on the ground under the headline. They are still scenes, drawn
// with the same kit as the videos, so a poster changes as easily as a frame.
// Build: ANIMFW_PYLIB=<pylib> node videos/posters.js <outDir> [slug ...]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { Scene, FONTS, el, g } from '../src/index.js';
import { C, mascotByName, mascot, sky } from '../kit/agentrq.js';
import { VW, VH } from './lib.js';
import { collect, logo } from './house.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const GREEN = '#4ade80';
const GROUND = 596; // the mascots' ground, under the headline
const SCALE = 3; // shots are captured at 3x their CSS size
const MS = 1.3; // the mascots, a little larger than in the videos
const STEP = 125; // between mascots, before MS: room for "antigravity" under its mascot
// The screen's box on the right: its left edge, width, height and vertical centre. It ends
// above the mascots' heads and inside the frame's right edge, tilt included.
const BOX_X = 588;
const BOX_W = 572;
const BOX_H = 392;
const BOX_CY = 300;
// The headline: at most 88px, smaller when a line would run past HEAD_W into the screen.
// Inter ExtraBold at -2.5 spacing averages under 0.52em a character.
const HEAD_W = 520;
export const headlineSize = (lines) => Math.min(88, Math.floor(HEAD_W / (Math.max(...lines.map((l) => l.length)) * 0.52)));

// One poster per video. `crop` is [x, y, w, h] in the shot's CSS px; `chip` is the
// green label over the screen.
export const POSTERS = [
  { slug: 'pano-collaboration', kicker: 'THE PANO', headline: ['Agents that', 'work together.'], sub: 'One board for every agent\'s docs.', shot: 'board-done', crop: [80, 70, 620, 330], chip: 'shared docs, live', mascots: ['claude', 'codex', 'agy', 'hermes'] },
  { slug: 'teams-collaboration', kicker: 'TEAMS', headline: ['Your team.', 'Their agents.'], sub: 'Share workspaces, tasks and skills.', shot: 'team-tasks', crop: [80, 25, 420, 330], chip: 'one board for everyone', mascots: ['claude', 'codex', 'hermes'] },
  { slug: 'workspaces-memory-skills', kicker: 'WORKSPACES', headline: ['Agents that', 'remember.'], sub: 'Memory and skills, per project.', shot: 'mem-next', crop: [655, 90, 650, 240], chip: 'it read the memory first', mascots: ['claude', 'codex', 'agy'] },
  { slug: 'see-every-agent', kicker: 'ONE SCREEN', headline: ['See every', 'agent.'], sub: 'Who works, who waits, who needs you.', shot: 'ask-board', crop: [280, 30, 1140, 760], chip: 'Allow, right on the board', mascots: ['claude', 'codex', 'agy', 'hermes'] },
  { slug: 'automate-work', kicker: 'AUTOMATION', headline: ['Automate', 'the busywork.'], sub: 'Schedules, events, webhooks, workflows.', shot: 'wf-board', crop: [992, 392, 416, 400], chip: 'one task starts the next', mascots: ['claude', 'codex', 'hermes'] },
  { slug: 'into-your-tools', kicker: 'MCP + SLACK', headline: ['Agents in', 'your Slack.'], sub: 'One MCP config. Approvals in Slack.', shot: 'tm-mention', crop: [944, 224, 476, 150], chip: 'sent from Slack, with the file', mascots: ['claude', 'codex', 'agy'] },
  { slug: 'hand-off-fast', kicker: 'HAND OFF FAST', headline: ['Hand off', 'in seconds.'], sub: 'Talk, skip the title, take it back.', shot: 'd-sending', crop: [900, 410, 520, 160], chip: 'Cancel, before it goes', mascots: ['claude', 'codex', 'agy'] },
  { slug: 'end-to-end', kicker: 'THE OVERVIEW', headline: ['Every agent,', 'one place.'], sub: 'The whole tour, in seven minutes.', shot: 'kanban', crop: [280, 100, 1130, 560], chip: 'every agent, one board', mascots: ['claude', 'codex', 'agy', 'hermes'] },
  { slug: 'run-anywhere', kicker: 'MACHINES', headline: ['Run agents', 'anywhere.'], sub: 'Your machines, started from the browser.', shot: 'term-4', crop: [60, 30, 760, 260], chip: 'Claude Code, live in a tab', mascots: ['claude', 'codex', 'agy', 'hermes'] },
];

// The crop, at the shots' own 3x, as a data URI.
export async function cropHref(slug, shot, [x, y, w, h]) {
  const shots = path.join(dir, 'screens', slug);
  const manifest = JSON.parse(fs.readFileSync(path.join(shots, 'manifest.json'), 'utf8'));
  const file = manifest.shots[shot]?.file;
  if (!file) throw new Error(`no shot "${shot}" in ${shots}`);
  const buf = await sharp(path.join(shots, file)).extract({ left: x * SCALE, top: y * SCALE, width: w * SCALE, height: h * SCALE }).webp({ lossless: true }).toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

// The poster's scene: one still frame.
export function posterScene(p, href) {
  const s = new Scene({ width: VW, height: VH, loop: 12, background: C.bg, description: `YouTube poster: ${p.headline.join(' ')}` })
    .font('pixel', FONTS.silkscreen, { fallback: 'monospace' })
    .font('bold', FONTS.inter, { axes: { wght: 800, opsz: 32 } })
    .font('semi', FONTS.inter, { axes: { wght: 700, opsz: 14 } })
    .font('body', FONTS.inter, { axes: { wght: 500, opsz: 18 } });
  sky(s);

  // The screen: the crop, as large as the right half's box allows, centred in it.
  const [, , cw, ch] = p.crop;
  const k = Math.min(BOX_W / cw, BOX_H / ch);
  const W = Math.round(cw * k);
  const H = Math.round(ch * k);
  const X = Math.round(BOX_X + (BOX_W - W) / 2);
  const Y = Math.round(BOX_CY - H / 2);
  const BAR = 26;
  const cx = X + W / 2;
  const cy = Y + H / 2;
  // A green glow behind it.
  s.defs.push(el('radialGradient', { id: 'glow' }, el('stop', { offset: '0%', 'stop-color': GREEN, 'stop-opacity': 0.32 }), el('stop', { offset: '100%', 'stop-color': GREEN, 'stop-opacity': 0 })));
  s.add(el('ellipse', { cx, cy, rx: W * 0.78, ry: H * 0.62 + 120, fill: 'url(#glow)' }));
  s.add(g({ transform: `rotate(-2.5 ${cx} ${cy})` },
    el('rect', { x: X + 14, y: Y - BAR + 16, width: W, height: H + BAR, fill: '#000', opacity: 0.55 }),
    el('rect', { x: X - 4, y: Y - BAR - 4, width: W + 8, height: H + BAR + 8, fill: GREEN }),
    el('rect', { x: X, y: Y - BAR, width: W, height: BAR, fill: '#1c1c1f' }),
    ...[0, 1, 2].map((i) => el('circle', { cx: X + 14 + i * 14, cy: Y - BAR / 2, r: 4, fill: '#3f3f46' })),
    s.text('app.agentrq.com', { x: X + W / 2, y: Y - 8, font: 'semi', size: 12, fill: C.dim, anchor: 'middle' }),
    el('image', { href, x: X, y: Y, width: W, height: H, preserveAspectRatio: 'xMidYMid slice' })));

  // The chip, over the screen's lower right corner (the left one is the mascots').
  const chipW = Math.round(p.chip.length * 13.2 + 40);
  const chipX = Math.min(X + W - chipW + 20, VW - 24 - chipW);
  s.add(g({ transform: `rotate(-2.5 ${cx} ${cy})` },
    el('rect', { x: chipX, y: Y + H - 4, width: chipW, height: 48, rx: 8, fill: GREEN }),
    s.text(p.chip, { x: chipX + chipW / 2, y: Y + H + 28, font: 'semi', size: 22, fill: C.ink, anchor: 'middle' })));

  // The copy.
  s.add(logo(s));
  s.add(s.text(p.kicker, { x: 44, y: 186, font: 'pixel', size: 22, fill: C.lit }));
  const size = headlineSize(p.headline);
  s.add(s.text(p.headline[0], { x: 40, y: 280, font: 'bold', size, fill: C.text, spacing: -2.5 }));
  s.add(s.text(p.headline[1], { x: 40, y: 280 + Math.round(size * 1.09), font: 'bold', size, fill: C.lit, spacing: -2.5 }));
  s.add(s.text(p.sub, { x: 44, y: 336 + Math.round(size * 1.09), font: 'body', size: 26, fill: C.dim }));

  // The ground and the mascots on it.
  s.add(el('rect', { x: 0, y: GROUND, width: VW, height: VH - GROUND, fill: '#101013' }), el('rect', { x: 0, y: GROUND, width: VW, height: 4, fill: C.line }));
  const crowd = collect(s, () => p.mascots.forEach((n, i) => {
    mascot(s, { ...mascotByName(n), name: n === 'agy' ? 'antigravity' : n }, i, { x: 62 + i * STEP });
  }));
  s.add(g({ transform: `translate(0 ${GROUND - 400 * MS}) scale(${MS})` }, crowd));
  return s;
}

// Renders the posters named in `slugs` (all of them when it is empty) to <outDir>/<slug>-youtube.png and .jpg (1280x720).
export async function renderPosters(outDir, slugs = []) {
  const { frames } = await import('../src/render.js');
  fs.mkdirSync(outDir, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'posters-'));
  const out = [];
  try {
    for (const p of POSTERS.filter((x) => !slugs.length || slugs.includes(x.slug))) {
      const s = posterScene(p, await cropHref(p.slug, p.shot, p.crop));
      const svg = path.join(tmp, `${p.slug}.svg`);
      fs.writeFileSync(svg, s.toSVG());
      const [png] = await frames(svg, [0], { width: VW, height: VH, scale: 2560 / VW });
      const base = path.join(outDir, `${p.slug}-youtube`);
      await sharp(png).resize(1280, 720).png().toFile(`${base}.png`);
      await sharp(png).resize(1280, 720).jpeg({ quality: 92 }).toFile(`${base}.jpg`);
      out.push(`${base}.jpg`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return out;
}

// node videos/posters.js <outDir> [slug ...]: every poster, or the ones named.
export async function main([outDir = 'posters', ...slugs], log = console.log) {
  const files = await renderPosters(outDir, slugs);
  log(files.join('\n'));
  return files;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
