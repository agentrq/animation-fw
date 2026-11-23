// A task tracker for agents: a supervisor files 120 tasks at once, five
// agents work them while every count moves live, they share what they learn
// through workspace memory, and one asks you a question in its thread.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, OFF, newScene, sky, ground, intro, frame, mascot, cursor, press,
} from '../kit/agentrq.js';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop. Each beat owns a span.
const B = [0.3, 6.4, 12.0, 16.6, 22.4];
const FADE = 0.25;
const BURST = 0.8;          // claude starts filing tasks
const FILED = 3.0;          // all 120 are on the board
const ASK = 16.9;           // hermes blocks on a question
const SEND = 18.3;          // you click Send
const ALL_DONE = 19.6;
const DANCE = 20.4;
const RESET = 22.6;
const TOTAL = 120;

// ---------------------------------------------------------------- the stage
const BX = 440;
const BY = 20;
const BW = 740;
const COLS = ['Not Started', 'Ongoing', 'Blocked', 'Done'];
const COL_DOT = [C.notstarted, C.ongoing, C.blocked, C.done];
const colX = (c) => BX + 10 + c * 122;
const COL_W = 116;
const ROWS = 9;
const rowY = (k) => BY + 76 + k * 17;
const PX0 = BX + 504;       // the side panel
const PW = 226;

// The board's counts over the loop: [second, notStarted, ongoing, blocked, done].
function counts() {
  const st = [[0, 0, 0, 0, 0]];
  for (let k = 1; k <= 12; k++) st.push([+(BURST + 0.18 * k).toFixed(2), 10 * k, 0, 0, 0]);
  let [ns, on, bl, dn] = [TOTAL - 5, 5, 0, 0];
  st.push([B[1] + 0.2, ns, on, bl, dn]);
  const step = (t) => { ns -= 4; dn += 4; st.push([+t.toFixed(2), ns, on, bl, dn]); };
  for (let t = 7.0; t < B[2]; t += 0.45) step(t);
  for (let t = B[2] + 0.4; t < B[3]; t += 0.6) step(t);
  on = 4; bl = 1; st.push([ASK, ns, on, bl, dn]);
  for (let t = 17.3; t < SEND; t += 0.5) step(t);
  on = 5; bl = 0; st.push([SEND + 0.1, ns, on, bl, dn]);
  // The last ones land quickly.
  const left = ns + on;
  for (let k = 1; k <= 6; k++) {
    const done = TOTAL - Math.round(left * (6 - k) / 6);
    const rest = TOTAL - done;
    st.push([+(SEND + 0.1 + 0.2 * k).toFixed(2), Math.max(0, rest - 5), Math.min(5, rest), 0, done]);
  }
  st.push([RESET, 0, 0, 0, 0]);
  return st;
}
const STATES = counts();

// What every mascot does over the loop.
const ACTS = Object.fromEntries(MASCOTS.map((m) => [m.name, { hops: [], alert: [], work: [], ask: [], done: [] }]));

const appear = (s, node, t, until) => s.anim(node, until
  ? [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step'], [until, { opacity: 0 }, 'step']]
  : [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step']]);

// A beat's content fades in at its start and out at its end.
function beat(s, i, nodes) {
  const [from, to] = [B[i], B[i + 1]];
  s.add(s.anim(g({}, nodes), [[0, { opacity: 0 }], [from, { opacity: 0 }], [from + FADE, { opacity: 1 }], [to - FADE, { opacity: 1 }], [to, { opacity: 0 }]]));
}

const box = (x, y, w, h, fill = C.column, stroke) => el('rect', { x, y, width: w, height: h, fill, stroke, 'stroke-width': stroke ? 2 : undefined, class: 'px' });

// A small square that runs from one point to another, once.
const pulse = (s, t, [x0, y0], [x1, y1], { fill = C.lit, dur = 0.6 } = {}) => s.anim(
  el('rect', { x: -4, y: -4, width: 8, height: 8, fill, class: 'px' }),
  [[0, { x: x0, y: y0, opacity: 0 }], [t, { x: x0, y: y0, opacity: 1 }, 'step'], [t + dur, { x: x1, y: y1 }, 'inOut'], [t + dur + 0.05, { opacity: 0 }, 'step']]);

export default function taskTracker() {
  const s = newScene({
    poster: 20.2,
    description: 'A task tracker for agents: claude, as supervisor, files 120 tasks in a burst; codex, agy, hermes and openclaw pick them up while every column count on the board moves live; codex saves a lesson to workspace memory and the others load it; hermes asks you a question in its task thread, you answer, and all 120 tasks land in Done as the agents celebrate.',
  });

  sky(s);
  ground(s);
  story(s);
  board(s);
  panel(s);
  plan();
  for (const [i, m] of MASCOTS.entries()) {
    const acts = ACTS[m.name];
    acts.hops.push([DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]);
    mascot(s, m, i, acts);
  }
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'task tracker',
    headline: ['A task tracker', 'for agents.'],
    sub: 'Fast, live, shared and direct.',
    steps: [['burst', B[0], B[1]], ['live', B[1], B[2]], ['share', B[2], B[3]], ['talk', B[3], B[4]]],
    log: [
      [0, BURST, '> waiting for work_'],
      [BURST, FILED + 0.1, '> claude: splitting the release'],
      [FILED + 0.1, B[1], '> 120 tasks filed at once'],
      [B[1], B[2], '> 5 agents, every move live'],
      [B[2], B[3], '> codex saved it, all read it'],
      [B[3], SEND, '> hermes: drop the table?', C.ask],
      [SEND, ALL_DONE, '> you: keep it one release'],
      [ALL_DONE, RESET, '> 120 of 120 done'],
    ],
  });
}

// The board: four columns whose counts and rows follow STATES.
function board(s) {
  frame(s, { x: BX, y: BY, w: BW, h: 272, title: 'All workspaces' });

  // A live dot that pulses, as the app's realtime connection.
  s.add(s.anim(el('rect', { x: BX + BW - 64, y: BY + 17, width: 8, height: 8, fill: C.ongoing, class: 'px' }),
    [[0, { opacity: 1 }], [0.5, { opacity: 0.3 }, 'step'], [1, { opacity: 1 }, 'step']], { period: 1 }));
  s.add(s.text('LIVE', { x: BX + BW - 50, y: BY + 26, font: 'pixel', size: 16, fill: C.lit }));

  COLS.forEach((title, c) => {
    const x = colX(c);
    s.add(box(x, BY + 44, COL_W, 220));
    s.add(el('rect', { x: x + 8, y: BY + 56, width: 6, height: 6, fill: COL_DOT[c], class: 'px' }));
    s.add(s.text(title, { x: x + 19, y: BY + 63, font: 'semi', size: 11, fill: C.dim }));

    // The count, one text per state it changes in.
    const spans = [];
    STATES.forEach((st, k) => {
      const n = st[1 + c];
      const prev = spans.at(-1);
      if (prev && prev.n === n) return;
      if (prev) prev.to = st[0];
      spans.push({ n, from: st[0], to: 24 });
    });
    for (const { n, from, to } of spans) {
      if (to <= from) continue;
      s.add(s.anim(s.text(String(n), { x: x + COL_W - 8, y: BY + 63, font: 'mono', size: 11, fill: n ? C.text : C.notstarted, anchor: 'end' }),
        from === 0 ? [[0, { opacity: 1 }], [to, { opacity: 0 }, 'step']]
          : [[0, { opacity: 0 }], [from, { opacity: 1 }, 'step'], [to, { opacity: 0 }, 'step']]));
    }

    // Rows: slot k shows while the column holds more than k tasks. Each
    // flashes white the moment it fills.
    for (let k = 0; k < ROWS; k++) {
      const keys = [[0, { opacity: 0 }]];
      let shown = false;
      for (const st of STATES) {
        const want = st[1 + c] > k;
        if (want !== shown) { keys.push([st[0], { opacity: want ? 1 : 0 }, 'step']); shown = want; }
      }
      const y = rowY(k);
      s.add(s.anim(g({},
        el('rect', { x: x + 6, y, width: COL_W - 12, height: 13, fill: C.card, class: 'px' }),
        el('rect', { x: x + 6, y, width: 3, height: 13, fill: COL_DOT[c], class: 'px' }),
        el('rect', { x: x + 14, y: y + 5, width: 30 + ((k * 17 + c * 11) % 40), height: 3, fill: '#52525b', class: 'px' })), keys));
    }

    // "+N more" under the rows, for each state that overflows.
    STATES.forEach((st, k) => {
      const n = st[1 + c];
      if (n <= ROWS) return;
      const to = STATES[k + 1]?.[0] ?? 24;
      const prev = STATES[k - 1]?.[1 + c];
      if (prev === n && k > 0) return;
      let end = to;
      for (let j = k + 1; j < STATES.length && STATES[j][1 + c] === n; j++) end = STATES[j + 1]?.[0] ?? 24;
      s.add(appear(s, s.text(`+${n - ROWS} more`, { x: x + 8, y: BY + 254, font: 'mono', size: 11, fill: C.dim }), st[0], end));
    });
  });
}

// The side panel, whose content changes with each beat.
function panel(s) {
  s.add(box(PX0, BY + 44, PW, 220));
  const head = (t) => s.text(t, { x: PX0 + 12, y: BY + 66, font: 'pixel', size: 16, fill: C.dim });
  const line = (txt, k, fill = C.dim, y0 = BY + 92) => s.text(txt, { x: PX0 + 12, y: y0 + k * 20, font: 'mono', size: 12, fill });

  // 01: claude, connected as supervisor, files tasks in a burst.
  const filed = ['Fix pkg/auth tests', 'Port billing to v2', 'Add cursor paging', 'Rename user_id', 'Drop old flags', 'Doc the new API'];
  beat(s, 0, [
    head('supervisor'),
    s.text('claude', { x: PX0 + PW - 12, y: BY + 66, font: 'mono', size: 12, fill: MASCOTS[0].color, anchor: 'end' }),
    ...filed.map((t, k) => appear(s, line(`+ ${t}`, k, C.text), BURST + 0.3 * k)),
    appear(s, line(`${TOTAL} tasks filed`, 6.6, C.lit), FILED),
  ]);
  ACTS.claude.work.push([BURST, FILED]);
  ACTS.claude.hops.push([FILED, 14]);
  ACTS.claude.done.push([FILED + 0.2, B[1]]);

  // 02: the workers take tasks, and every change streams in.
  const feed = [
    ['codex', 'ongoing', C.ongoing], ['agy', 'ongoing', C.ongoing], ['hermes', 'ongoing', C.ongoing],
    ['openclaw', 'ongoing', C.ongoing], ['codex', 'done', C.lit], ['agy', 'done', C.lit],
    ['hermes', 'done', C.lit], ['openclaw', 'done', C.lit],
  ];
  beat(s, 1, [
    head('live feed'),
    ...feed.map(([who, st, fill], k) => appear(s, g({},
      line(who, k, MASCOTS.find((m) => m.name === who).color),
      s.text(`-> ${st}`, { x: PX0 + 104, y: BY + 92 + k * 20, font: 'mono', size: 12, fill })), B[1] + 0.3 + 0.6 * k)),
  ]);
  MASCOTS.slice(1).forEach((m, i) => {
    ACTS[m.name].alert.push([FILED + 0.2 + 0.15 * i, B[1] + 0.2]);
    ACTS[m.name].hops.push([B[1] + 0.2 + 0.15 * i, 14]);
  });

  // 03: codex learns something and saves it; the others load it.
  const T = B[2];
  beat(s, 2, [
    head('memory.md'),
    line('- use pnpm, not npm', 0),
    line('- staging DB is read-only', 1),
    appear(s, g({}, box(PX0 + 6, BY + 121, PW - 12, 22, '#14532d'),
      line('+ api v2 pages by cursor', 2, C.lit)), T + 0.8),
    pulse(s, T + 0.4, [mascotXOf('codex'), 330], [PX0 + 12, BY + 132]),
    appear(s, line('codex saved a memory', 4.3, C.text), T + 0.9),
    ...['agy', 'hermes', 'openclaw', 'claude'].map((who, k) => appear(s, g({},
      line(who, 5.3 + k, MASCOTS.find((m) => m.name === who).color),
      s.text('loaded', { x: PX0 + 104, y: BY + 92 + (5.3 + k) * 20, font: 'mono', size: 12, fill: C.dim })), T + 1.8 + 0.4 * k)),
  ]);
  ACTS.codex.hops.push([T + 0.3, 16]);
  ['agy', 'hermes', 'openclaw', 'claude'].forEach((who, k) => ACTS[who].hops.push([T + 1.8 + 0.4 * k, 10]));

  // 04: hermes asks in its task thread; you answer from the board.
  beat(s, 3, [
    head('task thread'),
    s.text('Migrate users table', { x: PX0 + 12, y: BY + 90, font: 'semi', size: 12, fill: C.text }),
    appear(s, g({},
      line('hermes: drop the legacy', 1.4, C.ask),
      line('table now, or keep it', 2.4, C.ask),
      line('for one release?', 3.4, C.ask)), ASK + 0.1),
    appear(s, g({}, box(PX0 + 12, BY + 182, 150, 24, C.card, C.line),
      s.text('keep it one release', { x: PX0 + 18, y: BY + 198, font: 'mono', size: 11, fill: C.text })), SEND - 1.0, SEND),
    appear(s, g({}, el('rect', { x: PX0 + 168, y: BY + 182, width: 46, height: 24, fill: C.text, class: 'px' }),
      s.text('Send', { x: PX0 + 191, y: BY + 199, font: 'semi', size: 12, fill: C.ink, anchor: 'middle' })), SEND - 1.0, SEND + 0.2),
    appear(s, line('you: keep it one release', 4.6, C.text), SEND + 0.1),
    appear(s, line('hermes: on it', 5.6, C.dim), SEND + 0.6),
    appear(s, line(`${TOTAL} of ${TOTAL} done`, 7.0, C.lit), ALL_DONE),
  ]);
}

const mascotXOf = (name) => 514 + MASCOTS.findIndex((m) => m.name === name) * 148;

// Work, ask and done spans for the four workers.
function plan() {
  for (const m of MASCOTS.slice(1)) {
    const a = ACTS[m.name];
    if (m.name === 'hermes') {
      a.work.push([B[1] + 0.6, ASK]);
      a.ask.push([ASK, SEND + 0.1]);
      a.hops.push([SEND + 0.1, 14]);
      a.work.push([SEND + 0.3, ALL_DONE]);
    } else if (m.name === 'codex') {
      a.work.push([B[1] + 0.6, B[2] + 0.2], [B[2] + 1.2, ALL_DONE]);
    } else {
      a.work.push([B[1] + 0.6, ALL_DONE]);
    }
    a.hops.push([ALL_DONE, 20]);
    a.done.push([ALL_DONE, RESET]);
  }
  ACTS.claude.done.push([ALL_DONE, RESET]);
  ACTS.claude.hops.push([ALL_DONE, 20]);
}

// You: one click on Send, in hermes' thread.
function pointer(s) {
  const send = { x: PX0 + 186, y: BY + 196 };
  cursor(s, [
    [0, OFF],
    [SEND - 1.2, OFF],
    [SEND - 0.4, send, 'inOut'],
    ...press(SEND, send),
    [SEND + 0.5, send],
    [SEND + 1.2, OFF, 'inOut'],
  ]);
}
