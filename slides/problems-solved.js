// A single static 16:9 slide in the house style: what AgentRQ solves today.
// It is not a README scene (no loop, no motion), so it lives in slides/ and
// keeps out of the scenes/ tests that hold scenes to 1200 x 440.
import { Scene, sprite, el, g } from '../src/index.js';
import { C, MASCOTS, rng, newScene } from '../kit/agentrq.js';

export const W = 1920;
export const H = 1080;
const GROUND = 960;
const PX = 6;

// [kicker, problem, solution lines, highlight]
export const CARDS = [
  ['DISTRIBUTED SKILLS', 'Playbooks copied to every box', [
    'Stored once, served over MCP',
    'to every agent, machine and',
    'harness. Edit once, and every',
    'workspace reads the new copy.'], 'lead'],
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
    'for an agent.'], 'new'],
  ['MEMORY + PANO', 'Agents forget everything', [
    'Workspace memory outlives a',
    'task, and shared Pano docs',
    'pass plans and checklists',
    'between agents.']],
  ['MACHINES', 'Agents tied to one laptop', [
    'Start agents on your own boxes',
    'from the web, and open their',
    'live terminals in any browser',
    'from anywhere.']],
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

function stars(s) {
  const r = rng(11);
  for (let i = 0; i < 70; i++) {
    const big = r() > 0.8;
    s.add(el('rect', {
      x: Math.round(r() * W), y: Math.round(r() * (GROUND - 20)),
      width: big ? 4 : 2, height: big ? 4 : 2, fill: big ? '#3f3f46' : '#27272a', class: 'px',
    }));
  }
}

function logo(s, x, y, scale) {
  s.add(g({ transform: `translate(${x} ${y}) scale(${scale})` },
    el('rect', { width: 32, height: 32, rx: 8, fill: C.panel, stroke: C.line }),
    g({ transform: 'translate(4 4)', fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
      el('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
      el('path', { d: 'M12 7l-3.5 8M12 7l3.5 8M9.5 12h5' }))));
}

function card(s, { x, y, w, h }, [kicker, problem, lines, mark], n) {
  const lead = mark === 'lead';
  s.add(el('rect', { x, y, width: w, height: h, fill: lead ? '#0f1f14' : C.panel, stroke: lead ? C.ongoing : C.line, 'stroke-width': 2, class: 'px' }));
  s.add(s.text(String(n).padStart(2, '0'), { x: x + 20, y: y + 38, font: 'pixel', size: 18, fill: lead ? C.lit : C.notstarted }));
  s.add(s.text(kicker, { x: x + 56, y: y + 38, font: 'pixel', size: 18, fill: lead ? C.lit : C.text }));
  if (mark === 'new') {
    s.add(el('rect', { x: x + w - 66, y: y + 18, width: 48, height: 26, fill: C.ask, class: 'px' }));
    s.add(s.text('NEW', { x: x + w - 42, y: y + 37, font: 'pixel', size: 16, fill: C.ink, anchor: 'middle' }));
  }
  // The problem, marked in the blocked red.
  s.add(el('rect', { x: x + 20, y: y + 62, width: 10, height: 10, fill: C.blocked, class: 'px' }));
  s.add(s.text(problem, { x: x + 40, y: y + 72, font: 'mono', size: 15, fill: C.dim }));
  s.add(el('rect', { x: x + 20, y: y + 92, width: w - 40, height: 2, fill: C.line, class: 'px' }));
  // What AgentRQ does about it.
  s.add(el('rect', { x: x + 20, y: y + 112, width: 10, height: 10, fill: C.ongoing, class: 'px' }));
  lines.forEach((line, i) => s.add(s.text(line, { x: x + 40, y: y + 122 + i * 28, font: 'body', size: 18, fill: C.text })));
}

export default async function () {
  const base = newScene({ description: 'x', poster: 1 });
  const s = new Scene({
    width: W, height: H, loop: 1, background: C.bg, poster: 0,
    description: 'What AgentRQ solves today: ten problems of running AI coding agents, each with what AgentRQ does about it, led by distributed skills. Contact hi@agentrq.com, Mustafa Turan, Founder at Contextual, Inc.',
  });
  s.fonts = base.fonts;

  stars(s);

  // Header: the logo, the kicker, a two-line headline and a subtitle.
  logo(s, 80, 64, 1.5);
  s.add(s.text('AgentRQ', { x: 142, y: 101, font: 'bold', size: 32, fill: C.text }));
  s.add(s.text('WHAT IT SOLVES TODAY', { x: 290, y: 99, font: 'pixel', size: 22, fill: C.dim }));
  s.add(s.text('Hand AI agents real work.', { x: 80, y: 196, font: 'bold', size: 68, fill: C.text, spacing: -1.5 }));
  s.add(s.text('Stay in control.', { x: 80, y: 272, font: 'bold', size: 68, fill: C.lit, spacing: -1.5 }));
  s.add(s.text('The task manager and orchestration layer for AI agents: any harness, any machine, one board.', { x: 80, y: 318, font: 'body', size: 24, fill: C.dim }));

  // Ten problems in two rows of five.
  const cols = 5, gap = 24, x0 = 80, y0 = 362, w = (W - 2 * x0 - (cols - 1) * gap) / cols, h = 240;
  CARDS.forEach((c, i) => card(s, { x: x0 + (i % cols) * (w + gap), y: y0 + Math.floor(i / cols) * (h + gap), w, h }, c, i + 1));

  // Ground with the five mascots standing still on it.
  s.add(el('rect', { x: 0, y: GROUND, width: W, height: H - GROUND, fill: '#101013', class: 'px' }));
  s.add(el('rect', { x: 0, y: GROUND, width: W, height: 4, fill: C.line, class: 'px' }));
  let mx = 80;
  for (const m of MASCOTS) {
    const rows = m.art.split('\n').map((l) => l.trim()).filter(Boolean);
    const mw = Math.max(...rows.map((r) => r.length)) * PX, mh = rows.length * PX;
    s.add(el('rect', { x: mx + 4, y: GROUND - 4, width: mw - 8, height: 4, fill: '#000', opacity: 0.5, class: 'px' }));
    s.add(sprite(m.art, m.palette, { px: PX, x: mx, y: GROUND - mh - (m.float ? 10 : 0) }));
    s.add(s.text(m.name, { x: mx + mw / 2, y: GROUND + 34, font: 'pixel', size: 16, fill: m.color, anchor: 'middle' }));
    mx += mw + 44;
  }

  // Contact, bottom right.
  s.add(s.text('hi@agentrq.com', { x: W - 80, y: GROUND + 46, font: 'bold', size: 30, fill: C.text, anchor: 'end' }));
  s.add(s.text('Mustafa Turan  ·  Founder @ Contextual, Inc.', { x: W - 80, y: GROUND + 84, font: 'body', size: 22, fill: C.dim, anchor: 'end' }));
  s.add(s.text('agentrq.com', { x: 80, y: GROUND + 84, font: 'mono', size: 18, fill: C.notstarted }));
  return s;
}
