// AgentRQ's events and workflows: when a workspace's task completes it fires
// a named event, and every workspace wired to that event gets a new task.
import { sprite, el, g } from '../src/index.js';
import {
  C, CHECK, OFF, newScene, sky, ground, intro, mascot, mascotByName, cursor, during,
} from '../kit/agentrq.js';

// The app draws events in violet.
const EV = { text: '#a78bfa', bg: '#1a1528', line: '#3b2d63', lit: '#c4b5fd' };
const EDGE = '#3f3f46';
const START = '#34d399';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const GRAB = 1;                            // you pick up release in the palette
const DROP = 2.6;                          // and drop it on deploy_finished
const PULSE = 0.5;                         // a pulse runs one edge
const FLY = 1;                             // a new task reaches its agent
const QA_DONE = 4.6;                       // claude finishes the qa task
const FIRE = [5, 11.2];                    // qa_passed, deploy_finished
const WORK = 3;                            // how long codex and hermes work
const DANCE = 18.2;
const RESET = 22.6;

// Each event fires, a pulse runs into it and on into its subscriber, which
// gets a task; its agent then works for WORK seconds.
const HOP = (t) => ({ lit: t + PULSE, next: t + 2 * PULSE + 0.2 });
const TASK = (k) => HOP(FIRE[k]).next;
const POP = (k) => TASK(k) + 0.3;         // its card pops out of the workspace
const ARRIVE = (k) => POP(k) + 0.2 + FLY;
const DONE = (k) => ARRIVE(k) + 0.6 + WORK;

// ---------------------------------------------------------------- the screen
const BX = 440;
const BY = 20;
const BW = 740;
const BH = 272;
const PAL = { x: 454, w: 116 };
const CV = { x: 584, y: 62, w: 584, h: 222 };
const TOP = 84;                            // events
const BOT = 202;                           // workspaces
const EV_H = 36;
const WS_H = 50;

// The graph, left to right; it zigzags between events above and workspaces
// below, as the run alternates between them.
const NODES = [
  { kind: 'event', label: 'pr_merged', x: 590, w: 157, start: true },
  { kind: 'agent', label: 'qa', x: 703, w: 106, emits: 'qa_passed', agent: 'claude' },
  { kind: 'event', label: 'qa_passed', x: 765, w: 118 },
  { kind: 'agent', label: 'deploy', x: 839, w: 132, emits: 'deploy_finished', agent: 'codex', task: 'Deploy to production' },
  { kind: 'event', label: 'deploy_finished', x: 927, w: 158 },
  { kind: 'agent', label: 'release', x: 1041, w: 122, agent: 'hermes', task: 'Write release notes', added: DROP },
];
const nodeY = (n) => (n.kind === 'event' ? TOP : BOT);
const nodeH = (n) => (n.kind === 'event' ? EV_H : n.emits ? WS_H : EV_H);
const mid = (n) => n.x + n.w / 2;

// Edge i joins node i to node i + 1, straight up or down through where they
// overlap.
const EDGES = NODES.slice(1).map((to, i) => {
  const from = NODES[i];
  const x = Math.round((to.x + from.x + from.w) / 2);
  return { x, down: from.kind === 'event', from, to };
});

// When each event is lit, and each workspace's task.
const EVENT_LIT = { qa_passed: HOP(FIRE[0]).lit, deploy_finished: HOP(FIRE[1]).lit };
const PULSES = FIRE.flatMap((t, k) => [[1 + 2 * k, t], [2 + 2 * k, t + PULSE + 0.2]]);

export default function eventsWorkflows() {
  const s = newScene({
    poster: TASK(1) + 0.04,
    description: 'AgentRQ workflows: you drag the release workspace onto the deploy_finished event. claude finishes the qa task, so qa_passed fires and a pulse runs into deploy, which gets a new task; codex deploys, deploy_finished fires and release gets its task; hermes writes the release notes and claude, codex and hermes celebrate.',
  });

  sky(s);
  ground(s);
  story(s);
  screen(s);
  palette(s);
  EDGES.forEach((e, i) => edge(s, e, i));
  NODES.forEach((n) => node(s, n));
  PULSES.forEach(([i, t]) => pulse(s, EDGES[i], t));
  card(s, NODES[3], 0);
  card(s, NODES[5], 1);
  agents(s);
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'workflows',
    headline: ['One finishes,', 'the next begins.'],
    sub: 'Named events chain your workspaces.',
    steps: [['wire', 0.4, QA_DONE - 0.4], ['finish', QA_DONE - 0.4, EVENT_LIT.qa_passed], ['fire', EVENT_LIT.qa_passed, FIRE[1]], ['chain', FIRE[1], RESET]],
    log: [
      [0, GRAB, '> qa: claude testing_'],
      [GRAB, DROP + 0.2, '> you: drag release'],
      [DROP + 0.2, QA_DONE, '> release on deploy_finished'],
      [QA_DONE, EVENT_LIT.qa_passed, '> qa finished'],
      [EVENT_LIT.qa_passed, TASK(0), '> event: qa_passed', EV.text],
      [TASK(0), DONE(0), '> deploy: new task'],
      [DONE(0), EVENT_LIT.deploy_finished, '> deploy finished'],
      [EVENT_LIT.deploy_finished, TASK(1), '> event: deploy_finished', EV.text],
      [TASK(1), DONE(1), '> release: new task'],
      [DONE(1), DANCE, '> release notes written'],
      [DANCE, RESET, '> chained, no glue code'],
    ],
  });
}

// The workflow's page: its name, the Graph | Text switch, and the canvas.
function screen(s) {
  s.add(
    el('rect', { x: BX, y: BY, width: BW, height: BH, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    s.text('Workflows', { x: BX + 16, y: BY + 26, font: 'semi', size: 15, fill: C.dim }),
    s.text('/', { x: BX + 100, y: BY + 26, font: 'semi', size: 15, fill: '#52525b' }),
    s.text('ship-it', { x: BX + 114, y: BY + 26, font: 'mono', size: 15, fill: C.text }),
    el('rect', { x: 1064, y: 28, width: 104, height: 22, fill: C.bg, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    el('rect', { x: 1067, y: 31, width: 50, height: 16, fill: C.card, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    s.text('Graph', { x: 1092, y: 43, font: 'semi', size: 11, fill: C.text, anchor: 'middle' }),
    s.text('Text', { x: 1142, y: 43, font: 'semi', size: 11, fill: C.dim, anchor: 'middle' }),
    el('rect', { x: CV.x, y: CV.y, width: CV.w, height: CV.h, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
  );
}

const chipAt = (k) => ({ x: PAL.x, y: k < 3 ? 92 + k * 28 : 202 + (k - 3) * 28 });

function chip(s, label, event, { w = PAL.w, stroke } = {}) {
  return g({},
    el('rect', { width: w, height: 22, fill: event ? EV.bg : C.card, stroke: stroke ?? (event ? EV.line : C.line), 'stroke-width': stroke ? 2 : 1, class: 'px' }),
    s.text(label, { x: 8, y: 15, font: event ? 'mono' : 'semi', size: 12, fill: event ? EV.text : C.text }));
}

// The palette: workspaces to drag onto an event, events to drag onto a
// workspace.
function palette(s) {
  const head = (label, y) => s.text(label, { x: PAL.x, y, font: 'semi', size: 11, fill: C.dim, spacing: 1 });
  s.add(head('WORKSPACES', 80), head('EVENTS', 190));
  ['qa', 'deploy', 'release', 'qa_passed', 'deploy_finished'].forEach((label, k) => {
    const { x, y } = chipAt(k);
    s.add(g({ transform: `translate(${x} ${y})` }, chip(s, label, k >= 3)));
  });
}

const ARROW = { down: '#####\n.###.\n..#..', up: '..#..\n.###.\n#####' };

function edge(s, e, i) {
  const y1 = TOP + EV_H;
  const y2 = BOT;
  const draw = (fill) => g({},
    el('rect', { x: e.x - 2, y: y1 + (e.down ? 0 : 6), width: 4, height: y2 - y1 - 6, fill, class: 'px' }),
    sprite(ARROW[e.down ? 'down' : 'up'], { '#': fill }, { px: 2, x: e.x - 5, y: e.down ? y2 - 6 : y1 }));
  if (!e.to.added) {
    s.add(draw(EDGE));
    return;
  }
  // The edge you wire in snaps on, lit for a moment.
  const at = e.to.added + 0.1;
  s.add(s.anim(draw(EDGE), [[0, { opacity: 0 }], [at, { opacity: 1 }, 'step'], [RESET, { opacity: 1 }], [RESET + 0.5, { opacity: 0 }]]));
  s.add(during(s, draw(EV.lit), [[at, at + 0.2], [at + 0.35, at + 0.6]]));
}

function badge(s, label, fill, color) {
  const w = label.length * 7 + 6;
  return g({},
    el('rect', { x: 8, y: 11, width: w, height: 14, fill, class: 'px' }),
    s.text(label, { x: 8 + w / 2, y: 22, font: 'pixel', size: 8, fill: color, anchor: 'middle' }));
}

function node(s, n) {
  const y = nodeY(n);
  const h = nodeH(n);
  const event = n.kind === 'event';
  const parts = [
    el('rect', { width: n.w, height: h, fill: event ? EV.bg : C.card, stroke: event ? EV.line : C.line, 'stroke-width': event ? 2 : 1, class: 'px' }),
    badge(s, n.kind, event ? '#2e2150' : '#27272a', event ? EV.lit : C.dim),
    s.text(n.label, { x: 52, y: 23, font: 'mono', size: 11, fill: C.text }),
  ];
  if (n.start) parts.push(s.text('start', { x: n.w - 10, y: 22, font: 'pixel', size: 8, fill: START, anchor: 'end' }));
  if (n.emits) {
    parts.push(
      s.text('emits', { x: 10, y: 41, font: 'body', size: 9, fill: '#71717a' }),
      s.text(n.emits, { x: 38, y: 41, font: 'mono', size: 9, fill: C.dim }));
  }

  if (event && EVENT_LIT[n.label]) {
    // Fired: a flash, then lit until the loop turns.
    const t = EVENT_LIT[n.label];
    parts.push(
      s.anim(el('rect', { width: n.w, height: h, fill: EV.text, class: 'px' }),
        [[0, { opacity: 0 }], [t, { opacity: 0.45 }, 'step'], [t + 0.5, { opacity: 0.16 }], [RESET, { opacity: 0.16 }], [RESET + 0.5, { opacity: 0 }]]),
      during(s, el('rect', { width: n.w, height: h, fill: 'none', stroke: EV.lit, 'stroke-width': 2, class: 'px' }), [[t, RESET + 0.5]]));
  }
  if (n.label === 'deploy_finished') {
    // The drop target while you drag release over it.
    parts.push(during(s, el('rect', { x: -4, y: -4, width: n.w + 8, height: h + 8, fill: 'none', stroke: C.text, 'stroke-width': 2, class: 'px' }), [[DROP - 0.5, DROP]]));
  }

  if (!event) {
    // A workspace's task: ongoing (green edge) while its agent works, then
    // the tick.
    const k = n.label === 'deploy' ? 0 : n.label === 'release' ? 1 : -1;
    const work = k < 0 ? [0, QA_DONE] : [TASK(k), DONE(k)];
    if (k >= 0) {
      parts.push(s.anim(el('rect', { width: n.w, height: h, fill: C.lit, class: 'px' }),
        [[0, { opacity: 0 }], [TASK(k), { opacity: 0.4 }, 'step'], [TASK(k) + 0.6, { opacity: 0 }]]));
    }
    parts.push(
      during(s, el('rect', { width: n.w, height: h, fill: 'none', stroke: C.ongoing, 'stroke-width': 2, class: 'px' }), [work]),
      during(s, el('rect', { width: 4, height: h, fill: C.ongoing, class: 'px' }), [work]),
      s.anim(sprite(CHECK, { '#': C.ongoing }, { px: 2, x: n.w - 20, y: 12 }), [[0, { opacity: 0 }], [work[1], { opacity: 1 }, 'step'], [RESET + 0.5, { opacity: 0 }, 'step']]));
  }

  // While you drag a workspace, only events take it: the rest dim.
  const dim = event ? [] : [[DROP - 1.6, { opacity: 0.4 }], [DROP, { opacity: 1 }, 'step']];
  if (n.added) {
    // Drawn round its centre so it pops in from there.
    const body = g({ transform: `translate(${-n.w / 2} ${-h / 2})` }, parts);
    s.add(s.anim(body, [
      [0, { x: mid(n), y: y + h / 2, scale: 0.4, opacity: 0 }],
      [n.added, { scale: 0.4, opacity: 0 }, 'step'],
      [n.added + 0.35, { scale: 1, opacity: 1 }, 'back'],
      [RESET, { opacity: 1 }],
      [RESET + 0.5, { opacity: 0 }],
    ]));
  } else {
    s.add(s.anim(g({}, parts), [[0, { x: n.x, y, opacity: 1 }], [DROP - 1.6, { opacity: 1 }], ...dim]));
  }
}

// A pulse running along an edge, into the event or out of it.
function pulse(s, e, t) {
  const [ya, yb] = e.down ? [TOP + EV_H, BOT - 8] : [BOT - 2, TOP + EV_H - 6];
  const dot = g({},
    el('rect', { x: -9, y: -5, width: 18, height: 18, fill: EV.lit, opacity: 0.3, class: 'px' }),
    el('rect', { x: -5, y: -1, width: 10, height: 10, fill: '#fff', class: 'px' }));
  s.add(s.anim(dot, [
    [0, { x: e.x, y: ya, opacity: 0 }],
    [t, { opacity: 1 }, 'step'],
    [t + PULSE, { y: yb }, 'in'],
    [t + PULSE + 0.08, { opacity: 0 }, 'step'],
  ]));
}

// The new task the event made: it pops out of the workspace and drops to
// its agent.
function card(s, n, k) {
  const W = 150;
  const H = 34;
  const ev = ['qa_passed', 'deploy_finished'][k];
  const t = POP(k);
  const from = { x: Math.min(mid(n) - W / 2, CV.x + CV.w - W - 6), y: BOT + 8 };
  const to = { x: mid(n) - W * 0.35, y: 300 };
  const parts = [
    el('rect', { width: W, height: H, fill: C.card, stroke: EV.line, 'stroke-width': 1, class: 'px' }),
    el('rect', { width: 4, height: H, fill: C.notstarted, class: 'px' }),
    s.text(n.task, { x: 12, y: 15, font: 'semi', size: 12, fill: C.text }),
    s.text(`on ${ev}`, { x: 12, y: 28, font: 'mono', size: 10, fill: EV.text }),
  ];
  s.add(s.anim(g({}, parts), [
    [0, { ...from, scale: 0.6, opacity: 0 }],
    [t, { opacity: 0 }, 'step'],
    [t + 0.3, { x: from.x, y: from.y - 18, scale: 1, opacity: 1 }, 'back'],
    [t + 0.2 + 0.4, {}],
    [t + 0.2 + FLY, { ...to, scale: 0.7 }, 'inOut'],
    [t + 0.2 + FLY + 0.25, { opacity: 0 }],
  ]));
}

// claude works from the start; codex and hermes wake when their task lands.
function agents(s) {
  const dance = (i) => [[DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]];
  mascot(s, mascotByName('claude'), 0, {
    x: mid(NODES[1]),
    work: [[0, QA_DONE]],
    done: [[QA_DONE, RESET]],
    hops: [[QA_DONE, 22], ...dance(0)],
  });
  [['codex', NODES[3]], ['hermes', NODES[5]]].forEach(([name, n], k) => {
    mascot(s, mascotByName(name), k + 1, {
      x: mid(n),
      alert: [[ARRIVE(k), ARRIVE(k) + 0.6]],
      work: [[ARRIVE(k) + 0.6, DONE(k)]],
      done: [[DONE(k), RESET]],
      hops: [[ARRIVE(k), 14], [DONE(k), 22], ...dance(k + 1)],
    });
  });
}

// You: pick release up in the palette and drop it on deploy_finished.
function pointer(s) {
  const grab = { x: PAL.x + 24, y: chipAt(2).y + 12 };
  const target = { x: mid(NODES[4]) + 10, y: TOP + 24 };
  const ghost = (p) => ({ x: p.x - 24, y: p.y - 12 });
  s.add(s.anim(chip(s, 'release', false, { w: 72, stroke: C.text }), [
    [0, { ...ghost(grab), opacity: 0 }],
    [GRAB, { opacity: 1 }, 'step'],
    [GRAB + 0.2, ghost(grab)],
    [DROP - 0.4, ghost(target), 'inOut'],
    [DROP, { opacity: 0 }, 'step'],
  ]));
  cursor(s, [
    [0, OFF],
    [0.2, OFF],
    [GRAB - 0.2, grab, 'inOut'],
    [GRAB, { ...grab, scale: 0.85 }, 'step'],
    [GRAB + 0.2, grab],
    [DROP - 0.4, target, 'inOut'],
    [DROP, { ...target, scale: 1 }, 'step'],
    [DROP + 0.5, target],
    [DROP + 1.2, OFF, 'inOut'],
  ]);
}
