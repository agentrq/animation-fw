// AgentRQ's scheduled tasks: set a cadence once, and the poller spawns each
// run on time while every agent sleeps.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, OFF, PX, LOOP, newScene, sky, ground, intro, frame, button, mascot, mascotX, cursor, press, during,
} from '../kit/agentrq.js';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop. The poller ticks once a
// minute; here a minute passes every TICK seconds, from 08:50 on.
const TICK = 0.6;
const START = 8 * 60 + 50;
const at = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return +((h * 60 + m - START) * TICK).toFixed(2);
};
const ADD = 1;                             // you click + New task
const PICK = 2.2;                          // you pick Every 15 mins
const SAVE = 3.2;                          // you click Save
const FIRE = [at('09:00'), at('09:15')];   // runs come due
const FLY = 1.2;                           // a run's card reaches its agent
const RESET = 22.6;

// ---------------------------------------------------------------- the panel
const BX = 440;
const BY = 20;
const BW = 500;
const rowY = (r) => BY + 66 + r * 62;
const CARD_W = 150;
const CARD_H = 34;

// The Scheduled list. Each run goes to the row's agent; next is every
// next-run label the row shows, from the second it rolls forward.
const ROWS = [
  { title: 'Nightly backup', agent: 'hermes', cadence: 'Daily 02:00', next: [[0, 'Oct 27 02:00']], runs: [] },
  { title: 'Weekly report', agent: 'claude', cadence: 'Weekly Mon 09:00', next: [[0, 'Oct 26 09:00'], [FIRE[0], 'Nov 2 09:00']], runs: [FIRE[0]] },
  { title: 'Triage issues', agent: 'openclaw', cadence: 'Every 15 mins', next: [[0, 'Oct 26 09:00'], [FIRE[0], 'Oct 26 09:15'], [FIRE[1], 'Oct 26 09:30']], runs: FIRE, added: SAVE + 0.2 },
];

// How long each agent works on a run.
const WORK = { claude: 3.2, openclaw: 2.4 };

// Each agent's runs: [arrives, done].
const RUNS = MASCOTS.map((m) => ROWS.filter((r) => r.agent === m.name)
  .flatMap((r) => r.runs.map((t) => [t + FLY, t + FLY + 0.7 + WORK[m.name]])));

// ---------------------------------------------------------------- the clock
const CX = 1072;
const CY = 124;
const R = 23;                              // in 4 px cells
const CELL = 4;

export default function taskScheduling() {
  const s = newScene({
    poster: FIRE[0] + 0.8,
    description: 'AgentRQ task scheduling: you give a task a cadence, every 15 minutes, and click Save. A poller ticks every minute while five agents, claude, codex, agy, hermes and openclaw, sleep; when a scheduled task comes due its row flashes and a run flies down to its agent, which wakes, works and finishes, and the next run rolls forward.',
  });

  sky(s);
  ground(s);
  story(s);
  panel(s);
  ROWS.forEach((r, i) => row(s, r, i));
  clock(s);
  ROWS.forEach((r, i) => r.runs.forEach((t) => card(s, r, i, t)));
  MASCOTS.forEach((m, i) => agent(s, m, i));
  picker(s);
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'scheduling',
    headline: ['Set it once,', 'it runs on time.'],
    sub: 'Dates and cadences, nobody waiting up.',
    steps: [['schedule', ADD, SAVE + 0.8], ['tick', SAVE + 0.8, FIRE[0]], ['spawn', FIRE[0], RUNS[0][0][1]], ['done', RUNS[0][0][1], RESET]],
    log: [
      [0, ADD, '> poller: tick', C.cron],
      [ADD, SAVE + 0.2, '> you: every 15 mins'],
      [SAVE + 0.2, FIRE[0], '> next run 09:00'],
      [FIRE[0], FIRE[0] + FLY, '> due: 2 tasks at 09:00', C.cron],
      [FIRE[0] + FLY, RUNS[0][0][1], '> claude, openclaw: on it'],
      [RUNS[0][0][1], FIRE[1], '> next run 09:15'],
      [FIRE[1], FIRE[1] + FLY, '> due: Triage issues', C.cron],
      [FIRE[1] + FLY, RUNS[4][1][1], '> openclaw: on it'],
      [RUNS[4][1][1], RESET, '> on time, nobody waited'],
    ],
  });
}

function panel(s) {
  frame(s, { x: BX, y: BY, w: BW, h: 272, title: 'Scheduled' });
  button(s, { x: BX + BW - 116, y: BY + 9, w: 104, label: '+ New task', clicks: [ADD] });
  for (const [label, x] of [['Task', 24], ['Cadence', 190], ['Next run', 370]]) {
    s.add(s.text(label, { x: BX + x, y: BY + 56, font: 'semi', size: 12, fill: C.dim }));
  }
}

function chip(s, label, { x, y, on }) {
  const w = label.length * 7 + 14;
  return g({},
    el('rect', { x, y, width: w, height: 20, fill: on ? '#0b2a30' : C.column, stroke: on ? C.cron : C.line, 'stroke-width': 1, class: 'px' }),
    s.text(label, { x: x + w / 2, y: y + 14, font: 'mono', size: 11, fill: on ? C.cron : C.dim, anchor: 'middle' }));
}

// A row of the list, with its cadence and next run; it flashes cyan as each
// run comes due.
function row(s, r, i) {
  const m = MASCOTS.find((x) => x.name === r.agent);
  const y = rowY(i);
  const parts = [
    el('rect', { x: BX + 10, y, width: BW - 20, height: 54, fill: C.card, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    el('rect', { x: BX + 10, y, width: 4, height: 54, fill: C.cron, class: 'px' }),
    s.text(r.title, { x: BX + 24, y: y + 23, font: 'semi', size: 13, fill: C.text }),
    el('rect', { x: BX + 24, y: y + 32, width: 6, height: 6, fill: m.color, class: 'px' }),
    s.text(m.name, { x: BX + 34, y: y + 39, font: 'mono', size: 10, fill: C.dim }),
    chip(s, r.cadence, { x: BX + 190, y: y + 17, on: true }),
    ...r.next.map(([from], k) => {
      const to = r.next[k + 1]?.[0] ?? LOOP;
      return during(s, s.text(r.next[k][1], { x: BX + 370, y: y + 32, font: 'mono', size: 12, fill: C.text }), [[from === 0 ? 0 : from + 0.3, to === LOOP ? LOOP : to + 0.3]]);
    }),
  ];
  if (r.runs.length) {
    parts.push(s.anim(el('rect', { x: BX + 10, y, width: BW - 20, height: 54, fill: C.cron, class: 'px' }),
      [[0, { opacity: 0 }], ...r.runs.flatMap((t) => [[t, { opacity: 0.35 }, 'step'], [t + 0.2, { opacity: 0 }, 'step'], [t + 0.35, { opacity: 0.35 }, 'step'], [t + 0.55, { opacity: 0 }, 'step']])]));
  }
  if (r.added) {
    s.add(s.anim(g({}, parts), [[0, { x: 40, opacity: 0 }], [r.added, { opacity: 0 }, 'step'], [r.added + 0.4, { x: 0, opacity: 1 }, 'out'], [RESET, { opacity: 1 }], [RESET + 0.5, { opacity: 0 }]]));
  } else s.add(g({}, parts));
}

// A run of a row's task: it pops out of the row and flies down to its agent.
function card(s, r, i, t) {
  const m = MASCOTS.find((x) => x.name === r.agent);
  const mi = MASCOTS.indexOf(m);
  const from = { x: BX + 300, y: rowY(i) + 10 };
  const to = { x: mascotX(mi) - CARD_W * 0.35, y: 296 };
  const parts = [
    el('rect', { width: CARD_W, height: CARD_H, fill: C.card, stroke: C.cron, 'stroke-width': 1, class: 'px' }),
    el('rect', { width: 4, height: CARD_H, fill: C.cron, class: 'px' }),
    s.text(r.title, { x: 12, y: 15, font: 'semi', size: 12, fill: C.text }),
    el('rect', { x: 12, y: 21, width: 6, height: 6, fill: m.color, class: 'px' }),
    s.text(m.name, { x: 22, y: 28, font: 'mono', size: 10, fill: C.dim }),
  ];
  s.add(s.anim(g({}, parts), [
    [0, { ...from, scale: 0.6, opacity: 0 }],
    [t, { opacity: 0 }, 'step'],
    [t + 0.3, { x: from.x, y: from.y - 14, scale: 1, opacity: 1 }, 'back'],
    [t + 0.4, {}],
    [t + FLY, { ...to, scale: 0.7 }, 'inOut'],
    [t + FLY + 0.25, { opacity: 0 }],
  ]));
}

// The clock: a pixel ring, the hour marks, and hands that step on each tick.
function clock(s) {
  const n = R * 2 + 1;
  const rows = [];
  for (let y = 0; y < n; y++) {
    let line = '';
    for (let x = 0; x < n; x++) {
      const d = Math.hypot(x - R, y - R);
      line += d <= R + 0.3 && d > R - 1.7 ? '#' : d <= R - 1.7 ? 'f' : '.';
    }
    rows.push(line);
  }
  s.add(sprite(rows, { '#': '#52525b', f: C.panel }, { px: CELL, x: CX - R * CELL - CELL / 2, y: CY - R * CELL - CELL / 2 }));
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * 2 * Math.PI;
    const big = h % 3 === 0;
    const w = big ? 8 : 4;
    s.add(el('rect', {
      x: Math.round(CX + Math.sin(a) * (R - 4) * CELL - w / 2), y: Math.round(CY - Math.cos(a) * (R - 4) * CELL - w / 2),
      width: w, height: w, fill: big ? C.text : C.dim, class: 'px',
    }));
  }

  const ticks = Array.from({ length: LOOP / TICK }, (_, k) => +(k * TICK).toFixed(2));
  const hand = (len, w, fill, deg) => s.anim(
    el('rect', { x: -w / 2, y: -len, width: w, height: len + w / 2, fill, class: 'px' }),
    ticks.map((t, k) => [t, { x: CX, y: CY, rotate: deg(START + k) }, 'step']));
  const face = g({},
    hand(54, 8, C.dim, (min) => ((min / 60) % 12) * 30),
    hand(76, 6, C.text, (min) => (min % 60) * 6),
    el('rect', { x: CX - 6, y: CY - 6, width: 12, height: 12, fill: C.cron, class: 'px' }),
    ticks.map((t, k) => {
      const min = START + k;
      const hhmm = `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
      return during(s, s.text(hhmm, { x: CX, y: CY + R * CELL + 44, font: 'pixel', size: 28, fill: C.text, anchor: 'middle' }), [[t, +(t + TICK).toFixed(2)]]);
    }));
  // The loop starts again at 08:50, so the hands fade out over the turn.
  s.add(s.anim(face, [[0, { opacity: 0 }], [0.3, { opacity: 1 }], [RESET + 0.4, { opacity: 1 }], [RESET + 0.9, { opacity: 0 }]]));

  // Each poller tick, a small flash.
  s.add(s.anim(s.text('tick', { x: CX + R * CELL - 6, y: CY - R * CELL + 14, font: 'pixel', size: 12, fill: C.cron }),
    [[0, { opacity: 1 }], [0.2, { opacity: 0 }, 'step']], { period: TICK }));
  s.add(s.text('Mon Oct 26 · poller, every minute', { x: CX, y: CY + R * CELL + 68, font: 'mono', size: 11, fill: C.dim, anchor: 'middle' }));
}

// Asleep but for its runs: eyes shut and a zZ now and then, then woken by
// each run (!), working (...) and done (tick).
function agent(s, m, i) {
  const runs = RUNS[i];
  const awake = runs.map(([arrive, done]) => [arrive, done + 1.6]);
  const sleep = [];
  let from = 0;
  for (const [a, b] of awake) { sleep.push([from, a]); from = b; }
  sleep.push([from, LOOP]);
  const zz = sleep.flatMap(([a, b]) => {
    const out = [];
    for (let t = a + 0.4 + (i * 0.5) % 2; t + 1.6 <= b; t += 2.4) out.push([+t.toFixed(2), +(t + 1.6).toFixed(2)]);
    return out;
  });
  mascot(s, m, i, {
    sleep,
    say: [['zZ', zz, C.dim]],
    hops: runs.flatMap(([arrive, done]) => [[arrive, 14], [done, 22]]),
    alert: runs.map(([arrive]) => [arrive, arrive + 0.7]),
    work: runs.map(([arrive, done]) => [arrive + 0.7, done]),
    done: runs.map(([, done]) => [done, done + 1.6]),
  });
}

// The schedule picker you open with + New task: Repeated, Every 15 mins,
// and the next run it previews.
const POP = { x: BX + BW - 312, y: BY + 40, w: 300, h: 150 };
const PICK_AT = { x: POP.x + 12, y: POP.y + 80 };
const SAVE_AT = { x: POP.x + POP.w - 76, y: POP.y + 116, w: 64 };

function picker(s) {
  const { x, y, w, h } = POP;
  const tabs = ['None', 'One-time', 'Repeated'];
  const tw = (w - 24) / 3;
  let cx = PICK_AT.x;
  const chips = ['Every 15 mins', 'Hourly', 'Daily', 'Weekly'].map((label, k) => {
    const c = { x: cx, y: PICK_AT.y };
    cx += label.length * 7 + 14 + 6;
    return k === 0
      ? g({}, chip(s, label, { ...c, on: false }), s.anim(chip(s, label, { ...c, on: true }), [[0, { opacity: 0 }], [PICK, { opacity: 1 }, 'step']]))
      : chip(s, label, { ...c, on: false });
  });
  const parts = [
    el('rect', { x, y, width: w, height: h, fill: C.bg, stroke: C.dim, 'stroke-width': 2, class: 'px' }),
    el('rect', { x: x + 12, y: y + 12, width: w - 24, height: 26, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    s.text('Triage issues', { x: x + 22, y: y + 30, font: 'semi', size: 13, fill: C.text }),
    el('rect', { x: x + 12, y: y + 46, width: w - 24, height: 24, fill: C.column, class: 'px' }),
    el('rect', { x: x + 14 + 2 * tw, y: y + 48, width: tw - 4, height: 20, fill: C.card, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    tabs.map((t, k) => s.text(t, { x: x + 12 + tw * k + tw / 2, y: y + 62, font: 'semi', size: 11, fill: k === 2 ? C.text : C.dim, anchor: 'middle' })),
    chips,
    during(s, s.text('----', { x: x + 12, y: y + 132, font: 'mono', size: 11, fill: C.dim }), [[0, PICK]]),
    during(s, g({},
      s.text('*/15 * * * *', { x: x + 12, y: y + 132, font: 'mono', size: 11, fill: C.dim }),
      s.text('In 7 mins', { x: x + 118, y: y + 132, font: 'semi', size: 11, fill: C.cron })), [[PICK, LOOP]]),
    el('rect', { x: SAVE_AT.x, y: SAVE_AT.y, width: SAVE_AT.w, height: 24, fill: C.text, class: 'px' }),
    s.anim(el('rect', { x: SAVE_AT.x, y: SAVE_AT.y, width: SAVE_AT.w, height: 24, fill: C.ongoing, class: 'px' }),
      [[0, { opacity: 0 }], [SAVE - 0.15, { opacity: 0.8 }, 'step'], [SAVE, { opacity: 0 }, 'step']]),
    s.text('Save', { x: SAVE_AT.x + SAVE_AT.w / 2, y: SAVE_AT.y + 17, font: 'semi', size: 13, fill: C.ink, anchor: 'middle' }),
  ];
  s.add(during(s, g({}, parts), [[ADD + 0.15, SAVE + 0.15]]));
}

// You: + New task, Every 15 mins, Save; then you leave it to the poller.
function pointer(s) {
  const btn = { x: BX + BW - 70, y: BY + 22 };
  const pick = { x: PICK_AT.x + 40, y: PICK_AT.y + 12 };
  const save = { x: SAVE_AT.x + 34, y: SAVE_AT.y + 14 };
  cursor(s, [
    [0, OFF],
    [0.2, OFF],
    [ADD - 0.2, btn, 'inOut'],
    ...press(ADD, btn),
    [PICK - 0.6, btn],
    [PICK - 0.1, pick, 'inOut'],
    ...press(PICK, pick),
    [SAVE - 0.6, pick],
    [SAVE - 0.1, save, 'inOut'],
    ...press(SAVE, save),
    [SAVE + 0.4, save],
    [SAVE + 1.1, OFF, 'inOut'],
  ]);
}
