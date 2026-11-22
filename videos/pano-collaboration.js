// Agent collaboration on the Pano, narrated, about seven minutes: each chapter
// opens on a pain in the house style (sky, ground, mascots), then shows the fix on
// real screens of the app, captured with src/capture.js from a local AgentRQ where
// a supervisor splits a feature across five workspaces. The captures and their
// regions are in videos/screens/pano-collaboration.
// Build: node bin/video.js videos/pano-collaboration.js --size 3840x2160
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { el, g, sprite } from '../src/index.js';
import { C, mascotByName, mascot, rng } from '../kit/agentrq.js';
import { loadTimeline, beatsById, videoScene, showDuring, captions, VW } from './lib.js';
import { Screen, loadShots } from './screen.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'pano-collaboration.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, 'screens/pano-collaboration');

const BAND = 595;
const GROUND_Y = 520;
const LIFT = GROUND_Y - 400; // the kit stands mascots on y 400
const FADE = 0.4;
const NAMES = ['claude', 'codex', 'agy', 'hermes', 'openclaw'];
const ARTX = 560;
const MX = (i) => 615 + i * 122; // a mascot under each of five panes

// The nodes a kit call adds to the scene, taken back out so they can be placed.
function collect(s, fn) {
  const n = s.body.length;
  fn();
  return s.body.splice(n);
}

const fadeSpan = (s, node, [from, to], fade = FADE) => s.anim(node,
  [[0, { opacity: 0 }], [from, { opacity: 0 }, 'step'], [from + fade, { opacity: 1 }], [to - fade, { opacity: 1 }], [to, { opacity: 0 }]]);

// ---------------------------------------------------------------- house pieces

function logo(s) {
  return g({},
    g({ transform: 'translate(40 32) scale(1.1)' },
      el('rect', { width: 32, height: 32, rx: 8, fill: C.panel, stroke: C.line }),
      g({ transform: 'translate(4 4)', fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
        el('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
        el('path', { d: 'M12 7l-3.5 8M12 7l3.5 8M9.5 12h5' }))),
    s.text('AgentRQ', { x: 86, y: 59, font: 'bold', size: 22, fill: C.text }));
}

function groundStrip(s) {
  const r = rng(11);
  s.add(el('rect', { x: 0, y: GROUND_Y, width: VW, height: BAND - GROUND_Y, fill: '#101013', class: 'px' }),
    el('rect', { x: 0, y: GROUND_Y, width: VW, height: 4, fill: C.line, class: 'px' }));
  for (let i = 0; i < 30; i++) {
    s.add(el('rect', { x: Math.round(r() * VW / 4) * 4, y: GROUND_Y + 10 + Math.round(r() * 12) * 4, width: 8, height: 4, fill: '#18181b', class: 'px' }));
  }
}

// The copy on the left of a card: kicker, two-line headline, a line under it.
function cardText(s, { kicker, headline, sub }) {
  return g({},
    s.text(kicker, { x: 40, y: 112, font: 'pixel', size: 16, fill: C.lit }),
    s.text(headline[0], { x: 40, y: 178, font: 'bold', size: 48, fill: C.text, spacing: -1 }),
    s.text(headline[1], { x: 40, y: 234, font: 'bold', size: 48, fill: C.text, spacing: -1 }),
    s.text(sub, { x: 40, y: 276, font: 'body', size: 20, fill: C.dim }));
}

function pane(s, { x, y, w, h, title, color }) {
  return g({},
    el('rect', { x, y, width: w, height: h, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    el('rect', { x: x + 2, y: y + 2, width: w - 4, height: 22, fill: '#1c1c1f', class: 'px' }),
    el('rect', { x: x + 10, y: y + 10, width: 6, height: 6, fill: color, class: 'px' }),
    s.text(title, { x: x + 22, y: y + 18, font: 'pixel', size: 11, fill: color }));
}

function bubbleLine(s, { x, y, w, text, you = false, fill }) {
  return g({},
    el('rect', { x, y, width: w, height: 24, fill: fill ?? (you ? C.text : C.card), stroke: you ? 'none' : C.line, class: 'px' }),
    s.text(text, { x: x + 10, y: y + 16, font: 'semi', size: 12, fill: you ? C.ink : C.text }));
}

// A little paper doc: a page with a folded corner and lines, and a label.
function doc(s, label, { fill = '#fef3c7', ink = '#78350f', w = 92 } = {}) {
  return g({},
    el('rect', { width: w, height: 30, fill, class: 'px' }),
    el('rect', { x: w - 10, width: 10, height: 10, fill: C.panel, class: 'px' }),
    el('rect', { x: w - 10, y: 0, width: 6, height: 6, fill: ink, opacity: 0.25, class: 'px' }),
    s.text(label, { x: 8, y: 20, font: 'mono', size: 11, fill: ink }));
}

function tagChip(s, label, { x, y, fill, color = C.ink }) {
  const w = Math.round(label.length * 9.6 + 20);
  return g({}, el('rect', { x, y, width: w, height: 26, fill, class: 'px' }),
    s.text(label, { x: x + w / 2, y: y + 18, font: 'pixel', size: 12, fill: color, anchor: 'middle' }));
}

const ARROW = `
  #.........
  ##........
  #w#.......
  #ww#......
  #www#.....
  #wwww#....
  #wwwww#...
  #wwwwww#..
  #wwwwwww#.
  #wwww#####
  #ww#w#....
  #w#.#w#...
  ##..#w#...
  .....##...`;
const arrow = () => sprite(ARROW, { '#': C.ink, w: C.text }, { px: 2 });

// ---------------------------------------------------------------- the cards' art

// Five agents, five chats, and you carrying the plan from one to the next.
function artGlue(s, at) {
  const t0 = at('hook', 1.2);
  const panes = NAMES.map((n, i) => pane(s, { x: ARTX + i * 122, y: 70, w: 110, h: 170, title: n, color: mascotByName(n).color }));
  const copies = NAMES.map((_, i) => s.anim(g({ transform: `translate(${ARTX + 9 + i * 122} 104)` }, doc(s, 'plan.md')),
    [[0, { opacity: 0 }], [t0 + i * 1.1, { opacity: 0 }, 'step'], [t0 + i * 1.1 + 0.05, { opacity: 1 }, 'step']]));
  const hops = NAMES.slice(1).map((_, i) => {
    const from = t0 + i * 1.1;
    return s.anim(g({}, doc(s, 'plan.md'), g({ transform: 'translate(60 18)' }, arrow())),
      [[0, { x: ARTX + 9 + i * 122, y: 104, opacity: 0 }], [from + 0.1, { opacity: 1 }, 'step'], [from + 1.0, { x: ARTX + 9 + (i + 1) * 122, y: 104 }, 'inOut'], [from + 1.1, { opacity: 0 }, 'step']]);
  });
  const ask = at('pain', 0.4);
  const questions = NAMES.map((_, i) => s.anim(bubbleLine(s, { x: ARTX + 9 + i * 122, y: 150 + (i % 2) * 30, w: 92, text: ['blocked?', 'which API?', 'done yet?', 'what plan?', 'is it v2?'][i], fill: '#713f12' }),
    [[0, { opacity: 0 }], [ask + i * 0.5, { opacity: 0 }, 'step'], [ask + i * 0.5 + 0.05, { opacity: 1 }, 'step']]));
  const pains = ['copy, paste', 'relay questions', 'chase status'].map((label, i) => s.anim(tagChip(s, label, { x: 40 + [0, 150, 340][i], y: 320, fill: [C.ask, '#fb923c', C.blocked][i] }),
    [[0, { opacity: 0 }], [at('pain', 1.2 + i * 1.3), { opacity: 0 }, 'step'], [at('pain', 1.2 + i * 1.3) + 0.05, { opacity: 1 }, 'step']]));
  return g({}, ...panes, ...copies, ...hops, ...questions, ...pains);
}

// The promise: a board every workspace shares, and a supervisor.
function artPromise(s) {
  const note = (x, y, fill, rot) => g({ transform: `translate(${x} ${y}) rotate(${rot})` },
    el('rect', { width: 62, height: 62, fill, class: 'px' }), el('rect', { x: 20, y: -6, width: 22, height: 10, fill: '#ffffff55', class: 'px' }),
    el('rect', { x: 8, y: 16, width: 40, height: 4, fill: '#00000033', class: 'px' }), el('rect', { x: 8, y: 28, width: 46, height: 4, fill: '#00000033', class: 'px' }),
    el('rect', { x: 8, y: 40, width: 30, height: 4, fill: '#00000033', class: 'px' }));
  const node = (x, y, label, color) => g({},
    el('rect', { x, y, width: 92, height: 30, fill: C.card, stroke: color, 'stroke-width': 2, class: 'px' }),
    s.text(label, { x: x + 46, y: y + 20, font: 'pixel', size: 11, fill: color, anchor: 'middle' }));
  const edges = [0, 1, 2, 3].map((i) => el('rect', { x: 925 + i * 66 + 40, y: 222, width: 3, height: 22, fill: C.line, class: 'px' }));
  return g({},
    el('rect', { x: ARTX, y: 70, width: 280, height: 290, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    s.text('PANO', { x: ARTX + 20, y: 104, font: 'pixel', size: 18, fill: C.ask }),
    note(ARTX + 30, 130, '#fef08a', -4), note(ARTX + 110, 124, '#bfdbfe', 3), note(ARTX + 190, 132, '#bbf7d0', -2),
    note(ARTX + 70, 214, '#fbcfe8', 2), note(ARTX + 150, 212, '#e9d5ff', -3),
    s.text('one board every', { x: ARTX + 20, y: 316, font: 'body', size: 15, fill: C.dim }),
    s.text('workspace shares', { x: ARTX + 20, y: 336, font: 'body', size: 15, fill: C.dim }),
    el('rect', { x: 870, y: 70, width: 290, height: 290, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    s.text('SUPERVISOR', { x: 890, y: 104, font: 'pixel', size: 18, fill: C.lit }),
    node(969, 140, 'supervisor', C.lit), el('rect', { x: 1014, y: 170, width: 3, height: 52, fill: C.line, class: 'px' }),
    el('rect', { x: 965, y: 220, width: 201, height: 3, fill: C.line, class: 'px' }), ...edges,
    ...['api', 'web', 'worker', 'docs'].map((n, i) => g({}, el('rect', { x: 942 + i * 66, y: 244, width: 50, height: 26, fill: C.card, stroke: C.line, class: 'px' }),
      s.text(n, { x: 967 + i * 66, y: 261, font: 'mono', size: 11, fill: C.text, anchor: 'middle' }))),
    s.text('an agent that', { x: 890, y: 316, font: 'body', size: 15, fill: C.dim }),
    s.text('runs the team', { x: 890, y: 336, font: 'body', size: 15, fill: C.dim }));
}

// One plan in one chat; the other agents never see it.
function artOnePlan(s, at) {
  const t = at('pano-pain', 1.5);
  return g({},
    ...['claude', 'codex', 'agy'].map((n, i) => pane(s, { x: ARTX + i * 202, y: 70, w: 186, h: 220, title: n, color: mascotByName(n).color })),
    g({ transform: `translate(${ARTX + 14} 110)` }, doc(s, 'PLAN.md', { w: 130 })),
    bubbleLine(s, { x: ARTX + 14, y: 154, w: 158, text: '5 steps, 3 agents' }),
    bubbleLine(s, { x: ARTX + 14, y: 186, w: 158, text: 'API first, then web' }),
    ...[1, 2].map((i) => s.anim(g({},
      s.text('?', { x: ARTX + i * 202 + 93, y: 190, font: 'pixel', size: 64, fill: C.ask, anchor: 'middle' }),
      s.text('no plan here', { x: ARTX + i * 202 + 93, y: 236, font: 'body', size: 14, fill: C.dim, anchor: 'middle' })),
    [[0, { opacity: 0 }], [t + i * 0.6, { opacity: 0 }, 'step'], [t + i * 0.6 + 0.05, { opacity: 1 }, 'step']])));
}

// Action items scattered across sticky notes and messages, owned by no one.
function artScattered(s, at) {
  const NOTES = [['export API', '#fef08a', 590, 80, -6], ['settings page', '#bfdbfe', 760, 120, 4], ['email job', '#bbf7d0', 940, 74, -3],
    ['help article', '#fbcfe8', 640, 230, 5], ['e2e test', '#e9d5ff', 860, 250, -5], ['who owns it?', '#fed7aa', 1040, 210, 3]];
  return g({}, ...NOTES.map(([label, fill, x, y, rot], i) => {
    const t = at('notes-pain', 0.5 + i * 0.35);
    const n = g({ transform: `rotate(${rot})` },
      el('rect', { width: 130, height: 96, fill, class: 'px' }),
      el('rect', { x: 46, y: -6, width: 38, height: 12, fill: '#ffffff66', class: 'px' }),
      s.text(label, { x: 12, y: 34, font: 'semi', size: 14, fill: '#27272a' }),
      el('rect', { x: 12, y: 50, width: 96, height: 4, fill: '#00000022', class: 'px' }),
      el('rect', { x: 12, y: 62, width: 70, height: 4, fill: '#00000022', class: 'px' }),
      el('rect', { x: 92, y: 70, width: 30, height: 20, fill: C.ink, class: 'px' }),
      s.text('?', { x: 107, y: 86, font: 'pixel', size: 14, fill: C.ask, anchor: 'middle' }));
    return s.anim(n, [[0, { x, y: y - 30, opacity: 0 }], [t, { opacity: 0 }, 'step'], [t + 0.4, { y, opacity: 1 }, 'back'],
      [t + 2.4, { y: y + 6 }, 'inOut'], [t + 4.4, { y }, 'inOut']]);
  }));
}

// You hand out tasks one by one while the other agents wait.
function artOneByOne(s, at) {
  const TASKS = ['Export API', 'Settings', 'Email job', 'Help article', 'E2E test'];
  const parts = [];
  TASKS.forEach((label, i) => {
    const y = 80 + i * 46;
    const chip = g({}, el('rect', { width: 116, height: 34, fill: C.card, stroke: C.line, 'stroke-width': 2, class: 'px' }),
      el('rect', { width: 4, height: 34, fill: C.notstarted, class: 'px' }), s.text(label, { x: 14, y: 22, font: 'semi', size: 13, fill: C.text }));
    if (i < 3) {
      const t = at('split-pain', 1.0 + i * 2.0);
      const to = { x: MX(i) - 58, y: 330 };
      parts.push(s.anim(g({}, chip, g({ transform: 'translate(90 20)' }, arrow())),
        [[0, { x: ARTX + 20, y }], [t, { x: ARTX + 20, y }, 'step'], [t + 1.2, to, 'inOut'], [t + 1.25, { opacity: 0 }, 'step']]));
      parts.push(s.anim(g({ transform: `translate(${to.x} ${to.y})` }, chip), [[0, { opacity: 0 }], [t + 1.25, { opacity: 1 }, 'step']]));
    } else parts.push(g({ transform: `translate(${ARTX + 20} ${y})` }, chip));
  });
  return g({}, s.text('your list', { x: ARTX + 20, y: 66, font: 'pixel', size: 12, fill: C.dim }), ...parts);
}

// A contract copied from one chat to another, then changed where the copy cannot see.
function artCopyPaste(s, at) {
  const t = at('handoff-pain', 1.2);
  return g({},
    pane(s, { x: ARTX + 10, y: 70, w: 250, h: 230, title: 'api', color: mascotByName('claude').color }),
    pane(s, { x: ARTX + 340, y: 70, w: 250, h: 230, title: 'web', color: mascotByName('codex').color }),
    s.anim(g({ transform: `translate(${ARTX + 30} 110)` }, doc(s, 'contract v1', { w: 130, fill: '#dbeafe', ink: '#1e3a8a' })),
      [[0, { opacity: 1 }], [t + 3.4, { opacity: 0 }, 'step']]),
    s.anim(g({ transform: `translate(${ARTX + 30} 110)` }, doc(s, 'contract v2', { w: 130, fill: '#bbf7d0', ink: '#14532d' })),
      [[0, { opacity: 0 }], [t + 3.4, { opacity: 1 }, 'step']]),
    s.anim(g({}, doc(s, 'contract v1', { w: 130, fill: '#dbeafe', ink: '#1e3a8a' }), g({ transform: 'translate(100 18)' }, arrow())),
      [[0, { x: ARTX + 30, y: 110, opacity: 0 }], [t, { opacity: 1 }, 'step'], [t + 1.4, { x: ARTX + 360, y: 110 }, 'inOut']]),
    s.anim(tagChip(s, 'copy, paste', { x: ARTX + 220, y: 160, fill: C.ask }), [[0, { opacity: 0 }], [t + 0.3, { opacity: 1 }, 'step'], [t + 2.0, { opacity: 0 }, 'step']]),
    s.anim(tagChip(s, 'stale copy!', { x: ARTX + 380, y: 160, fill: C.blocked, color: C.text }), [[0, { opacity: 0 }], [t + 4.0, { opacity: 1 }, 'step']]));
}

// "Done yet?" in four chats, and four agents still typing.
function artDoneYet(s, at) {
  const parts = [];
  ['claude', 'codex', 'agy', 'hermes'].forEach((n, i) => {
    const x = ARTX + (i % 2) * 300;
    const y = 66 + Math.floor(i / 2) * 136;
    const t = at('status-pain', 0.8 + i * 1.1);
    parts.push(pane(s, { x, y, w: 286, h: 124, title: n, color: mascotByName(n).color }),
      s.anim(bubbleLine(s, { x: x + 170, y: y + 36, w: 100, text: 'done yet?', you: true }), [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step']]),
      s.anim(g({}, ...[0, 1, 2].map((d) => s.anim(el('rect', { x: x + 22 + d * 12, y: y + 88, width: 6, height: 6, fill: C.dim, class: 'px' }),
        [[0, { opacity: 0.3 }], [0.25 + d * 0.25, { opacity: 1 }, 'step'], [1, { opacity: 0.3 }]], { period: 1 }))), [[0, { opacity: 0 }], [t + 0.6, { opacity: 1 }, 'step']]));
  });
  return g({}, ...parts);
}

// The end card: the line to remember, and where to try it.
function artEnd(s) {
  return g({},
    s.text('agentrq.com', { x: 860, y: 200, font: 'bold', size: 64, fill: C.text, anchor: 'middle', spacing: -1.5 }),
    s.text('the Pano and the supervisor, free during beta', { x: 860, y: 244, font: 'body', size: 20, fill: C.dim, anchor: 'middle' }),
    el('rect', { x: 640, y: 290, width: 440, height: 54, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
    s.text('How do your agents work together?', { x: 860, y: 324, font: 'semi', size: 18, fill: C.lit, anchor: 'middle' }));
}

// ---------------------------------------------------------------- the video

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);

  const s = videoScene({
    tl,
    ground: false,
    poster: at('chips', 4),
    thumbnail: at('assign', 4),
    description: 'Agent collaboration on the AgentRQ Pano, narrated over real screens of the app: you write meeting notes on the shared board, the supervisor splits them across five workspaces and starts four agents in parallel, the API agent posts a contract the web agent reads and questions in comments, and each checklist item ticks itself as its task completes, until five of five are done.',
  });
  groundStrip(s);

  // ------------------------------------------------ cards
  const CARDS = [
    { span: [0, end('pain')], kicker: 'ONE FEATURE, FIVE AGENTS', headline: ['Five agents.', 'One of you.'], sub: 'You are the glue between their chats.', art: artGlue },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ', headline: ['Agent collaboration,', 'made easy.'], sub: 'A shared board, and a supervisor.', art: artPromise },
    { span: [start('pano-pain'), end('pano-pain')], kicker: '01 / THE PANO', headline: ['One plan.', 'Many chats.'], sub: 'The other agents never see it.', art: artOnePlan },
    { span: [start('notes-pain'), end('notes-pain')], kicker: '02 / MEETING NOTES', headline: ['Action items,', 'owned by no one.'], sub: 'Scattered across notes and messages.', art: artScattered },
    { span: [start('split-pain'), end('split-pain')], kicker: '03 / THE SUPERVISOR', headline: ['Who does what?', 'You, one by one.'], sub: 'Every other agent waits its turn.', art: artOneByOne },
    { span: [start('handoff-pain'), end('handoff-pain')], kicker: '04 / HAND-OFFS', headline: ['Copy. Paste.', 'Hope it is current.'], sub: 'The contract lives in another workspace.', art: artCopyPaste },
    { span: [start('status-pain'), end('status-pain')], kicker: '05 / STATUS', headline: ['Done yet?', 'Done yet?'], sub: 'Asking every agent, every hour.', art: artDoneYet },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Agent collaboration,', 'made easy.'], sub: 'Plan, split, hand off, report. One board.', art: artEnd },
  ];
  for (const c of CARDS) {
    // The first card holds its opening frame rather than fading in from black.
    const node = g({}, logo(s), cardText(s, c), c.art(s, at));
    s.add(c.span[0] === 0 ? s.anim(node, [[0, { opacity: 1 }], [c.span[1] - FADE, { opacity: 1 }], [c.span[1], { opacity: 0 }]]) : fadeSpan(s, node, c.span));
  }

  // The mascots stand on the ground under every card, and react to its story.
  const cardSpans = CARDS.map((c) => c.span);
  const sp = (id, a = 1, z) => [at(id, a), z === undefined ? end(id) - 0.2 : at(id, z)];
  const BEHAVE = {
    claude: { work: [sp('hook', 1)], ask: [sp('pain', 0.4), sp('status-pain', 1.5)], done: [sp('promise', 1), sp('cta', 1)], alert: [sp('handoff-pain', 5.2)] },
    codex: { ask: [sp('pain', 0.9), sp('pano-pain', 2.0), sp('handoff-pain', 2)], done: [sp('promise', 1.3), sp('cta', 1.3)], work: [sp('status-pain', 2)] },
    agy: { ask: [sp('pain', 1.4), sp('pano-pain', 2.6)], done: [sp('promise', 1.6), sp('cta', 1.6)], work: [sp('status-pain', 3)], say: [['zZ', [sp('split-pain', 0.5, 4.9)]]] },
    hermes: { ask: [sp('pain', 1.9), sp('notes-pain', 2)], done: [sp('promise', 1.9), sp('cta', 1.9)], work: [sp('status-pain', 4)], say: [['zZ', [sp('split-pain', 0.5)]]] },
    openclaw: { ask: [sp('pain', 2.4), sp('notes-pain', 3)], done: [sp('promise', 2.2), sp('cta', 2.2)], say: [['zZ', [sp('split-pain', 0.5)]]] },
  };
  const hopsAt = (spans) => spans.map(([t0]) => [t0, 16]);
  const crowd = collect(s, () => NAMES.forEach((n, i) => {
    const m = BEHAVE[n];
    mascot(s, { ...mascotByName(n), name: n === 'agy' ? 'antigravity' : n }, i, {
      x: MX(i), hops: hopsAt([...(m.done ?? []), ...(m.alert ?? [])]), ...m, say: m.say ?? [],
    });
  }));
  s.add(showDuring(s, g({ transform: `translate(0 ${LIFT})` }, crowd), cardSpans));

  // ------------------------------------------------ screens
  const shots = loadShots(SHOTS);
  const sc = new Screen(s, shots, { safe: { x: 0, y: 0, w: VW, h: BAND } });
  const ROW1 = [90, 104, 1316, 368];
  const LIST = (shot) => ({ region: 'body', shot, x: -0.03, y: -0.02, w: 0.62, h: 0.75 });

  // 01 The Pano
  sc.show('board', start('board'), { fade: 0 }).cut(start('board'), 'window').look(at('board', 2.5), ROW1, { dur: 2.5 });
  sc.look(start('authors'), [410, 160, 995, 320]);
  sc.callout(at('authors', 1.6), at('authors', 4.2), 'foot0', { label: 'the docs agent, 3 hours ago' });
  sc.callout(at('authors', 3.3), at('authors', 5.9), 'foot1', { label: 'the web agent, a day ago' });
  sc.callout(at('authors', 5.0), at('authors', 8.6), 'foot2', { label: 'the api agent' });
  sc.look(start('filter'), [90, 100, 1130, 60]);
  sc.callout(at('filter', 1.4), end('filter') - 0.3, 'pills', { label: 'paper colors' });
  sc.callout(at('filter', 1.4), end('filter') - 0.3, 'filter', { label: 'filter by title' });
  sc.look(start('chatbox'), [81, 540, 1326, 240]);
  sc.callout(at('chatbox', 1.5), end('chatbox') - 0.3, 'chat', { label: 'chat with your supervisor', side: 'above' });

  // 02 Meeting notes
  sc.cut(start('new-note'), 'newCard');
  sc.click(at('new-note', 3.6), { region: 'newCard', x: 0.2, y: 0.68, w: 0.08, h: 0.09 });
  sc.show('note-empty', at('new-note', 3.9), { fade: 0.25 }).away(at('new-note', 4.1));
  sc.look(at('new-note', 4.2), [238, 150, 1150, 540], { dur: 1.0 });
  sc.look(at('new-note', 5.6), 'paper', { dur: 1.0 });
  sc.show('note-title', at('typing', 0.4), { wipe: 0.5 });
  sc.show('note-typed-1', at('typing', 1.6), { wipe: 0.8 });
  sc.show('note-typed-2', at('typing', 3.4), { wipe: 1.6 });
  sc.show('note-typed-3', at('typing', 5.8), { wipe: 1.6 });
  sc.look(start('checkboxes'), [262, 374, 520, 240]);
  sc.callout(at('checkboxes', 1.4), end('checkboxes') - 0.3, { region: 'text', x: -0.01, y: 0.2, w: 0.5, h: 0.37 }, { label: '- [ ] makes a checkbox', side: 'right' });
  sc.look(start('post'), [600, 150, 820, 560], { dur: 0.9 });
  sc.click(at('post', 1.6), 'save');
  sc.show('note-posted', at('post', 1.9)).away(at('post', 2.1));
  sc.look(at('post', 2.0), { region: 'paper', shot: 'note-posted', h: 0.62 });
  sc.callout(at('post', 3.4), at('post', 5.6), 'progress', { label: '0 of 5 done' });
  sc.show('board-kickoff', at('post', 5.9)).look(at('post', 5.9), ROW1, { dur: 0.8 });
  sc.callout(at('post', 7.0), end('post') - 0.3, 'card0', { label: 'every workspace sees it' });

  // 03 The supervisor
  sc.show('chat-hash', start('hash')).cut(start('hash'), [81, 470, 1326, 310]);
  sc.callout(at('hash', 1.2), end('hash') - 0.3, 'menu', { label: '# tags a doc', side: 'above' });
  sc.show('chat-typed', at('ask', 0.4), { wipe: 0.6 });
  sc.callout(at('ask', 1.6), end('ask') - 0.3, 'chip', { label: 'the tagged note', side: 'above' });
  sc.click(at('open', 1.0), [1352, 742, 26, 26]);
  sc.look(at('open', 1.3), 'window', { dur: 0.9 }).away(at('open', 1.5));
  sc.show('chat-open', at('open', 2.3), { fade: 0.3 });
  sc.show('chat-reply-1', at('reads', 0.6)).look(at('reads', 0.3), { region: 'column', y: 0.15, h: 0.36 });
  sc.callout(at('reads', 2.2), end('reads') - 0.3, { region: 'column', x: 0.03, y: 0.19, w: 0.94, h: 0.2 }, { label: 'what depends on what' });
  sc.show('chat-reply-2', at('assign', 0.5)).look(at('assign', 0.3), 'window', { dur: 1.0 });
  sc.look(at('assign', 2.6), [560, 180, 870, 620], { dur: 1.2 });
  sc.callout(at('assign', 4.0), end('assign') - 0.3, [1016, 214, 400, 572], { label: 'four agents, live', side: 'left' });
  sc.show('kickoff-assigned', start('chips')).look(start('chips'), LIST('kickoff-assigned'), { dur: 1.0 });
  sc.callout(at('chips', 2.4), end('chips') - 0.3, [407, 372, 101, 21], { label: 'owner and live status', side: 'right' });
  sc.callout(at('waits', 1.0), at('waits', 5.0), [134, 336, 440, 140], { label: 'now, in parallel', side: 'right' });
  sc.callout(at('waits', 5.2), end('waits') - 0.3, [134, 484, 300, 56], { label: 'waits for api and web', side: 'right' });
  sc.show('kanban-parallel', start('kanban')).cut(start('kanban'), 'window').look(at('kanban', 0.6), [96, 116, 1300, 510]);
  sc.callout(at('kanban', 2.0), end('kanban') - 0.3, [430, 120, 304, 494], { label: 'five agents at once', side: 'right' });
  sc.look(start('isolation'), [430, 150, 304, 470]);
  [[446, 160, 122], [446, 254, 56], [446, 348, 60], [446, 442, 78], [446, 536, 66]].forEach(([x, y, w], i) =>
    sc.callout(at('isolation', 1.2 + i * 0.5), end('isolation') - 0.3, [x, y, w, 20], i === 4 ? { label: 'one workspace each', side: 'left' } : {}));

  // 04 Hand-offs
  sc.show('board-contract', start('contract-card')).cut(start('contract-card'), ROW1);
  sc.callout(at('contract-card', 1.4), end('contract-card') - 0.3, 'card1', { label: 'posted by the api agent', side: 'below' });
  sc.show('contract', start('contract')).look(start('contract'), { region: 'paper', shot: 'contract', by: 10 }, { dur: 1.0 });
  sc.callout(at('contract', 2.0), end('contract') - 0.3, { region: 'table', by: 6 }, { label: 'endpoint and parameters', side: 'above' });
  sc.show('contract-web-task', start('web-reads')).look(start('web-reads'), { region: 'column', y: 0.15, h: 0.25 });
  sc.callout(at('web-reads', 1.8), end('web-reads') - 0.3, { region: 'column', x: 0.03, y: 0.19, w: 0.94, h: 0.1 }, { label: 'read from the Pano' });
  sc.show('contract-question', start('question')).look(start('question'), [1060, 250, 340, 300]);
  sc.callout(at('question', 1.6), end('question') - 0.3, 'list', { label: '@api, in a comment', side: 'below' });
  sc.show('contract-answer', at('answer', 0.4));
  sc.callout(at('answer', 1.4), at('answer', 4.4), { region: 'list', y: 0.5, h: 0.5 }, { label: 'the answer', side: 'below' });
  sc.look(at('answer', 4.6), { region: 'paper', shot: 'contract-answer', by: 10 }, { dur: 1.0 });
  sc.callout(at('answer', 6.0), end('answer') - 0.3, { region: 'table', y: 0.8, h: 0.2 }, { label: 'format, added', side: 'below' });
  sc.look(start('versions'), [120, 140, 700, 110]);
  sc.callout(at('versions', 1.6), end('versions') - 0.3, 'meta', { label: 'updated by api', side: 'below' });
  sc.look(start('watched'), 'window', { dur: 1.6 });

  // 05 Status
  sc.show('kickoff-assigned', start('tick1'), { fade: 0 }).cut(start('tick1'), { region: 'paper', h: 0.98 });
  sc.show('tick-1', at('tick1', 4.0), { fade: 0.5 });
  sc.callout(at('tick1', 4.6), end('tick1') - 0.3, [134, 448, 290, 28], { label: 'ticked itself', side: 'right' });
  sc.show('tick-2', at('tick23', 1.2), { fade: 0.5 });
  sc.show('tick-3', at('tick23', 3.6), { fade: 0.5 });
  sc.callout(at('tick23', 4.4), end('tick23') - 0.3, 'progress', { label: '3 of 5 done', side: 'right' });
  sc.show('tick-qa-started', at('qa-start', 0.6), { fade: 0.5 });
  sc.callout(at('qa-start', 1.4), at('qa-start', 4.6), [134, 514, 350, 30], { label: 'qa starts', side: 'right' });
  sc.show('chat-reply-3', at('qa-start', 5.0)).cut(at('qa-start', 5.0), { region: 'column', y: 0.45, h: 0.25 });
  sc.callout(at('qa-start', 6.0), end('qa-start') - 0.3, { region: 'column', x: 0.03, y: 0.52, w: 0.94, h: 0.08 }, { label: 'the supervisor tells you' });
  sc.show('qa-bug', start('bug')).cut(start('bug'), [1060, 420, 340, 240]);
  sc.callout(at('bug', 1.6), end('bug') - 0.3, 'list', { label: 'qa names the worker', side: 'above' });
  sc.show('tick-4', at('fix', 0.4)).look(at('fix', 0.4), [1060, 420, 340, 300], { dur: 0.8 });
  sc.look(at('fix', 3.6), { region: 'paper', h: 0.98 }, { dur: 1.0 });
  sc.show('tick-5', at('fix', 5.0), { fade: 0.5 });
  sc.callout(at('fix', 5.8), end('fix') - 0.3, 'progress', { label: '5 of 5 done', side: 'right' });
  sc.show('chat-reply-4', start('done')).cut(start('done'), { region: 'column', y: 0.55, h: 0.25 });
  sc.callout(at('done', 1.0), at('done', 4.2), { region: 'column', x: 0.03, y: 0.62, w: 0.94, h: 0.1 }, { label: 'ready to release' });
  sc.show('board-done', at('done', 4.6)).cut(at('done', 4.6), ROW1);
  sc.callout(at('done', 5.6), end('done') - 0.3, 'card0', { label: '5 of 5, on the board' });

  // 06 You stay in charge
  sc.show('item-menu', start('menu')).cut(start('menu'), [100, 300, 560, 400]);
  sc.callout(at('menu', 2.0), at('menu', 4.6), { region: 'menu', y: 0.09, h: 0.09 }, { label: 'open its task', side: 'right' });
  sc.callout(at('menu', 4.6), at('menu', 7.4), { region: 'menu', y: 0.32, h: 0.68 }, { label: 'reassign', side: 'right' });
  sc.callout(at('menu', 7.4), end('menu') - 0.3, { region: 'menu', y: 0.2, h: 0.12 }, { label: 'tick by hand', side: 'right' });
  sc.show('mention', start('mention')).cut(start('mention'), [1060, 500, 340, 280]);
  sc.callout(at('mention', 1.4), end('mention') - 0.3, 'menu', { label: 'ping any workspace', side: 'left' });
  sc.show('tick-5', start('related'), { fade: 0.3 }).look(start('related'), [1060, 90, 340, 330]);
  sc.callout(at('related', 1.2), at('related', 5.0), 'related', { label: 'live status', side: 'left' });
  sc.callout(at('related', 5.4), end('related') - 0.3, [1066, 124, 330, 22], { label: 'cleans itself up', side: 'left' });

  // Recap: the finished board, then back out to the whole window.
  sc.show('board-done', start('recap'), { fade: 0.5 }).cut(start('recap'), ROW1).look(at('recap', 3.0), 'window', { dur: 3.0 });

  sc.visible([
    [start('board'), end('chatbox')],
    [start('new-note'), end('post')],
    [start('hash'), end('isolation')],
    [start('contract-card'), end('watched')],
    [start('tick1'), end('recap')],
  ]).build();

  // The chapter, in a corner, while its screens show.
  const CHAPTERS = [['01 / THE PANO', 'board', 'chatbox'], ['02 / MEETING NOTES', 'new-note', 'post'], ['03 / THE SUPERVISOR', 'hash', 'isolation'],
    ['04 / HAND-OFFS', 'contract-card', 'watched'], ['05 / STATUS', 'tick1', 'done'], ['06 / YOU STAY IN CHARGE', 'menu', 'related']];
  for (const [label, from, to] of CHAPTERS) {
    const w = Math.round(label.length * 11 + 28);
    s.add(fadeSpan(s, g({}, el('rect', { x: 16, y: 14, width: w, height: 30, rx: 6, fill: '#09090bdd', stroke: C.line }),
      s.text(label, { x: 16 + w / 2, y: 35, font: 'pixel', size: 13, fill: C.lit, anchor: 'middle' })), [start(from), end(to)]));
  }

  captions(s, tl, { band: BAND, size: 28, chars: 72, lineGap: 32, baseline: 51 });
  return s;
};

