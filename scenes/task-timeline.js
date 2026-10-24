// AgentRQ's task timeline: every status a task has been in, and how long it
// stayed there, drawn as dots under the task, with the totals above them.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, OFF, newScene, sky, ground, intro, frame, button, mascot, cursor, press, during,
} from '../kit/agentrq.js';

const [CLAUDE] = MASCOTS;

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const NEW = 0.6;                           // the task lands, not started
const PICK = 2.2;                          // claude takes it
const ASK = 5.2;                           // claude asks to run the migration
const ALLOW = 7;                           // you click Allow
const BLOCK = 10.4;                        // claude is blocked
const TYPE = 11.2;                         // you type an answer
const SEND = 12.6;                         // and click Send
const CLOSE = 15.6;                        // claude completes it
const DANCE = 17.6;
const RESET = 22.6;

// The task's own clock, in minutes past 10:00, pinned to the beats above.
const CLOCK = [[0, NEW], [2, PICK], [6, ASK], [8, ALLOW], [13, BLOCK], [16, SEND], [21, CLOSE]];
function secAt(min) {
  for (let i = 1; i < CLOCK.length; i++) {
    const [m0, t0] = CLOCK[i - 1];
    const [m1, t1] = CLOCK[i];
    if (min <= m1) return +(t0 + ((min - m0) / (m1 - m0)) * (t1 - t0)).toFixed(3);
  }
  return CLOCK.at(-1)[1];
}
const clockText = (min) => `10:${String(min).padStart(2, '0')} AM`;

// Every state the task goes through, from the minute it began. The colours
// are the ones every task list uses; needs input is the yellow of waiting on
// you.
const TONE = {
  notstarted: { dot: C.notstarted, label: 'NOT STARTED', text: C.dim },
  ongoing: { dot: C.ongoing, label: 'ONGOING', text: C.dim },
  needsinput: { dot: C.ask, label: 'NEEDS INPUT', text: '#facc15', line: '#ca8a04' },
  blocked: { dot: C.blocked, label: 'BLOCKED', text: '#f87171', line: '#dc2626' },
  completed: { dot: C.done, label: 'COMPLETED', text: C.dim },
};
const DOTS = [
  ['notstarted', 0], ['ongoing', 2], ['needsinput', 6], ['ongoing', 8], ['blocked', 13], ['ongoing', 16], ['completed', 21],
];
const landAt = (i) => secAt(DOTS[i][1]);

const minutes = (m) => (m ? `${m}m` : '0s');

// ---------------------------------------------------------------- the page
const BX = 440;
const BY = 20;
const BW = 740;
const BH = 272;
const DY = BY + 116;                       // the dots' centre line
const dotX = (i) => BX + 40 + i * 102;
const TOT_Y = BY + 88;                     // the totals, above the dots
const CARD = { x: BX + 16, y: BY + 182, w: BW - 32, h: 76 };

const CLOCK_ART = `
  .###.
  #.#.#
  #.##.
  #...#
  .###.`;

export default function taskTimeline() {
  const s = newScene({
    poster: 17,
    description: 'AgentRQ task timeline: under a task, a dot lands for every status it enters, with the time spent on the line to the next. claude picks up Migrate users table, waits on you to allow a command (a yellow needs-input stretch), later is blocked until you reply (a red stretch), and completes it; the totals read claude-code worked 14m, blocked 3m, needs input 2m, start to close 19m, and claude celebrates.',
  });

  sky(s);
  ground(s);
  story(s);
  page(s);
  clock(s);
  DOTS.forEach((_, i) => dot(s, i));
  totals(s);
  permission(s);
  blocked(s);
  finished(s);
  agent(s);
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'timeline',
    headline: ['Where did', 'the time go?'],
    sub: 'Every status, and how long it lasted.',
    steps: [['start', NEW, ASK], ['ask', ASK, BLOCK], ['block', BLOCK, CLOSE], ['close', CLOSE, RESET]],
    log: [
      [0, NEW, '> waiting for work_'],
      [NEW, PICK, '> new task: not started'],
      [PICK, ASK, '> claude: ongoing'],
      [ASK, ALLOW, '> claude: run psql -f migrate.sql?', C.ask],
      [ALLOW, BLOCK, '> you: allow · waited 2m'],
      [BLOCK, SEND, '> claude: blocked, no DB password', '#f87171'],
      [SEND, CLOSE, '> you: reply · blocked 3m'],
      [CLOSE, RESET, '> closed in 19m', C.lit],
    ],
  });
}

// The task's page: its title, its description, a rule above the timeline.
function page(s) {
  frame(s, { x: BX, y: BY, w: BW, h: BH, title: 'Migrate users table' });
  s.add(
    s.text('Rename the user columns, then backfill the new ones.', { x: BX + 16, y: BY + 52, font: 'body', size: 12, fill: '#71717a' }),
    el('rect', { x: BX + 2, y: BY + 64, width: BW - 4, height: 1, fill: C.line, class: 'px' }),
  );
}

// A clock in the corner, running a minute at a time.
function clock(s) {
  const x = BX + BW - 104;
  s.add(sprite(CLOCK_ART, { '#': C.dim }, { px: 2, x, y: BY + 15 }));
  for (let m = 0; m <= 21; m++) {
    const from = m ? secAt(m) : 0;
    const to = m < 21 ? secAt(m + 1) : RESET + 0.5;
    s.add(during(s, s.text(clockText(m), { x: x + 16, y: BY + 25, font: 'mono', size: 12, fill: C.dim }), [[from, to]]));
  }
  s.add(during(s, s.text(clockText(0), { x: x + 16, y: BY + 25, font: 'mono', size: 12, fill: C.dim }), [[RESET + 0.5, 24]]));
}

// One state: its dot and label land when the task enters it; while it is
// the current one the dot pings and its time ticks beside it; when the next
// lands, the line to it carries how long this one lasted.
function dot(s, i) {
  const [state, from] = DOTS[i];
  const tone = TONE[state];
  const x = dotX(i);
  const land = landAt(i);
  const last = i === DOTS.length - 1;
  const next = last ? null : landAt(i + 1);
  const end = RESET + 0.5;

  // The line to the next dot, with this state's duration in its middle.
  if (!last) {
    const x1 = dotX(i + 1);
    const took = DOTS[i + 1][1] - from;
    const label = minutes(took);
    const lw = label.length * 7 + 8;
    const mid = (x + x1) / 2;
    const thick = tone.line ? 4 : 2;
    const fill = tone.line ?? '#3f3f46';
    s.add(during(s, g({},
      el('rect', { x: x + 8, y: DY - thick / 2, width: mid - lw / 2 - x - 8, height: thick, fill, class: 'px' }),
      el('rect', { x: mid + lw / 2, y: DY - thick / 2, width: x1 - 8 - mid - lw / 2, height: thick, fill, class: 'px' }),
      s.text(label, { x: mid, y: DY + 4, font: 'semi', size: 11, fill: tone.line ? tone.text : C.dim, anchor: 'middle' }),
    ), [[next, end]]));

    // While open: the time so far, a minute at a time, beside the dot.
    for (let m = from; m < DOTS[i + 1][1]; m++) {
      s.add(during(s, s.text(minutes(m - from), { x: x + 12, y: DY + 4, font: 'semi', size: 11, fill: tone.line ? tone.text : C.dim }),
        [[m === from ? land : secAt(m), secAt(m + 1)]]));
    }
    // The current dot pings.
    const ping = s.anim(el('rect', { x: x - 11, y: DY - 11, width: 22, height: 22, fill: 'none', stroke: tone.dot, 'stroke-width': 2, class: 'px' }),
      [[0, { opacity: 0.8 }], [0.5, { opacity: 0.1 }, 'step']], { period: 1 });
    s.add(during(s, g({}, ping), [[land, next]]));
  }

  const body = g({},
    el('rect', { x: x - 6, y: DY - 6, width: 12, height: 12, fill: tone.dot, class: 'px' }),
    s.text(tone.label, { x: x - 6, y: DY + 28, font: 'semi', size: 10, fill: tone.text, spacing: 1 }),
    s.text(clockText(from), { x: x - 6, y: DY + 43, font: 'mono', size: 10, fill: '#71717a' }),
  );
  s.add(s.anim(body, [
    [0, { y: -10, opacity: 0 }],
    [land, { opacity: 0 }, 'step'],
    [land + 0.3, { y: 0, opacity: 1 }, 'back'],
    [RESET, { opacity: 1 }],
    [RESET + 0.5, { opacity: 0 }],
  ]));
}

// The totals above the dots, adding up as the task goes: what claude-code
// has worked, then the blocked and needs-input time, and start to close.
const CH = 6.6;                            // one mono character at 11 px
function totals(s) {
  const x0 = BX + 34;
  const y = TOT_Y;
  const word = (text, x, fill, spans) => s.add(during(s, s.text(text, { x, y, font: 'mono', size: 11, fill }), spans));

  // claude-code working, its minutes ticking while it is ongoing.
  const working = 'CLAUDE-CODE WORKING ';
  const worked = 'CLAUDE-CODE WORKED ';
  word(working, x0, '#71717a', [[PICK, CLOSE]]);
  word(worked, x0, '#71717a', [[CLOSE, RESET + 0.5]]);
  const ongoing = DOTS.map(([st, m], i) => [st, m, DOTS[i + 1]?.[1]]).filter(([st]) => st === 'ongoing');
  const workedBy = (min) => ongoing.reduce((sum, [, a, b]) => sum + Math.max(0, Math.min(min, b) - a), 0);
  let shown = -1;
  const ticks = [];
  for (let m = 2; m <= 21; m++) {
    const w = workedBy(m);
    if (w !== shown) { ticks.push([m, w]); shown = w; }
  }
  ticks.forEach(([m, w], k) => {
    const from = m === 2 ? PICK : secAt(m);
    const to = k + 1 < ticks.length ? secAt(ticks[k + 1][0]) : RESET + 0.5;
    const x = x0 + ((m < 21 ? working : worked).length + 0.5) * CH;
    word(minutes(w).toUpperCase(), x, C.text, [[from, to]]);
  });

  // Each figure takes its place once its stretch is over: needs input first,
  // then blocked goes before it, as the app orders them.
  const after = x0 + (worked.length + 5) * CH;
  const blockedText = '· BLOCKED ';
  const needsText = '· NEEDS INPUT ';
  const pair = (label, value, x, fill, spans) => {
    word(label, x, '#71717a', spans);
    word(value, x + (label.length + 0.5) * CH, fill, spans);
  };
  const blockedW = (blockedText.length + 4) * CH;
  const needsW = (needsText.length + 4) * CH;
  pair(needsText, '2M', after, '#facc15', [[ALLOW, SEND]]);
  pair(blockedText, '3M', after, '#f87171', [[SEND, RESET + 0.5]]);
  pair(needsText, '2M', after + blockedW, '#facc15', [[SEND, RESET + 0.5]]);
  pair('· START→CLOSE ', '19M', after + blockedW + needsW, C.text, [[CLOSE + 0.3, RESET + 0.5]]);
}

// A card in the conversation, sliding up when it arrives.
function card(s, parts, from, to, bar) {
  const { x, y, w, h } = CARD;
  s.add(s.anim(g({},
    el('rect', { width: w, height: h, fill: C.card, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    el('rect', { width: 4, height: h, fill: bar, class: 'px' }),
    ...parts,
  ), [
    [0, { x, y: y + 12, opacity: 0 }],
    [from, { opacity: 0 }, 'step'],
    [from + 0.3, { y, opacity: 1 }, 'out'],
    [to, { opacity: 1 }],
    [to + 0.3, { opacity: 0 }],
  ]));
}

// claude's permission request, open until you allow it.
const ALLOW_BTN = { x: CARD.w - 196, y: 40, w: 84 };
function permission(s) {
  const { x: bx, y: by, w: bw } = ALLOW_BTN;
  card(s, [
    s.text('claude wants to run', { x: 18, y: 24, font: 'semi', size: 13, fill: C.text }),
    el('rect', { x: 18, y: 36, width: 260, height: 28, fill: C.bg, class: 'px' }),
    s.text('$ psql -f migrate.sql', { x: 28, y: 55, font: 'mono', size: 13, fill: '#facc15' }),
    el('rect', { x: bx, y: by, width: bw, height: 24, fill: C.text, class: 'px' }),
    s.anim(el('rect', { x: bx, y: by, width: bw, height: 24, fill: C.ongoing, class: 'px' }),
      [[0, { opacity: 0 }], [ALLOW - 0.15, { opacity: 0.8 }, 'step'], [ALLOW, { opacity: 0 }, 'step']]),
    s.text('Allow', { x: bx + bw / 2, y: by + 17, font: 'semi', size: 13, fill: C.ink, anchor: 'middle' }),
    el('rect', { x: bx + bw + 12, y: by, width: bw, height: 24, fill: 'none', stroke: '#3f3f46', 'stroke-width': 2, class: 'px' }),
    s.text('Deny', { x: bx + bw * 1.5 + 12, y: by + 17, font: 'semi', size: 13, fill: C.dim, anchor: 'middle' }),
  ], ASK, ALLOW + 0.2, '#facc15');
}

// claude's blocked message, and your answer typed and sent.
const REPLY = 'Added it to .env';
const SEND_BTN = { x: CARD.w - 96, y: 40, w: 80 };
function blocked(s) {
  const { x: bx, y: by, w: bw } = SEND_BTN;
  const typed = [[TYPE, 'Added'], [TYPE + 0.35, 'Added it to'], [TYPE + 0.7, REPLY]];
  card(s, [
    s.text('claude: I need the staging database password.', { x: 18, y: 24, font: 'semi', size: 13, fill: C.text }),
    el('rect', { x: 18, y: 36, width: bx - 30, height: 28, fill: C.bg, stroke: '#3f3f46', 'stroke-width': 1, class: 'px' }),
    during(s, s.text('Reply…', { x: 28, y: 55, font: 'body', size: 13, fill: '#52525b' }), [[0, TYPE]]),
    ...typed.map(([t, text], k) => during(s, s.text(text, { x: 28, y: 55, font: 'body', size: 13, fill: C.text }),
      [[t, k + 1 < typed.length ? typed[k + 1][0] : 24]])),
    el('rect', { x: bx, y: by, width: bw, height: 24, fill: C.text, class: 'px' }),
    s.anim(el('rect', { x: bx, y: by, width: bw, height: 24, fill: C.ongoing, class: 'px' }),
      [[0, { opacity: 0 }], [SEND - 0.15, { opacity: 0.8 }, 'step'], [SEND, { opacity: 0 }, 'step']]),
    s.text('Send', { x: bx + bw / 2, y: by + 17, font: 'semi', size: 13, fill: C.ink, anchor: 'middle' }),
  ], BLOCK, SEND + 0.2, C.blocked);
}

// claude's closing message, under the finished timeline.
function finished(s) {
  card(s, [
    s.text('claude: Done. 3 columns renamed, 12,480 rows backfilled.', { x: 18, y: 24, font: 'semi', size: 13, fill: C.text }),
    s.text('Migration ran on staging; every test passes.', { x: 18, y: 50, font: 'body', size: 12, fill: '#71717a' }),
  ], CLOSE + 0.2, RESET, C.done);
}

// claude: told of the task, working, asking, blocked, done, dancing.
function agent(s) {
  mascot(s, CLAUDE, 0, {
    x: 810,
    hops: [[NEW, 8], [PICK, 14], [ALLOW, 14], [SEND, 14], [CLOSE, 22], [DANCE, 16], [DANCE + 0.9, 16], [DANCE + 1.8, 16]],
    alert: [[NEW, PICK], [BLOCK, SEND]],
    work: [[PICK + 0.2, ASK], [ALLOW + 0.2, BLOCK], [SEND + 0.2, CLOSE]],
    ask: [[ASK, ALLOW]],
    done: [[CLOSE, RESET]],
  });
}

// You: Allow on claude's request, then the reply box and Send.
function pointer(s) {
  const allow = { x: CARD.x + ALLOW_BTN.x + 50, y: CARD.y + ALLOW_BTN.y + 14 };
  const box = { x: CARD.x + 260, y: CARD.y + 52 };
  const send = { x: CARD.x + SEND_BTN.x + 46, y: CARD.y + SEND_BTN.y + 14 };
  cursor(s, [
    [0, OFF],
    [ALLOW - 1, OFF],
    [ALLOW - 0.2, allow, 'inOut'],
    ...press(ALLOW, allow),
    [ALLOW + 0.4, allow],
    [ALLOW + 1, OFF, 'inOut'],
    [TYPE - 0.9, OFF],
    [TYPE - 0.2, box, 'inOut'],
    ...press(TYPE, box),
    [SEND - 0.6, box],
    [SEND - 0.2, send, 'inOut'],
    ...press(SEND, send),
    [SEND + 0.4, send],
    [SEND + 1, OFF, 'inOut'],
  ]);
}
