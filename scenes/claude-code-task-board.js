// Claude Code task board: you write a task for the Agent (the default
// assignee) and create it. It reaches the api workspace's Claude Code session over its channel,
// claude marks it ongoing, stops once for an approval (the card turns
// yellow, with Allow/Deny), then replies and marks it completed. Two more Claude Code
// sessions, web and docs, sit on the same board.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, OFF, newScene, sky, ground, intro, frame, mascot, cursor, press, during,
} from '../kit/agentrq.js';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop. Each beat owns a span.
const B = [0.3, 6.6, 12.0, 17.6, 22.6];
const FADE = 0.25;
const COMPOSE = 0.9;        // you click into the New Task box
const AGENT = 3.6;          // the pointer checks the assignee: Agent
const CREATE = 5.0;         // Create Task
const FILED = 6.9;          // the card lands in Not Started
const ARRIVE = 7.6;         // the channel message reaches the terminal
const START = 9.2;          // claude: updateStatus ongoing
const ASK = 12.4;           // claude asks to run the tests: the card turns yellow
const ALLOW = 14.8;         // you: Allow Once
const RESULT = 18.0;        // the reply
const COMPLETE = 19.6;      // claude: updateStatus completed
const DANCE = 20.4;
const RESET = 22.6;

const TASK = 'fix the flaky login test';

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
const CP = { x: BX + 16, y: BY + 100, w: BW - 32, h: 52 };
const TX = CP.x + 14;
const TXT_Y = CP.y + 30;
const ROW = CP.y + CP.h + 10;
const TOG = { x: CP.x + 3, y: ROW, w: 70, h: 24 };    // Agent | Human

// You: the person the Claude Code sessions work for.
const YOU = {
  name: 'you', color: '#60a5fa',
  art: `
    ...hhhh...
    ..hhhhhh..
    .hhffffhh.
    .hf#ff#fh.
    .hffffffh.
    ...ffff...
    ..ssssss..
    .ssssssss.
    f.ssssss.f
    ..ssssss..
    ..ll..ll..
    ..ll..ll..`,
  palette: { h: '#3f2a1d', f: '#c8956d', '#': '#1c1917', s: '#60a5fa', l: '#3f3f46' },
  eyes: [[3, 3, 1, 1], [6, 3, 1, 1]], skin: '#c8956d',
};
const CLAUDE = MASCOTS.find((m) => m.name === 'claude');
const AT = { you: 520, api: 680, web: 820, docs: 960 };

// The task cards: [second, column, slot]; column -1 is off the board.
const TASKS = [
  { ws: 'docs', title: 'API reference', moves: [[0, 3, 0], [COMPLETE, 3, 1]] },
  { ws: 'web', title: 'Dark mode', moves: [[0, 1, 0], [START, 1, 1]] },
  { ws: 'billing', title: 'Stripe secret', moves: [[0, 2, 0]] },
  { ws: 'api', title: 'Flaky login test', moves: [[0, -1, 0], [FILED, 0, 0], [START, 1, 0], [COMPLETE, 3, 0]], pending: [[ASK, ALLOW]] },
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

export default function claudeCodeTaskBoard() {
  const s = newScene({
    poster: 13.4,
    description: 'A task board for Claude Code: you write "fix the flaky login test" in New Task, keep the assignee on Agent and click Create Task. The card lands in Not Started on a board that also shows the web and docs workspaces\' Claude Code sessions. The task reaches the api session\'s terminal as a channel message, and claude marks it ongoing. It stops to ask before running the tests, so the card turns yellow and you click Allow Once. claude replies that the race is fixed and the tests pass 20 times in a row, then marks the task completed and the card moves to Done.',
  });

  sky(s);
  ground(s);
  story(s);
  board(s);
  panel(s);
  sessions(s);
  composer(s);
  mascot(s, YOU, 5, {
    x: AT.you,
    hops: [[CREATE + 0.2, 12], [ALLOW + 0.2, 12], [DANCE + 0.1, 16], [DANCE + 1.0, 16]],
    alert: [[ASK + 0.2, ALLOW - 0.3]],
    done: [[COMPLETE + 0.2, RESET]],
  });
  mascot(s, { ...CLAUDE, name: 'api' }, 0, {
    x: AT.api,
    hops: [[ARRIVE, 14], [ALLOW + 0.2, 14], [DANCE + 0.15, 16], [DANCE + 1.05, 16]],
    alert: [[FILED, START]],
    work: [[START + 0.4, ASK], [ALLOW + 0.4, RESULT]],
    ask: [[ASK, ALLOW + 0.1]],
    done: [[RESULT, RESET]],
  });
  mascot(s, { ...CLAUDE, name: 'web' }, 1, {
    x: AT.web,
    hops: [[DANCE + 0.3, 12]],
    work: [[0.5, RESET]],
  });
  mascot(s, { ...CLAUDE, name: 'docs' }, 2, {
    x: AT.docs,
    hops: [[DANCE + 0.45, 12]],
    say: [['zZ', [[0.5, RESET]]]],
  });
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'claude code task board',
    headline: ['Assign it. Track it.', 'Claude runs it.'],
    sub: 'Every Claude Code session, one board.',
    steps: [['assign', B[0], B[1]], ['deliver', B[1], B[2]], ['approve', B[2], B[3]], ['done', B[3], B[4]]],
    log: [
      [0, COMPOSE, '> New Task in api_'],
      [COMPOSE, AGENT, '> you describe the work'],
      [AGENT, CREATE, '> assignee: Agent', C.ask],
      [CREATE, ARRIVE, '> card lands in Not Started'],
      [ARRIVE, START, '> channel -> Claude Code'],
      [START, ASK, '> claude: ongoing'],
      [ASK, ALLOW, '> claude asks: run the tests?', C.ask],
      [ALLOW, RESULT, '> you: Allow Once'],
      [RESULT, COMPLETE, '> claude replies'],
      [COMPLETE, RESET, '> claude: completed', C.lit],
    ],
  });
}

// The board across every workspace: four columns, three cards.
function board(s) {
  frame(s, { x: BX, y: BY, w: BW, h: BH, title: 'All workspaces' });
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
      s.add(during(s, txt, [[from, to]]));
    }
  });

  for (const t of TASKS) card(s, t);

  // A permission waits on the card: a yellow outline that blinks.
  const at = cardAt(1, 0);
  const ring = s.anim(el('rect', { x: at.x - 2, y: at.y - 2, width: CARD_W + 4, height: CARD_H + 4, fill: 'none', stroke: C.ask, 'stroke-width': 2, class: 'px' }),
    [[0, { opacity: 1 }], [0.5, { opacity: 0.25 }, 'step']], { period: 1 });
  s.add(during(s, ring, [[ASK, ALLOW]]));
}

const cardAt = (col, slot) => ({ x: colX(col) + 6, y: col === 3 ? doneY(slot) : slotY(slot) });

// A card as the app draws it: status bar, workspace with the online dot,
// title, the agent.
function card(s, { ws, title, moves, pending = [] }) {
  const bars = COL_DOT.map((fill, c) => {
    const spans = [];
    moves.forEach(([t, col], k) => { if (col === c) spans.push([t, moves[k + 1]?.[0] ?? 24]); });
    return during(s, rect({ x: 3, y: 5, width: 3, height: CARD_H - 10 }, fill), spans);
  });
  const body = g({},
    rect({ x: 0, y: 0, width: CARD_W, height: CARD_H }, C.card),
    ...bars,
    // Pending on you: the bar turns yellow.
    during(s, rect({ x: 3, y: 5, width: 3, height: CARD_H - 10 }, C.ask), pending),
    rect({ x: 11, y: 7, width: 5, height: 5 }, C.ongoing),
    s.text(ws, { x: 20, y: 13, font: 'mono', size: 10, fill: C.dim }),
    s.text(title, { x: 11, y: 27, font: 'semi', size: 11, fill: C.text }),
    s.text('claude', { x: 11, y: 39, font: 'mono', size: 10, fill: CLAUDE.color }),
    s.text('Agent', { x: CARD_W - 6, y: 39, font: 'mono', size: 9, fill: C.notstarted, anchor: 'end' }));

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

// The side panel, whose content changes with each beat.
function panel(s) {
  s.add(box(PX0, BY + 44, PW, COL_H));
  const head = (t) => s.text(t, { x: PX0 + 12, y: BY + 66, font: 'pixel', size: 16, fill: C.dim });

  // 02: the task arrives in Claude Code's terminal over the channel.
  const tx = PX0 + 8;
  const ty = BY + 50;
  const tw = PW - 16;
  const mono = (txt, x, k, fill = C.dim, size = 10) => s.text(txt, { x, y: ty + 44 + k * 15, font: 'mono', size, fill });
  beat(s, 1, [
    box(tx, ty, tw, 168, '#0c0c0e', C.line),
    rect({ x: tx + 8, y: ty + 9, width: 5, height: 5 }, C.blocked),
    rect({ x: tx + 17, y: ty + 9, width: 5, height: 5 }, C.ask),
    rect({ x: tx + 26, y: ty + 9, width: 5, height: 5 }, C.ongoing),
    s.text('api - claude', { x: tx + 40, y: ty + 15, font: 'mono', size: 10, fill: C.dim }),
    s.text('LIVE', { x: tx + tw - 8, y: ty + 16, font: 'pixel', size: 14, fill: C.lit, anchor: 'end' }),
    rect({ x: tx, y: ty + 22, width: tw, height: 1 }, C.line),
    appear(s, g({},
      mono('<channel source=', tx + 8, 0, C.cron),
      mono('"agentrq-workspace">', tx + 20, 1, C.cron),
      mono('[Task 0md9r2]', tx + 8, 2, C.text),
      mono(TASK, tx + 8, 3, C.text)), ARRIVE),
    appear(s, g({},
      rect({ x: tx + 8, y: ty + 98, width: 5, height: 5 }, C.ongoing),
      mono('task updateStatus', tx + 18, 4, C.text),
      mono('└ ongoing', tx + 18, 5, C.lit)), START),
    appear(s, g({},
      rect({ x: tx + 8, y: ty + 143, width: 5, height: 5 }, C.ongoing),
      mono('Read login.spec.ts', tx + 18, 7, C.dim)), START + 1.0),
  ]);

  // 03: pending on you, one permission answered with a button.
  const bx = PX0 + 8;
  const by = BY + 50;
  const bw = PW - 16;
  beat(s, 2, [
    appear(s, g({},
      box(bx, by, bw, 168, C.panel, C.line),
      rect({ x: bx + 10, y: by + 10, width: 8, height: 8 }, C.ask),
      s.text('Authorization Required', { x: bx + 24, y: by + 18, font: 'semi', size: 11, fill: C.text }),
      s.text('Flaky login test - claude', { x: bx + 10, y: by + 38, font: 'mono', size: 10, fill: CLAUDE.color }),
      s.text('Action', { x: bx + 10, y: by + 58, font: 'semi', size: 9, fill: C.notstarted }),
      box(bx + 10, by + 64, bw - 20, 20, C.column),
      s.text('Bash', { x: bx + 16, y: by + 78, font: 'mono', size: 11, fill: C.text }),
      box(bx + 10, by + 90, bw - 20, 22, C.column),
      s.text('npm test -- login', { x: bx + 16, y: by + 105, font: 'mono', size: 10, fill: C.dim })), ASK),
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
      s.text('Bash  allowed once', { x: bx + 28, y: by + 138, font: 'mono', size: 11, fill: C.lit }),
      s.text('claude carries on', { x: bx + 28, y: by + 156, font: 'mono', size: 10, fill: C.dim })), ALLOW + 0.1),
  ]);

  // 04: the reply, then claude closes the task itself.
  const line = (txt, k, fill = C.dim) => s.text(txt, { x: PX0 + 12, y: BY + 92 + k * 20, font: 'mono', size: 12, fill });
  beat(s, 3, [
    head('reply'),
    appear(s, g({},
      box(PX0 + 10, BY + 78, PW - 20, 76, C.card, C.line),
      rect({ x: PX0 + 20, y: BY + 88, width: 6, height: 6 }, CLAUDE.color),
      s.text('Agent - claude', { x: PX0 + 32, y: BY + 95, font: 'semi', size: 9, fill: C.dim }),
      s.text('Fixed a race in session', { x: PX0 + 20, y: BY + 114, font: 'body', size: 12, fill: C.text }),
      s.text('setup. 20/20 runs pass.', { x: PX0 + 20, y: BY + 130, font: 'body', size: 12, fill: C.text }),
      s.text('branch fix/login-race', { x: PX0 + 20, y: BY + 146, font: 'mono', size: 9, fill: C.dim })), RESULT),
    appear(s, g({},
      rect({ x: PX0 + 14, y: BY + 176, width: 5, height: 5 }, C.ongoing),
      line('updateStatus', 4.1, C.text),
      s.text('└ completed', { x: PX0 + 24, y: BY + 194, font: 'mono', size: 12, fill: C.lit })), COMPLETE),
  ]);
}

// The Claude Code sessions connected to the board, one per workspace.
function sessions(s) {
  const { x, y, w, h } = STRIP;
  const parts = [
    el('rect', { x, y, width: w, height: h, fill: C.column, stroke: C.line, 'stroke-width': 1 }),
    s.text('CLAUDE CODE SESSIONS', { x: x + 12, y: y + 18, font: 'semi', size: 9, fill: C.notstarted, spacing: 1 }),
  ];
  let cx = x + 170;
  for (const ws of ['api', 'web', 'docs']) {
    const cw = (ws.length + 6) * 6.6 + 30;
    parts.push(
      box(cx, y + 5, cw, 18, C.panel, C.line),
      rect({ x: cx + 7, y: y + 12, width: 4, height: 4 }, C.ongoing),
      s.text(ws, { x: cx + 15, y: y + 18, font: 'mono', size: 10, fill: C.text }),
      s.text('claude', { x: cx + 15 + ws.length * 6.6 + 8, y: y + 18, font: 'mono', size: 10, fill: CLAUDE.color }),
    );
    cx += cw + 8;
  }
  parts.push(s.text('--channels', { x: x + w - 12, y: y + 18, font: 'mono', size: 10, fill: C.cron, anchor: 'end' }));
  s.add(g({}, parts));
}

// 01: the New Task form, over the board.
function composer(s) {
  const tog = (label, x, on) => [
    rect({ x, y: TOG.y, width: TOG.w, height: TOG.h }, on ? C.text : C.column, on ? {} : { stroke: C.line, 'stroke-width': 1 }),
    s.text(label, { x: x + TOG.w / 2, y: TOG.y + 16, font: 'semi', size: 12, fill: on ? C.ink : C.dim, anchor: 'middle' }),
  ];
  const parts = [
    rect({ x: BX + 2, y: BY + 2, width: BW - 4, height: 226 }, C.panel),
    s.text('New Task', { x: BX + 16, y: BY + 26, font: 'semi', size: 15, fill: C.text }),
    box(BX + BW - 108, BY + 10, 96, 22, C.column, C.line),
    rect({ x: BX + BW - 98, y: BY + 18, width: 6, height: 6 }, C.ongoing),
    s.text('api', { x: BX + BW - 84, y: BY + 25, font: 'semi', size: 11, fill: C.dim }),
    rect({ x: BX + 2, y: BY + 40, width: BW - 4, height: 1 }, C.line),
    s.text('What should the agent do?', { x: BX + 16, y: BY + 66, font: 'body', size: 13, fill: C.dim }),
    box(CP.x, CP.y, CP.w, CP.h, '#27272a', '#3f3f46'),
    during(s, el('rect', { x: CP.x, y: CP.y, width: CP.w, height: CP.h, fill: 'none', stroke: '#71717a', 'stroke-width': 2, class: 'px' }), [[COMPOSE, CREATE]]),
    ...typing(s, [
      [COMPOSE + 0.3, 'fix the'], [COMPOSE + 0.7, 'fix the flaky'], [COMPOSE + 1.1, 'fix the flaky login'], [COMPOSE + 1.5, TASK], [CREATE + 0.3, ''],
    ], { x: TX, y: TXT_Y, end: B[1] }),
    // The options row: the voice button, Agent | Human, then Create Task.
    s.text('Assignee', { x: TOG.x, y: ROW + 40, font: 'body', size: 10, fill: C.notstarted }),
    box(TOG.x - 3, ROW - 3, TOG.w * 2 + 10, TOG.h + 6, '#27272a', '#3f3f46'),
    ...tog('AGENT', TOG.x, true), ...tog('HUMAN', TOG.x + TOG.w + 4, false),
    during(s, el('rect', { x: TOG.x - 3, y: ROW - 3, width: TOG.w + 6, height: TOG.h + 6, fill: 'none', stroke: C.ask, 'stroke-width': 2, class: 'px' }), [[AGENT, CREATE - 0.3]]),
    rect({ x: CP.x + CP.w - 120, y: ROW, width: 120, height: 24 }, C.text),
    appear(s, rect({ x: CP.x + CP.w - 120, y: ROW, width: 120, height: 24, opacity: 0.8 }, C.ongoing), CREATE - 0.15, CREATE),
    s.text('Create Task', { x: CP.x + CP.w - 60, y: ROW + 17, font: 'semi', size: 13, fill: C.ink, anchor: 'middle' }),
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

// Your pointer: the text box, the Agent toggle, Create Task, Allow Once.
function pointer(s) {
  const comp = { x: TX + 240, y: TXT_Y - 6 };
  const agent = { x: TOG.x + TOG.w / 2, y: ROW + 14 };
  const create = { x: CP.x + CP.w - 60, y: ROW + 12 };
  const allow = { x: PX0 + 8 + 43, y: BY + 50 + 136 };
  cursor(s, [
    [0, OFF],
    [0.3, OFF],
    [COMPOSE - 0.15, comp, 'inOut'], ...press(COMPOSE, comp),
    [AGENT - 0.7, comp],
    [AGENT - 0.15, agent, 'inOut'],
    [AGENT + 0.5, agent],
    [CREATE - 0.15, create, 'inOut'], ...press(CREATE, create),
    [CREATE + 0.6, create],
    [CREATE + 1.4, OFF, 'inOut'],
    [ALLOW - 1.2, OFF],
    [ALLOW - 0.15, allow, 'inOut'], ...press(ALLOW, allow),
    [ALLOW + 0.5, allow],
    [ALLOW + 1.3, OFF, 'inOut'],
  ]);
}
