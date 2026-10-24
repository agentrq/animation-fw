// AgentRQ's task board handing work to five agents at once.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, CHECK, OFF, newScene, sky, ground, intro, frame, button, mascot, cursor, press,
} from '../kit/agentrq.js';

// Each agent's task on the board.
const TASKS = ['Fix login redirect', 'Migrate users table', 'Polish settings UI', 'Write release notes', 'Triage new issues'];

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const ADD = (i) => 1.2 + 0.6 * i;          // you add the task
const PICK = (i) => 5.2 + 0.6 * i;         // its agent takes it
const DONE = [10, 16, 11, 13, 14.2];       // it lands in Done
const ASK = 9.2;                           // codex blocks on a question
const ALLOW = 11.4;                        // you click Allow
const RESUME = 12;                         // codex goes back to work
const DANCE = 18;
const RESET = 22.6;
const MOVE = 0.6;

// ---------------------------------------------------------------- the board
const BX = 440;
const BY = 20;
const BW = 740;
const COLS = ['Not Started', 'Ongoing', 'Blocked', 'Done'];
const COL_DOT = [C.notstarted, C.ongoing, C.blocked, C.done];
const colX = (c) => BX + 10 + c * 182;
const CARD_W = 168;
const CARD_H = 34;
const slotY = (s) => BY + 76 + s * 38;
const at = (c, s) => ({ x: colX(c) + 3, y: slotY(s) });

// Which column each card is in, and when. Done lists the newest first, as
// the app does; the other columns append.
const MOVES = [
  ...MASCOTS.flatMap((m, i) => [
    { t: ADD(i), card: i, col: 0 },
    { t: PICK(i), card: i, col: 1 },
    { t: DONE[i], card: i, col: 3, top: true },
  ]),
  { t: ASK, card: 1, col: 2 },
  { t: RESUME, card: 1, col: 1 },
];

// Replays the moves and returns, per card, every [t, column, slot] it takes,
// including the slides when a card above it leaves.
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

export default function taskBoard() {
  const s = newScene({
    poster: 17.5,
    description: 'AgentRQ task board: you add five tasks and five agents, claude, codex, agy, hermes and openclaw, each pick up their own. Cards move from Not Started to Ongoing; codex asks a question and its card turns Blocked until you click Allow; then every card lands in Done and the agents celebrate.',
  });

  sky(s);
  ground(s);
  story(s);
  board(s);
  MASCOTS.forEach((m, i) => card(s, m, i));
  MASCOTS.forEach((m, i) => agent(s, m, i));
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'task board',
    headline: ['One board,', 'every agent.'],
    sub: 'Hand out tasks. Watch them move.',
    steps: [['assign', 1, 5], ['pick up', 5, ASK], ['ask', ASK, RESUME + 0.5], ['done', RESUME + 0.5, RESET]],
    log: [
      [0, 1, '> waiting for work_'],
      [1, PICK(0), '> you: 5 tasks, 5 agents'],
      [PICK(0), ASK, '> each agent pulls its own'],
      [ASK, ALLOW, '> codex: run the migration?', C.ask],
      [ALLOW, 13, '> you: allow'],
      [13, DONE[1] + MOVE, '> agents finishing up'],
      [DONE[1] + MOVE, RESET, '> 5 of 5 done'],
    ],
  });
}

function board(s) {
  frame(s, { x: BX, y: BY, w: BW, h: 272, title: 'All workspaces' });
  button(s, { x: BX + BW - 116, y: BY + 9, w: 104, label: '+ New task', clicks: MASCOTS.map((_, i) => ADD(i)) });

  COLS.forEach((title, c) => {
    s.add(el('rect', { x: colX(c), y: BY + 44, width: 174, height: 220, fill: C.column, class: 'px' }));
    s.add(el('rect', { x: colX(c) + 10, y: BY + 56, width: 6, height: 6, fill: COL_DOT[c], class: 'px' }));
    s.add(s.text(title, { x: colX(c) + 22, y: BY + 63, font: 'semi', size: 12, fill: C.dim }));
  });
}

function card(s, m, i) {
  const codex = m.name === 'codex';
  const done = DONE[i];
  const [[t0, c0, s0], ...rest] = TRACKS.get(i);

  // Dropped in, then every slide the layout asks for, then gone.
  const keys = [
    [0, { ...at(c0, s0), y: slotY(s0) - 14, opacity: 0 }],
    [t0, { opacity: 0 }, 'step'],
    [t0 + 0.35, { ...at(c0, s0), opacity: 1 }, 'back'],
  ];
  let prev = at(c0, s0);
  for (const [t, c, slot] of rest) {
    keys.push([t, prev], [t + MOVE, at(c, slot), 'inOut']);
    prev = at(c, slot);
  }
  keys.push([RESET, { opacity: 1 }], [RESET + 0.5, { opacity: 0 }]);

  // The bar down its left edge takes the column's colour on arrival.
  const bar = [[0, { fill: C.notstarted }]];
  for (const [t, c] of rest) bar.push([t + MOVE, { fill: COL_DOT[c] }, 'step']);
  bar.push([RESET + 0.6, { fill: C.notstarted }, 'step']);

  const check = sprite(CHECK, { '#': C.ongoing }, { px: 2, x: CARD_W - 22, y: 11 });

  const parts = [
    el('rect', { width: CARD_W, height: CARD_H, fill: C.card, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    s.anim(el('rect', { width: 4, height: CARD_H, class: 'px' }), bar),
    s.text(TASKS[i], { x: 12, y: 15, font: 'semi', size: 12, fill: C.text }),
    el('rect', { x: 12, y: 21, width: 6, height: 6, fill: m.color, class: 'px' }),
    s.text(m.name, { x: 22, y: 28, font: 'mono', size: 10, fill: C.dim }),
    s.anim(check, [[0, { opacity: 0 }], [done + MOVE, { opacity: 1 }, 'step'], [RESET + 0.6, { opacity: 0 }, 'step']]),
  ];
  if (codex) {
    // The Allow button, there only while the card is blocked.
    parts.push(s.anim(g({},
      el('rect', { x: CARD_W - 52, y: 17, width: 44, height: 14, fill: C.ask, class: 'px' }),
      s.text('allow', { x: CARD_W - 30, y: 28, font: 'pixel', size: 8, fill: C.ink, anchor: 'middle' })),
    [[0, { opacity: 0 }], [ASK + MOVE, { opacity: 1 }, 'step'], [ALLOW + 0.2, { opacity: 0.4 }, 'step'], [RESUME, { opacity: 0 }, 'step']]));
  }
  s.add(s.anim(g({}, parts), keys));
}

// Each agent hops when its task arrives, when it picks it up, higher when it
// is done, and twice in the dance; codex hops again when it may go on.
function agent(s, m, i) {
  const codex = m.name === 'codex';
  const hops = [[ADD(i) + 0.35, 8], [PICK(i), 14], [DONE[i] + MOVE, 22], [DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]];
  if (codex) hops.push([RESUME, 14]);
  mascot(s, m, i, {
    hops,
    alert: [[ADD(i) + 0.35, PICK(i)]],
    work: codex ? [[PICK(i) + MOVE, ASK], [RESUME + MOVE, DONE[i]]] : [[PICK(i) + MOVE, DONE[i]]],
    ask: codex ? [[ASK + MOVE, RESUME]] : [],
    done: [[DONE[i] + MOVE, RESET]],
  });
}

// You: five clicks on + New task, then Allow on codex's question.
function pointer(s) {
  const btn = { x: BX + BW - 70, y: BY + 22 };
  const allow = { x: at(2, 0).x + CARD_W - 32, y: at(2, 0).y + 24 };
  cursor(s, [
    [0, OFF],
    [0.4, OFF],
    [1, btn, 'inOut'],
    ...MASCOTS.flatMap((_, i) => press(ADD(i), btn)),
    [ADD(4) + 0.3, btn],
    [ADD(4) + 0.9, OFF, 'inOut'],
    [ALLOW - 0.8, OFF],
    [ALLOW - 0.2, allow, 'inOut'],
    ...press(ALLOW + 0.2, allow),
    [RESUME + 0.4, allow],
    [RESUME + 1, OFF, 'inOut'],
  ]);
}
