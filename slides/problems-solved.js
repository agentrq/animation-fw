// A 16:9 slide in the house style: what AgentRQ solves today. It is built
// still (for PNG, JPEG and PDF) or, with { animated: true }, as a 16 s loop
// for a GIF. It is not a README scene, so it lives in slides/ and keeps out
// of the scenes/ tests that hold scenes to 1200 x 440.
import { Scene, sprite, el, g } from '../src/index.js';
import { C, MASCOTS, CHECK, rng, newScene } from '../kit/agentrq.js';

export const W = 1920;
export const H = 1080;
const GROUND = 960;
const PX = 6;

// [kicker, problem, solution lines]
export const CARDS = [
  ['DISTRIBUTED SKILLS', 'Playbooks copied to every box', [
    'Stored once, served over MCP',
    'to every agent, machine and',
    'harness. Edit once, and every',
    'workspace reads the new copy.']],
  ['ONE TASK BOARD', 'Babysitting every terminal', [
    'Agents pick up tasks, report',
    'status and ask you questions on',
    'one live board, with Allow and',
    'Deny right on the task.']],
  ['APPROVALS + YOLO', 'Safe or fast, never both', [
    'Approve per task, or turn on',
    'YOLO for a task or workspace',
    'and still keep a record of',
    'every call it made.']],
  ['TRAJECTORY', 'No idea what an agent ran', [
    'Every tool call and message,',
    'searchable, plus a timeline of',
    'time worked, blocked and',
    'waiting on you.']],
  ['ISOLATED WORKSPACES', 'Agents step on each other', [
    'Each workspace has its own',
    'MCP address, memory and',
    'folder. Forks run in parallel',
    'in their own git worktree.']],
  ['CRON + HOOKS', 'Work stops when you look away', [
    'Cron runs, events and drag and',
    'drop workflows. A failed CI run',
    'on GitHub arrives as a task',
    'for an agent.']],
  ['MEMORY + PANO', 'Agents forget everything', [
    'Workspace memory outlives a',
    'task, and shared Pano docs',
    'pass plans and checklists',
    'between agents.']],
  ['LIVE TERMINALS', 'Agents tied to one laptop', [
    'Agents run on your machines,',
    'in live terminals you open from',
    'where you go: web, desktop',
    'and mobile.']],
  ['ANY AGENT', 'Every harness is different', [
    'One MCP surface for any MCP or',
    'ACP agent: Claude Code, Codex,',
    'Antigravity, Hermes, OpenClaw',
    'and more.']],
  ['SITE TOOLS', 'Logged-in sites off limits', [
    'The Chrome extension lends a',
    "site's WebMCP tools to agents,",
    'run in your own signed-in',
    'browser, with your approval.']],
];

// The animated loop: the header and the cards come in one by one, the
// mascots celebrate, everything holds, then fades out so the loop restarts.
export const LOOP = 16;
const T = { header: 0.2, line1: 0.5, line2: 0.8, sub: 1.1, cards: 1.5, every: 0.4, solve: 0.35, tick: 0.75, contact: 6.0, party: 6.3, out: 15.3 };

// Wraps nodes so they slide up and fade in at `at`, then fade out with the
// loop. A still slide just groups them.
function reveal(s, animated, at, ...nodes) {
  const node = g({}, ...nodes);
  if (!animated) return node;
  const hidden = { opacity: 0, y: 14 };
  return s.anim(node, [[0, hidden], [at, hidden], [at + 0.45, { opacity: 1, y: 0 }, 'out'], [T.out, { opacity: 1, y: 0 }], [T.out + 0.5, { opacity: 0, y: 0 }, 'in']]);
}

function stars(s, animated) {
  const r = rng(11);
  for (let i = 0; i < 70; i++) {
    const big = r() > 0.8;
    const star = el('rect', {
      x: Math.round(r() * W), y: Math.round(r() * (GROUND - 20)),
      width: big ? 4 : 2, height: big ? 4 : 2, fill: big ? '#3f3f46' : '#27272a', class: 'px',
    });
    const twinkle = ((i * 37) % 10) / 10; // not from r(), so the still keeps its stars
    if (animated && twinkle > 0.6) {
      const t = +(twinkle * 3).toFixed(1);
      s.add(s.anim(star, [[0, { opacity: 1 }], [t, { opacity: 0.15 }, 'step'], [t + 0.6, { opacity: 1 }, 'step']], { period: 4 }));
    } else s.add(star);
  }
}

function logo(x, y, scale) {
  return g({ transform: `translate(${x} ${y}) scale(${scale})` },
    el('rect', { width: 32, height: 32, rx: 8, fill: C.panel, stroke: C.line }),
    g({ transform: 'translate(4 4)', fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
      el('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
      el('path', { d: 'M12 7l-3.5 8M12 7l3.5 8M9.5 12h5' })));
}

// A card names the problem, then what AgentRQ does about it.
function card(s, animated, at, { x, y, w, h }, [kicker, problem, lines], n) {
  s.add(reveal(s, animated, at,
    el('rect', { x, y, width: w, height: h, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    s.text(String(n).padStart(2, '0'), { x: x + 20, y: y + 38, font: 'pixel', size: 18, fill: C.notstarted }),
    s.text(kicker, { x: x + 56, y: y + 38, font: 'pixel', size: 18, fill: C.text }),
    el('rect', { x: x + 20, y: y + 62, width: 10, height: 10, fill: C.blocked, class: 'px' }),
    s.text(problem, { x: x + 40, y: y + 72, font: 'mono', size: 15, fill: C.dim }),
    el('rect', { x: x + 20, y: y + 92, width: w - 40, height: 2, fill: C.line, class: 'px' })));
  s.add(reveal(s, animated, at + T.solve,
    el('rect', { x: x + 20, y: y + 112, width: 10, height: 10, fill: C.ongoing, class: 'px' }),
    ...lines.map((line, i) => s.text(line, { x: x + 40, y: y + 122 + i * 28, font: 'body', size: 18, fill: C.text }))));
  // In the animation, a green check pops onto the card once its fix is in.
  if (animated) {
    const tick = g({},
      el('rect', { width: 26, height: 26, fill: C.lit, class: 'px' }),
      sprite(CHECK, { '#': C.ink }, { px: 3, x: 3, y: 4 }));
    const pos = { x: x + w - 38, y: y + 19 }, on = at + T.tick;
    s.add(s.anim(tick, [[0, { ...pos, scale: 0, opacity: 0 }], [on, { scale: 0, opacity: 0 }], [on + 0.3, { scale: 1, opacity: 1 }, 'back'],
      [T.out, { scale: 1, opacity: 1 }], [T.out + 0.5, { opacity: 0 }, 'in']], { origin: 'center' }));
  }
}

// A mascot on the ground: still, or bobbing and hopping when the cards are in.
function mascot(s, animated, m, i, x) {
  const rows = m.art.split('\n').map((l) => l.trim()).filter(Boolean);
  const mw = Math.max(...rows.map((r) => r.length)) * PX, mh = rows.length * PX;
  const top = GROUND - mh - (m.float ? 10 : 0);
  s.add(el('rect', { x: x + 4, y: GROUND - 4, width: mw - 8, height: 4, fill: '#000', opacity: 0.5, class: 'px' }));
  if (!animated) s.add(sprite(m.art, m.palette, { px: PX, x, y: top }));
  else {
    const bob = s.anim(sprite(m.art, m.palette, { px: PX }),
      [[0, { y: i % 2 ? -PX : 0 }], [0.5, { y: i % 2 ? 0 : -PX }, 'step'], [1, { y: i % 2 ? -PX : 0 }, 'step']], { period: 1 });
    const keys = [[0, { x, y: top }]];
    for (const t of [T.party + i * 0.15, T.party + 1.2 + i * 0.15]) {
      keys.push([t, { y: top }], [t + 0.18, { y: top - 22 }, 'out'], [t + 0.36, { y: top }, 'in']);
    }
    s.add(s.anim(bob, keys));
  }
  s.add(s.text(m.name, { x: x + mw / 2, y: GROUND + 34, font: 'pixel', size: 16, fill: m.color, anchor: 'middle' }));
  return mw;
}

export default async function ({ animated = false } = {}) {
  const base = newScene({ description: 'x', poster: 1 });
  const s = new Scene({
    width: W, height: H, loop: animated ? LOOP : 1, background: C.bg, poster: animated ? 10 : 0,
    description: `What AgentRQ solves today: ten problems of running AI coding agents, each with what AgentRQ does about it. Contact hi@agentrq.com${animated ? '' : ', Mustafa Turan, Founder at Contextual, Inc'}.`,
  });
  s.fonts = base.fonts;

  stars(s, animated);

  // Header: the logo, the kicker, a two-line headline and a subtitle.
  s.add(reveal(s, animated, T.header,
    logo(80, 64, 1.5),
    s.text('AgentRQ', { x: 142, y: 101, font: 'bold', size: 32, fill: C.text }),
    s.text('WHAT IT SOLVES TODAY', { x: 290, y: 99, font: 'pixel', size: 22, fill: C.dim })));
  s.add(reveal(s, animated, T.line1, s.text('Hand AI agents real work.', { x: 80, y: 196, font: 'bold', size: 68, fill: C.text, spacing: -1.5 })));
  s.add(reveal(s, animated, T.line2, s.text('Stay in control.', { x: 80, y: 272, font: 'bold', size: 68, fill: C.lit, spacing: -1.5 })));
  s.add(reveal(s, animated, T.sub, s.text('Self-learning task manager and orchestration layer for AI agents: any harness, any machine, one board.', { x: 80, y: 318, font: 'body', size: 24, fill: C.dim })));

  // Ten problems in two rows of five, coming in one by one.
  const cols = 5, gap = 24, x0 = 80, y0 = 362, w = (W - 2 * x0 - (cols - 1) * gap) / cols, h = 240;
  CARDS.forEach((c, i) => card(s, animated, T.cards + i * T.every,
    { x: x0 + (i % cols) * (w + gap), y: y0 + Math.floor(i / cols) * (h + gap), w, h }, c, i + 1));

  // Ground with the five mascots on it.
  s.add(el('rect', { x: 0, y: GROUND, width: W, height: H - GROUND, fill: '#101013', class: 'px' }));
  s.add(el('rect', { x: 0, y: GROUND, width: W, height: 4, fill: C.line, class: 'px' }));
  let mx = 80;
  MASCOTS.forEach((m, i) => { mx += mascot(s, animated, m, i, mx) + 44; });

  // Contact, bottom right. The animated loop names only AgentRQ, not the founder.
  s.add(reveal(s, animated, T.contact,
    s.text('hi@agentrq.com', { x: W - 80, y: GROUND + (animated ? 64 : 46), font: 'bold', size: 30, fill: C.text, anchor: 'end' }),
    animated ? null : s.text('Mustafa Turan  ·  Founder @ Contextual, Inc.', { x: W - 80, y: GROUND + 84, font: 'body', size: 22, fill: C.dim, anchor: 'end' })));
  s.add(s.text('agentrq.com', { x: 80, y: GROUND + 84, font: 'mono', size: 18, fill: C.notstarted }));
  return s;
}
