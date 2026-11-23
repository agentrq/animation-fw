// Scheduled cron agents: you give a task a Repeated schedule, it waits in
// Scheduled as a template, and on the minute it spawns a fresh run that its
// workspace's agent picks up. A run still open skips the next tick instead of
// piling up, and a finished run fires an event that starts the next workspace.
import { el, g } from '../src/index.js';
import {
  C, MASCOTS, OFF, newScene, sky, ground, intro, frame, mascot, mascotByName, cursor, press,
} from '../kit/agentrq.js';

// The app draws events in violet.
const EV = { text: '#a78bfa', bg: '#1a1528', line: '#3b2d63', lit: '#c4b5fd' };

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop. Each beat owns a span.
const B = [0.3, 6.0, 11.8, 17.2, 22.4];
const FADE = 0.25;
const PICK_REPEATED = 1.6;  // you pick Repeated
const PICK_DAILY = 2.7;     // and Daily
const CREATE = 4.3;         // and create the task
const NINE = 7.0;           // the clock reaches 09:00
const TAKE = 8.0;           // the agents take their runs
const AUDIT_DONE = 11.0;
const TEN = 12.6;           // the clock reaches 10:00
const TRIAGE_DONE = 15.6;
const NOTES_DONE = 18.0;    // fires notes_ready
const PUBLISH = 18.8;       // the deploy workspace gets its task
const SHIP_DONE = 20.2;
const DANCE = 20.6;
const RESET = 22.6;

// ---------------------------------------------------------------- the stage
const BX = 440;
const BY = 20;
const BW = 740;
const COLS = ['Scheduled', 'Not Started', 'Ongoing', 'Done'];
const COL_DOT = [C.cron, C.notstarted, C.ongoing, C.done];
const colX = (c) => BX + 10 + c * 122;
const COL_W = 116;
const CARD_W = COL_W - 12;
const CARD_H = 44;
const slotY = (k) => BY + 72 + k * 47;
const PX0 = BX + 504;       // the side panel
const PW = 226;

// Templates sit in Scheduled; each run is a card of its own.
// moves: [second, column, slot]; column -1 is off the board.
const CARDS = [
  { id: 'triage', ws: 'support', agent: 'hermes', title: 'Triage issues', tag: 'Hourly', moves: [[0, 0, 0]] },
  { id: 'notes', ws: 'docs', agent: 'agy', title: 'Release notes', tag: 'Mon 10:00', moves: [[0, 0, 1]] },
  { id: 'audit', ws: 'api', agent: 'claude', title: 'Dependency audit', tag: 'Daily 09:00', moves: [[0, -1, 2], [CREATE + 0.2, 0, 2]] },
  { id: 'r-triage', ws: 'support', agent: 'hermes', title: 'Triage issues', moves: [[0, -1, 0], [NINE, 1, 0], [TAKE, 2, 0], [AUDIT_DONE + 0.3, 2, 0], [TRIAGE_DONE, 3, 1]] },
  { id: 'r-audit', ws: 'api', agent: 'claude', title: 'Dependency audit', moves: [[0, -1, 0], [NINE + 0.3, 1, 1], [TAKE + 0.4, 2, 1], [AUDIT_DONE, 3, 0]] },
  { id: 'r-notes', ws: 'docs', agent: 'agy', title: 'Release notes', moves: [[0, -1, 0], [TEN + 0.2, 1, 0], [TEN + 1.4, 2, 1], [TRIAGE_DONE + 0.3, 2, 0], [NOTES_DONE, 3, 2]] },
  { id: 'r-ship', ws: 'deploy', agent: 'openclaw', title: 'Ship changelog', moves: [[0, -1, 0], [PUBLISH, 1, 0], [PUBLISH + 0.6, 2, 0], [SHIP_DONE, 3, 3]] },
];

// The board's column counts over the loop, from the cards' moves.
function counts() {
  const times = [...new Set(CARDS.flatMap((cd) => cd.moves.map(([t]) => t)))].sort((a, b) => a - b);
  const colAt = (moves, t) => moves.filter(([mt]) => mt <= t).at(-1)[1];
  const st = times.map((t) => [t, ...COLS.map((_, c) => CARDS.filter((cd) => colAt(cd.moves, t) === c).length)]);
  st.push([RESET, 2, 0, 0, 0]);
  return st;
}
const STATES = counts();

// The clock in the board's header.
const CLOCK = [[0, '08:58'], [3.0, '08:59'], [NINE, '09:00'], [9.6, '09:01'], [TEN - 0.8, '09:59'], [TEN, '10:00'], [15.0, '10:01'], [RESET, '08:58']];

const ACTS = Object.fromEntries(MASCOTS.map((m) => [m.name, { hops: [], alert: [], work: [], ask: [], done: [], say: [] }]));

const appear = (s, node, t, until) => s.anim(node, until
  ? [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step'], [until, { opacity: 0 }, 'step']]
  : [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step']]);

function beat(s, i, nodes) {
  const [from, to] = [B[i], B[i + 1]];
  s.add(s.anim(g({}, nodes), [[0, { opacity: 0 }], [from, { opacity: 0 }], [from + FADE, { opacity: 1 }], [to - FADE, { opacity: 1 }], [to, { opacity: 0 }]]));
}

const box = (x, y, w, h, fill = C.column, stroke) => el('rect', { x, y, width: w, height: h, fill, stroke, 'stroke-width': stroke ? 2 : undefined, class: 'px' });
const colour = (name) => mascotByName(name).color;

export default function scheduledCronAgents() {
  const s = newScene({
    poster: 21.0,
    description: 'Scheduled cron agents in AgentRQ: you give Dependency audit a Repeated, Daily 09:00 schedule and it waits in Scheduled beside an hourly Triage issues and a weekly Release notes; at 09:00 each template spawns a fresh run that claude and hermes pick up; at 10:00 the hourly triage is skipped because its 09:00 run is still open, while the weekly notes run starts for agy; when it finishes it fires notes_ready, the deploy workspace gets Ship changelog for openclaw, and every run lands in Done as the agents celebrate.',
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
    kicker: 'cron agents',
    headline: ['Agents that', 'run on time.'],
    sub: 'Repeated tasks, fresh runs, no pile-ups.',
    steps: [['schedule', B[0], B[1]], ['run', B[1], B[2]], ['skip', B[2], B[3]], ['chain', B[3], B[4]]],
    log: [
      [0, CREATE, '> you: every day at 09:00_'],
      [CREATE, NINE, '> 3 schedules waiting'],
      [NINE, TAKE, '> 09:00: 2 runs spawned', C.cron],
      [TAKE, B[2], '> claude + hermes on it'],
      [B[2], TEN, '> triage still running'],
      [TEN, TRIAGE_DONE, '> 10:00: triage skipped, no pile-up', C.ask],
      [TRIAGE_DONE, NOTES_DONE, '> agy: writing release notes'],
      [NOTES_DONE, SHIP_DONE, '> event: notes_ready', EV.text],
      [SHIP_DONE, RESET, '> every run done, on time'],
    ],
  });
}

function board(s) {
  frame(s, { x: BX, y: BY, w: BW, h: 272, title: 'All workspaces' });

  // The clock, one text per minute it shows.
  CLOCK.forEach(([t, txt], k) => {
    const to = CLOCK[k + 1]?.[0] ?? 24;
    if (to <= t) return;
    const node = s.text(txt, { x: BX + BW - 82, y: BY + 26, font: 'mono', size: 14, fill: t === NINE || t === TEN ? C.cron : C.text, anchor: 'end' });
    s.add(t === 0 ? s.anim(node, [[0, { opacity: 1 }], [to, { opacity: 0 }, 'step']]) : appear(s, node, t, to));
  });
  s.add(s.anim(el('rect', { x: BX + BW - 64, y: BY + 17, width: 8, height: 8, fill: C.ongoing, class: 'px' }),
    [[0, { opacity: 1 }], [0.5, { opacity: 0.3 }, 'step'], [1, { opacity: 1 }, 'step']], { period: 1 }));
  s.add(s.text('LIVE', { x: BX + BW - 50, y: BY + 26, font: 'pixel', size: 16, fill: C.lit }));

  COLS.forEach((title, c) => {
    const x = colX(c);
    s.add(box(x, BY + 44, COL_W, 220));
    s.add(el('rect', { x: x + 8, y: BY + 54, width: 6, height: 6, fill: COL_DOT[c], class: 'px' }));
    s.add(s.text(title, { x: x + 19, y: BY + 61, font: 'semi', size: 11, fill: C.dim }));

    const spans = [];
    STATES.forEach((st) => {
      const n = st[1 + c];
      const prev = spans.at(-1);
      if (prev && prev.n === n) return;
      if (prev) prev.to = st[0];
      spans.push({ n, from: st[0], to: 24 });
    });
    for (const { n, from, to } of spans) {
      if (to <= from) continue;
      s.add(s.anim(s.text(String(n), { x: x + COL_W - 8, y: BY + 61, font: 'mono', size: 11, fill: n ? C.text : C.notstarted, anchor: 'end' }),
        from === 0 ? [[0, { opacity: 1 }], [to, { opacity: 0 }, 'step']]
          : [[0, { opacity: 0 }], [from, { opacity: 1 }, 'step'], [to, { opacity: 0 }, 'step']]));
    }
  });

  for (const cd of CARDS) card(s, cd);

  // The template that fires flashes as its run drops out of it.
  const flash = (slot, t) => s.add(appear(s, el('rect', { x: colX(0) + 6, y: slotY(slot), width: CARD_W, height: CARD_H, fill: 'none', stroke: C.cron, 'stroke-width': 2, class: 'px' }), t, t + 0.6));
  flash(0, NINE); flash(2, NINE + 0.3); flash(1, TEN + 0.2);
  // The skipped tick: the hourly template flashes amber.
  s.add(appear(s, el('rect', { x: colX(0) + 6, y: slotY(0), width: CARD_W, height: CARD_H, fill: 'none', stroke: C.ask, 'stroke-width': 2, class: 'px' }), TEN, TEN + 1.2));
}

// A card as the app draws it across every workspace: a status bar, the
// workspace with its agent-online dot, the title, then the agent. A
// template shows its schedule in place of the agent.
function card(s, { ws, agent, title, tag, moves }) {
  const bars = COL_DOT.map((fill, c) => {
    const keys = [[0, { opacity: moves[0][1] === c ? 1 : 0 }]];
    moves.forEach(([t, col], k) => {
      if (k === 0) return;
      keys.push([t, { opacity: col === c ? 1 : 0 }, 'step']);
    });
    return s.anim(el('rect', { x: 3, y: 5, width: 3, height: CARD_H - 10, fill, class: 'px' }), keys);
  });
  const body = g({},
    el('rect', { x: 0, y: 0, width: CARD_W, height: CARD_H, fill: C.card, class: 'px' }),
    ...bars,
    el('rect', { x: 11, y: 7, width: 5, height: 5, fill: C.ongoing, class: 'px' }),
    s.text(ws, { x: 20, y: 13, font: 'mono', size: 10, fill: C.dim }),
    s.text(title, { x: 11, y: 27, font: 'semi', size: 11, fill: C.text }),
    tag
      ? s.text(tag, { x: 11, y: 39, font: 'mono', size: 10, fill: C.cron })
      : s.text(agent, { x: 11, y: 39, font: 'mono', size: 10, fill: colour(agent) }));

  const keys = [];
  moves.forEach(([t, col, slot], k) => {
    const at = { x: colX(Math.max(col, 0)) + 6, y: slotY(slot) };
    if (col < 0) { keys.push([t, { ...at, opacity: 0 }]); return; }
    if (k === 0) { keys.push([t, { ...at, opacity: 1 }]); return; }
    if (moves[k - 1][1] < 0) {
      // A run is born on its template and slides out of Scheduled.
      // A task an event hands over drops in from above instead.
      const from = CARDS.find((c) => c.tag && c.title === title);
      const start = from ? { x: colX(0) + 6, y: slotY(from.moves.at(-1)[2]) } : { ...at, y: at.y - 20 };
      keys.push([t, { ...start, opacity: col === 0 || !from ? 0 : 1 }, 'step'], [t + 0.5, { ...at, opacity: 1 }, 'inOut']);
      return;
    }
    keys.push([t - 0.01, {}], [t + 0.45, at, 'inOut']);
  });
  const end = moves.length === 1 ? null : RESET;
  if (end) keys.push([end, { opacity: 1 }], [end + 0.3, { opacity: 0 }]);
  s.add(s.anim(body, keys));
}

function panel(s) {
  s.add(box(PX0, BY + 44, PW, 220));
  const head = (t) => s.text(t, { x: PX0 + 12, y: BY + 66, font: 'pixel', size: 16, fill: C.dim });
  const line = (txt, k, fill = C.dim, y0 = BY + 92) => s.text(txt, { x: PX0 + 12, y: y0 + k * 20, font: 'mono', size: 12, fill });
  const label = (txt, x, y) => s.text(txt, { x, y, font: 'semi', size: 9, fill: C.notstarted });
  const field = (x, y, w, txt, fill = C.text) => g({}, box(x, y, w, 22, C.card, C.line), s.text(txt, { x: x + 8, y: y + 15, font: 'mono', size: 11, fill }));

  // 01: the task form's Execution Strategy popover, set to Repeated, Daily.
  const px = PX0 + 10;
  const tabs = ['None', 'One-time', 'Repeated'];
  const tabW = [46, 70, 76];
  let tx = px;
  const tabNodes = tabs.map((t, k) => {
    const x = tx; tx += tabW[k] + 4;
    const plain = g({}, box(x, BY + 96, tabW[k], 22, C.card, C.line),
      s.text(t, { x: x + tabW[k] / 2, y: BY + 111, font: 'semi', size: 10, fill: C.dim, anchor: 'middle' }));
    const lit = g({}, el('rect', { x, y: BY + 96, width: tabW[k], height: 22, fill: C.text, class: 'px' }),
      s.text(t, { x: x + tabW[k] / 2, y: BY + 111, font: 'semi', size: 10, fill: C.ink, anchor: 'middle' }));
    if (k === 0) return [appear(s, lit, B[0], PICK_REPEATED), appear(s, plain, PICK_REPEATED)];
    if (k === 2) return [appear(s, plain, B[0], PICK_REPEATED), appear(s, lit, PICK_REPEATED)];
    return [plain];
  }).flat();
  beat(s, 0, [
    s.text('Dependency audit', { x: px, y: BY + 66, font: 'semi', size: 12, fill: C.text }),
    s.text('api', { x: PX0 + PW - 12, y: BY + 66, font: 'mono', size: 11, fill: C.dim, anchor: 'end' }),
    label('EXECUTION STRATEGY', px, BY + 88),
    ...tabNodes,
    appear(s, g({},
      label('FREQUENCY', px, BY + 136),
      label('TIME', px + 124, BY + 136)), PICK_REPEATED),
    appear(s, field(px, BY + 142, 116, 'Hourly', C.dim), PICK_REPEATED, PICK_DAILY),
    appear(s, field(px, BY + 142, 116, 'Daily'), PICK_DAILY),
    appear(s, field(px + 124, BY + 142, 82, '09:00'), PICK_DAILY),
    appear(s, field(px, BY + 172, 96, '0 * * * *', C.cron), PICK_REPEATED, PICK_DAILY),
    appear(s, field(px, BY + 172, 96, '0 9 * * *', C.cron), PICK_DAILY),
    appear(s, s.text('in 2m', { x: px + 104, y: BY + 187, font: 'mono', size: 11, fill: C.dim }), PICK_DAILY),
    // The form's send button, an up arrow.
    el('rect', { x: PX0 + PW - 40, y: BY + 226, width: 28, height: 28, fill: C.text, class: 'px' }),
    el('rect', { x: PX0 + PW - 27, y: BY + 232, width: 2, height: 16, fill: C.ink, class: 'px' }),
    el('rect', { x: PX0 + PW - 31, y: BY + 236, width: 10, height: 2, fill: C.ink, class: 'px' }),
    el('rect', { x: PX0 + PW - 29, y: BY + 234, width: 6, height: 2, fill: C.ink, class: 'px' }),
    appear(s, el('rect', { x: PX0 + PW - 40, y: BY + 226, width: 28, height: 28, fill: C.ongoing, opacity: 0.8, class: 'px' }), CREATE - 0.15, CREATE + 0.1),
    appear(s, line('saved to Scheduled', 7.0, C.lit), CREATE + 0.2),
  ]);

  // 02: 09:00. Two templates are due; each spawns a fresh run.
  beat(s, 1, [
    head('09:00 tick'),
    appear(s, g({}, line('Triage issues', 0, C.text), s.text('-> run', { x: PX0 + 150, y: BY + 92, font: 'mono', size: 12, fill: C.cron })), NINE),
    appear(s, g({}, line('Dependency audit', 1, C.text), s.text('-> run', { x: PX0 + 150, y: BY + 112, font: 'mono', size: 12, fill: C.cron })), NINE + 0.3),
    appear(s, line('Release notes  not due', 2, C.notstarted), NINE + 0.6),
    appear(s, g({}, line('hermes', 3.6, colour('hermes')), s.text('-> ongoing', { x: PX0 + 96, y: BY + 92 + 3.6 * 20, font: 'mono', size: 12, fill: C.ongoing })), TAKE),
    appear(s, line('claude: /clear, then', 4.6, colour('claude')), TAKE + 0.4),
    appear(s, line('starts the new run', 5.6, colour('claude')), TAKE + 0.4),
    appear(s, line('audit -> done', 7.0, C.lit), AUDIT_DONE),
  ]);

  // 03: 10:00. Triage's 09:00 run is still open, so it skips; notes runs.
  beat(s, 2, [
    head('10:00 tick'),
    appear(s, line('Triage issues', 0, C.text), TEN),
    appear(s, line('  09:00 run still open', 1, C.ask), TEN),
    appear(s, line('  -> skipped', 2, C.ask), TEN),
    appear(s, g({}, line('Release notes', 3.4, C.text), s.text('-> run', { x: PX0 + 150, y: BY + 92 + 3.4 * 20, font: 'mono', size: 12, fill: C.cron })), TEN + 0.2),
    appear(s, g({}, line('agy', 4.6, colour('agy')), s.text('-> ongoing', { x: PX0 + 96, y: BY + 92 + 4.6 * 20, font: 'mono', size: 12, fill: C.ongoing })), TEN + 1.4),
    appear(s, line('triage -> done', 6.2, C.lit), TRIAGE_DONE),
    appear(s, line('next triage: 11:00', 7.2, C.dim), TRIAGE_DONE + 0.3),
  ]);

  // 04: the notes run completes and fires notes_ready, which hands the
  // deploy workspace its task. Event nodes above, workspace nodes below.
  const node = (x, y, w, txt, event) => g({},
    box(x, y, w, 26, event ? EV.bg : C.card, event ? EV.line : C.line),
    s.text(txt, { x: x + 8, y: y + 17, font: event ? 'mono' : 'semi', size: 11, fill: event ? EV.text : C.text }));
  const edge = (x0, y0, x1, y1) => g({},
    el('rect', { x: x0, y: y0, width: 2, height: (y1 - y0) / 2, fill: C.line, class: 'px' }),
    el('rect', { x: Math.min(x0, x1), y: y0 + (y1 - y0) / 2, width: Math.abs(x1 - x0) + 2, height: 2, fill: C.line, class: 'px' }),
    el('rect', { x: x1, y: y0 + (y1 - y0) / 2, width: 2, height: (y1 - y0) / 2, fill: C.line, class: 'px' }));
  beat(s, 3, [
    head('workflow'),
    node(PX0 + 12, BY + 82, 120, 'docs', false),
    s.text('weekly', { x: PX0 + 140, y: BY + 99, font: 'mono', size: 10, fill: C.cron }),
    edge(PX0 + 60, BY + 108, PX0 + 100, BY + 132),
    node(PX0 + 50, BY + 132, 120, 'notes_ready', true),
    edge(PX0 + 100, BY + 158, PX0 + 60, BY + 182),
    node(PX0 + 12, BY + 182, 120, 'deploy', false),
    appear(s, el('rect', { x: PX0 + 50, y: BY + 132, width: 120, height: 26, fill: 'none', stroke: EV.lit, 'stroke-width': 2, class: 'px' }), NOTES_DONE, NOTES_DONE + 0.8),
    appear(s, el('rect', { x: PX0 + 12, y: BY + 182, width: 120, height: 26, fill: 'none', stroke: C.ongoing, 'stroke-width': 2, class: 'px' }), PUBLISH, PUBLISH + 0.8),
    appear(s, line('openclaw: changelog', 6.4, colour('openclaw')), PUBLISH + 0.2),
    appear(s, line('published', 7.4, C.lit), SHIP_DONE),
  ]);
}

function plan() {
  const a = ACTS;
  a.claude.alert.push([NINE + 0.4, TAKE + 0.4]);
  a.claude.hops.push([TAKE + 0.4, 14]);
  a.claude.work.push([TAKE + 0.6, AUDIT_DONE]);
  a.claude.done.push([AUDIT_DONE, B[2] + 0.4], [SHIP_DONE, RESET]);

  a.hermes.alert.push([NINE + 0.1, TAKE]);
  a.hermes.hops.push([TAKE, 14]);
  a.hermes.work.push([TAKE + 0.2, TRIAGE_DONE]);
  a.hermes.done.push([TRIAGE_DONE, RESET]);

  a.agy.say.push(['zZ', [[0, TEN + 0.2]]]);
  a.agy.alert.push([TEN + 0.3, TEN + 1.4]);
  a.agy.hops.push([TEN + 1.4, 14]);
  a.agy.work.push([TEN + 1.6, NOTES_DONE]);
  a.agy.done.push([NOTES_DONE, RESET]);

  a.openclaw.say.push(['zZ', [[0, PUBLISH]]]);
  a.openclaw.alert.push([PUBLISH, PUBLISH + 0.6]);
  a.openclaw.hops.push([PUBLISH + 0.6, 14]);
  a.openclaw.work.push([PUBLISH + 0.8, SHIP_DONE]);
  a.openclaw.done.push([SHIP_DONE, RESET]);

  a.codex.say.push(['zZ', [[0, DANCE]]]);
  a.codex.done.push([SHIP_DONE, RESET]);
}

// You: Repeated, Daily, then send.
function pointer(s) {
  const repeated = { x: PX0 + 10 + 46 + 4 + 70 + 4 + 38, y: BY + 108 };
  const freq = { x: PX0 + 60, y: BY + 152 };
  const send = { x: PX0 + PW - 26, y: BY + 240 };
  cursor(s, [
    [0, OFF],
    [PICK_REPEATED - 0.9, OFF],
    [PICK_REPEATED - 0.3, repeated, 'inOut'],
    ...press(PICK_REPEATED, repeated),
    [PICK_DAILY - 0.4, freq, 'inOut'],
    ...press(PICK_DAILY, freq),
    [CREATE - 0.5, send, 'inOut'],
    ...press(CREATE, send),
    [CREATE + 0.4, send],
    [CREATE + 1.1, OFF, 'inOut'],
  ]);
}
