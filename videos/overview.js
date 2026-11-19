// AgentRQ in one story, narrated: three agents, one gets stuck, you approve
// from your phone, a schedule runs, skills spread, any agent works.
// Build: node bin/video.js videos/overview.js   (it speaks videos/overview.narration.json first)
import { sprite, el, g } from '../src/index.js';
import {
  C, CHECK, OFF, GROUND, mascotByName, mascot, cursor, press,
} from '../kit/agentrq.js';
import {
  loadTimeline, videoScene, beatSpan, showDuring, story, tag, captions,
} from './lib.js';

const tl = loadTimeline();
const { T } = tl;
const MOVE = 0.6;

const claude = mascotByName('claude');
const codex = mascotByName('codex');
const agy = mascotByName('agy');
const hermes = mascotByName('hermes');
const ANTIGRAVITY = { ...agy, name: 'antigravity' };

// ---------------------------------------------------------------- the board
const BX = 440;
const BY = 20;
const BW = 740;
const COLS = ['Not Started', 'Ongoing', 'Blocked', 'Done'];
const COL_DOT = [C.notstarted, C.ongoing, C.blocked, C.done];
const colX = (c) => BX + 10 + c * 182;
const CARD_W = 168;
const CARD_H = 34;
const slotY = (n) => BY + 76 + n * 38;
const at = (c, n) => ({ x: colX(c) + 3, y: slotY(n) });

const CARDS = [
  { who: claude, title: 'Fix login test' },
  { who: codex, title: 'Bump deps' },
  { who: ANTIGRAVITY, title: 'Write API docs' },
];
// [time, card, column, top?]: Done lists the newest first, the rest append.
const MOVES = [
  { t: T(0, 0.8), card: 0, col: 0 }, { t: T(0, 1.8), card: 0, col: 1 }, { t: T(2, 3.8), card: 0, col: 3, top: true },
  { t: T(0, 1.1), card: 1, col: 0 }, { t: T(0, 2.2), card: 1, col: 1 }, { t: T(0, 3.8), card: 1, col: 2 },
  { t: T(2, 3.3), card: 1, col: 1 }, { t: T(2, 5.4), card: 1, col: 3, top: true },
  { t: T(0, 1.4), card: 2, col: 0 }, { t: T(0, 2.6), card: 2, col: 1 }, { t: T(2, 4.6), card: 2, col: 3, top: true },
];

// Replays the moves; per card, every [t, column, slot] it takes, including the
// slides when a card above it leaves.
function layout(moves) {
  const cols = COLS.map(() => []);
  const where = new Map();
  const track = new Map();
  for (const { t, card, col, top } of [...moves].sort((a, b) => a.t - b.t)) {
    if (where.has(card)) cols[where.get(card)].splice(cols[where.get(card)].indexOf(card), 1);
    if (top) cols[col].unshift(card); else cols[col].push(card);
    where.set(card, col);
    cols.forEach((list, c) => list.forEach((id, slot) => {
      const k = track.get(id) ?? [];
      const last = k.at(-1);
      if (!last || last[1] !== c || last[2] !== slot) k.push([t, c, slot]);
      track.set(id, k);
    }));
  }
  return track;
}
const TRACKS = layout(MOVES);
const BLOCKED = [T(0, 3.8) + MOVE, T(2, 3.3)];
const DONE_AT = [T(2, 3.8), T(2, 5.4), T(2, 4.6)];
const END = tl.end;

const panel = (s, { x, y, w, h, title }) => g({},
  el('rect', { x, y, width: w, height: h, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
  s.text(title, { x: x + 16, y: y + 26, font: 'semi', size: 15, fill: C.text }));

function board(s) {
  const parts = [panel(s, { x: BX, y: BY, w: BW, h: 272, title: 'All workspaces' })];
  COLS.forEach((title, c) => {
    parts.push(
      el('rect', { x: colX(c), y: BY + 44, width: 174, height: 220, fill: C.column, class: 'px' }),
      el('rect', { x: colX(c) + 10, y: BY + 56, width: 6, height: 6, fill: COL_DOT[c], class: 'px' }),
      s.text(title, { x: colX(c) + 22, y: BY + 63, font: 'semi', size: 12, fill: C.dim }));
  });
  s.add(showDuring(s, g({}, parts), [beatSpan(tl, 0, 2)]));

  CARDS.forEach((c, i) => {
    const [[t0, c0, s0], ...rest] = TRACKS.get(i);
    const keys = [
      [0, { ...at(c0, s0), y: slotY(s0) - 14, opacity: 0 }],
      [t0, { opacity: 0 }, 'step'],
      [t0 + 0.35, { ...at(c0, s0), opacity: 1 }, 'back'],
    ];
    let prev = at(c0, s0);
    for (const [t, col, slot] of rest) { keys.push([t, prev], [t + MOVE, at(col, slot), 'inOut']); prev = at(col, slot); }
    keys.push([tl.S[3], { opacity: 1 }], [tl.S[3] + 0.01, { opacity: 0 }, 'step']);

    const bar = [[0, { fill: C.notstarted }]];
    for (const [t, col] of rest) bar.push([t + MOVE, { fill: COL_DOT[col] }, 'step']);
    const parts = [
      el('rect', { width: CARD_W, height: CARD_H, fill: C.card, stroke: C.line, 'stroke-width': 1, class: 'px' }),
      s.anim(el('rect', { width: 4, height: CARD_H, class: 'px' }), bar),
      s.text(c.title, { x: 12, y: 15, font: 'semi', size: 12, fill: C.text }),
      el('rect', { x: 12, y: 21, width: 6, height: 6, fill: c.who.color, class: 'px' }),
      s.text(c.who.name, { x: 22, y: 28, font: 'mono', size: 10, fill: C.dim }),
      s.anim(sprite(CHECK, { '#': C.ongoing }, { px: 2, x: CARD_W - 22, y: 11 }),
        [[0, { opacity: 0 }], [DONE_AT[i] + MOVE, { opacity: 1 }, 'step']]),
    ];
    if (c.who === codex) {
      parts.push(s.anim(g({},
        el('rect', { x: CARD_W - 52, y: 17, width: 44, height: 14, fill: C.ask, class: 'px' }),
        s.text('allow', { x: CARD_W - 30, y: 28, font: 'pixel', size: 8, fill: C.ink, anchor: 'middle' })),
      [[0, { opacity: 0 }], [BLOCKED[0], { opacity: 1 }, 'step'], [T(2, 2.7), { opacity: 0.4 }, 'step'], [BLOCKED[1], { opacity: 0 }, 'step']]));
    }
    s.add(s.anim(g({}, parts), keys));
  });

  // Self-explaining labels on the first card (beat 1): what an owner and a status are.
  // The blocked card sits at the top of the Blocked column, so the labels point at it.
  const label = (text, tx, ty, lx, ly, lw, lh, t0, t1, color) => showDuring(s, g({},
    el('rect', { x: lx, y: ly, width: lw, height: lh, fill: color, class: 'px' }),
    tag(s, text, { x: tx, y: ty, fill: color, color: C.ink, stroke: color, font: 'pixel', size: 10 })), [[t0, t1]]);
  s.add(label('owner: who has it', 842, 150, 856, 128, 2, 22, T(1, 0.9), T(1, 4.0), C.lit));
  s.add(label('status: the bar', 826, 196, 818, 124, 2, 72, T(1, 1.9), T(1, 4.0), C.ask));
}

// ---------------------------------------------------------------- the phone
const PX0 = 735;
const PY0 = 22;
const PW = 170;
const PH = 268;
const ALLOW_ONCE = { x: PX0 + PW / 2, y: PY0 + 200 };

function phone(s) {
  const buzz = T(3, 0.7);
  const body = g({},
    el('rect', { x: PX0, y: PY0, width: PW, height: PH, fill: '#0c0c0f', stroke: C.dim, 'stroke-width': 2, class: 'px' }),
    el('rect', { x: PX0 + 8, y: PY0 + 12, width: PW - 16, height: PH - 24, fill: C.panel, class: 'px' }),
    el('rect', { x: PX0 + PW / 2 - 14, y: PY0 + 4, width: 28, height: 4, fill: C.line, class: 'px' }));

  const banner = g({},
    el('rect', { x: PX0 + 14, y: PY0 + 20, width: PW - 28, height: 38, fill: C.card, stroke: C.ask, 'stroke-width': 1, class: 'px' }),
    s.text('Claude Code needs', { x: PX0 + 22, y: PY0 + 36, font: 'semi', size: 11, fill: C.text }),
    s.text('your approval', { x: PX0 + 22, y: PY0 + 50, font: 'body', size: 11, fill: C.dim }));
  const card = g({},
    el('rect', { x: PX0 + 14, y: PY0 + 24, width: PW - 28, height: 214, fill: C.card, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    s.text('AUTH REQUIRED', { x: PX0 + 22, y: PY0 + 44, font: 'pixel', size: 10, fill: C.blocked }),
    s.text('Claude Code wants', { x: PX0 + 22, y: PY0 + 66, font: 'semi', size: 12, fill: C.text }),
    s.text('to run a command', { x: PX0 + 22, y: PY0 + 82, font: 'semi', size: 12, fill: C.text }),
    el('rect', { x: PX0 + 22, y: PY0 + 92, width: PW - 44, height: 34, fill: '#000', class: 'px' }),
    s.text('git push origin', { x: PX0 + 28, y: PY0 + 107, font: 'mono', size: 10, fill: C.lit }),
    s.text('main', { x: PX0 + 28, y: PY0 + 120, font: 'mono', size: 10, fill: C.lit }),
    el('rect', { x: PX0 + 22, y: PY0 + 150, width: PW - 44, height: 28, fill: C.text, class: 'px' }),
    s.text('Allow Once', { x: PX0 + PW / 2, y: PY0 + 169, font: 'semi', size: 12, fill: C.ink, anchor: 'middle' }),
    el('rect', { x: PX0 + 22, y: PY0 + 184, width: PW - 44, height: 22, fill: C.line, class: 'px' }),
    s.text('Always Allow', { x: PX0 + PW / 2, y: PY0 + 199, font: 'semi', size: 11, fill: C.dim, anchor: 'middle' }),
    s.text('Deny', { x: PX0 + PW / 2, y: PY0 + 224, font: 'semi', size: 11, fill: C.blocked, anchor: 'middle' }));
  const allowed = g({},
    el('rect', { x: PX0 + 14, y: PY0 + 24, width: PW - 28, height: 214, fill: C.lit, class: 'px' }),
    sprite(CHECK, { '#': C.ink }, { px: 6, x: PX0 + PW / 2 - 18, y: PY0 + 84 }),
    s.text('Allowed', { x: PX0 + PW / 2, y: PY0 + 160, font: 'bold', size: 20, fill: C.ink, anchor: 'middle' }),
    s.text('Claude carries on', { x: PX0 + PW / 2, y: PY0 + 182, font: 'body', size: 12, fill: C.ink, anchor: 'middle' }));

  // dinner, so the story has somewhere for you to be
  const pizza = sprite(`
    cccccccccccc
    .oorooooooo.
    ..oooooroo..
    ...ooooooo..
    ....oroo....
    .....oo.....`, { c: '#d97757', o: '#facc15', r: '#ef4444' }, { px: 6, x: 520, y: 150 });
  const dinner = g({}, pizza, s.text('dinner', { x: 556, y: 232, font: 'pixel', size: 16, fill: C.dim, anchor: 'middle' }));

  const jiggle = s.anim(body, [[0, { x: 0 }], [buzz, { x: 0 }, 'step'], [buzz + 0.08, { x: -4 }, 'step'], [buzz + 0.16, { x: 4 }, 'step'],
    [buzz + 0.24, { x: -4 }, 'step'], [buzz + 0.32, { x: 0 }, 'step']]);
  const group = g({}, dinner, jiggle,
    showDuring(s, banner, [[buzz, T(3, 1.9)]]),
    showDuring(s, card, [[T(3, 1.9), tl.beatEnd(3)]]),
    showDuring(s, allowed, [[T(3, 3.6) + 0.1, tl.beatEnd(3)]]));
  s.add(showDuring(s, group, [beatSpan(tl, 3)]));
}

// ---------------------------------------------------------------- the schedule
const SEG = [['None', 470], ['One-time', 560], ['Repeated', 668]];
const CRON = '0 9 * * 1-5';
const RUNS = ['Mon', 'Tue', 'Wed'];

function schedule(s) {
  const clickT = T(4, 0.9);
  const seg = g({},
    ...SEG.map(([label, x]) => g({},
      el('rect', { x, y: 62, width: label.length * 8 + 22, height: 26, fill: C.line, class: 'px' }),
      s.text(label, { x: x + (label.length * 8 + 22) / 2, y: 80, font: 'semi', size: 12, fill: C.dim, anchor: 'middle' }))));
  const pick = (label, x, from) => s.anim(g({},
    el('rect', { x, y: 62, width: label.length * 8 + 22, height: 26, fill: C.text, class: 'px' }),
    s.text(label, { x: x + (label.length * 8 + 22) / 2, y: 80, font: 'semi', size: 12, fill: C.ink, anchor: 'middle' })),
  from ? [[0, { opacity: 0 }], [from, { opacity: 1 }, 'step']] : [[0, { opacity: 1 }], [clickT, { opacity: 0 }, 'step']]);

  const typed = [...CRON].map((_, i) => showDuring(s,
    s.text(CRON.slice(0, i + 1), { x: 480, y: 212, font: 'mono', size: 22, fill: C.lit }),
    [[T(4, 1.4 + i * 0.1), i === CRON.length - 1 ? tl.beatEnd(4) : T(4, 1.4 + (i + 1) * 0.1)]]));
  const fields = g({},
    s.text('Frequency', { x: 470, y: 118, font: 'pixel', size: 12, fill: C.dim }),
    s.text('Weekdays', { x: 470, y: 140, font: 'semi', size: 14, fill: C.text }),
    s.text('Time', { x: 620, y: 118, font: 'pixel', size: 12, fill: C.dim }),
    s.text('09:00', { x: 620, y: 140, font: 'semi', size: 14, fill: C.text }),
    s.text('Cron', { x: 470, y: 184, font: 'pixel', size: 12, fill: C.dim }),
    s.text('every weekday at 9am', { x: 480, y: 240, font: 'body', size: 14, fill: C.dim }));

  const runs = RUNS.map((day, i) => {
    const t0 = T(4, 2.7 + i * 0.75);
    const row = g({},
      el('rect', { x: 800, y: 60 + i * 74, width: 366, height: 62, fill: C.card, stroke: C.line, 'stroke-width': 1, class: 'px' }),
      el('rect', { x: 800, y: 60 + i * 74, width: 4, height: 62, fill: C.cron, class: 'px' }),
      s.text('Dependency audit', { x: 818, y: 86 + i * 74, font: 'semi', size: 14, fill: C.text }),
      s.text(`run · ${day} 09:00`, { x: 818, y: 106 + i * 74, font: 'mono', size: 11, fill: C.dim }),
      showDuring(s, tag(s, 'working', { x: 1070, y: 78 + i * 74, fill: '#14532d', color: C.lit, stroke: '#14532d', font: 'pixel', size: 10 }), [[t0, t0 + 1.2]]),
      s.anim(sprite(CHECK, { '#': C.ongoing }, { px: 3, x: 1128, y: 76 + i * 74 }), [[0, { opacity: 0 }], [t0 + 1.2, { opacity: 1 }, 'step']]),
      showDuring(s, tag(s, 'done', { x: 1070, y: 78 + i * 74, fill: '#166534', color: '#dcfce7', stroke: '#166534', font: 'pixel', size: 10 }), [[t0 + 1.2, tl.beatEnd(4)]]));
    return s.anim(row, [[0, { opacity: 0, y: 18 }], [t0, { opacity: 0, y: 18 }, 'step'], [t0 + 0.35, { opacity: 1, y: 0 }, 'back']]);
  });

  const group = g({}, panel(s, { x: BX, y: BY, w: BW, h: 272, title: 'Execution strategy' }),
    seg, pick('None', 470, 0), pick('Repeated', 668, clickT), fields, ...typed, ...runs);
  s.add(showDuring(s, group, [beatSpan(tl, 4)]));
}

// ---------------------------------------------------------------- skills and memory
const NODE = { claude: { x: 480, y: 150 }, codex: { x: 960, y: 84 }, agy: { x: 960, y: 196 } };
const chip = (s, label, fill, color) => {
  const w = label.length * 7 + 18;
  return g({}, el('rect', { width: w, height: 24, fill, stroke: color, 'stroke-width': 1, class: 'px' }),
    s.text(label, { x: 9, y: 16, font: 'mono', size: 11, fill: color }));
};

function skills(s) {
  const node = (m, p, label) => g({},
    sprite(m.art, m.palette, { px: 4, x: p.x, y: p.y }),
    s.text(label, { x: p.x + 28, y: p.y + 56, font: 'pixel', size: 12, fill: m.color, anchor: 'middle' }));
  const saveBtn = g({},
    el('rect', { x: 462, y: 232, width: 124, height: 26, fill: C.text, class: 'px' }),
    s.text('Save as skill', { x: 524, y: 250, font: 'semi', size: 12, fill: C.ink, anchor: 'middle' }));

  const fly = (label, fill, color, from, to, t0, y0) => s.anim(chip(s, label, fill, color), [
    [0, { x: from.x, y: from.y + y0, opacity: 0 }],
    [t0, { x: from.x, y: from.y + y0, opacity: 0 }, 'step'],
    [t0 + 0.2, { opacity: 1 }],
    [t0 + 1.4, { x: to.x - 150, y: to.y + 10, opacity: 1 }, 'inOut'],
    [t0 + 1.6, { opacity: 0 }, 'step']]);
  const c = NODE.claude;
  const flyers = [
    fly('deploy-staging.md', C.card, C.lit, { x: c.x + 62, y: c.y }, NODE.codex, T(5, 1.5), 0),
    fly('deploy-staging.md', C.card, C.lit, { x: c.x + 62, y: c.y }, NODE.agy, T(5, 1.8), 22),
    fly('staging needs VPN', '#fef08a', C.ink, { x: c.x + 62, y: c.y }, NODE.codex, T(5, 3.4), 0),
    fly('staging needs VPN', '#fef08a', C.ink, { x: c.x + 62, y: c.y }, NODE.agy, T(5, 3.7), 22),
  ];
  const loaded = (p, t0, t1) => g({},
    s.anim(sprite(CHECK, { '#': C.ongoing }, { px: 3, x: p.x - 150, y: p.y + 6 }), [[0, { opacity: 0 }], [t0, { opacity: 1 }, 'step']]),
    s.anim(s.text('skill loaded', { x: p.x - 128, y: p.y + 20, font: 'mono', size: 11, fill: C.lit }), [[0, { opacity: 0 }], [t0, { opacity: 1 }, 'step']]),
    s.anim(s.text('+ memory', { x: p.x - 128, y: p.y + 36, font: 'mono', size: 11, fill: C.ask }), [[0, { opacity: 0 }], [t1, { opacity: 1 }, 'step']]));

  const group = g({}, panel(s, { x: BX, y: BY, w: BW, h: 272, title: 'Skills and memory' }),
    node(claude, NODE.claude, 'claude'), node(codex, NODE.codex, 'codex'), node(ANTIGRAVITY, NODE.agy, 'antigravity'),
    saveBtn, ...flyers, loaded(NODE.codex, T(5, 3.0), T(5, 4.9)), loaded(NODE.agy, T(5, 3.3), T(5, 5.2)));
  s.add(showDuring(s, group, [beatSpan(tl, 5)]));
}

// ---------------------------------------------------------------- any agent
const AGENTS = ['claude', 'codex', 'antigravity', 'hermes', 'cursor', 'goose', 'copilot', 'kimi', 'cline', 'junie', 'openclaw', 'opencode', 'openhands', 'qwen code', 'kiro'];
const tileXY = (i) => ({ x: 462 + (i % 5) * 141, y: 62 + Math.floor(i / 5) * 52 });
const COUNT = [['0', 0.4], ['14', 1.0], ['31', 1.6], ['48', 2.2], ['55+', 2.8]];

function agents(s) {
  const tiles = AGENTS.map((name, i) => {
    const { x, y } = tileXY(i);
    const lit = i < 4;
    return s.anim(g({},
      el('rect', { x, y, width: 134, height: 40, fill: C.card, stroke: lit ? C.ongoing : C.line, 'stroke-width': lit ? 2 : 1, class: 'px' }),
      s.text(name, { x: x + 67, y: y + 25, font: 'mono', size: 12, fill: lit ? C.lit : C.text, anchor: 'middle' })),
    [[0, { opacity: 0, scale: 0.6 }], [T(6, 0.3 + i * 0.12), { opacity: 0, scale: 0.6 }, 'step'], [T(6, 0.3 + i * 0.12) + 0.3, { opacity: 1, scale: 1 }, 'back']],
    { origin: 'center' });
  });
  const counter = COUNT.map(([n, t], i) => showDuring(s,
    s.text(n, { x: 462, y: 258, font: 'bold', size: 40, fill: C.text, spacing: -1 }),
    [[T(6, t), i === COUNT.length - 1 ? tl.beatEnd(6) : T(6, COUNT[i + 1][1])]]));
  const group = g({}, panel(s, { x: BX, y: BY, w: BW, h: 272, title: 'Agents' }), ...tiles, ...counter,
    s.text('coding agents, one workspace', { x: 580, y: 256, font: 'body', size: 16, fill: C.dim }));
  s.add(showDuring(s, group, [beatSpan(tl, 6)]));
}

// ---------------------------------------------------------------- anywhere
const SURF = [['web', 'a browser tab'], ['desktop', 'the desktop app'], ['mobile', 'your phone'], ['cli', 'the terminal']];

function icon(s, kind, x, y) {
  const o = { fill: 'none', stroke: C.text, 'stroke-width': 3, class: 'px' };
  if (kind === 'web') return g({}, el('rect', { ...o, x, y, width: 84, height: 60 }), el('rect', { x, y, width: 84, height: 12, fill: C.text, class: 'px' }));
  if (kind === 'desktop') return g({}, el('rect', { ...o, x, y, width: 84, height: 52 }), el('rect', { x: x + 32, y: y + 52, width: 20, height: 8, fill: C.text, class: 'px' }), el('rect', { x: x + 22, y: y + 60, width: 40, height: 4, fill: C.text, class: 'px' }));
  if (kind === 'mobile') return g({}, el('rect', { ...o, x: x + 22, y: y - 4, width: 40, height: 68 }), el('rect', { x: x + 36, y: y + 54, width: 12, height: 3, fill: C.text, class: 'px' }));
  return g({}, el('rect', { x, y, width: 84, height: 60, fill: '#000', stroke: C.lit, 'stroke-width': 3, class: 'px' }), s.text('>_', { x: x + 14, y: y + 40, font: 'mono', size: 28, fill: C.lit }));
}

function surfaces(s) {
  const tiles = SURF.map(([name, sub], i) => {
    const x = 464 + i * 178;
    const t0 = T(7, 0.4 + i * 0.7);
    const pop = g({},
      el('rect', { x, y: 62, width: 164, height: 190, fill: C.card, stroke: C.line, 'stroke-width': 2, class: 'px' }),
      icon(s, name, x + 40, 98),
      s.text(name, { x: x + 82, y: 206, font: 'pixel', size: 18, fill: C.text, anchor: 'middle' }),
      s.text(sub, { x: x + 82, y: 230, font: 'body', size: 13, fill: C.dim, anchor: 'middle' }),
      s.anim(el('rect', { x, y: 62, width: 164, height: 190, fill: 'none', stroke: C.ongoing, 'stroke-width': 4, class: 'px' }),
        [[0, { opacity: 0 }], [t0 + 0.55, { opacity: 1 }, 'step'], [t0 + 1.2, { opacity: 0 }, 'step']]));
    return s.anim(pop, [[0, { opacity: 0, y: 24 }], [t0, { opacity: 0, y: 24 }, 'step'], [t0 + 0.35, { opacity: 1, y: 0 }, 'back']]);
  });
  s.add(showDuring(s, g({}, panel(s, { x: BX, y: BY, w: BW, h: 272, title: 'Check in from anywhere' }), ...tiles), [beatSpan(tl, 7)]));
}

// ---------------------------------------------------------------- the end
function close(s) {
  const t0 = tl.S[8];
  const big = s.anim(g({},
    s.text('OPEN SOURCE', { x: 810, y: 130, font: 'pixel', size: 58, fill: C.lit, anchor: 'middle' }),
    s.text('Your turn', { x: 810, y: 204, font: 'bold', size: 52, fill: C.text, anchor: 'middle', spacing: -1 }),
    s.text('Comment below: your multi agent headaches.', { x: 810, y: 250, font: 'body', size: 20, fill: C.dim, anchor: 'middle' })),
  [[0, { opacity: 0, y: 20 }], [t0 + 0.2, { opacity: 0, y: 20 }, 'step'], [t0 + 0.6, { opacity: 1, y: 0 }, 'back']]);
  s.add(showDuring(s, big, [beatSpan(tl, 8)]));
}

// ---------------------------------------------------------------- the agents
function agentsOnGround(s) {
  const hopTimes = (...ts) => ts.map((t) => [t, 16]);
  mascot(s, claude, 0, {
    hops: [[T(0, 0.8), 8], [T(0, 1.8), 14], [T(2, 3.8), 22], [T(3, 3.6), 16], [T(5, 0.9), 18], [T(6, 0.4), 14], [T(7, 0.4), 14], ...hopTimes(T(8, 0.7), T(8, 1.6))],
    work: [[T(0, 1.8) + MOVE, T(2, 3.8)], [T(3, 3.6) + MOVE, T(5, 0.9)]],
    done: [[T(2, 3.8) + MOVE, T(3, 1.6)], [T(5, 1.2), T(6, 0.2)], [T(8, 0.6), END]],
    say: [['push?', [[T(3, 1.6), T(3, 3.5)]], C.ask], ['skill!', [[T(5, 1.0), T(5, 2.4)]], C.lit]],
  });
  mascot(s, codex, 1, {
    hops: [[T(0, 1.1) + 0.35, 8], [T(0, 2.2), 14], [T(0, 3.8) + MOVE, 12], [T(2, 3.3), 16], [T(2, 5.4) + MOVE, 22], [T(5, 3.0), 14], [T(6, 0.7), 14], [T(7, 0.8), 14], ...hopTimes(T(8, 0.9), T(8, 1.8))],
    work: [[T(0, 2.2) + MOVE, T(0, 3.8)], [T(2, 3.3) + MOVE, T(2, 5.4)]],
    ask: [],
    say: [['stuck!', [[T(0, 3.8) + MOVE, T(2, 2.7)]], C.ask], ['thanks!', [[T(2, 3.4), T(2, 5.0)]], C.lit]],
    done: [[T(2, 5.4) + MOVE, tl.S[3]], [T(5, 3.4), T(6, 0.3)], [T(8, 0.8), END]],
  });
  mascot(s, ANTIGRAVITY, 2, {
    hops: [[T(0, 1.4) + 0.35, 8], [T(0, 2.6), 14], [T(2, 4.6) + MOVE, 22], [T(5, 3.3), 14], [T(6, 1.0), 14], [T(7, 1.2), 14], ...hopTimes(T(8, 1.1), T(8, 2.0))],
    work: [[T(0, 2.6) + MOVE, T(2, 4.6)]],
    done: [[T(2, 4.6) + MOVE, tl.S[3]], [T(5, 3.6), T(6, 0.3)], [T(8, 1.0), END]],
  });
  mascot(s, hermes, 3, {
    hops: [[T(4, 2.7), 14], [T(4, 3.5), 14], [T(4, 4.3), 14], [T(6, 1.3), 14], [T(7, 1.6), 14], ...hopTimes(T(8, 1.3), T(8, 2.2))],
    alert: [[T(4, 2.5), T(4, 2.9)]],
    work: [[T(4, 0.6), T(4, 4.9)]],
    done: [[T(4, 4.9), tl.S[5]], [T(8, 1.2), END]],
    say: [['9am!', [[T(4, 1.0), T(4, 2.4)]], C.cron]],
  });
}

// ---------------------------------------------------------------- the pointer
function pointer(s) {
  const allow = { x: at(2, 0).x + CARD_W - 32, y: at(2, 0).y + 24 };
  const phoneBtn = ALLOW_ONCE;
  const repeated = { x: 700, y: 76 };
  const save = { x: 524, y: 245 };
  const tilePt = (i) => ({ x: tileXY(i).x + 67, y: tileXY(i).y + 20 });
  const surf = (i) => ({ x: 464 + i * 178 + 82, y: 150 });
  const keys = [[0, OFF], [T(2, 1.4), OFF]];
  keys.push([T(2, 2.2), allow, 'inOut'], ...press(T(2, 2.7), allow), [T(2, 3.4), allow], [T(2, 4.0), OFF, 'inOut']);
  keys.push([T(3, 2.6), OFF], [T(3, 3.2), phoneBtn, 'inOut'], ...press(T(3, 3.6), phoneBtn), [T(3, 4.2), phoneBtn], [T(3, 4.8), OFF, 'inOut']);
  keys.push([T(4, 0.1), OFF], [T(4, 0.7), repeated, 'inOut'], ...press(T(4, 0.9), repeated), [T(4, 1.2), repeated], [T(4, 1.8), OFF, 'inOut']);
  keys.push([T(5, 0.2), OFF], [T(5, 0.7), save, 'inOut'], ...press(T(5, 1.0), save), [T(5, 1.3), save], [T(5, 1.9), OFF, 'inOut']);
  keys.push([T(6, 0.8), OFF], [T(6, 1.3), tilePt(4), 'inOut'], ...press(T(6, 1.6), tilePt(4)), [T(6, 2.1), tilePt(9), 'inOut'], ...press(T(6, 2.4), tilePt(9)),
    [T(6, 2.9), tilePt(13), 'inOut'], ...press(T(6, 3.2), tilePt(13)), [T(6, 3.8), OFF, 'inOut']);
  keys.push([T(7, 0.1), OFF]);
  [0, 1, 2, 3].forEach((i) => keys.push([T(7, 0.9 + i * 0.7), surf(i), 'inOut'], ...press(T(7, 1.0 + i * 0.7) + 0.3, surf(i))));
  keys.push([T(7, 4.0), OFF, 'inOut']);
  cursor(s, keys);
}

export default function overview() {
  const s = videoScene({
    tl,
    poster: tl.S[5] + 6,
    thumbnail: tl.at(1, 0.75), // the board, Codex stuck, "one task board" on the captions
    description: 'AgentRQ, told as a story: three agents work through your backlog and one gets blocked; its card rolls up to you and one tap approves it, even from your phone; a schedule runs the audit by itself; a skill one agent saved is loaded by the others; any of 55+ agents works, on the web, desktop, phone or terminal; and it is open source.',
  });

  story(s, tl, {
    kicker: 'the story',
    steps: [['board', tl.S[1], tl.S[2]], ['approve', tl.S[2], tl.S[4]], ['schedule', tl.S[4], tl.S[5]], ['share', tl.S[5], tl.S[6]]],
    beats: [
      { at: [0], headline: ['Which agent', 'is stuck?'], sub: 'Three agents. One needs you.', log: '> 3 agents, 1 stuck' },
      { at: [1], headline: ['One board,', 'every agent.'], sub: 'Tasks with an owner and a status.', log: '> every task has an owner' },
      { at: [2], headline: ['Blocked rolls', 'up to you.'], sub: 'Allow or deny, on the card.',
        logs: [['> codex: push to main?', tl.S[2], T(2, 2.7), C.ask], ['> you: allow', T(2, 2.7), tl.beatEnd(2)]] },
      { at: [3], headline: ['Approve from', 'anywhere.'], sub: 'One tap, even at dinner.', log: '> claude: run git push?' },
      { at: [4], headline: ['Run it on', 'a schedule.'], sub: 'Every run is its own task.', log: '> cron 0 9 * * 1-5' },
      { at: [5], headline: ['One learns,', 'all know.'], sub: 'Skills and memory, shared.', log: '> skill: deploy-staging' },
      { at: [6], headline: ['Bring any', 'agent.'], sub: '55+ coding agents.', log: '> 55+ agents, 1 board' },
      { at: [7], headline: ['Web, desktop,', 'mobile, CLI.'], sub: 'Check in from anywhere.', log: '> web | desktop | mobile | cli' },
      { at: [8], headline: ['Open source.', 'Your turn.'], sub: 'Share your multi agent headaches below.', log: '> comment below' },
    ],
  });

  board(s);
  phone(s);
  schedule(s);
  skills(s);
  agents(s);
  surfaces(s);
  close(s);
  agentsOnGround(s);
  pointer(s);
  captions(s, tl);
  return s;
}
