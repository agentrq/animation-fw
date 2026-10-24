// AgentRQ machines: enrol a computer of your own once, and agents run on it,
// in your repositories, with your toolchain.
import { sprite, el, g } from '../src/index.js';
import {
  C, OFF, LOOP, GROUND, newScene, sky, ground, intro, mascot, mascotByName, cursor, press, during,
} from '../kit/agentrq.js';

// The dark theme's own greys.
const ROW_HI = '#27272a';
const BORDER = '#3f3f46';
const SCREEN = '#0c0c0f';
const WIRE = '#52525b';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const ADD = 1.2;                           // + Add machine
const COPY = 2.4;                          // you copy the enrol command
const FLY = 2.5;                           // and type it on the machine
const ENROL = 3.4;                         // the machine takes the code
const ONLINE = 4.3;                        // dev-box is online
const OPEN = 5.4;                          // you open it: New Session
const PICK = 6.2;                          // agentrq-web
const START = 7;                           // Start agent → Starting…
const TERM = 7.8;                          // straight to the terminal
const LIVE = 8.3;
const BACK = 10.2;                         // ← dev-box: Sessions (1 running)
const INFO = 11.4;                         // Machine Info
const DONE = 16;                           // claude finishes
const DANCE = 18;
const RESET = 22.6;
const FLIGHT = 0.35;

const CODE = 'K7QX-M2PD';
const ENROL_CMD = 'agentrqd enroll --server https://app.agentrq.com --code ';

// What the machine reports: [second, CPU %, memory free, load].
const METRICS = [
  [ONLINE, 4.1, '27.6 GB', '0.21 0.18 0.12'],
  [11.8, 38.5, '21.2 GB', '1.84 0.62 0.31'],
  [12.8, 71.9, '15.4 GB', '3.40 1.21 0.55'],
  [14, 64.3, '14.9 GB', '3.12 1.58 0.71'],
  [16.4, 22, '24.6 GB', '1.10 1.43 0.78'],
  [17.2, 8.2, '27.1 GB', '0.44 1.21 0.76'],
];

// ---------------------------------------------------------------- the stage
const BX = 440;
const BY = 20;
const BW = 740;
const BH = 252;

// The machine on the ground, and the wire that joins it once it is enrolled.
const MX = 1110;
const MACHINE_TOP = GROUND - 64;
const WIRE_TOP = BY + BH + 4;
const WIRE_DOTS = 8;
const dotY = (k) => WIRE_TOP + k * 8;
const WIRE_END = dotY(WIRE_DOTS - 1);

// Where the pointer goes.
const TABS = ['Sessions', 'New Session', 'Machine Info', 'Settings'];
const tabW = (label) => label.length * 7 + 20;
const tabX = (k) => 16 + TABS.slice(0, k).reduce((x, label) => x + tabW(label) + 6, 0);
const PANEL_Y = 70;
const STEP_Y = (k) => PANEL_Y + 52 + k * 40;
const WS = ['agentrq-web', 'billing-api', 'docs-site'];
const WS_W = (BW - 48) / 3;
const WS_Y = 164;
const at = (x, y) => ({ x: BX + x, y: BY + y });
const P = {
  add: at(BW - 80, 30),
  copy: at(BW - 40, STEP_Y(1) + 24),
  card: at(140, 104),
  workspace: at(16 + WS_W / 2, WS_Y + 16),
  start: at(BW - 76, 228),
  back: at(44, 19),
  info: at(tabX(2) + tabW(TABS[2]) / 2, 84),
};

export default function machines() {
  const s = newScene({
    poster: 13.4,
    description: 'AgentRQ machines: you click Add machine and get a single-use code, and typing it on your own computer enrols it, so dev-box comes online. You pick the agentrq-web workspace and Start agent, and claude starts in that workspace\'s folder on the machine, straight into its terminal. Back on the machine page one session is running, and Machine Info shows CPU, memory and load climb while claude works and fall when it is done, and claude celebrates.',
  });

  sky(s);
  ground(s);
  story(s);
  machine(s);
  wire(s);
  machinesPage(s);
  machinePage(s);
  terminalPage(s);
  codeChip(s);
  agent(s);
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'machines',
    headline: ['Your computer,', 'your agents.'],
    sub: 'Enrol it once. Agents run in your repos.',
    steps: [['add', 0.6, COPY], ['enrol', COPY, OPEN], ['start', OPEN, INFO], ['run', INFO, RESET]],
    log: [
      [0, ADD, '> no machines yet'],
      [ADD, COPY, `> one-time code ${CODE}`],
      [COPY, ONLINE, '> enrolling on the machine itself', C.ask],
      [ONLINE, OPEN, '> dev-box is online', C.lit],
      [OPEN, START, '> claude-code in agentrq-web'],
      [START, BACK, '> started in the workspace folder'],
      [BACK, INFO, '> sessions: 1 running'],
      [INFO, DONE, '> cpu 72%, load 3.40: claude works'],
      [DONE, RESET, '> claude done, cpu back to 8%', C.lit],
    ],
  });
}

// ---------------------------------------------------------------- the machine
const COMPUTER = `
  kkkkkkkkkkkkkkkkkk
  kssssssssssssssssk
  kssssssssssssssssk
  kssssssssssssssssk
  kssssssssssssssssk
  kssssssssssssssssk
  kssssssssssssssssk
  kssssssssssssssssk
  kssssssssssssssssk
  kssssssssssssssssk
  kssssssssssssssssk
  kssssssssssssssssk
  kkkkkkkkkkkkkkkkkk
  .......kkkk.......
  .......kkkk.......
  ....kkkkkkkkkk....`;

// Your computer: idle until it is enrolled, then its light comes on, and
// output scrolls on its screen while an agent works.
function machine(s) {
  const left = MX - 36;
  s.add(el('rect', { x: left + 4, y: GROUND - 4, width: 64, height: 4, fill: '#000', opacity: 0.5, class: 'px' }));
  s.add(sprite(COMPUTER, { k: WIRE, s: SCREEN }, { px: 4, x: left, y: MACHINE_TOP }));

  // The enrol command going in, a line at a time.
  const typed = [24, 52, 36].map((w, r) => during(s,
    el('rect', { x: left + 8, y: MACHINE_TOP + 8 + r * 8, width: w, height: 4, fill: C.text, opacity: 0.8, class: 'px' }),
    [[ENROL - 0.1 + r * 0.25, ONLINE + 0.4]]));
  s.add(...typed);
  s.add(during(s, el('rect', { x: left + 8, y: MACHINE_TOP + 32, width: 40, height: 4, fill: C.ongoing, class: 'px' }), [[ONLINE - 0.2, ONLINE + 0.4]]));

  const PAGES = [[40, 24, 48, 32], [28, 52, 20, 44], [48, 36, 40, 16]];
  const output = PAGES.map((widths, p) => s.anim(g({},
    widths.map((w, r) => el('rect', { x: left + 8, y: MACHINE_TOP + 8 + r * 8, width: w, height: 4, fill: C.ongoing, opacity: 0.8, class: 'px' }))),
  [[0, { opacity: p === 0 ? 1 : 0 }], [p, { opacity: 1 }, 'step'], [p + 1, { opacity: 0 }, 'step']], { period: 3 }));
  s.add(during(s, g({}, output), [[LIVE, DONE]]));

  s.add(s.anim(el('rect', { x: left + 8, y: MACHINE_TOP + 40, width: 6, height: 4, fill: C.text, class: 'px' }),
    [[0, { opacity: 1 }], [0.5, { opacity: 0 }, 'step']], { period: 1 }));
  s.add(el('rect', { x: left + 60, y: MACHINE_TOP + 52, width: 4, height: 4, fill: BORDER, class: 'px' }));
  s.add(during(s, s.anim(el('rect', { x: left + 60, y: MACHINE_TOP + 52, width: 4, height: 4, fill: C.ongoing, class: 'px' }),
    [[0, { opacity: 1 }], [0.25, { opacity: 0.2 }, 'step']], { period: 0.5 }), [[ONLINE, RESET + 0.5]]));
  s.add(s.text('agentrqd', { x: MX, y: GROUND + 28, font: 'mono', size: 13, fill: C.dim, anchor: 'middle' }));
}

// ---------------------------------------------------------------- the wire
// It joins once the machine is enrolled, built up from the machine. The
// launch goes down it; the machine's reports come up.
function wire(s) {
  for (let k = 0; k < WIRE_DOTS; k++) {
    const from = ENROL + 0.1 * (WIRE_DOTS - 1 - k);
    s.add(during(s, el('rect', { x: MX - 2, y: dotY(k), width: 4, height: 4, fill: WIRE, class: 'px' }), [[from, RESET + 0.5]]));
  }
  s.add(pulse(s, START + 0.3, WIRE_TOP, WIRE_END, C.text));
  [ONLINE, LIVE, ...METRICS.slice(1).map(([t]) => t)].forEach((t) => s.add(pulse(s, t - FLIGHT, WIRE_END, WIRE_TOP, C.lit)));
}

function pulse(s, t, from, to, fill) {
  return s.anim(el('rect', { width: 6, height: 6, fill, class: 'px' }), [
    [0, { x: MX - 3, y: from, opacity: 0 }],
    [t, { y: from, opacity: 1 }, 'step'],
    [t + FLIGHT, { y: to, opacity: 1 }],
    [t + FLIGHT + 0.01, { opacity: 0 }, 'step'],
  ]);
}

// ---------------------------------------------------------------- the pages
const caps = (s, str, opts) => s.text(str, { font: 'bold', size: 10, spacing: 1.5, ...opts });
const page = () => el('rect', { width: BW, height: BH, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' });
const whiteButton = (s, label, { x, y, w, h = 28 }) => g({},
  el('rect', { x, y, width: w, height: h, fill: C.text, class: 'px' }),
  caps(s, label, { x: x + w / 2, y: y + h / 2 + 4, fill: C.ink, anchor: 'middle' }));
const greyButton = (s, label, { x, y, w, h = 24 }) => g({},
  el('rect', { x, y, width: w, height: h, fill: C.card, stroke: BORDER, 'stroke-width': 1, class: 'px' }),
  caps(s, label, { x: x + w / 2, y: y + h / 2 + 4, fill: C.dim, anchor: 'middle' }));
const flash = (s, { x, y, w, h }, t) => during(s, el('rect', { x, y, width: w, height: h, fill: C.ongoing, opacity: 0.7, class: 'px' }), [[t - 0.15, t]]);

// Machines: empty, then the Add a machine panel with its three steps, then
// dev-box in the list.
function machinesPage(s) {
  const steps = [
    ['Install it', 'curl -fsSL https://agentrq.com/install-agentrqd.sh | sh'],
    ['Enrol this machine', ENROL_CMD],
    ['Run it', 'agentrqd serve'],
  ];
  const panel = g({},
    el('rect', { x: 16, y: PANEL_Y, width: BW - 32, height: 172, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    s.text('Add a machine', { x: 32, y: PANEL_Y + 24, font: 'semi', size: 13, fill: C.text }),
    s.text('Run these on the machine itself. The code is single-use and expires shortly.', { x: 32, y: PANEL_Y + 40, font: 'body', size: 11, fill: C.dim }),
    greyButton(s, 'DONE', { x: BW - 92, y: PANEL_Y + 12, w: 60 }),
    ...steps.map(([title, line], k) => g({},
      el('rect', { x: 32, y: STEP_Y(k) + 2, width: 14, height: 14, fill: ROW_HI, class: 'px' }),
      s.text(String(k + 1), { x: 39, y: STEP_Y(k) + 13, font: 'bold', size: 10, fill: C.dim, anchor: 'middle' }),
      s.text(title, { x: 56, y: STEP_Y(k) + 13, font: 'semi', size: 11, fill: C.text }),
      el('rect', { x: 56, y: STEP_Y(k) + 18, width: BW - 172, height: 18, fill: ROW_HI, stroke: BORDER, 'stroke-width': 1, class: 'px' }),
      s.text(line, { x: 64, y: STEP_Y(k) + 31, font: 'mono', size: 10, fill: '#e4e4e7' }),
      k === 1 ? s.text(CODE, { x: 64 + ENROL_CMD.length * 6, y: STEP_Y(k) + 31, font: 'mono', size: 10, fill: C.ask }) : null,
      greyButton(s, 'COPY', { x: BW - 108, y: STEP_Y(k) + 16, w: 60, h: 22 }))),
    flash(s, { x: BW - 108, y: STEP_Y(1) + 16, w: 60, h: 22 }, COPY));

  const empty = g({},
    el('rect', { x: 16, y: PANEL_Y, width: BW - 32, height: 120, fill: 'none', stroke: C.line, 'stroke-width': 1, class: 'px' }),
    s.text('No machines yet', { x: BW / 2, y: PANEL_Y + 52, font: 'semi', size: 13, fill: C.text, anchor: 'middle' }),
    s.text('A machine is a computer running agentrqd. Enrol one and you can run agents on it.', { x: BW / 2, y: PANEL_Y + 72, font: 'body', size: 11, fill: C.dim, anchor: 'middle' }));

  const card = g({},
    el('rect', { width: 340, height: 62, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    el('rect', { x: 16, y: 20, width: 7, height: 7, fill: C.ongoing, class: 'px' }),
    s.text('dev-box', { x: 32, y: 28, font: 'semi', size: 14, fill: C.text }),
    s.text('linux/amd64 · agentrqd 0.13.2', { x: 32, y: 46, font: 'body', size: 11, fill: C.dim }),
    flash(s, { x: 0, y: 0, w: 340, h: 62 }, OPEN));

  const parts = [
    page(),
    s.text('Machines', { x: 16, y: 40, font: 'bold', size: 20, fill: C.text }),
    s.text('Computers running agentrqd that can host agents for your workspaces.', { x: 16, y: 58, font: 'body', size: 11, fill: C.dim }),
    whiteButton(s, '+ ADD MACHINE', { x: BW - 146, y: 16, w: 130 }),
    flash(s, { x: BW - 146, y: 16, w: 130, h: 28 }, ADD),
    during(s, empty, [[0, ADD]]),
    during(s, panel, [[ADD + 0.1, ONLINE]]),
    s.anim(card, [[0, { x: 16, y: PANEL_Y, opacity: 0, scale: 0.9 }], [ONLINE, { opacity: 0 }, 'step'], [ONLINE + 0.3, { opacity: 1, scale: 1 }, 'back']], { origin: 'center' }),
  ];
  s.add(s.anim(g({}, parts), [
    [0, { x: BX, y: BY, opacity: 1 }],
    [OPEN + 0.1, { opacity: 0 }, 'step'],
    [RESET + 0.8, { opacity: 0 }],
    [RESET + 1.2, { opacity: 1 }],
  ]));
}

// The code, lifted off the page and typed on the machine.
function codeChip(s) {
  const w = CODE.length * 7.8 + 16;
  const chip = g({},
    el('rect', { width: w, height: 22, fill: C.ask, class: 'px' }),
    s.text(CODE, { x: w / 2, y: 15, font: 'mono', size: 13, fill: C.ink, anchor: 'middle' }));
  const from = at(64 + ENROL_CMD.length * 6 - 8, STEP_Y(1) + 15);
  s.add(s.anim(chip, [
    [0, { ...from, opacity: 0 }],
    [FLY, { opacity: 1 }, 'step'],
    [FLY + 0.3, { ...from, y: from.y - 14 }, 'out'],
    [ENROL - 0.1, { x: MX - w / 2, y: MACHINE_TOP + 14, opacity: 1 }, 'inOut'],
    [ENROL, { opacity: 0 }, 'step'],
  ]));
}

// dev-box: New Session to start claude, then (after the terminal) Sessions,
// then Machine Info.
function machinePage(s) {
  const tabOn = [
    [[BACK, INFO]],
    [[0, BACK]],
    [[INFO, LOOP]],
    [],
  ];
  const parts = [
    page(),
    caps(s, '← MACHINES', { x: 16, y: 22, fill: C.notstarted }),
    s.text('dev-box', { x: 16, y: 46, font: 'bold', size: 20, fill: C.text }),
    s.text('linux/amd64 · agentrqd 0.13.2 · online', { x: 16, y: 63, font: 'body', size: 11, fill: C.dim }),
  ];
  TABS.forEach((label, k) => {
    const x = tabX(k);
    const w = tabW(label);
    if (tabOn[k].length) parts.push(during(s, el('rect', { x, y: 72, width: w, height: 22, fill: ROW_HI, class: 'px' }), tabOn[k]));
    parts.push(s.text(label, { x: x + w / 2, y: 87, font: 'semi', size: 11, fill: C.dim, anchor: 'middle' }));
    if (tabOn[k].length) parts.push(during(s, s.text(label, { x: x + w / 2, y: 87, font: 'semi', size: 11, fill: C.text, anchor: 'middle' }), tabOn[k]));
  });
  parts.push(
    el('rect', { x: 2, y: 102, width: BW - 4, height: 1, fill: C.line, class: 'px' }),
    flash(s, { x: tabX(2), y: 72, w: tabW(TABS[2]), h: 22 }, INFO),
    during(s, newSession(s), [[0, BACK]]),
    during(s, sessions(s), [[BACK, INFO]]),
    during(s, resources(s), [[INFO, LOOP]]),
  );
  s.add(s.anim(g({}, parts), [
    [0, { x: BX, y: BY, opacity: 0 }],
    [OPEN + 0.1, { opacity: 1 }, 'step'],
    [TERM, { opacity: 0 }, 'step'],
    [BACK, { opacity: 1 }, 'step'],
    [RESET, { opacity: 1 }],
    [RESET + 0.5, { opacity: 0 }],
  ]));
}

// New Session: which workspace, what to run, and Start agent.
function newSession(s) {
  const parts = [
    s.text('Run an agent here', { x: 16, y: 124, font: 'semi', size: 13, fill: C.text }),
    s.text('Starts it in the workspace\'s folder on this machine.', { x: 16, y: 140, font: 'body', size: 11, fill: C.dim }),
    caps(s, 'WORKSPACE', { x: 16, y: WS_Y - 6, fill: C.notstarted }),
  ];
  WS.forEach((name, k) => {
    const x = 16 + k * (WS_W + 8);
    parts.push(
      el('rect', { x, y: WS_Y, width: WS_W, height: 30, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
      el('rect', { x: x + 12, y: WS_Y + 11, width: 8, height: 8, fill: 'none', stroke: BORDER, 'stroke-width': 2, class: 'px' }),
      s.text(name, { x: x + 30, y: WS_Y + 20, font: 'semi', size: 12, fill: C.text }),
    );
    if (k === 0) {
      parts.push(during(s, g({},
        el('rect', { x, y: WS_Y, width: WS_W, height: 30, fill: 'none', stroke: C.lit, 'stroke-width': 2, class: 'px' }),
        el('rect', { x: x + 12, y: WS_Y + 11, width: 8, height: 8, fill: C.lit, class: 'px' })), [[PICK, LOOP]]));
    }
  });
  parts.push(caps(s, 'WHAT TO RUN', { x: 16, y: 220, fill: C.notstarted }));
  [['Claude Code', true], ['ACP Gateway', false]].forEach(([label, on], k) => {
    const x = 16 + k * 112;
    parts.push(
      el('rect', { x, y: 226, width: 104, height: 22, fill: on ? C.text : C.column, stroke: BORDER, 'stroke-width': 1, class: 'px' }),
      s.text(label, { x: x + 52, y: 241, font: 'semi', size: 11, fill: on ? C.ink : C.dim, anchor: 'middle' }),
    );
  });
  const start = { x: BW - 136, y: 214, w: 120 };
  parts.push(
    el('rect', { x: start.x, y: start.y, width: start.w, height: 28, fill: C.text, class: 'px' }),
    flash(s, { ...start, h: 28 }, START),
    during(s, caps(s, 'START AGENT', { x: start.x + 60, y: start.y + 18, fill: C.ink, anchor: 'middle' }), [[0, START]]),
    during(s, caps(s, 'STARTING…', { x: start.x + 60, y: start.y + 18, fill: C.ink, anchor: 'middle' }), [[START, LOOP]]),
  );
  return g({}, parts);
}

// Sessions (1 running): claude's card, back from its terminal.
function sessions(s) {
  const w = (BW - 40) / 2;
  return g({},
    s.text('Sessions', { x: 16, y: 124, font: 'semi', size: 13, fill: C.text }),
    s.text('(1 running)', { x: 80, y: 124, font: 'body', size: 13, fill: C.notstarted }),
    g({ transform: 'translate(16 136)' },
      el('rect', { width: w, height: 50, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
      el('rect', { x: 12, y: 14, width: 6, height: 6, fill: C.ongoing, class: 'px' }),
      s.text('agentrq-web', { x: 26, y: 21, font: 'semi', size: 13, fill: C.text }),
      s.text('claude-code · running', { x: 26, y: 38, font: 'mono', size: 10, fill: C.ongoing }),
      el('rect', { x: w - 76, y: 10, width: 28, height: 28, fill: C.text, class: 'px' }),
      s.text('>_', { x: w - 62, y: 29, font: 'mono', size: 13, fill: C.ink, anchor: 'middle' }),
      el('rect', { x: w - 42, y: 10, width: 28, height: 28, fill: C.card, stroke: BORDER, 'stroke-width': 1, class: 'px' }),
      el('rect', { x: w - 33, y: 19, width: 10, height: 10, fill: C.dim, class: 'px' })));
}

// Machine Info: Resources, as the machine reports them.
function resources(s) {
  const tiles = ['CPU', 'MEMORY', 'UPTIME', 'LOAD'];
  const TW = (BW - 32 - 24) / 4;
  const tx = (k) => 16 + k * (TW + 8);
  const parts = [
    s.text('Resources', { x: 16, y: 124, font: 'semi', size: 13, fill: C.text }),
    s.text('measured 2s ago', { x: BW - 16, y: 124, font: 'body', size: 11, fill: C.notstarted, anchor: 'end' }),
  ];
  tiles.forEach((label, k) => parts.push(
    el('rect', { x: tx(k), y: 134, width: TW, height: 64, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    caps(s, label, { x: tx(k) + 12, y: 152, fill: C.notstarted })));

  // Each reading holds until the next one.
  METRICS.forEach(([t, cpu, mem, load], r) => {
    const spans = [[t, METRICS[r + 1]?.[0] ?? LOOP]];
    const hot = cpu > 50;
    parts.push(during(s, g({},
      s.text(`${cpu.toFixed(1)}%`, { x: tx(0) + 12, y: 174, font: 'bold', size: 16, fill: hot ? C.ask : C.text }),
      // A meter of ten cells under the CPU figure.
      ...Array.from({ length: 10 }, (_, c) => el('rect', {
        x: tx(0) + 12 + c * 14, y: 184, width: 10, height: 6, class: 'px',
        fill: c < Math.round(cpu / 10) ? (hot ? C.ask : C.ongoing) : ROW_HI,
      })),
      s.text(mem, { x: tx(1) + 12, y: 174, font: 'bold', size: 16, fill: C.text }),
      s.text(load, { x: tx(3) + 12, y: 173, font: 'mono', size: 14, fill: hot ? C.ask : C.text })), spans));
  });
  parts.push(
    s.text('free of 32 GB', { x: tx(1) + 12, y: 190, font: 'body', size: 10, fill: C.notstarted }),
    s.text('3d 4h', { x: tx(2) + 12, y: 174, font: 'bold', size: 16, fill: C.text }),
    s.text('1-, 5- and 15-minute', { x: tx(3) + 12, y: 190, font: 'body', size: 10, fill: C.notstarted }),
    el('rect', { x: 16, y: 208, width: BW - 32, height: 30, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    s.text('/', { x: 28, y: 227, font: 'mono', size: 12, fill: '#e4e4e7' }),
    el('rect', { x: 48, y: 220, width: 200, height: 6, fill: ROW_HI, class: 'px' }),
    el('rect', { x: 48, y: 220, width: 120, height: 6, fill: C.dim, class: 'px' }),
    s.text('412 GB free of 1 TB', { x: BW - 28, y: 227, font: 'body', size: 11, fill: C.dim, anchor: 'end' }),
  );
  return g({}, parts);
}

// Start agent goes straight to the terminal; claude is already at work.
function terminalPage(s) {
  const TX = 14;
  const TY = 72;
  const TW = BW - 28;
  const TH = BH - TY - 14;
  const lines = [
    [LIVE, '> session started in ~/src/agentrq-web', C.text],
    [8.6, '● Read(AGENTS.md)'],
    [9, '● Bash(npm ci)'],
    [9.4, '● Running the test suite…'],
  ];
  const parts = [
    page(),
    caps(s, '← DEV-BOX', { x: 16, y: 22, fill: C.notstarted }),
    flash(s, { x: 10, y: 10, w: 72, h: 18 }, BACK),
    s.text('agentrq-web', { x: 16, y: 46, font: 'bold', size: 20, fill: C.text }),
    s.text('claude-code', { x: 16, y: 62, font: 'mono', size: 10, fill: C.dim }),
    el('rect', { x: BW - 78, y: 18, width: 62, height: 28, fill: C.card, stroke: BORDER, 'stroke-width': 1, class: 'px' }),
    caps(s, 'STOP', { x: BW - 47, y: 36, fill: '#f87171', anchor: 'middle' }),
    el('rect', { x: TX, y: TY, width: TW, height: TH, fill: SCREEN, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    el('rect', { x: TX + 1, y: TY + 1, width: TW - 2, height: 24, fill: C.card, class: 'px' }),
    ...[0, 1, 2].map((k) => el('rect', { x: TX + 10 + k * 13, y: TY + 9, width: 8, height: 8, fill: BORDER, class: 'px' })),
    during(s, g({},
      el('rect', { x: TX + 56, y: TY + 10, width: 6, height: 6, fill: C.ask, class: 'px' }),
      caps(s, 'CONNECTING', { x: TX + 68, y: TY + 17, fill: C.dim })), [[TERM, LIVE]]),
    during(s, g({},
      el('rect', { x: TX + 56, y: TY + 10, width: 6, height: 6, fill: C.ongoing, class: 'px' }),
      caps(s, 'LIVE', { x: TX + 68, y: TY + 17, fill: C.dim })), [[LIVE, LOOP]]),
    ...lines.map(([t, text, fill = C.dim], r) => during(s,
      s.text(text, { x: TX + 12, y: TY + 42 + r * 15, font: 'mono', size: 12, fill }), [[t, LOOP]])),
  ];
  s.add(s.anim(g({}, parts), [[0, { x: BX, y: BY, opacity: 0 }], [TERM, { opacity: 1 }, 'step'], [BACK, { opacity: 0 }, 'step']]));
}

// ---------------------------------------------------------------- the agent
// claude sleeps until it is started on the machine, works, and celebrates.
function agent(s) {
  const awake = START + 0.3 + FLIGHT;
  mascot(s, mascotByName('claude'), 0, {
    x: 990,
    sleep: [[0, awake]],
    say: [['zZ', [[0.5, awake]]]],
    hops: [[awake, 14], [DONE, 22], [DANCE, 16], [DANCE + 0.9, 16], [DANCE + 1.8, 16]],
    alert: [[awake, LIVE]],
    work: [[LIVE, DONE]],
    done: [[DONE, RESET]],
  });
}

// You: Add machine, Copy, open dev-box, pick the workspace, Start agent,
// back to the machine, Machine Info.
function pointer(s) {
  const go = (t, p) => [[t - 0.6, p, 'inOut'], ...press(t, p), [t + 0.1, p]];
  cursor(s, [
    [0, OFF],
    [0.4, OFF],
    ...go(ADD, P.add),
    ...go(COPY, P.copy),
    [COPY + 0.6, P.copy],
    ...go(OPEN, P.card),
    ...go(PICK, P.workspace),
    ...go(START, P.start),
    [BACK - 1, P.start],
    ...go(BACK, P.back),
    ...go(INFO, P.info),
    [INFO + 0.5, P.info],
    [INFO + 1.2, OFF, 'inOut'],
  ]);
}
