// What sets AgentRQ apart, in six beats: memory that outlives the agent,
// a supervisor leading workers, chains of events written as plain text,
// skills switched on per workspace, the terminal from your phone, and
// every agent plugged in over ACP v1 or Claude Channels.
import { sprite, el, g } from '../src/index.js';
import {
  C, CHECK, OFF, newScene, sky, ground, intro, mascot, mascotByName, cursor, press,
} from '../kit/agentrq.js';

// The dark theme's own greys.
const BORDER = '#3f3f46';
const SCREEN = '#0c0c0f';
const WIRE = '#52525b';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop. Each beat owns a span.
const B = [0.3, 3.9, 7.5, 11.1, 14.7, 18.3, 22.4];
const FADE = 0.25;
const DANCE = 20.6;

// ---------------------------------------------------------------- the stage
const BX = 440;
const BY = 20;
const BW = 740;
const BH = 272;

// Where each mascot stands, by name.
const X = { claude: 514, codex: 662, agy: 810, hermes: 958, openclaw: 1106 };

const appear = (s, node, t, until) => s.anim(node, until
  ? [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step'], [until, { opacity: 0 }, 'step']]
  : [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step']]);

// A beat's content fades in at its start and out at its end.
function beat(s, i, nodes) {
  const [from, to] = [B[i], B[i + 1]];
  s.add(s.anim(g({}, nodes), [[0, { opacity: 0 }], [from, { opacity: 0 }], [from + FADE, { opacity: 1 }], [to - FADE, { opacity: 1 }], [to, { opacity: 0 }]]));
}

// A small square that runs from one point to another, once.
const pulse = (s, t, [x0, y0], [x1, y1], { fill = C.lit, dur = 0.6 } = {}) => s.anim(
  el('rect', { x: -4, y: -4, width: 8, height: 8, fill, class: 'px' }),
  [[0, { x: x0, y: y0, opacity: 0 }], [t, { x: x0, y: y0, opacity: 1 }, 'step'], [t + dur, { x: x1, y: y1 }, 'inOut'], [t + dur + 0.05, { opacity: 0 }, 'step']]);

const box = (x, y, w, h, fill = C.column, stroke) => el('rect', { x, y, width: w, height: h, fill, stroke, 'stroke-width': stroke ? 2 : undefined, class: 'px' });
const hline = (x0, x1, y, fill = WIRE) => el('rect', { x: Math.min(x0, x1), y: y - 1, width: Math.abs(x1 - x0), height: 2, fill, class: 'px' });
const vline = (x, y0, y1, fill = WIRE) => el('rect', { x: x - 1, y: Math.min(y0, y1), width: 2, height: Math.abs(y1 - y0), fill, class: 'px' });
const dot = (x, y, fill) => el('rect', { x, y, width: 6, height: 6, fill, class: 'px' });

// What every mascot does over the loop, filled in beat by beat.
const ACTS = Object.fromEntries(Object.keys(X).map((n) => [n, { hops: [], alert: [], work: [], ask: [], done: [] }]));

export default function whyAgentrq() {
  const s = newScene({
    poster: 20.2,
    description: 'What sets AgentRQ apart, in six beats: claude saves a lesson to workspace memory and codex picks up the task thread on another machine; a claude supervisor splits Ship billing v2 into three worker tasks for codex, agy and hermes; a plain-text chain of events hands qa to deploy to release notes; you switch the pr-review skill on for three more workspaces; you answer claude\'s prompt from your phone; and claude over Claude Channels and codex, agy, hermes and openclaw over ACP v1 all join one workspace and celebrate.',
  });

  sky(s);
  ground(s);
  story(s);
  stage(s);
  memory(s);
  supervisor(s);
  chain(s);
  skills(s);
  terminal(s);
  protocols(s);
  for (const [name, acts] of Object.entries(ACTS)) {
    const m = mascotByName(name);
    const sorted = Object.fromEntries(Object.entries(acts).map(([k, v]) => [k, [...v].sort((a, b) => a[0] - b[0])]));
    sorted.hops.push([DANCE, 16], [DANCE + 0.8, 16]);
    mascot(s, m, Object.keys(X).indexOf(name), { x: X[name], ...sorted });
  }
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'why agentrq',
    headline: ['One layer for', 'every agent.'],
    sub: 'Six things that set AgentRQ apart.',
    steps: ['01', '02', '03', '04', '05', '06'].map((n, i) => [n, B[i], B[i + 1]]),
    log: [
      [0, B[0], '> six things_'],
      [B[0], B[1], '> memory outlives the agent'],
      [B[1], B[2], '> supervisor -> 3 workers'],
      [B[2], B[3], '> qa_passed -> deploy'],
      [B[3], B[4], '> pr-review: on in 4 spaces'],
      [B[4], B[5], '> you: y, from your phone'],
      [B[5], B[6], '> ACP v1 + Claude Channels'],
    ],
  });
}

// The window every beat draws into, with the beat's title on it.
const TITLES = [
  ['Distributed memory', 'task + workspace'],
  ['Supervisor and workers', 'one agent leads'],
  ['Chain of events', 'plain-text workflows'],
  ['Distributed skills', 'one switch per workspace'],
  ['Your terminal, anywhere', 'phone, web, Chrome'],
  ['Every agent plugs in', 'ACP v1 + Claude Channels'],
];

function stage(s) {
  s.add(box(BX, BY, BW, BH, C.panel, C.line));
  TITLES.forEach(([title, tag], i) => beat(s, i, [
    s.text(`0${i + 1}`, { x: BX + 16, y: BY + 27, font: 'pixel', size: 16, fill: C.lit }),
    s.text(title, { x: BX + 46, y: BY + 26, font: 'semi', size: 15, fill: C.text }),
    s.text(tag, { x: BX + BW - 16, y: BY + 26, font: 'mono', size: 12, fill: C.dim, anchor: 'end' }),
  ]));
}

// 01: claude learns something on a task and saves it; codex, on another
// machine, reads the task's whole thread and the workspace's memory.
function memory(s) {
  const t = B[0];
  const L = [456, 56, 348, 220];
  const R = [816, 56, 348, 220];
  const thread = [
    [t + 0.3, 'you: totals are off by a cent', C.text],
    [t + 0.7, 'claude: tax rounds half-up', C.dim],
    [t + 1.1, 'claude: fixed, noted in memory', C.dim],
    [t + 2.0, 'codex @ laptop: read the thread,', C.lit],
    [t + 2.0, 'taking the follow-up', C.lit],
  ];
  const notes = ['- use pnpm, not npm', '- staging DB is read-only'];
  beat(s, 0, [
    box(...L), box(...R),
    s.text('task thread', { x: L[0] + 14, y: L[1] + 24, font: 'pixel', size: 16, fill: C.dim }),
    s.text('Fix checkout totals', { x: L[0] + 14, y: L[1] + 48, font: 'semi', size: 14, fill: C.text }),
    ...thread.map(([at, line, fill], k) => appear(s, s.text(line, { x: L[0] + 14, y: L[1] + 82 + k * 22, font: 'mono', size: 13, fill }), at)),
    s.text('workspace memory', { x: R[0] + 14, y: R[1] + 24, font: 'pixel', size: 16, fill: C.dim }),
    s.text('memory.md', { x: R[0] + 14, y: R[1] + 48, font: 'semi', size: 14, fill: C.text }),
    ...notes.map((line, k) => s.text(line, { x: R[0] + 14, y: R[1] + 82 + k * 22, font: 'mono', size: 13, fill: C.dim })),
    appear(s, g({}, box(R[0] + 8, R[1] + 112, R[2] - 16, 22, '#14532d'),
      s.text('+ tax rounds half-even', { x: R[0] + 14, y: R[1] + 127, font: 'mono', size: 13, fill: C.lit })), t + 1.2),
    pulse(s, t + 1.0, [L[0] + 240, L[1] + 112], [R[0] + 12, L[1] + 123]),
    appear(s, g({},
      s.text('same memory on any machine,', { x: R[0] + 14, y: R[1] + 176, font: 'mono', size: 13, fill: C.text }),
      s.text('any vendor, any agent', { x: R[0] + 14, y: R[1] + 198, font: 'mono', size: 13, fill: C.text })), t + 2.2),
  ]);
  ACTS.claude.work.push([t + 0.5, t + 1.2]);
  ACTS.claude.hops.push([t + 1.2, 12]);
  ACTS.codex.hops.push([t + 2.0, 14]);
  ACTS.codex.done.push([t + 2.3, B[1]]);
}

// 02: the supervisor splits a feature into three tasks in three workspaces
// and follows each one to Done.
function supervisor(s) {
  const t = B[1];
  const SUP = [456, 130, 220, 64];
  const WORK = [
    ['api', 'Invoices endpoint', 'codex', 2.0],
    ['web', 'Invoice page', 'agy', 2.4],
    ['docs', 'Billing guide', 'hermes', 2.8],
  ];
  const CX = 760;
  const CW = 404;
  const cy = (k) => 58 + k * 74;
  const parts = [
    box(...SUP, C.card, C.line),
    s.text('supervisor', { x: SUP[0] + 14, y: SUP[1] + 24, font: 'pixel', size: 16, fill: C.dim }),
    s.text('Ship billing v2', { x: SUP[0] + 14, y: SUP[1] + 48, font: 'semi', size: 15, fill: C.text }),
    dot(SUP[0] + 150, SUP[1] + 16, mascotByName('claude').color),
    s.text('claude', { x: SUP[0] + 160, y: SUP[1] + 23, font: 'mono', size: 11, fill: C.dim }),
    appear(s, g({}, hline(SUP[0] + SUP[2], 720, SUP[1] + 32), vline(720, cy(0) + 28, cy(2) + 28),
      ...WORK.map((_, k) => hline(720, CX, cy(k) + 28))), t + 0.5),
    appear(s, s.text('3 of 3 done, claude reports back', { x: SUP[0], y: 252, font: 'mono', size: 13, fill: C.lit }), t + 3.1),
  ];
  WORK.forEach(([ws, task, agent, end], k) => {
    const at = t + 0.6 + 0.2 * k;
    const y = cy(k);
    const m = mascotByName(agent);
    parts.push(appear(s, g({},
      box(CX, y, CW, 56, C.card, C.line),
      s.anim(el('rect', { x: CX, y, width: 4, height: 56, class: 'px' }),
        [[0, { fill: C.notstarted }], [t + 1.1, { fill: C.ongoing }, 'step'], [t + end, { fill: C.done }, 'step']]),
      s.text(ws, { x: CX + 16, y: y + 22, font: 'pixel', size: 16, fill: C.dim }),
      s.text(task, { x: CX + 16, y: y + 44, font: 'semi', size: 14, fill: C.text }),
      dot(CX + CW - 120, y + 16, m.color),
      s.text(agent, { x: CX + CW - 108, y: y + 23, font: 'mono', size: 11, fill: C.dim }),
      appear(s, sprite(CHECK, { '#': C.ongoing }, { px: 3, x: CX + CW - 36, y: y + 30 }), t + end),
    ), at));
    ACTS[agent].alert.push([at, t + 1.1]);
    ACTS[agent].work.push([t + 1.1, t + end]);
    ACTS[agent].done.push([t + end, B[2]]);
    ACTS[agent].hops.push([t + end, 18]);
  });
  beat(s, 1, [...parts, ...WORK.map((_, k) => pulse(s, t + 0.5 + 0.2 * k, [SUP[0] + SUP[2], SUP[1] + 32], [CX, cy(k) + 28]))]);
  ACTS.claude.work.push([t + 0.2, t + 0.6]);
  ACTS.claude.done.push([t + 3.1, B[2]]);
}

// 03: a workflow written as an indented list; each event lights the next
// agent, which gets a task in plain words.
function chain(s) {
  const t = B[2];
  const E = [456, 56, 380, 220];
  const LINES = ['- event:pr_merged', '  - agent:qa', '    - event:qa_passed', '      - agent:deploy', '        - event:deploy_finished', '          - agent:release-notes'];
  const lit = (k) => t + 0.3 + 0.5 * k;
  const TASKS = [[1, 'qa', 'codex', 'Run the e2e suite on main'], [3, 'deploy', 'agy', 'Ship main to production'], [5, 'release-notes', 'hermes', 'Write the release notes']];
  const parts = [
    box(...E, SCREEN, BORDER),
    s.text('text mode', { x: E[0] + 14, y: E[1] + 24, font: 'pixel', size: 16, fill: C.dim }),
  ];
  LINES.forEach((line, k) => {
    const y = E[1] + 54 + k * 26;
    const event = line.includes('event:');
    parts.push(s.anim(box(E[0] + 6, y - 15, E[2] - 12, 22, '#14532d'), [[0, { opacity: 0 }], [lit(k), { opacity: 1 }, 'step'], [lit(k) + 0.5, { opacity: 0.35 }]]));
    // SVG collapses leading spaces, so the indent is an offset: 0.6em a character.
    const indent = line.length - line.trimStart().length;
    parts.push(s.text(line.trimStart(), { x: E[0] + 14 + indent * 7.8, y, font: 'mono', size: 13, fill: event ? C.cron : C.text }));
  });
  TASKS.forEach(([k, ws, agent, task], n) => {
    const y = 60 + n * 74;
    const at = lit(k) + 0.2;
    parts.push(appear(s, g({},
      box(852, y, 312, 58, C.card, C.line),
      s.text(`new task in ${ws}`, { x: 866, y: y + 22, font: 'mono', size: 11, fill: C.dim }),
      dot(1150 - agent.length * 7 - 12, y + 16, mascotByName(agent).color),
      s.text(agent, { x: 1150, y: y + 23, font: 'mono', size: 11, fill: C.dim, anchor: 'end' }),
      s.text(task, { x: 866, y: y + 45, font: 'semi', size: 14, fill: C.text })), at));
    parts.push(pulse(s, at - 0.3, [E[0] + E[2], E[1] + 54 + k * 26 - 4], [852, y + 29], { fill: C.cron, dur: 0.3 }));
    ACTS[agent].alert.push([at, at + 0.4]);
    ACTS[agent].work.push([at + 0.4, at + 1.0]);
    ACTS[agent].done.push([at + 1.0, B[3]]);
    ACTS[agent].hops.push([at + 1.0, 14]);
  });
  beat(s, 2, parts);
}

// 04: one skill, a switch per workspace; you turn it on for three more.
const SW = [[0, 'api', 'codex'], [1, 'web', 'agy'], [2, 'docs', 'hermes'], [3, 'ops', 'openclaw']];
const switchAt = (k) => B[3] + 0.6 + 0.6 * k;          // k 1..3; api is on already
const switchXY = (k) => ({ x: 1120, y: 112 + k * 40 });

function skills(s) {
  const t = B[3];
  const parts = [
    s.text('skill', { x: 456, y: 80, font: 'pixel', size: 16, fill: C.dim }),
    s.text('pr-review', { x: 516, y: 80, font: 'semi', size: 15, fill: C.text }),
    s.text('SKILL.md + 2 files', { x: 1164, y: 80, font: 'mono', size: 12, fill: C.dim, anchor: 'end' }),
  ];
  for (const [k, ws, agent] of SW) {
    const y = 96 + k * 40;
    const on = k === 0 ? 0 : switchAt(k);
    const { x } = switchXY(k);
    parts.push(
      box(456, y, 708, 32, C.column),
      s.text(ws, { x: 472, y: y + 21, font: 'semi', size: 14, fill: C.text }),
      dot(540, y + 13, mascotByName(agent).color),
      s.text(agent, { x: 552, y: y + 20, font: 'mono', size: 11, fill: C.dim }),
      s.anim(el('rect', { x: x - 22, y: y + 6, width: 44, height: 20, class: 'px' }),
        [[0, { fill: k === 0 ? C.ongoing : C.line }], ...(k ? [[on, { fill: C.ongoing }, 'step']] : [])]),
      s.anim(el('rect', { x: 0, y: y + 9, width: 14, height: 14, fill: C.text, class: 'px' }),
        [[0, { x: k === 0 ? x + 5 : x - 19 }], ...(k ? [[on, { x: x - 19 }], [on + 0.2, { x: x + 5 }, 'out']] : [])]),
    );
    ACTS[agent].done.push([k === 0 ? t + 0.3 : on + 0.1, B[4]]);
    if (k) ACTS[agent].hops.push([on + 0.1, 14]);
  }
  parts.push(appear(s, s.text('one playbook, edited once, every agent', { x: 456, y: 270, font: 'mono', size: 13, fill: C.lit }), t + 2.6));
  beat(s, 3, parts);
}

// 05: claude asks on a machine at home; you answer on your phone.
const TAP = B[4] + 1.4;
const TAP_AT = { x: 560, y: 250 };

function terminal(s) {
  const t = B[4];
  const P = [470, 52, 180, 232];
  const M = [900, 120, 250, 70];
  const lines = [
    [0, '> fix the flaky test', C.text],
    [0, '* Read(login.spec.ts)', C.dim],
    [0, '* Update(session.ts)', C.dim],
    [t + 0.6, 'Apply this edit? y/n', C.ask],
    [TAP, 'y', C.text],
    [t + 1.9, '* Edit applied.', C.dim],
    [t + 2.4, '* 12 tests pass', C.lit],
  ];
  const parts = [
    el('rect', { x: P[0], y: P[1], width: P[2], height: P[3], rx: 18, fill: SCREEN, stroke: BORDER, 'stroke-width': 3 }),
    el('rect', { x: P[0] + 66, y: P[1] + 10, width: 48, height: 6, rx: 3, fill: BORDER }),
    ...lines.map(([at, line, fill], k) => {
      const node = s.text(line, { x: P[0] + 14, y: P[1] + 40 + k * 20, font: 'mono', size: 11, fill });
      return at ? appear(s, node, at) : node;
    }),
    appear(s, g({}, box(TAP_AT.x - 40, TAP_AT.y - 14, 80, 26, C.ask),
      s.text('Yes', { x: TAP_AT.x, y: TAP_AT.y + 4, font: 'semi', size: 13, fill: C.ink, anchor: 'middle' })), t + 0.6, TAP + 0.2),
    // The wire from your phone to the machine.
    ...Array.from({ length: 30 }, (_, k) => el('rect', { x: P[0] + P[2] + 10 + k * 8, y: 154, width: 4, height: 2, fill: WIRE, class: 'px' })),
    pulse(s, TAP, [P[0] + P[2] + 10, 155], [M[0], 155], { dur: 0.4 }),
    pulse(s, t + 1.9, [M[0], 155], [P[0] + P[2] + 10, 155], { dur: 0.4, fill: C.text }),
    box(...M, C.card, C.line),
    s.text('dev-box', { x: M[0] + 14, y: M[1] + 26, font: 'pixel', size: 16, fill: C.dim }),
    dot(M[0] + 14, M[1] + 42, mascotByName('claude').color),
    s.text('claude code, live', { x: M[0] + 26, y: M[1] + 50, font: 'mono', size: 12, fill: C.text }),
    s.text('same session from your phone,', { x: 1025, y: 236, font: 'mono', size: 12, fill: C.dim, anchor: 'middle' }),
    s.text('any browser, the Chrome panel', { x: 1025, y: 256, font: 'mono', size: 12, fill: C.dim, anchor: 'middle' }),
  ];
  beat(s, 4, parts);
  ACTS.claude.ask.push([t + 0.6, TAP]);
  ACTS.claude.work.push([TAP + 0.1, t + 2.4]);
  ACTS.claude.done.push([t + 2.4, B[5]]);
  ACTS.claude.hops.push([TAP + 0.1, 14], [t + 2.4, 18]);
}

// 06: claude joins over Claude Channels, the rest over ACP v1, all into
// one workspace.
function protocols(s) {
  const t = B[5];
  const HUB = [680, 52, 260, 50];
  const CH = [456, 168, 140, 56];
  const ACP = [612, 168, 552, 56];
  const hubX = HUB[0] + HUB[2] / 2;
  const chX = CH[0] + CH[2] / 2;
  const acpX = ACP[0] + ACP[2] / 2;
  const acp = ['codex', 'agy', 'hermes', 'openclaw'];
  const parts = [
    vline(hubX, HUB[1] + HUB[3], 136), hline(chX, acpX, 136), vline(chX, 136, CH[1]), vline(acpX, 136, ACP[1]),
    vline(X.claude, CH[1] + 56, 292),
    ...acp.map((n) => vline(X[n], ACP[1] + 56, 292)),
    box(...HUB, C.card, C.line),
    s.text('AgentRQ workspace', { x: hubX, y: HUB[1] + 22, font: 'semi', size: 14, fill: C.text, anchor: 'middle' }),
    s.text('tasks, replies, permissions', { x: hubX, y: HUB[1] + 40, font: 'mono', size: 11, fill: C.dim, anchor: 'middle' }),
    box(...CH, C.card, '#d97757'),
    s.text('Claude', { x: chX, y: CH[1] + 23, font: 'semi', size: 14, fill: C.text, anchor: 'middle' }),
    s.text('Channels', { x: chX, y: CH[1] + 43, font: 'semi', size: 14, fill: C.text, anchor: 'middle' }),
    box(...ACP, C.card, C.cron),
    s.text('ACP v1', { x: acpX, y: ACP[1] + 23, font: 'semi', size: 14, fill: C.text, anchor: 'middle' }),
    s.text('acp-gateway, any ACP agent', { x: acpX, y: ACP[1] + 43, font: 'mono', size: 11, fill: C.dim, anchor: 'middle' }),
    // Tasks go down to every agent, then replies come back up.
    pulse(s, t + 0.5, [hubX, HUB[1] + 50], [hubX, 136], { dur: 0.3 }),
    pulse(s, t + 0.8, [hubX, 136], [chX, 136], { dur: 0.3 }),
    pulse(s, t + 0.8, [hubX, 136], [acpX, 136], { dur: 0.3 }),
    pulse(s, t + 1.1, [chX, 136], [X.claude, 292], { dur: 0.4 }),
    ...acp.map((n, k) => pulse(s, t + 1.1 + 0.1 * k, [X[n], ACP[1] + 56], [X[n], 292], { dur: 0.4 })),
    ...['claude', ...acp].map((n, k) => pulse(s, t + 2.0 + 0.1 * k, [X[n], 292], [X[n], 240], { dur: 0.3, fill: C.text })),
  ];
  beat(s, 5, parts);
  for (const n of ['claude', ...acp]) {
    ACTS[n].alert.push([t + 1.5, t + 2.0]);
    ACTS[n].done.push([t + 2.1, B[6]]);
  }
}

// You: three switches in beat 4, then Yes on your phone in beat 5.
function pointer(s) {
  const sw = [1, 2, 3].map(switchXY);
  cursor(s, [
    [0, OFF],
    [B[3], OFF],
    [switchAt(1) - 0.3, sw[0], 'inOut'],
    ...press(switchAt(1), sw[0]),
    [switchAt(2) - 0.3, sw[1], 'inOut'],
    ...press(switchAt(2), sw[1]),
    [switchAt(3) - 0.3, sw[2], 'inOut'],
    ...press(switchAt(3), sw[2]),
    [switchAt(3) + 0.4, sw[2]],
    [B[4] + 0.6, OFF, 'inOut'],
    [TAP - 0.6, OFF],
    [TAP - 0.15, TAP_AT, 'inOut'],
    ...press(TAP, TAP_AT),
    [TAP + 0.4, TAP_AT],
    [TAP + 1, OFF, 'inOut'],
  ]);
}
