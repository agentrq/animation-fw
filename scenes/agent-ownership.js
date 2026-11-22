// Agent ownership: coding and research agents on one board. Each workspace
// is a role with one agent on it, every card names its owner, an agent runs
// one task at a time while the next waits with its owner already on it, a
// research result hands work to a coding agent through an event, and one
// task is assigned to a person, who drags it to Done.
import { el, g } from '../src/index.js';
import {
  C, MASCOTS, OFF, newScene, sky, ground, intro, frame, mascot, mascotByName, cursor, press,
} from '../kit/agentrq.js';

// The app draws events in violet.
const EV = { text: '#a78bfa', bg: '#1a1528', line: '#3b2d63', lit: '#c4b5fd' };
const EDGE = '#3f3f46';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop. Each beat owns a span.
const B = [0.3, 6.0, 11.4, 17.0, 22.4];
const FADE = 0.25;
const FILE = 1.0;           // claude, the supervisor, files a task per role
const START = 3.4;          // each agent picks up its own
const QUEUE = 6.6;          // a second task for codex, which is busy
const D_CO = 8.4;           // hermes finishes the competitor scan
const D_RL = 10.2;          // codex finishes, and takes the next one
const D_CS = 12.0;          // agy finishes the SDK comparison
const FIRE = 12.5;          // findings_published fires
const HAND = 13.3;          // and api gets a task, owned by codex
const D_RT = 15.0;
const D_PP = 17.4;          // openclaw finishes the page, files a review for you
const REVIEW = 17.9;
const GRAB = 19.0;          // you drag the review to Done
const DROP = 19.6;
const D_SDK = 20.2;
const DANCE = 20.8;
const RESET = 22.6;

// ---------------------------------------------------------------- the stage
const BX = 440;
const BY = 20;
const BW = 740;
const COLS = ['Not Started', 'Ongoing', 'Blocked', 'Done'];
const COL_DOT = [C.notstarted, C.ongoing, C.blocked, C.done];
const colX = (c) => BX + 10 + c * 122;
const COL_W = 116;
const CARD_W = COL_W - 12;
const CARD_H = 44;
const slotY = (k) => BY + 72 + k * 47;
// Done lists the newest first, so finished cards pile up under it.
const doneY = (k) => BY + 70 + k * 25;
const PX0 = BX + 504;       // the side panel
const PW = 226;

// You, the person on the team: the one task that is yours.
const YOU = {
  name: 'you', color: '#38bdf8',
  art: `
    ...hhhh...
    ..hhhhhh..
    ..hffffh..
    ..f#ff#f..
    ..ffffff..
    ...ffff...
    ..ssssss..
    .ssssssss.
    f.ssssss.f
    ..ssssss..
    ..ll..ll..
    ..ll..ll..`,
  palette: { h: '#1c1917', f: '#d6a77a', '#': '#1c1917', s: '#38bdf8', l: '#3f3f46' },
  eyes: [[3, 3, 1, 1], [6, 3, 1, 1]], skin: '#d6a77a',
};

// The roles: two coding workspaces, two research ones, one agent on each.
const ROLES = [
  { ws: 'api', agent: 'codex', kind: 'coding' },
  { ws: 'web', agent: 'openclaw', kind: 'coding' },
  { ws: 'research', agent: 'agy', kind: 'research' },
  { ws: 'market', agent: 'hermes', kind: 'research' },
];

// Every task: its workspace, its owner, and where it is: [second, column,
// slot] before Done. Column -1 is off the board. `done` is when it lands in
// Done; the pile under it is worked out below.
const TASKS = [
  { id: 'rl', ws: 'api', owner: 'codex', title: 'Rate limits', moves: [[0, -1, 0], [FILE, 0, 0], [START, 1, 0]], done: D_RL },
  { id: 'pp', ws: 'web', owner: 'openclaw', title: 'Pricing page', moves: [[0, -1, 1], [FILE + 0.4, 0, 1], [START + 0.3, 1, 1], [D_RL, 1, 0]], done: D_PP },
  { id: 'cs', ws: 'research', owner: 'agy', title: 'Compare SDKs', moves: [[0, -1, 2], [FILE + 0.8, 0, 2], [START + 0.6, 1, 2], [D_RL, 1, 1]], done: D_CS },
  { id: 'co', ws: 'market', owner: 'hermes', title: 'Competitor scan', moves: [[0, -1, 3], [FILE + 1.2, 0, 3], [START + 0.9, 1, 3]], done: D_CO },
  { id: 'rt', ws: 'api', owner: 'codex', title: 'Retry logic', moves: [[0, -1, 0], [QUEUE, 0, 0], [D_RL, 1, 2], [D_CS, 1, 1]], done: D_RT },
  { id: 'sdk', ws: 'api', owner: 'codex', title: 'Adopt SDK v3', moves: [[0, -1, 0], [HAND, 0, 0], [D_RT, 1, 1], [D_PP, 1, 0]], done: D_SDK },
  { id: 'rv', ws: 'web', owner: 'you', human: true, title: 'Review pricing', moves: [[0, -1, 0], [REVIEW, 0, 0]], done: DROP },
];

// Into Done, newest on top: each card moves down one place as the next lands.
const DONE_ORDER = TASKS.map((t) => t.done).sort((a, b) => a - b);
for (const t of TASKS) {
  t.moves.push([t.done, 3, 0]);
  DONE_ORDER.filter((d) => d > t.done).forEach((d, k) => t.moves.push([d, 3, k + 1]));
}
// Later cards draw on top of the pile.
TASKS.sort((a, b) => a.done - b.done);

// The board's column counts over the loop, from the moves.
function counts() {
  const all = TASKS.map((t) => t.moves);
  const times = [...new Set(all.flat().map(([t]) => t))].sort((a, b) => a - b);
  const colAt = (moves, t) => moves.filter(([mt]) => mt <= t).at(-1)[1];
  const st = times.map((t) => [t, ...COLS.map((_, c) => all.filter((m) => colAt(m, t) === c).length)]);
  st.push([RESET, 0, 0, 0, 0]);
  return st;
}
const STATES = counts();

// What every mascot does over the loop.
const ACTS = Object.fromEntries([...MASCOTS, YOU].map((m) => [m.name, { hops: [], alert: [], work: [], ask: [], done: [], say: [] }]));

const appear = (s, node, t, until) => s.anim(node, until
  ? [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step'], [until, { opacity: 0 }, 'step']]
  : [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step']]);

// A beat's content fades in at its start and out at its end.
function beat(s, i, nodes) {
  const [from, to] = [B[i], B[i + 1]];
  s.add(s.anim(g({}, nodes), [[0, { opacity: 0 }], [from, { opacity: 0 }], [from + FADE, { opacity: 1 }], [to - FADE, { opacity: 1 }], [to, { opacity: 0 }]]));
}

const box = (x, y, w, h, fill = C.column, stroke) => el('rect', { x, y, width: w, height: h, fill, stroke, 'stroke-width': stroke ? 2 : undefined, class: 'px' });
const colour = (name) => (name === 'you' ? YOU.color : mascotByName(name).color);

// Under the stage: you on the left, then the supervisor and the four agents.
const AT = { you: 474, claude: 572, codex: 700, openclaw: 828, agy: 956, hermes: 1084 };

export default function agentOwnership() {
  const s = newScene({
    poster: 21.2,
    description: 'Agent ownership in AgentRQ: claude, the supervisor, files one task into each role workspace, api for codex and web for openclaw (coding), research for agy and market for hermes (research), and every card shows its workspace and owner. A second api task waits in Not Started with codex already named, because an agent runs one task at a time. When agy finishes comparing SDKs, the findings_published event hands a new task to api, owned by codex. openclaw files a review assigned to you, a person; you drag it to Done, and all seven tasks finish as the agents and you celebrate.',
  });

  sky(s);
  ground(s);
  story(s);
  board(s);
  panel(s);
  plan();
  mascot(s, YOU, 5, { x: AT.you, ...ACTS.you });
  for (const name of ['claude', 'codex', 'openclaw', 'agy', 'hermes']) {
    const m = mascotByName(name);
    const i = MASCOTS.indexOf(m);
    const acts = ACTS[name];
    acts.hops.push([DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]);
    mascot(s, m, i, { x: AT[name], ...acts });
  }
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'agent ownership',
    headline: ['Every task has', 'one owner.'],
    sub: 'Coding and research agents, one board.',
    steps: [['roles', B[0], B[1]], ['queue', B[1], B[2]], ['handoff', B[2], B[3]], ['yours', B[3], B[4]]],
    log: [
      [0, FILE, '> 4 workspaces, 4 roles_'],
      [FILE, START, '> claude: a task per role'],
      [START, QUEUE, '> every card names its owner'],
      [QUEUE, D_RL, '> codex busy: next one waits'],
      [D_RL, D_CS, '> codex: next task started'],
      [D_CS, HAND, '> event: findings_published', EV.text],
      [HAND, D_PP, '> api: new task for codex'],
      [D_PP, DROP, '> openclaw: review is yours', C.ask],
      [DROP, D_SDK, '> you: review done'],
      [D_SDK, RESET, '> 7 of 7 done, 1 owner each'],
    ],
  });
}

// The board: four columns, seven cards that move between them.
function board(s) {
  frame(s, { x: BX, y: BY, w: BW, h: 272, title: 'All workspaces' });

  s.add(s.anim(el('rect', { x: BX + BW - 64, y: BY + 17, width: 8, height: 8, fill: C.ongoing, class: 'px' }),
    [[0, { opacity: 1 }], [0.5, { opacity: 0.3 }, 'step'], [1, { opacity: 1 }, 'step']], { period: 1 }));
  s.add(s.text('LIVE', { x: BX + BW - 50, y: BY + 26, font: 'pixel', size: 16, fill: C.lit }));

  COLS.forEach((title, c) => {
    const x = colX(c);
    s.add(box(x, BY + 44, COL_W, 220));
    s.add(el('rect', { x: x + 8, y: BY + 54, width: 6, height: 6, fill: COL_DOT[c], class: 'px' }));
    s.add(s.text(title, { x: x + 19, y: BY + 61, font: 'semi', size: 11, fill: C.dim }));

    // The count, one text per state it changes in.
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

  for (const t of TASKS) card(s, t);
}

const cardAt = (col, slot) => ({ x: colX(col) + 6, y: col === 3 ? doneY(slot) : slotY(slot) });

// One card, as the app draws it across every workspace: a status bar on the
// left, the workspace with its agent-online dot, the title, then the owner.
// A task assigned to a person carries the app's Human tag.
function card(s, { ws, owner, title, human, moves }) {
  const bars = COL_DOT.map((fill, c) => {
    const spans = [];
    moves.forEach(([t, col], k) => {
      if (col !== c) return;
      spans.push([t, moves[k + 1]?.[0] ?? RESET]);
    });
    const keys = [[0, { opacity: 0 }]];
    for (const [from, to] of spans) keys.push([from, { opacity: 1 }, 'step'], [to, { opacity: 0 }, 'step']);
    return s.anim(el('rect', { x: 3, y: 5, width: 3, height: CARD_H - 10, fill, class: 'px' }), keys);
  });
  const body = g({},
    el('rect', { x: 0, y: 0, width: CARD_W, height: CARD_H, fill: C.card, class: 'px' }),
    ...bars,
    el('rect', { x: 11, y: 7, width: 5, height: 5, fill: C.ongoing, class: 'px' }),
    s.text(ws, { x: 20, y: 13, font: 'mono', size: 10, fill: C.dim }),
    human ? g({},
      el('rect', { x: CARD_W - 40, y: 4, width: 36, height: 12, fill: C.panel, class: 'px' }),
      s.text('HUMAN', { x: CARD_W - 22, y: 13, font: 'semi', size: 8, fill: C.ask, anchor: 'middle' })) : null,
    s.text(title, { x: 11, y: 27, font: 'semi', size: 11, fill: C.text }),
    s.text(owner, { x: 11, y: 39, font: 'mono', size: 10, fill: colour(owner) }));

  // It slides from slot to slot, and fades in when filed and out at the end.
  const keys = [];
  moves.forEach(([t, col, slot], k) => {
    if (col < 0) { keys.push([t, { ...cardAt(0, slot), y: slotY(slot) - 20, opacity: 0 }]); return; }
    const at = cardAt(col, slot);
    if (k === 1) keys.push([t, { ...at, y: at.y - 20, opacity: 0 }, 'step'], [t + 0.3, { ...at, opacity: 1 }, 'out']);
    else keys.push([t - 0.01, {}], [t + 0.45, at, 'inOut']);
  });
  keys.push([RESET, { opacity: 1 }], [RESET + 0.3, { opacity: 0 }]);
  s.add(s.anim(body, keys));
}

// The side panel, whose content changes with each beat.
function panel(s) {
  s.add(box(PX0, BY + 44, PW, 220));
  const head = (t) => s.text(t, { x: PX0 + 12, y: BY + 66, font: 'pixel', size: 16, fill: C.dim });
  const line = (txt, k, fill = C.dim, x = PX0 + 12) => s.text(txt, { x, y: BY + 92 + k * 20, font: 'mono', size: 12, fill });
  const row = (cells, k, t) => appear(s, g({}, ...cells.map(([txt, fill, dx]) => line(txt, k, fill, PX0 + 12 + dx))), t);

  // 01: the roles. Coding and research workspaces, one agent each.
  beat(s, 0, [
    head('workspaces'),
    s.text('role', { x: PX0 + 12, y: BY + 88, font: 'semi', size: 11, fill: C.notstarted }),
    s.text('owner', { x: PX0 + 86, y: BY + 88, font: 'semi', size: 11, fill: C.notstarted }),
    ...ROLES.map(({ ws, agent, kind }, k) => row([[ws, C.text, 0], [agent, colour(agent), 74], [kind === 'coding' ? 'code' : 'research', C.notstarted, 148]], k + 1, 0.4 + 0.15 * k)),
    row([['lead', C.text, 0], ['claude', colour('claude'), 74]], 5.2, 1.0),
    appear(s, s.text('supervisor', { x: PX0 + 86, y: BY + 92 + 6.1 * 20, font: 'mono', size: 11, fill: C.dim }), 1.0),
    appear(s, line('4 tasks, 4 owners', 7.2, C.lit), FILE + 1.8),
  ]);
  ACTS.claude.work.push([FILE - 0.2, FILE + 1.6]);
  ACTS.claude.done.push([FILE + 1.7, B[1]]);

  // 02: one task at a time. The next waits, its owner already named.
  beat(s, 1, [
    head('codex'),
    s.text('api', { x: PX0 + PW - 12, y: BY + 66, font: 'mono', size: 11, fill: C.dim, anchor: 'end' }),
    appear(s, row([['Rate limits', C.text, 0], ['ongoing', C.ongoing, 128]], 0, 0), B[1], D_RL + 0.3),
    appear(s, row([['Retry logic', C.text, 0], ['waiting', C.notstarted, 128]], 1, 0), QUEUE + 0.3, D_RL + 0.3),
    appear(s, row([['Rate limits', C.text, 0], ['done', C.done, 128]], 0, 0), D_RL + 0.3),
    appear(s, row([['Retry logic', C.text, 0], ['ongoing', C.ongoing, 128]], 1, 0), D_RL + 0.3),
    appear(s, line('one task at a time', 3.2, C.lit), QUEUE + 0.8),
    appear(s, line('the next one waits', 4.2, C.dim), QUEUE + 0.8),
    appear(s, line('with its owner on it', 5.2, C.dim), QUEUE + 0.8),
    appear(s, line('hermes -> done', 7.2, colour('hermes')), D_CO + 0.3),
  ]);

  // 03: the hand-off. research finishes, an event fires, api gets the work.
  const ev = { x: PX0 + 24, y: BY + 80, w: 178, h: 26 };
  const wsNode = (x, label, agent, lit) => g({},
    box(x, BY + 146, 86, 40, C.card, C.line),
    lit,
    s.text(label, { x: x + 8, y: BY + 162, font: 'semi', size: 11, fill: C.text }),
    s.text(agent, { x: x + 8, y: BY + 178, font: 'mono', size: 10, fill: colour(agent) }));
  const ra = { x: PX0 + 14 };
  const api = { x: PX0 + PW - 100 };
  const flash = (x, y, w, h, t, fill) => appear(s, el('rect', { x, y, width: w, height: h, fill: 'none', stroke: fill, 'stroke-width': 2, class: 'px' }), t);
  beat(s, 2, [
    // research -> findings_published -> api, a zigzag like the workflow graph.
    el('path', { d: `M${ra.x + 43} ${BY + 146} V${ev.y + ev.h}`, stroke: EDGE, 'stroke-width': 2, fill: 'none' }),
    el('path', { d: `M${api.x + 43} ${ev.y + ev.h} V${BY + 146}`, stroke: EDGE, 'stroke-width': 2, fill: 'none' }),
    appear(s, el('path', { d: `M${ra.x + 43} ${BY + 146} V${ev.y + ev.h}`, stroke: EV.lit, 'stroke-width': 2, fill: 'none' }), FIRE - 0.3),
    appear(s, el('path', { d: `M${api.x + 43} ${ev.y + ev.h} V${BY + 146}`, stroke: EV.lit, 'stroke-width': 2, fill: 'none' }), HAND - 0.3),
    box(ev.x, ev.y, ev.w, ev.h, EV.bg, EV.line),
    flash(ev.x, ev.y, ev.w, ev.h, FIRE, EV.lit),
    s.text('findings_published', { x: ev.x + 10, y: ev.y + 17, font: 'mono', size: 12, fill: EV.text }),
    wsNode(ra.x, 'research', 'agy', flash(ra.x, BY + 146, 86, 40, D_CS + 0.2, C.done)),
    wsNode(api.x, 'api', 'codex', flash(api.x, BY + 146, 86, 40, HAND, C.ongoing)),
    appear(s, line('Adopt SDK v3', 5.4, C.text), HAND + 0.2),
    appear(s, line('owner: codex', 6.4, colour('codex')), HAND + 0.2),
  ]);

  // 04: a task assigned to a person. It waits for you, and you finish it.
  beat(s, 3, [
    head('review pricing'),
    row([['web', C.dim, 0]], 0, 0),
    appear(s, g({},
      el('rect', { x: PX0 + 48, y: BY + 82, width: 44, height: 14, fill: C.panel, class: 'px' }),
      s.text('HUMAN', { x: PX0 + 70, y: BY + 93, font: 'semi', size: 9, fill: C.ask, anchor: 'middle' })), B[3]),
    appear(s, row([['from', C.dim, 0], ['openclaw', colour('openclaw'), 56]], 1.4, 0), REVIEW),
    appear(s, row([['owner', C.dim, 0], ['you', YOU.color, 56]], 2.4, 0), REVIEW),
    appear(s, line('waiting on you', 4.0, C.ask), REVIEW + 0.2, DROP),
    appear(s, line('you -> done', 4.0, C.lit), DROP + 0.2),
    appear(s, line('7 of 7 done', 6.4, C.lit), D_SDK),
  ]);
}

// Work, alert and done spans for the workers, and your part.
function plan() {
  const workOn = (owner) => TASKS.filter((t) => t.owner === owner);
  for (const { agent } of ROLES) {
    const a = ACTS[agent];
    for (const t of workOn(agent)) {
      const start = t.moves.find(([, col]) => col === 1)?.[0];
      if (start === undefined) continue;
      a.work.push([start + 0.9, t.done]);
      a.done.push([t.done, t.done + 0.8]);
    }
  }
  for (const { agent } of ROLES) {
    const first = TASKS.find((t) => t.owner === agent);
    ACTS[agent].alert.push([first.moves[1][0] + 0.2, START]);
    ACTS[agent].hops.push([START + 0.1, 14]);
  }
  // Agents with nothing left to do wait with a tick until the dance.
  for (const name of ['hermes', 'agy']) {
    const last = Math.max(...workOn(name).map((t) => t.done));
    ACTS[name].done.at(-1)[1] = RESET;
    ACTS[name].done = ACTS[name].done.filter(([from]) => from <= last);
  }
  ACTS.codex.alert.push([QUEUE + 0.1, QUEUE + 0.8], [HAND + 0.1, HAND + 0.8]);
  ACTS.codex.done.push([D_SDK + 0.8, RESET]);
  ACTS.openclaw.done.at(-1)[1] = RESET;
  ACTS.claude.work.push([QUEUE - 0.4, QUEUE]);
  ACTS.claude.done.push([D_SDK, RESET]);
  // You get a review to do, drag it to Done and cheer.
  ACTS.you.alert.push([REVIEW, GRAB - 0.2]);
  ACTS.you.hops.push([DROP, 14], [DANCE + 0.1, 16], [DANCE + 1.0, 16]);
  ACTS.you.done.push([DROP + 0.1, RESET]);
}

// You: drag the review card from Not Started to Done.
function pointer(s) {
  const from = { x: colX(0) + 6 + 70, y: slotY(0) + 24 };
  const to = { x: colX(3) + 6 + 70, y: doneY(0) + 24 };
  cursor(s, [
    [0, OFF],
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
