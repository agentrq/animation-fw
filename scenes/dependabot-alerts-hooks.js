// Dependabot alerts wake an agent through a hook. GitHub raises an alert on
// lodash and posts it to a hook's payload URL. A dependabot hook checks the
// signature and fires dependabot.alert_created, routed to the account's
// dependabot_alert_created event, whose trigger files a task in api-service.
// claude, asleep until then, wakes, asks once to run npm install, gets it
// allowed, opens a pull request and finishes the task.
import { el, g, sprite } from '../src/index.js';
import {
  C, OFF, newScene, sky, ground, intro, frame, mascot, mascotByName, cursor, press, CHECK,
} from '../kit/agentrq.js';

// The app draws events in violet.
const EV = { text: '#a78bfa', bg: '#1a1528', line: '#3b2d63', lit: '#c4b5fd' };
const EDGE = '#3f3f46';
const HIGH = '#f97316';     // GitHub's high severity

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop. Each beat owns a span.
const B = [0.3, 6.0, 11.4, 17.0, 22.4];
const FADE = 0.25;
const ALERT = 0.9;          // Dependabot raises the alert
const SEND = 2.8;           // GitHub posts it to the payload URL
const LAND = 3.6;
const ACCEPT = 4.0;         // 202 Accepted
const QUEUED = 6.5;         // the delivery, queued
const PUBLISHED = 8.0;      // the hook checked it and fired its event
const FIRE = 8.6;           // dependabot_alert_created fires
const TASK = 9.6;           // its trigger files a task in api-service
const FILED = 11.8;         // the card on the board
const WAKE = 12.4;          // claude wakes
const START = 13.4;         // and takes it
const ASK = 17.5;           // Authorization Required: npm install
const ALLOW = 19.0;         // Allow Once
const PR = 19.9;            // pull request opened
const DONE = 21.0;          // the task is done
const DANCE = 21.4;
const RESET = 22.6;

// ---------------------------------------------------------------- the stage
const BX = 440;
const BY = 20;
const BW = 740;
const LX = BX + 12;         // left pane
const LW = 352;
const RX = LX + LW + 12;    // right pane
const RW = BX + BW - 12 - RX;
const PY = BY + 44;
const PH = 220;

const COLS = ['Not Started', 'Ongoing', 'Done'];
const COL_DOT = [C.notstarted, C.ongoing, C.done];
const COL_W = 110;
const colX = (c) => LX + 4 + c * (COL_W + 6);
const CARD_W = COL_W - 12;
const CARD_H = 44;

const CLAUDE = mascotByName('claude');

const appear = (s, node, t, until) => s.anim(node, until
  ? [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step'], [until, { opacity: 0 }, 'step']]
  : [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step']]);

// Content shown from the start of beat i to the end of beat j.
function span(s, i, j, nodes) {
  const [from, to] = [B[i], B[j + 1]];
  s.add(s.anim(g({}, nodes), [[0, { opacity: 0 }], [from, { opacity: 0 }], [from + FADE, { opacity: 1 }], [to - FADE, { opacity: 1 }], [to, { opacity: 0 }]]));
}
const beat = (s, i, nodes) => span(s, i, i, nodes);

const box = (x, y, w, h, fill = C.column, stroke) => el('rect', { x, y, width: w, height: h, fill, stroke, 'stroke-width': stroke ? 2 : undefined, class: 'px' });
const rect = (a, fill) => el('rect', { ...a, fill, class: 'px' });

export default function dependabotAlertsHooks() {
  const s = newScene({
    poster: 21.6,
    description: 'Dependabot alerts wake an agent through AgentRQ Hooks. GitHub raises a high-severity Dependabot alert on lodash in acme/api-service and posts it, signed, to a hook\'s payload URL. The dependabot hook checks X-Hub-Signature-256, its delivery goes from queued to published, and the dependabot.alert_created route fires the dependabot_alert_created event, whose trigger files a task in the api-service workspace. claude, asleep until then, wakes and takes the task, asks once to run npm install lodash@4.17.21, is allowed once, opens a pull request bumping lodash and moves the task to Done.',
  });

  sky(s);
  ground(s);
  story(s);
  frame(s, { x: BX, y: BY, w: BW, h: 272, title: '' });
  // The stage's title, per beat: GitHub, then the app's own screens.
  const title = (t) => s.text(t, { x: BX + 16, y: BY + 26, font: 'semi', size: 15, fill: C.text });
  beat(s, 0, [title('GitHub')]);
  beat(s, 1, [title('Events \u203a Hooks')]);
  span(s, 2, 3, [title('All workspaces')]);
  github(s);
  hook(s);
  board(s);
  work(s);
  mascot(s, CLAUDE, 0, {
    x: 810,
    say: [['zZ', [[0, WAKE]]]],
    sleep: [[0, WAKE]],
    alert: [[WAKE, START]],
    hops: [[WAKE + 0.1, 16], [DANCE, 16], [DANCE + 0.8, 16]],
    work: [[START + 0.3, ASK], [ALLOW + 0.2, DONE]],
    ask: [[ASK, ALLOW + 0.2]],
    done: [[DONE, RESET]],
  });
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'hooks',
    headline: ['An alert', 'wakes Claude.'],
    sub: 'Dependabot to a task, with no polling.',
    steps: [['alert', B[0], B[1]], ['hook', B[1], B[2]], ['wake', B[2], B[3]], ['fix', B[3], B[4]]],
    log: [
      [0, ALERT, '> claude: idle, zZ_'],
      [ALERT, SEND, '> dependabot: lodash, high', HIGH],
      [SEND, ACCEPT, '> github: POST payload URL'],
      [ACCEPT, QUEUED, '> agentrq: 202 Accepted'],
      [QUEUED, PUBLISHED, '> hook: checking signature'],
      [PUBLISHED, TASK, '> event: dependabot_alert_created', EV.text],
      [TASK, WAKE, '> api-service: new task'],
      [WAKE, ASK, '> claude: awake, on it'],
      [ASK, ALLOW, '> claude: may I run npm?', C.ask],
      [ALLOW, PR, '> you: allowed once'],
      [PR, DONE, '> claude: PR opened'],
      [DONE, RESET, '> alert fixed, task done'],
    ],
  });
  s.add(s.text('Events › Hooks', { x: BX + BW - 16, y: BY + 26, font: 'semi', size: 12, fill: C.dim, anchor: 'end' }));
}

// 01: GitHub raises a Dependabot alert and posts it to the payload URL.
function github(s) {
  const x = LX;
  const y = PY;
  const label = (t, k, fill = C.dim) => s.text(t, { x: x + 14, y: y + 78 + k * 20, font: 'mono', size: 12, fill });
  beat(s, 0, [
    box(x, y, LW, PH),
    s.text('acme/api-service', { x: x + 14, y: y + 22, font: 'mono', size: 12, fill: C.dim }),
    s.text('Security', { x: x + LW - 14, y: y + 22, font: 'semi', size: 11, fill: C.notstarted, anchor: 'end' }),
    appear(s, g({},
      rect({ x: x + 14, y: y + 36, width: 10, height: 10 }, HIGH),
      s.text('Dependabot alert', { x: x + 32, y: y + 46, font: 'semi', size: 14, fill: C.text }),
      box(x + LW - 64, y + 34, 50, 16, '#2a1608', HIGH),
      s.text('HIGH', { x: x + LW - 39, y: y + 46, font: 'semi', size: 10, fill: HIGH, anchor: 'middle' }),
      label('Command Injection in lodash', 0, C.text),
      label('package   lodash (npm)', 1),
      label('affected  < 4.17.21', 2),
      label('patched   4.17.21', 3, C.lit),
      label('GHSA-35jh-r3h4-6jhm', 4, C.notstarted)), ALERT),
  ]);

  // The request, with GitHub's own headers.
  const rl = (t, k, fill = C.dim) => s.text(t, { x: RX + 14, y: PY + 46 + k * 20, font: 'mono', size: 11, fill });
  beat(s, 0, [
    box(RX, PY, RW, PH),
    s.text('webhook', { x: RX + 14, y: PY + 22, font: 'pixel', size: 16, fill: C.dim }),
    appear(s, g({},
      rl('POST /api/v1/hooks/in/...', 0, C.text),
      rl('X-GitHub-Event:', 1),
      rl('dependabot_alert', 2, C.text),
      rl('X-Hub-Signature-256:', 3),
      rl('sha256=9f2c41...', 4, C.text),
      rl('action: created', 5)), LAND),
    appear(s, g({},
      sprite(CHECK, { '#': C.lit }, { px: 2, x: RX + 14, y: PY + 176 }),
      s.text('202 Accepted', { x: RX + 32, y: PY + 186, font: 'mono', size: 12, fill: C.lit })), ACCEPT),
  ]);

  // The packet flies across.
  const packet = g({},
    box(0, 0, 54, 20, EV.bg, EV.line),
    s.text('POST', { x: 27, y: 14, font: 'mono', size: 11, fill: EV.text, anchor: 'middle' }));
  s.add(s.anim(packet, [
    [0, { x: LX + LW - 80, y: PY + 186, opacity: 0 }],
    [SEND, { x: LX + LW - 80, y: PY + 186, opacity: 1 }, 'step'],
    [LAND, { x: RX + RW - 70, y: PY + 186 }, 'inOut'],
    [LAND + 0.15, { opacity: 0 }, 'step'],
  ]));
}

// 02: the registration: its hook, routes and deliveries; then the event and
// the workspace its trigger files a task in.
function hook(s) {
  const x = LX;
  const y = PY;
  const head = (t, yy) => s.text(t, { x: x + 14, y: yy, font: 'semi', size: 10, fill: C.notstarted });
  beat(s, 1, [
    box(x, y, LW, PH),
    s.text('dependabot-alerts', { x: x + 14, y: y + 24, font: 'semi', size: 14, fill: C.text }),
    box(x + LW - 76, y + 11, 62, 18, '#0f2a17', C.done),
    s.text('Enabled', { x: x + LW - 45, y: y + 24, font: 'semi', size: 10, fill: C.lit, anchor: 'middle' }),
    s.text('hook: dependabot 1.0.0', { x: x + 14, y: y + 44, font: 'mono', size: 11, fill: C.dim }),
    head('Payload URL', y + 70),
    box(x + 14, y + 76, LW - 28, 22, C.card),
    s.text('.../hooks/in/...?agentrq_hook_token=•••', { x: x + 20, y: y + 91, font: 'mono', size: 10, fill: C.dim }),
    head('Routes', y + 122),
    s.text('dependabot.alert_created', { x: x + 14, y: y + 142, font: 'mono', size: 11, fill: C.text }),
    s.text('→ dependabot_alert_created', { x: x + 14, y: y + 160, font: 'mono', size: 11, fill: EV.text }),
    head('Deliveries', y + 186),
    // The delivery's status badge: queued, then published.
    appear(s, g({},
      box(x + 14, y + 194, 62, 16, C.panel, C.line),
      s.text('QUEUED', { x: x + 45, y: y + 206, font: 'semi', size: 9, fill: C.dim, anchor: 'middle' })), QUEUED, PUBLISHED),
    appear(s, g({},
      box(x + 14, y + 194, 74, 16, '#0f2a17', C.done),
      s.text('PUBLISHED', { x: x + 51, y: y + 206, font: 'semi', size: 9, fill: C.lit, anchor: 'middle' }),
      s.text('dependabot.alert_created · 9 ms', { x: x + 96, y: y + 206, font: 'mono', size: 9, fill: C.dim })), PUBLISHED),
  ]);

  // The right pane: event node above, the workspace node below, zigzag edge.
  const ev = { x: RX + 26, y: PY + 42, w: RW - 52, h: 28 };
  const ws = { x: RX + 90, y: PY + 132, w: 140, h: 44 };
  const edge = `M${ev.x + ev.w / 2} ${ev.y + ev.h} V${ev.y + ev.h + 20} H${ws.x + ws.w / 2} V${ws.y}`;
  const flash = (a, t, fill) => appear(s, el('rect', { ...a, fill: 'none', stroke: fill, 'stroke-width': 2, class: 'px' }), t);
  beat(s, 1, [
    box(RX, PY, RW, PH),
    s.text('event', { x: RX + 14, y: PY + 24, font: 'pixel', size: 16, fill: C.dim }),
    el('path', { d: edge, stroke: EDGE, 'stroke-width': 2, fill: 'none' }),
    appear(s, el('path', { d: edge, stroke: EV.lit, 'stroke-width': 2, fill: 'none' }), FIRE + 0.4),
    box(ev.x, ev.y, ev.w, ev.h, EV.bg, EV.line),
    flash({ x: ev.x, y: ev.y, width: ev.w, height: ev.h }, FIRE, EV.lit),
    s.text('dependabot_alert_created', { x: ev.x + ev.w / 2, y: ev.y + 18, font: 'mono', size: 11, fill: EV.text, anchor: 'middle' }),
    s.text('trigger: new task', { x: ws.x + ws.w + 8, y: ev.y + ev.h + 46, font: 'mono', size: 9, fill: C.notstarted }),
    box(ws.x, ws.y, ws.w, ws.h, C.card, C.line),
    flash({ x: ws.x, y: ws.y, width: ws.w, height: ws.h }, TASK, C.ongoing),
    s.text('api-service', { x: ws.x + 10, y: ws.y + 18, font: 'semi', size: 12, fill: C.text }),
    s.text('claude', { x: ws.x + 10, y: ws.y + 35, font: 'mono', size: 10, fill: CLAUDE.color }),
    appear(s, s.text('task filed: Patch lodash', { x: RX + 14, y: PY + 204, font: 'mono', size: 11, fill: C.lit }), TASK + 0.2),
  ]);
}

// 03-04: the board, with the one task the event filed.
function board(s) {
  const counts = [
    // [from, Not Started, Ongoing, Done]
    [B[2], 0, 0, 0], [FILED, 1, 0, 0], [START, 0, 1, 0], [DONE, 0, 0, 1],
  ];
  const nodes = [box(LX, PY, LW, PH, C.panel)];
  COLS.forEach((title, c) => {
    const x = colX(c);
    nodes.push(box(x, PY + 6, COL_W, PH - 12));
    nodes.push(rect({ x: x + 8, y: PY + 16, width: 6, height: 6 }, COL_DOT[c]));
    nodes.push(s.text(title, { x: x + 19, y: PY + 23, font: 'semi', size: 11, fill: C.dim }));
    counts.forEach(([from, ...n], k) => {
      const to = counts[k + 1]?.[0] ?? 24;
      nodes.push(appear(s, s.text(String(n[c]), { x: x + COL_W - 8, y: PY + 23, font: 'mono', size: 11, fill: n[c] ? C.text : C.notstarted, anchor: 'end' }), from, to));
    });
  });
  span(s, 2, 3, nodes);

  // The card: a status bar, the workspace with its online dot, title, owner.
  const at = (c) => ({ x: colX(c) + 6, y: PY + 34 });
  const bar = (fill, from, to) => appear(s, rect({ x: 3, y: 5, width: 3, height: CARD_H - 10 }, fill), from, to);
  const dot = s.anim(rect({ x: 11, y: 7, width: 5, height: 5 }, C.ongoing),
    [[0, { opacity: 0.25 }], [WAKE, { opacity: 1 }, 'step']]);
  const body = g({},
    rect({ x: 0, y: 0, width: CARD_W, height: CARD_H }, C.card),
    bar(C.notstarted, 0, START), bar(C.ongoing, START, DONE), bar(C.done, DONE),
    dot,
    s.text('api-service', { x: 20, y: 13, font: 'mono', size: 10, fill: C.dim }),
    s.text('Patch lodash', { x: 11, y: 27, font: 'semi', size: 11, fill: C.text }),
    s.text('claude', { x: 11, y: 39, font: 'mono', size: 10, fill: CLAUDE.color }));
  s.add(s.anim(body, [
    [0, { ...at(0), y: at(0).y - 20, opacity: 0 }],
    [FILED, { ...at(0), y: at(0).y - 20, opacity: 0 }, 'step'],
    [FILED + 0.3, { ...at(0), opacity: 1 }, 'out'],
    [START - 0.01, {}], [START + 0.45, at(1), 'inOut'],
    [DONE - 0.01, {}], [DONE + 0.45, at(2), 'inOut'],
    [RESET, { opacity: 1 }], [RESET + 0.3, { opacity: 0 }],
  ]));
}

// 03: the task, its body filled from the event's payload. 04: one question,
// then the pull request.
function work(s) {
  const line = (t, k, fill = C.dim, size = 11) => s.text(t, { x: RX + 14, y: PY + 48 + k * 18, font: 'mono', size, fill });
  beat(s, 2, [
    box(RX, PY, RW, PH),
    s.text('Patch lodash', { x: RX + 14, y: PY + 24, font: 'semi', size: 13, fill: C.text }),
    appear(s, g({},
      line('Dependabot alert in', 0.3),
      line('acme/api-service:', 1.3),
      line('lodash < 4.17.21', 2.3, C.text),
      line('severity: high', 3.3, HIGH),
      line('Command Injection', 4.3, C.text),
      line('GHSA-35jh-r3h4-6jhm', 5.3),
      line('Bump it, test, open a PR.', 6.6, C.text)), FILED),
    appear(s, line('claude: on it', 8.6, C.lit), START + 0.3),
  ]);

  const bx = RX + 8;
  const by = PY + 8;
  const bw = RW - 16;
  beat(s, 3, [
    box(RX, PY, RW, PH),
    appear(s, g({},
      box(bx, by, bw, 150, C.panel, C.line),
      rect({ x: bx + 10, y: by + 10, width: 8, height: 8 }, C.ask),
      s.text('Authorization Required', { x: bx + 24, y: by + 18, font: 'semi', size: 11, fill: C.text }),
      s.text('Patch lodash - claude', { x: bx + 10, y: by + 38, font: 'mono', size: 10, fill: CLAUDE.color }),
      s.text('Action', { x: bx + 10, y: by + 58, font: 'semi', size: 9, fill: C.notstarted }),
      box(bx + 10, by + 64, bw - 20, 20, C.column),
      s.text('Bash', { x: bx + 16, y: by + 78, font: 'mono', size: 11, fill: C.text }),
      box(bx + 10, by + 90, bw - 20, 22, C.column),
      s.text('npm install lodash@4.17.21', { x: bx + 16, y: by + 105, font: 'mono', size: 10, fill: C.dim })), ASK),
    appear(s, g({},
      rect({ x: bx + 10, y: by + 120, width: 70, height: 22 }, C.text),
      s.text('Allow Once', { x: bx + 45, y: by + 135, font: 'semi', size: 10, fill: C.ink, anchor: 'middle' }),
      box(bx + 86, by + 120, 78, 22, C.card, C.line),
      s.text('Always Allow', { x: bx + 125, y: by + 135, font: 'semi', size: 10, fill: C.text, anchor: 'middle' }),
      box(bx + 170, by + 120, 50, 22, C.card, C.line),
      s.text('Deny', { x: bx + 195, y: by + 135, font: 'semi', size: 10, fill: C.blocked, anchor: 'middle' })), ASK + 0.3, ALLOW + 0.1),
    appear(s, rect({ x: bx + 10, y: by + 120, width: 70, height: 22, opacity: 0.8 }, C.ongoing), ALLOW - 0.15, ALLOW + 0.1),
    appear(s, g({},
      sprite(CHECK, { '#': C.lit }, { px: 2, x: bx + 10, y: by + 124 }),
      s.text('Bash allowed once', { x: bx + 28, y: by + 135, font: 'mono', size: 11, fill: C.lit })), ALLOW + 0.1),
    // The pull request.
    appear(s, g({},
      box(bx, by + 160, bw, 44, C.card, C.line),
      rect({ x: bx + 10, y: by + 170, width: 8, height: 8 }, C.ongoing),
      s.text('PR #412 opened', { x: bx + 24, y: by + 178, font: 'semi', size: 11, fill: C.text }),
      s.text('chore(deps): bump lodash to 4.17.21', { x: bx + 10, y: by + 196, font: 'mono', size: 9.5, fill: C.dim })), PR),
  ]);
}

// You: one click on Allow Once.
function pointer(s) {
  const at = { x: RX + 8 + 45, y: PY + 8 + 131 };
  cursor(s, [
    [0, OFF],
    [ALLOW - 1.0, OFF],
    [ALLOW - 0.3, at, 'inOut'],
    ...press(ALLOW, at),
    [ALLOW + 0.3, at],
    [ALLOW + 1.0, OFF, 'inOut'],
  ]);
}
