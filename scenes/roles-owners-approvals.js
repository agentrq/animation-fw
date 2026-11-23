// Managing agents by role: each workspace is a role with one agent on it, a
// supervisor files the work, every card on the board says who owns it, a
// blocker surfaces the second it happens, and a risky command waits for your
// Allow Once before it runs.
import { el, g } from '../src/index.js';
import {
  C, MASCOTS, OFF, newScene, sky, ground, intro, frame, mascot, mascotByName, cursor, press,
} from '../kit/agentrq.js';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop. Each beat owns a span.
const B = [0.3, 6.0, 11.6, 17.0, 22.4];
const FADE = 0.25;
const FILE = 1.2;           // claude, the supervisor, starts filing tasks
const START = 6.4;          // the workers pick them up
const DONE_API = 10.4;      // codex finishes first
const BLOCK = 12.0;         // hermes is blocked
const UNBLOCK = 14.6;       // claude answers it
const DONE_WEB = 15.8;
const ASK = 17.4;           // openclaw asks to run a command
const ALLOW = 19.1;         // you click Allow Once
const DONE_QA = 19.6;
const DONE_SHIP = 20.2;
const DANCE = 20.6;
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
const PX0 = BX + 504;       // the side panel
const PW = 226;

// The four roles: a workspace each, one agent on it, one task.
const ROLES = [
  { ws: 'api', agent: 'codex', task: 'Billing API v2' },
  { ws: 'web', agent: 'agy', task: 'Checkout page' },
  { ws: 'qa', agent: 'hermes', task: 'E2E suite' },
  { ws: 'deploy', agent: 'openclaw', task: 'Ship to prod' },
];

// Where each card is: [second, column, slot]. Column -1 is off the board.
const MOVES = {
  codex: [[0, -1, 0], [FILE + 0.0, 0, 0], [START, 1, 0], [DONE_API, 3, 0]],
  agy: [[0, -1, 0], [FILE + 0.5, 0, 1], [START + 0.4, 1, 1], [DONE_API + 0.3, 1, 0], [DONE_WEB, 3, 1]],
  hermes: [[0, -1, 0], [FILE + 1.0, 0, 2], [START + 0.8, 1, 2], [DONE_API + 0.3, 1, 1], [BLOCK, 2, 0], [UNBLOCK + 0.6, 1, 1], [DONE_WEB + 0.3, 1, 0], [DONE_QA, 3, 2]],
  openclaw: [[0, -1, 0], [FILE + 1.5, 0, 3], [START + 1.2, 1, 3], [DONE_API + 0.3, 1, 2], [BLOCK + 0.3, 1, 1], [UNBLOCK + 0.6, 1, 2], [DONE_WEB + 0.3, 1, 1], [DONE_QA + 0.3, 1, 0], [DONE_SHIP, 3, 3]],
};

// The board's column counts over the loop, from MOVES.
function counts() {
  const times = [...new Set(Object.values(MOVES).flat().map(([t]) => t))].sort((a, b) => a - b);
  const colAt = (moves, t) => moves.filter(([mt]) => mt <= t).at(-1)[1];
  const st = times.map((t) => [t, ...COLS.map((_, c) => Object.values(MOVES).filter((m) => colAt(m, t) === c).length)]);
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
const colour = (name) => mascotByName(name).color;

export default function rolesOwnersApprovals() {
  const s = newScene({
    poster: 21.0,
    description: 'Managing agents by role in AgentRQ: claude, as supervisor, files four tasks into four role workspaces, api for codex, web for agy, qa for hermes and deploy for openclaw, and every card on the board shows its workspace and owner; hermes goes to Blocked and claude unblocks it; openclaw asks to run kubectl rollout restart deploy/api, the request waits as Authorization Required until you click Allow Once, and all four tasks land in Done as the agents celebrate.',
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
    kicker: 'agent roles',
    headline: ['Every agent', 'has a role.'],
    sub: 'See who owns what, and what waits.',
    steps: [['roles', B[0], B[1]], ['owners', B[1], B[2]], ['blocked', B[2], B[3]], ['approve', B[3], B[4]]],
    log: [
      [0, FILE, '> 4 workspaces, 4 roles_'],
      [FILE, START, '> claude: filing to each role'],
      [START, BLOCK, '> every card names its owner'],
      [BLOCK, UNBLOCK, '> hermes: blocked on staging', C.blocked],
      [UNBLOCK, B[3], '> claude unblocked hermes'],
      [B[3], ALLOW, '> openclaw waits for you', C.ask],
      [ALLOW, DONE_SHIP, '> you: Allow Once'],
      [DONE_SHIP, RESET, '> 4 of 4 done, all reviewed'],
    ],
  });
}

// The board: four columns, four cards that move between them.
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

  for (const role of ROLES) card(s, role);
}

// One card, as the app draws it across every workspace: a status bar on the
// left, the workspace with its agent-online dot, the title, then the agent.
function card(s, { ws, agent, task }) {
  const moves = MOVES[agent];
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
    s.text(task, { x: 11, y: 27, font: 'semi', size: 11, fill: C.text }),
    s.text(agent, { x: 11, y: 39, font: 'mono', size: 10, fill: colour(agent) }));

  // It slides from slot to slot, and fades in when filed and out at the end.
  const keys = [];
  moves.forEach(([t, col, slot], k) => {
    if (col < 0) { keys.push([t, { x: colX(0) + 6, y: slotY(slot) - 20, opacity: 0 }]); return; }
    const at = { x: colX(col) + 6, y: slotY(slot) };
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
  const line = (txt, k, fill = C.dim, y0 = BY + 92) => s.text(txt, { x: PX0 + 12, y: y0 + k * 20, font: 'mono', size: 12, fill });
  const pair = (left, right, k, lf, rf = C.dim, t) => appear(s, g({},
    line(left, k, lf),
    s.text(right, { x: PX0 + 96, y: BY + 92 + k * 20, font: 'mono', size: 12, fill: rf })), t);

  // 01: the roles. Each workspace is a role, with its mission and its agent.
  beat(s, 0, [
    head('workspaces'),
    s.text('role', { x: PX0 + 12, y: BY + 88, font: 'semi', size: 11, fill: C.notstarted }),
    s.text('agent', { x: PX0 + 96, y: BY + 88, font: 'semi', size: 11, fill: C.notstarted }),
    ...ROLES.map(({ ws, agent }, k) => pair(ws, agent, k + 1, C.text, colour(agent), 0.4 + 0.15 * k)),
    pair('lead', 'claude', 5.2, C.text, colour('claude'), 0.4 + 0.6),
    appear(s, s.text('supervisor', { x: PX0 + 96, y: BY + 92 + 6.1 * 20, font: 'mono', size: 11, fill: C.dim }), 1.0),
    appear(s, line('4 tasks filed', 7.2, C.lit), FILE + 1.8),
  ]);
  ACTS.claude.work.push([FILE - 0.2, FILE + 1.8]);
  ACTS.claude.done.push([FILE + 1.9, B[1]]);

  // 02: who owns what. One owner per task, all four at a glance.
  beat(s, 1, [
    head('owners'),
    ...ROLES.map(({ agent, task }, k) => pair(agent, task, k, colour(agent), C.text, B[1] + 0.4 + 0.4 * k)),
    appear(s, line('1 owner per task', 5.0, C.lit), B[1] + 2.4),
    appear(s, line('codex -> done', 7.4, C.lit), DONE_API + 0.3),
  ]);

  // 03: a blocker. It lands in Blocked and on the supervisor's desk at once.
  beat(s, 2, [
    head('blocked'),
    s.text('E2E suite', { x: PX0 + 12, y: BY + 90, font: 'semi', size: 12, fill: C.text }),
    s.text('qa', { x: PX0 + PW - 12, y: BY + 90, font: 'mono', size: 11, fill: C.dim, anchor: 'end' }),
    appear(s, g({},
      line('hermes: staging DB is', 1.4, colour('hermes')),
      line('down, can not run e2e', 2.4, colour('hermes'))), BLOCK + 0.1),
    appear(s, line('claude: restarted it,', 3.8, colour('claude')), UNBLOCK - 0.4),
    appear(s, line('run it again', 4.8, colour('claude')), UNBLOCK - 0.4),
    appear(s, line('hermes -> ongoing', 6.4, C.lit), UNBLOCK + 0.7),
  ]);

  // 04: openclaw wants to run a command; the request waits for you.
  const bx = PX0 + 8;
  const bw = PW - 16;
  const by = BY + 52;
  beat(s, 3, [
    appear(s, g({},
      box(bx, by, bw, 204, C.panel, C.line),
      el('rect', { x: bx + 10, y: by + 12, width: 8, height: 8, fill: C.ask, class: 'px' }),
      s.text('Authorization Required', { x: bx + 24, y: by + 20, font: 'semi', size: 11, fill: C.text }),
      s.text('Ship to prod - openclaw', { x: bx + 10, y: by + 42, font: 'mono', size: 10, fill: colour('openclaw') }),
      s.text('ACTION', { x: bx + 10, y: by + 64, font: 'semi', size: 9, fill: C.notstarted }),
      box(bx + 10, by + 70, bw - 20, 20, C.column),
      s.text('Bash', { x: bx + 16, y: by + 84, font: 'mono', size: 11, fill: C.text }),
      box(bx + 10, by + 96, bw - 20, 38, C.column),
      s.text('kubectl rollout restart', { x: bx + 16, y: by + 111, font: 'mono', size: 10, fill: C.dim }),
      s.text('deploy/api', { x: bx + 16, y: by + 126, font: 'mono', size: 10, fill: C.dim })), ASK),
    // The three verdicts. Allow Once flashes when you click it.
    appear(s, g({},
      el('rect', { x: bx + 10, y: by + 146, width: 66, height: 22, fill: C.text, class: 'px' }),
      s.text('Allow Once', { x: bx + 43, y: by + 161, font: 'semi', size: 10, fill: C.ink, anchor: 'middle' }),
      box(bx + 80, by + 146, 72, 22, C.card, C.line),
      s.text('Always Allow', { x: bx + 116, y: by + 161, font: 'semi', size: 10, fill: C.text, anchor: 'middle' }),
      box(bx + 156, by + 146, 44, 22, C.card, C.line),
      s.text('Deny', { x: bx + 178, y: by + 161, font: 'semi', size: 10, fill: C.blocked, anchor: 'middle' })), ASK + 0.3, ALLOW + 0.1),
    appear(s, el('rect', { x: bx + 10, y: by + 146, width: 66, height: 22, fill: C.ongoing, opacity: 0.8, class: 'px' }), ALLOW - 0.15, ALLOW + 0.1),
    appear(s, g({},
      el('rect', { x: bx + 10, y: by + 150, width: 8, height: 8, fill: C.ongoing, class: 'px' }),
      s.text('Bash  allowed once', { x: bx + 24, y: by + 158, font: 'mono', size: 11, fill: C.lit })), ALLOW + 0.1),
    appear(s, s.text('4 of 4 done', { x: bx + 10, y: by + 190, font: 'mono', size: 12, fill: C.lit }), DONE_SHIP),
  ]);
}

// Work, ask, alert and done spans for the workers.
function plan() {
  for (const { agent } of ROLES) {
    const a = ACTS[agent];
    const moves = MOVES[agent];
    a.alert.push([moves[1][0] + 0.2, START]);
    a.hops.push([moves[2][0], 14]);
    const done = moves.at(-1)[0];
    if (agent === 'hermes') {
      a.work.push([moves[2][0] + 0.3, BLOCK]);
      a.ask.push([BLOCK, UNBLOCK + 0.6]);
      a.hops.push([UNBLOCK + 0.6, 14]);
      a.work.push([UNBLOCK + 0.8, done]);
    } else if (agent === 'openclaw') {
      a.work.push([moves[2][0] + 0.3, ASK]);
      a.ask.push([ASK, ALLOW + 0.1]);
      a.hops.push([ALLOW + 0.1, 14]);
      a.work.push([ALLOW + 0.3, done]);
    } else {
      a.work.push([moves[2][0] + 0.3, done]);
    }
    a.done.push([done, RESET]);
  }
  ACTS.claude.work.push([BLOCK + 0.4, UNBLOCK]);
  ACTS.claude.hops.push([UNBLOCK, 14]);
  ACTS.claude.done.push([DONE_SHIP, RESET]);
}

// You: one click on Allow Once.
function pointer(s) {
  const allow = { x: PX0 + 8 + 43, y: BY + 52 + 157 };
  cursor(s, [
    [0, OFF],
    [ALLOW - 1.3, OFF],
    [ALLOW - 0.4, allow, 'inOut'],
    ...press(ALLOW, allow),
    [ALLOW + 0.5, allow],
    [ALLOW + 1.2, OFF, 'inOut'],
  ]);
}
