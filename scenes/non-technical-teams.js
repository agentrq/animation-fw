// Non-technical teams: maya from marketing files a task with a preset, the
// agent works it, she answers its one question with Allow Once and gets a
// PDF back. The machine, repository, token and terminal the agent uses stay
// in a dimmed strip that engineering set up once: she never opens them.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, OFF, newScene, sky, ground, intro, frame, mascot, cursor, press, during, GROUND,
} from '../kit/agentrq.js';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop. Each beat owns a span.
const B = [0.3, 7.0, 12.0, 17.6, 22.6];
const FADE = 0.25;
const COMPOSE = 0.9;        // maya clicks into the New Task box
const HASH = 2.8;           // '#': her presets
const NARROW = 3.5;         // '#la': one left
const PICK = 4.4;           // the preset becomes the whole message
const CREATE = 5.6;         // Create Task
const FILED = 7.3;          // the card lands in Not Started
const START = 9.0;          // claude picks it up
const ASK = 12.4;           // claude asks to fetch the pricing page
const ALLOW = 14.6;         // maya: Allow Once
const RESULT = 17.9;        // the reply, with the PDF attached
const GRAB = 19.5;          // maya drags the card to Done
const DROP = 20.1;
const DANCE = 20.8;
const RESET = 22.6;

const TYPED = 'for the v2 launch: ';
const PRESET = 'draft a one-page brief in plain words, attach a PDF';
const TASK = TYPED + PRESET;
const PRESETS = [
  { name: 'launch-brief', body: PRESET },
  { name: 'weekly-report', body: 'sum up this week in five bullets' },
  { name: 'fix-typos', body: 'proofread the page and fix typos only' },
];

// ---------------------------------------------------------------- the stage
const BX = 440;
const BY = 20;
const BW = 740;
const BH = 272;
const COLS = ['Not Started', 'Ongoing', 'Blocked', 'Done'];
const COL_DOT = [C.notstarted, C.ongoing, C.blocked, C.done];
const colX = (c) => BX + 10 + c * 122;
const COL_W = 116;
const COL_H = 180;
const CARD_W = COL_W - 12;
const CARD_H = 44;
const slotY = (k) => BY + 72 + k * 47;
const doneY = (k) => BY + 70 + k * 25;
const PX0 = BX + 504;       // the side panel
const PW = 226;
const STRIP = { x: BX + 10, y: BY + 234, w: BW - 20, h: 28 };

// The New Task composer.
const CH = 8.4;             // one mono character at 14 px
const CP = { x: BX + 16, y: BY + 130, w: BW - 32, h: 52 };
const TX = CP.x + 14;
const TXT_Y = CP.y + 30;

// maya, from marketing: the person the agents work for.
const MAYA = {
  name: 'maya', color: '#f472b6',
  art: `
    ...hhhh...
    ..hhhhhh..
    .hhffffhh.
    .hf#ff#fh.
    .hffffffh.
    .h.ffff.h.
    ..ssssss..
    .ssssssss.
    f.ssssss.f
    ..ssssss..
    ..ll..ll..
    ..ll..ll..`,
  palette: { h: '#7c2d12', f: '#e0b08a', '#': '#1c1917', s: '#f472b6', l: '#3f3f46' },
  eyes: [[3, 3, 1, 1], [6, 3, 1, 1]], skin: '#e0b08a',
};
const CLAUDE = MASCOTS.find((m) => m.name === 'claude');
const AT = { maya: 540, claude: 720 };

// The task cards: [second, column, slot]; column -1 is off the board.
const TASKS = [
  { title: 'FAQ update', moves: [[0, 3, 1], [DROP, 3, 2]] },
  { title: 'Blog draft', moves: [[0, 3, 0], [DROP, 3, 1]] },
  { title: 'V2 launch brief', moves: [[0, -1, 0], [FILED, 0, 0], [START, 1, 0], [DROP, 3, 0]], mine: true },
];

const rect = (a, f, extra = {}) => el('rect', { ...a, fill: f, class: 'px', ...extra });
const box = (x, y, w, h, fill = C.column, stroke) => el('rect', { x, y, width: w, height: h, fill, stroke, 'stroke-width': stroke ? 1 : undefined, class: 'px' });
const appear = (s, node, t, until) => s.anim(node, until
  ? [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step'], [until, { opacity: 0 }, 'step']]
  : [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step']]);

// A beat's content fades in at its start and out at its end.
function beat(s, i, nodes) {
  const [from, to] = [B[i], B[i + 1]];
  s.add(s.anim(g({}, nodes), [[0, { opacity: 0 }], [from, { opacity: 0 }], [from + FADE, { opacity: 1 }], [to - FADE, { opacity: 1 }], [to, { opacity: 0 }]]));
}

export default function nonTechnicalTeams() {
  const s = newScene({
    poster: 13.2,
    description: 'AgentRQ for non-technical teams: maya from marketing opens New Task in the content workspace, types "for the v2 launch:" and picks the #launch-brief preset, which fills in the whole request, then clicks Create Task. The card lands in Not Started and claude picks it up. claude asks one question, an Authorization Required card to fetch acme.com/pricing, and maya clicks Allow Once. claude replies that the brief is ready with launch-brief.pdf attached, and maya drags the card to Done. The machine, repository, token and terminal the agent used sit in a dimmed strip that engineering set up once; maya never opens them.',
  });

  sky(s);
  ground(s);
  story(s);
  board(s);
  panel(s);
  infra(s);
  composer(s);
  server(s);
  mascot(s, MAYA, 5, {
    x: AT.maya,
    hops: [[CREATE + 0.2, 12], [DROP + 0.2, 14], [DANCE + 0.1, 16], [DANCE + 1.0, 16]],
    alert: [[ASK + 0.2, ALLOW - 0.3], [RESULT, GRAB - 0.3]],
    done: [[DROP + 0.2, RESET]],
  });
  mascot(s, CLAUDE, 0, {
    x: AT.claude,
    hops: [[START, 14], [ALLOW + 0.2, 14], [DANCE + 0.15, 16], [DANCE + 1.05, 16]],
    alert: [[FILED, START]],
    work: [[START + 0.4, ASK], [ALLOW + 0.4, RESULT]],
    ask: [[ASK, ALLOW + 0.1]],
    done: [[RESULT, RESET]],
  });
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'for every team',
    headline: ['Assign work,', 'skip the infra.'],
    sub: 'Tasks, questions, results. That is all.',
    steps: [['ask', B[0], B[1]], ['track', B[1], B[2]], ['approve', B[2], B[3]], ['result', B[3], B[4]]],
    log: [
      [0, COMPOSE, '> maya, marketing: New Task_'],
      [COMPOSE, HASH, '> she types what she needs'],
      [HASH, PICK, '> #launch-brief, a preset', C.ask],
      [PICK, CREATE, '> full request, no prompt skills'],
      [CREATE, START, '> filed to content'],
      [START, ASK, '> claude is on it'],
      [ASK, ALLOW, '> claude asks one question', C.ask],
      [ALLOW, RESULT, '> maya: Allow Once'],
      [RESULT, DROP, '> reply: launch-brief.pdf'],
      [DROP, RESET, '> done. no terminal opened', C.lit],
    ],
  });
}

// The workspace board: four columns, three cards.
function board(s) {
  frame(s, { x: BX, y: BY, w: BW, h: BH, title: 'content' });
  s.add(s.text('workspace', { x: BX + 84, y: BY + 26, font: 'mono', size: 11, fill: C.dim }));
  s.add(s.anim(rect({ x: BX + BW - 64, y: BY + 17, width: 8, height: 8 }, C.ongoing),
    [[0, { opacity: 1 }], [0.5, { opacity: 0.3 }, 'step'], [1, { opacity: 1 }, 'step']], { period: 1 }));
  s.add(s.text('LIVE', { x: BX + BW - 50, y: BY + 26, font: 'pixel', size: 16, fill: C.lit }));

  // The column counts, worked out from the moves.
  const times = [...new Set(TASKS.flatMap((t) => t.moves.map(([mt]) => mt)))].sort((a, b) => a - b);
  const colAt = (moves, t) => moves.filter(([mt]) => mt <= t).at(-1)[1];
  COLS.forEach((title, c) => {
    const x = colX(c);
    s.add(box(x, BY + 44, COL_W, COL_H));
    s.add(rect({ x: x + 8, y: BY + 54, width: 6, height: 6 }, COL_DOT[c]));
    s.add(s.text(title, { x: x + 19, y: BY + 61, font: 'semi', size: 11, fill: C.dim }));
    const spans = [];
    for (const t of times) {
      const n = TASKS.filter((k) => colAt(k.moves, t) === c).length;
      if (spans.at(-1)?.n === n) continue;
      if (spans.length) spans.at(-1).to = t;
      spans.push({ n, from: t, to: 24 });
    }
    for (const { n, from, to } of spans) {
      const txt = s.text(String(n), { x: x + COL_W - 8, y: BY + 61, font: 'mono', size: 11, fill: n ? C.text : C.notstarted, anchor: 'end' });
      s.add(from === 0 ? during(s, txt, [[0, to]]) : during(s, txt, [[from, to]]));
    }
  });

  for (const t of TASKS) card(s, t);

  // A question waits on the card: a yellow outline that blinks.
  const at = cardAt(1, 0);
  const ring = s.anim(el('rect', { x: at.x - 2, y: at.y - 2, width: CARD_W + 4, height: CARD_H + 4, fill: 'none', stroke: C.ask, 'stroke-width': 2, class: 'px' }),
    [[0, { opacity: 1 }], [0.5, { opacity: 0.25 }, 'step']], { period: 1 });
  s.add(during(s, ring, [[ASK, ALLOW]]));
}

const cardAt = (col, slot) => ({ x: colX(col) + 6, y: col === 3 ? doneY(slot) : slotY(slot) });

// A card as the app draws it: status bar, workspace with the online dot,
// title, owner.
function card(s, { title, moves }) {
  const bars = COL_DOT.map((fill, c) => {
    const spans = [];
    moves.forEach(([t, col], k) => { if (col === c) spans.push([t, moves[k + 1]?.[0] ?? 24]); });
    return during(s, rect({ x: 3, y: 5, width: 3, height: CARD_H - 10 }, fill), spans);
  });
  const body = g({},
    rect({ x: 0, y: 0, width: CARD_W, height: CARD_H }, C.card),
    ...bars,
    rect({ x: 11, y: 7, width: 5, height: 5 }, C.ongoing),
    s.text('content', { x: 20, y: 13, font: 'mono', size: 10, fill: C.dim }),
    s.text(title, { x: 11, y: 27, font: 'semi', size: 11, fill: C.text }),
    s.text('claude', { x: 11, y: 39, font: 'mono', size: 10, fill: CLAUDE.color }));

  const keys = [];
  moves.forEach(([t, col, slot], k) => {
    if (col < 0) { keys.push([t, { ...cardAt(0, slot), y: slotY(slot) - 20, opacity: 0 }]); return; }
    const at = cardAt(col, slot);
    if (k === 0) keys.push([t, { ...at, opacity: 1 }]);
    else if (moves[k - 1][1] < 0) keys.push([t, { ...at, y: at.y - 20, opacity: 0 }, 'step'], [t + 0.3, { ...at, opacity: 1 }, 'out']);
    else keys.push([t - 0.01, {}], [t + 0.45, at, 'inOut']);
  });
  if (moves[0][1] < 0) keys.push([RESET, { opacity: 1 }], [RESET + 0.3, { opacity: 0 }]);
  s.add(s.anim(body, keys));
}

const CHECK = `
  .....#
  ....##
  #..##.
  ####..
  .##...`;
const CROSS = `
  #...#
  .#.#.
  ..#..
  .#.#.
  #...#`;

// The side panel, whose content changes with each beat.
function panel(s) {
  s.add(box(PX0, BY + 44, PW, COL_H));
  const head = (t) => s.text(t, { x: PX0 + 12, y: BY + 66, font: 'pixel', size: 16, fill: C.dim });
  const line = (txt, k, fill = C.dim, x = PX0 + 12) => s.text(txt, { x, y: BY + 92 + k * 20, font: 'mono', size: 12, fill });

  // 02: what maya sees, and what she does not.
  const yes = (txt, k) => g({}, sprite(CHECK, { '#': C.lit }, { px: 2, x: PX0 + 12, y: BY + 83 + k * 20 }), line(txt, k, C.text, PX0 + 30));
  const no = (txt, k) => g({}, sprite(CROSS, { '#': C.notstarted }, { px: 2, x: PX0 + 13, y: BY + 83 + k * 20 }), line(txt, k, C.notstarted, PX0 + 30));
  beat(s, 1, [
    head('what maya sees'),
    yes('tasks', 0), yes('questions', 1), yes('results', 2),
    no('terminals', 3.3), no('tokens, repos', 4.3), no('servers', 5.3),
    appear(s, line('claude is on it', 6.8, C.lit), START + 0.3),
  ]);

  // 03: one question, answered with a button.
  const bx = PX0 + 8;
  const by = BY + 50;
  const bw = PW - 16;
  beat(s, 2, [
    appear(s, g({},
      box(bx, by, bw, 168, C.panel, C.line),
      rect({ x: bx + 10, y: by + 10, width: 8, height: 8 }, C.ask),
      s.text('Authorization Required', { x: bx + 24, y: by + 18, font: 'semi', size: 11, fill: C.text }),
      s.text('V2 launch brief - claude', { x: bx + 10, y: by + 38, font: 'mono', size: 10, fill: CLAUDE.color }),
      s.text('Action', { x: bx + 10, y: by + 58, font: 'semi', size: 9, fill: C.notstarted }),
      box(bx + 10, by + 64, bw - 20, 20, C.column),
      s.text('WebFetch', { x: bx + 16, y: by + 78, font: 'mono', size: 11, fill: C.text }),
      box(bx + 10, by + 90, bw - 20, 22, C.column),
      s.text('acme.com/pricing', { x: bx + 16, y: by + 105, font: 'mono', size: 10, fill: C.dim })), ASK),
    appear(s, g({},
      rect({ x: bx + 10, y: by + 124, width: 66, height: 22 }, C.text),
      s.text('Allow Once', { x: bx + 43, y: by + 139, font: 'semi', size: 10, fill: C.ink, anchor: 'middle' }),
      box(bx + 80, by + 124, 72, 22, C.card, C.line),
      s.text('Always Allow', { x: bx + 116, y: by + 139, font: 'semi', size: 10, fill: C.text, anchor: 'middle' }),
      box(bx + 156, by + 124, 44, 22, C.card, C.line),
      s.text('Deny', { x: bx + 178, y: by + 139, font: 'semi', size: 10, fill: C.blocked, anchor: 'middle' })), ASK + 0.3, ALLOW + 0.1),
    appear(s, rect({ x: bx + 10, y: by + 124, width: 66, height: 22, opacity: 0.8 }, C.ongoing), ALLOW - 0.15, ALLOW + 0.1),
    appear(s, g({},
      sprite(CHECK, { '#': C.lit }, { px: 2, x: bx + 10, y: by + 128 }),
      s.text('WebFetch  allowed once', { x: bx + 28, y: by + 138, font: 'mono', size: 11, fill: C.lit }),
      s.text('by maya', { x: bx + 28, y: by + 156, font: 'mono', size: 10, fill: MAYA.color })), ALLOW + 0.1),
  ]);

  // 04: the result comes back as a reply with a file on it.
  beat(s, 3, [
    head('reply'),
    appear(s, g({},
      box(PX0 + 10, BY + 78, PW - 20, 92, C.card, C.line),
      rect({ x: PX0 + 20, y: BY + 88, width: 6, height: 6 }, CLAUDE.color),
      s.text('Agent - claude', { x: PX0 + 32, y: BY + 95, font: 'semi', size: 9, fill: C.dim }),
      s.text('Brief is ready. Pricing', { x: PX0 + 20, y: BY + 114, font: 'body', size: 12, fill: C.text }),
      s.text('checked on acme.com.', { x: PX0 + 20, y: BY + 130, font: 'body', size: 12, fill: C.text }),
      // The attachment chip: a page icon, the name and the size.
      box(PX0 + 20, BY + 140, PW - 40, 22, C.column, C.line),
      rect({ x: PX0 + 28, y: BY + 145, width: 9, height: 12 }, C.dim),
      rect({ x: PX0 + 34, y: BY + 145, width: 3, height: 3 }, C.column),
      s.text('launch-brief.pdf', { x: PX0 + 44, y: BY + 155, font: 'mono', size: 10, fill: C.text }),
      s.text('84 KB', { x: PX0 + PW - 28, y: BY + 155, font: 'mono', size: 9, fill: C.dim, anchor: 'end' })), RESULT),
    appear(s, line('maya -> done', 4.6, MAYA.color), DROP + 0.2),
    appear(s, line('0 terminals opened', 5.6, C.lit), DANCE),
  ]);
}

const LOCK = `
  .###.
  #...#
  #...#
  #####
  ##.##
  #####`;

// What engineering set up once: dimmed, always there, never opened.
function infra(s) {
  const { x, y, w, h } = STRIP;
  const chips = [['machine', 'build-box'], ['repo', 'acme/site'], ['token', '****'], ['terminal', '']];
  let cx = x + 210;
  const parts = [
    el('rect', { x, y, width: w, height: h, fill: C.column, stroke: '#3f3f46', 'stroke-width': 1, 'stroke-dasharray': '4 3' }),
    sprite(LOCK, { '#': C.notstarted }, { px: 2, x: x + 10, y: y + 8 }),
    s.text('SET UP ONCE BY ENGINEERING', { x: x + 26, y: y + 18, font: 'semi', size: 9, fill: C.notstarted, spacing: 1 }),
  ];
  for (const [k, v] of chips) {
    const cw = (k.length + v.length) * 6.6 + (v ? 30 : 22);
    parts.push(
      box(cx, y + 5, cw, 18, C.panel, C.line),
      rect({ x: cx + 7, y: y + 12, width: 4, height: 4 }, C.notstarted),
      s.text(k, { x: cx + 15, y: y + 18, font: 'mono', size: 10, fill: C.notstarted }),
      v ? s.text(v, { x: cx + 15 + k.length * 6.6 + 8, y: y + 18, font: 'mono', size: 10, fill: '#52525b' }) : null,
    );
    cx += cw + 8;
  }
  s.add(g({ opacity: 0.75 }, parts));
}

const MIC = `
  .##.
  #..#
  #..#
  #..#
  .##.
  #..#
  .##.
  ..#.
  .###`;

// 01: the New Task form, over the board.
function composer(s) {
  const parts = [
    rect({ x: BX + 2, y: BY + 2, width: BW - 4, height: 226 }, C.panel),
    s.text('New Task', { x: BX + 16, y: BY + 26, font: 'semi', size: 15, fill: C.text }),
    box(BX + BW - 108, BY + 10, 96, 22, C.column, C.line),
    rect({ x: BX + BW - 98, y: BY + 18, width: 6, height: 6 }, C.ongoing),
    s.text('content', { x: BX + BW - 84, y: BY + 25, font: 'semi', size: 11, fill: C.dim }),
    rect({ x: BX + 2, y: BY + 40, width: BW - 4, height: 1 }, C.line),
    s.text('What should the agent do?', { x: BX + 16, y: BY + 66, font: 'body', size: 13, fill: C.dim }),
    box(CP.x, CP.y, CP.w, CP.h, '#27272a', '#3f3f46'),
    during(s, el('rect', { x: CP.x, y: CP.y, width: CP.w, height: CP.h, fill: 'none', stroke: '#71717a', 'stroke-width': 2, class: 'px' }), [[COMPOSE, CREATE]]),
    ...typing(s, [
      [COMPOSE + 0.3, 'for the'], [COMPOSE + 0.6, 'for the v2'], [COMPOSE + 0.9, 'for the v2 launch'], [COMPOSE + 1.2, TYPED],
      [HASH, `${TYPED}#`], [NARROW, `${TYPED}#la`], [PICK, TASK], [CREATE + 0.3, ''],
    ], { x: TX, y: TXT_Y, end: B[1] }),
    // The tools row: the voice button, then Create Task.
    box(CP.x, CP.y + CP.h + 10, 28, 24, C.column, C.line),
    sprite(MIC, { '#': C.dim }, { px: 2, x: CP.x + 10, y: CP.y + CP.h + 13 }),
    rect({ x: CP.x + CP.w - 120, y: CP.y + CP.h + 10, width: 120, height: 24 }, C.text),
    appear(s, rect({ x: CP.x + CP.w - 120, y: CP.y + CP.h + 10, width: 120, height: 24, opacity: 0.8 }, C.ongoing), CREATE - 0.15, CREATE),
    s.text('Create Task', { x: CP.x + CP.w - 60, y: CP.y + CP.h + 27, font: 'semi', size: 13, fill: C.ink, anchor: 'middle' }),
    menuAt(s, PRESETS, HASH, NARROW),
    menuAt(s, [PRESETS[0]], NARROW, PICK),
  ];
  const [from, to] = B.slice(0, 2);
  s.add(s.anim(g({}, parts), [[0, { opacity: 0 }], [from, { opacity: 0 }], [from + FADE, { opacity: 1 }], [to - FADE, { opacity: 1 }], [to, { opacity: 0 }]]));
}

// Text typed a few keys at a time: [second, text]; gone at `end`.
function typing(s, chunks, { x, y, end }) {
  const out = [];
  chunks.forEach(([t, text], k) => {
    const to = k + 1 < chunks.length ? chunks[k + 1][0] : end;
    out.push(during(s, s.text(text, { x, y, font: 'mono', size: 14, fill: C.text }), [[t, to]]));
    const blink = s.anim(rect({ x: x + 1 + text.length * CH, y: y - 15, width: 2, height: 18 }, C.text),
      [[0, { opacity: 1 }], [0.5, { opacity: 0 }, 'step']], { period: 1 });
    out.push(during(s, blink, [[t, to]]));
  });
  return out;
}

// The # menu, as the app draws it: #name, the start of the message, 'preset'.
function menuAt(s, rows, from, to) {
  const RH = 26;
  const y = CP.y - 4 - rows.length * RH;
  const parts = [box(CP.x, y, CP.w, rows.length * RH, '#27272a', '#3f3f46')];
  rows.forEach((p, k) => {
    if (k === 0) parts.push(rect({ x: CP.x + 1, y: y + 1, width: CP.w - 2, height: RH - 2 }, '#3f3f46'));
    parts.push(
      s.text(`#${p.name}`, { x: CP.x + 12, y: y + k * RH + 17, font: 'semi', size: 12, fill: C.text }),
      s.text(p.body, { x: CP.x + 132, y: y + k * RH + 17, font: 'body', size: 11, fill: C.dim }),
      s.text('preset', { x: CP.x + CP.w - 12, y: y + k * RH + 17, font: 'body', size: 10, fill: '#71717a', anchor: 'end' }));
  });
  return during(s, g({}, parts), [[from, to]]);
}

const RACK = `
  rrrrrrrrrrrr
  r..........r
  r.gg.......r
  r..........r
  rrrrrrrrrrrr
  r..........r
  r.gg.......r
  r..........r
  rrrrrrrrrrrr
  r..........r
  r.gg.......r
  r..........r
  rrrrrrrrrrrr
  .rr......rr.`;

// The machine the agent runs on, off to the side and out of maya's way.
function server(s) {
  const x = 1060;
  const y = GROUND - 70;
  s.add(g({ opacity: 0.55 },
    sprite(RACK, { r: '#3f3f46', g: '#27272a' }, { px: 5, x, y }),
    s.text('build-box', { x: x + 30, y: GROUND + 28, font: 'pixel', size: 16, fill: C.notstarted, anchor: 'middle' })));
  // Its lights blink while the agent works.
  [0, 1, 2].forEach((k) => {
    s.add(during(s, s.anim(rect({ x: x + 10, y: y + 10 + k * 20, width: 10, height: 5 }, C.ongoing),
      [[0, { opacity: 1 }], [0.3 + k * 0.1, { opacity: 0.2 }, 'step']], { period: 0.8 }), [[START + 0.4, ASK], [ALLOW + 0.4, RESULT]]));
  });
}

// maya's pointer: the preset, Create Task, Allow Once, the drag to Done.
function pointer(s) {
  const comp = { x: TX + 220, y: TXT_Y - 6 };
  const pickRow = { x: CP.x + 140, y: CP.y - 4 - 13 };
  const create = { x: CP.x + CP.w - 60, y: CP.y + CP.h + 22 };
  const allow = { x: PX0 + 8 + 43, y: BY + 50 + 136 };
  const from = { x: colX(1) + 6 + 70, y: slotY(0) + 24 };
  const to = { x: colX(3) + 6 + 70, y: doneY(0) + 24 };
  cursor(s, [
    [0, OFF],
    [0.3, OFF],
    [COMPOSE - 0.15, comp, 'inOut'], ...press(COMPOSE, comp),
    [PICK - 0.7, comp],
    [PICK - 0.15, pickRow, 'inOut'], ...press(PICK, pickRow),
    [PICK + 0.4, pickRow],
    [CREATE - 0.15, create, 'inOut'], ...press(CREATE, create),
    [CREATE + 0.6, create],
    [CREATE + 1.4, OFF, 'inOut'],
    [ALLOW - 1.2, OFF],
    [ALLOW - 0.15, allow, 'inOut'], ...press(ALLOW, allow),
    [ALLOW + 0.5, allow],
    [ALLOW + 1.3, OFF, 'inOut'],
    [GRAB - 1.0, OFF],
    [GRAB - 0.2, from, 'inOut'],
    ...press(GRAB, from),
    [DROP - 0.01, from],
    [DROP + 0.45, to, 'inOut'],
    ...press(DROP + 0.6, to),
    [DROP + 0.9, to],
    [DROP + 1.6, OFF, 'inOut'],
  ]);
}
