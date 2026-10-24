// AgentRQ's live terminals: a running agent on your own machine, at its
// prompt from any browser, and still running when nobody is watching.
import { sprite, el, g } from '../src/index.js';
import {
  C, OFF, LOOP, GROUND, newScene, sky, ground, intro, mascot, mascotByName, cursor, press, during,
} from '../kit/agentrq.js';

// The dark theme's own greys.
const ROW_HI = '#27272a';
const BORDER = '#3f3f46';
const SCREEN = '#0c0c0f';                  // the terminal's surface
const WIRE = '#52525b';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const OPEN = 2.2;                          // you click >_ on claude's card
const PAGE = 2.4;                          // the terminal page: Connecting
const LIVE = 3.2;                          // Live
const TYPE_Y = 6;                          // y
const ENTER = 6.4;                         // ↵
const ESC = 9;                             // Esc stops the wrong turn
const PROMPT = 9.5;                        // claude waits for a new instruction
const TYPED_AT = 9.9;                      // you type it, a key at a time
const KEY_GAP = 0.07;
const INSTRUCTION = 'just retry the refresh once';
const SEND = 12;                           // ↵
const DROP = 13.4;                         // the network drops
const CLOSE = 14.6;                        // you close the tab
const BACK = 16.8;                         // you come back: Connecting
const RELIVE = 17.4;                       // Live again, the screen restored
const DONE = 18.4;                         // claude finishes
const SHARE = 19.2;                        // hermes opens the same session
const DANCE = 20;
const RESET = 22.6;
const FLIGHT = 0.35;                       // a byte's trip down the wire

const KEYS_AT = [...INSTRUCTION].map((_, k) => TYPED_AT + KEY_GAP * k);

// ---------------------------------------------------------------- the stage
const BX = 440;
const BY = 20;
const BW = 740;
const BH = 252;

// The terminal frame inside the page, and its rows of mono text.
const TX = 14;
const TY = 72;
const TW = BW - 28;
const TH = BH - TY - 14;
const BAR = 24;
const ROWS = 8;
const LINE = 15;
const CH = 7.2;                            // JetBrains Mono 12 is 0.6em a character
const rowY = (r) => TY + BAR + 18 + r * LINE;
const col = (n) => 12 + n * CH;

// The machine on the ground, and the wire from the page down to it.
const MX = 1110;
const MACHINE_TOP = GROUND - 64;
const WIRE_TOP = BY + BH + 4;
const WIRE_DOTS = 8;
const dotY = (k) => WIRE_TOP + k * 8;
const WIRE_END = dotY(WIRE_DOTS - 1);

// What claude's TUI prints, and when. A line that arrives while nobody is
// connected shows up when the screen is restored.
const ASK = '│ Apply this edit? (y/n) ';
const LINES = [
  [LIVE, '> make the login test stop flaking', C.text],
  [LIVE, '● Read(test/login.spec.ts)'],
  [LIVE, '● Read(src/auth/session.ts)'],
  [3.8, '● The test races the token refresh.'],
  [4.4, '● Update(src/auth/session.ts)  +4 -1'],
  [5, ASK, C.ask],
  [6.9, '● Edit applied.'],
  [7.6, '● While here, rewriting src/auth/ from scratch…'],
  [8.3, '● Delete(src/auth/legacy.ts)'],
  [ESC + 0.25, '│ Interrupted by user', C.blocked],
  [PROMPT, '> ', C.text],
  [12.6, '● Update(src/auth/session.ts)  +2'],
  [14.2, '● Bash(npm test -- login --repeat 20)'],
  [15.6, '  20 of 20 passed', C.ongoing],
  [DONE, '● Done. The login test is stable.', C.lit],
];
const offline = (t) => t >= DROP && t < RELIVE;
const SHOWN = LINES.map(([t]) => (offline(t) ? RELIVE : t));
const ASK_ROW = LINES.findIndex(([, text]) => text === ASK);
const PROMPT_ROW = LINES.findIndex(([t]) => t === PROMPT);

export default function liveTerminals() {
  const s = newScene({
    poster: 19.8,
    description: 'AgentRQ live terminals: on the machine page you open claude\'s running session and you are at its prompt in the browser. You answer y, then press Esc when claude takes a wrong turn and type a new instruction, every key going down the wire to the machine. The network drops and you close the tab, but on the machine claude keeps working; when you come back the screen is restored and has moved on, claude finishes, hermes opens the same session, and the agents celebrate.',
  });

  sky(s);
  ground(s);
  story(s);
  keyRow(s);
  machine(s);
  wire(s);
  machinePage(s);
  terminalPage(s);
  nobody(s);
  ['hermes', 'codex', 'claude'].forEach((name, i) => agent(s, mascotByName(name), i));
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'live terminals',
    headline: ['Your machine,', 'in any browser.'],
    sub: 'Open an agent and type at its prompt.',
    steps: [['open', 0.6, TYPE_Y], ['type', TYPE_Y, DROP], ['drop', DROP, BACK], ['back', BACK, RESET]],
    log: [
      [0, OPEN, '> 2 sessions running on dev-box'],
      [OPEN, 5, '> attached to claude-code on dev-box'],
      [5, ENTER, '> claude: apply this edit?', C.ask],
      [ENTER, 7.6, '> you: y, enter'],
      [7.6, ESC, '> claude took a wrong turn', C.ask],
      [ESC, TYPED_AT, '> Esc sent'],
      [TYPED_AT, DROP, `> you: ${INSTRUCTION}`],
      [DROP, CLOSE, '> connection lost: reconnecting', C.ask],
      [CLOSE, BACK, '> tab closed: agent still running', C.lit],
      [BACK, DONE, '> back: screen restored'],
      [DONE, SHARE, '> claude: login test is stable', C.lit],
      [SHARE, RESET, '> shared with hermes'],
    ],
  });
}

// ---------------------------------------------------------------- key row
// The terminal's own key row, as a touch screen shows it, under the log.
const KY = 334;
const KEYS = [
  { label: 'Esc', w: 38, at: [ESC] },
  { label: '^C', w: 32 },
  { label: 'Tab', w: 38 },
  { label: '⇧Tab', w: 46 },
  { label: '↑', w: 28 },
  { label: '↓', w: 28 },
  { label: '←', w: 28 },
  { label: '→', w: 28 },
  { label: '↵', w: 34, at: [ENTER, SEND] },
];
const PRESS = 0.18;

function keyRow(s) {
  let x = 44;
  for (const { label, w, at = [] } of KEYS) {
    s.add(el('rect', { x, y: KY + 6, width: w, height: 30, fill: '#000', class: 'px' }));
    s.add(el('rect', { x, y: KY + 30, width: w, height: 6, fill: C.line, class: 'px' }));
    const lit = [[0, { opacity: 0 }], ...at.flatMap((t) => [[t, { opacity: 1 }, 'step'], [t + PRESS, { opacity: 0 }, 'step']])];
    const cap = g({},
      el('rect', { width: w, height: 30, fill: C.card, stroke: BORDER, 'stroke-width': 2, class: 'px' }),
      s.anim(el('rect', { x: 2, y: 2, width: w - 4, height: 26, fill: C.ongoing, class: 'px' }), lit),
      s.text(label, { x: w / 2, y: 20, font: 'semi', size: 12, fill: C.text, anchor: 'middle' }));
    s.add(s.anim(cap, [[0, { x, y: KY }], ...at.flatMap((t) => [[t, { y: KY + 5 }, 'step'], [t + PRESS, { y: KY }, 'step']])]));
    x += w + 6;
  }
}

// ---------------------------------------------------------------- the machine
// The enrolled computer: output scrolling on its screen and its light
// blinking the whole time, watched or not.
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

function machine(s) {
  const left = MX - 36;
  s.add(el('rect', { x: left + 4, y: GROUND - 4, width: 64, height: 4, fill: '#000', opacity: 0.5, class: 'px' }));
  s.add(sprite(COMPUTER, { k: WIRE, s: SCREEN }, { px: 4, x: left, y: MACHINE_TOP }));

  // Three pages of output, one a second, so the screen never sits still.
  const PAGES = [[40, 24, 48, 32], [28, 52, 20, 44], [48, 36, 40, 16]];
  PAGES.forEach((widths, p) => {
    const rows = widths.map((w, r) => el('rect', { x: left + 8, y: MACHINE_TOP + 8 + r * 8, width: w, height: 4, fill: C.ongoing, opacity: 0.8, class: 'px' }));
    s.add(s.anim(g({}, rows), [[0, { opacity: p === 0 ? 1 : 0 }], [p, { opacity: 1 }, 'step'], [p + 1, { opacity: 0 }, 'step']], { period: 3 }));
  });
  s.add(s.anim(el('rect', { x: left + 8, y: MACHINE_TOP + 40, width: 6, height: 4, fill: C.text, class: 'px' }),
    [[0, { opacity: 1 }], [0.5, { opacity: 0 }, 'step']], { period: 1 }));
  s.add(s.anim(el('rect', { x: left + 60, y: MACHINE_TOP + 52, width: 4, height: 4, fill: C.ongoing, class: 'px' }),
    [[0, { opacity: 1 }], [0.25, { opacity: 0.2 }, 'step']], { period: 0.5 }));
  s.add(s.text('agentrqd', { x: MX, y: GROUND + 28, font: 'mono', size: 13, fill: C.dim, anchor: 'middle' }));
}

// ---------------------------------------------------------------- the wire
// Dotted, page to machine. Your keys go down it, claude's output comes up;
// it breaks when the network drops and the top goes with the tab.
const CROSS = `
  #...#
  .#.#.
  ..#..
  .#.#.
  #...#`;

function wire(s) {
  for (let k = 0; k < WIRE_DOTS; k++) {
    const dot = el('rect', { x: MX - 2, y: dotY(k), width: 4, height: 4, fill: WIRE, class: 'px' });
    if (k === 3 || k === 4) s.add(during(s, dot, [[0, DROP], [RELIVE, LOOP]]));
    else if (k < 3) s.add(during(s, dot, [[0, CLOSE], [BACK, LOOP]]));
    else s.add(dot);
  }
  s.add(during(s, sprite(CROSS, { '#': C.blocked }, { px: 2, x: MX - 5, y: dotY(3) + 1 }), [[DROP, RELIVE]]));

  const keys = [TYPE_Y, ENTER, ESC, ...KEYS_AT, SEND];
  keys.forEach((t) => s.add(pulse(s, t, WIRE_TOP, WIRE_END, C.text)));

  // claude's output, landing as each line arrives while somebody is
  // connected, and a burst when the screen is repainted.
  const out = LINES.map(([t]) => t).filter((t, i) => t > LIVE && !offline(t) && t === SHOWN[i]);
  const repaint = [0, 0.1, 0.2, 0.3].map((d) => RELIVE - FLIGHT + d);
  [LIVE - FLIGHT, ...out.map((t) => t - FLIGHT), ...repaint].forEach((t) => s.add(pulse(s, t, WIRE_END, WIRE_TOP, C.lit)));
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
// The app's small uppercase labels: black, tracked wide.
const caps = (s, str, opts) => s.text(str, { font: 'bold', size: 10, spacing: 1.5, ...opts });

const page = () => el('rect', { width: BW, height: BH, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' });

// The machine page, Sessions tab: claude and codex running here.
const SESSIONS = [['agentrq-web', 'claude-code'], ['billing-api', 'codex']];
const CARD_W = (BW - 40) / 2;
const CARD_Y = 140;
const openButton = { x: BX + 16 + CARD_W - 64, y: BY + CARD_Y + 10 };

function machinePage(s) {
  const tabs = ['Sessions', 'New Session', 'Machine Info', 'Settings'];
  const parts = [
    page(),
    caps(s, '← MACHINES', { x: 16, y: 22, fill: C.notstarted }),
    s.text('dev-box', { x: 16, y: 46, font: 'bold', size: 20, fill: C.text }),
    s.text('linux/amd64 · agentrqd 0.13.2 · online', { x: 16, y: 63, font: 'body', size: 11, fill: C.dim }),
  ];
  let x = 16;
  tabs.forEach((label, k) => {
    const w = label.length * 7 + 20;
    if (k === 0) parts.push(el('rect', { x, y: 78, width: w, height: 22, fill: ROW_HI, class: 'px' }));
    parts.push(s.text(label, { x: x + w / 2, y: 93, font: 'semi', size: 11, fill: k === 0 ? C.text : C.dim, anchor: 'middle' }));
    x += w + 6;
  });
  parts.push(
    el('rect', { x: 2, y: 108, width: BW - 4, height: 1, fill: C.line, class: 'px' }),
    s.text('Sessions', { x: 16, y: 130, font: 'semi', size: 13, fill: C.text }),
    s.text('(2 running)', { x: 80, y: 130, font: 'body', size: 13, fill: C.notstarted }),
  );
  SESSIONS.forEach(([workspace, kind], k) => {
    const cx = 16 + k * (CARD_W + 8);
    parts.push(g({ transform: `translate(${cx} ${CARD_Y})` },
      el('rect', { width: CARD_W, height: 50, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
      el('rect', { x: 12, y: 14, width: 6, height: 6, fill: C.ongoing, class: 'px' }),
      s.text(workspace, { x: 26, y: 21, font: 'semi', size: 13, fill: C.text }),
      s.text(`${kind} · running`, { x: 26, y: 38, font: 'mono', size: 10, fill: C.ongoing }),
      el('rect', { x: CARD_W - 76, y: 10, width: 28, height: 28, fill: C.text, class: 'px' }),
      s.text('>_', { x: CARD_W - 62, y: 29, font: 'mono', size: 13, fill: C.ink, anchor: 'middle' }),
      el('rect', { x: CARD_W - 42, y: 10, width: 28, height: 28, fill: C.card, stroke: BORDER, 'stroke-width': 1, class: 'px' }),
      el('rect', { x: CARD_W - 33, y: 19, width: 10, height: 10, fill: C.dim, class: 'px' })));
  });
  parts.push(during(s, el('rect', { x: 16 + CARD_W - 76, y: CARD_Y + 10, width: 28, height: 28, fill: C.ongoing, opacity: 0.8, class: 'px' }), [[OPEN - 0.15, OPEN]]));
  s.add(s.anim(g({}, parts), [
    [0, { x: BX, y: BY, opacity: 1 }],
    [PAGE, { opacity: 0 }, 'step'],
    [RESET + 0.8, { opacity: 0 }],
    [RESET + 1.2, { opacity: 1 }],
  ]));
}

// The status the frame's title bar shows, with its dot.
const STATUS = [
  ['CONNECTING', C.ask, [[PAGE, LIVE], [BACK, RELIVE]]],
  ['LIVE', C.ongoing, [[LIVE, DROP], [RELIVE, LOOP]]],
  ['RECONNECTING', C.ask, [[DROP, CLOSE]]],
];

// The terminal page: the way back to the machine, the workspace and kind,
// Stop, and the frame with claude's screen in it.
function terminalPage(s) {
  const parts = [
    page(),
    caps(s, '← DEV-BOX', { x: 16, y: 22, fill: C.notstarted }),
    s.text('agentrq-web', { x: 16, y: 46, font: 'bold', size: 20, fill: C.text }),
    s.text('claude-code', { x: 16, y: 62, font: 'mono', size: 10, fill: C.dim }),
    el('rect', { x: BW - 78, y: 18, width: 62, height: 28, fill: C.card, stroke: BORDER, 'stroke-width': 1, class: 'px' }),
    caps(s, 'STOP', { x: BW - 47, y: 36, fill: '#f87171', anchor: 'middle' }),

    el('rect', { x: TX, y: TY, width: TW, height: TH, fill: SCREEN, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    el('rect', { x: TX + 1, y: TY + 1, width: TW - 2, height: BAR, fill: C.card, class: 'px' }),
    el('rect', { x: TX + 1, y: TY + BAR, width: TW - 2, height: 1, fill: C.line, class: 'px' }),
    ...[0, 1, 2].map((k) => el('rect', { x: TX + 10 + k * 13, y: TY + 9, width: 8, height: 8, fill: BORDER, class: 'px' })),
    ...STATUS.map(([label, fill, spans]) => during(s, g({},
      el('rect', { x: TX + 56, y: TY + 10, width: 6, height: 6, fill, class: 'px' }),
      caps(s, label, { x: TX + 68, y: TY + 17, fill: C.dim })), spans)),
    during(s, caps(s, 'SHARED WITH HERMES', { x: TX + TW - 12, y: TY + 17, fill: '#fbbf24', anchor: 'end' }), [[SHARE, LOOP]]),
    ...LINES.map((line, i) => screenLine(s, line, i)),
    // Frozen while reconnecting.
    during(s, el('rect', { x: TX + 1, y: TY + BAR + 1, width: TW - 2, height: TH - BAR - 2, fill: SCREEN, opacity: 0.55, class: 'px' }), [[DROP, CLOSE]]),
  ];
  s.add(s.anim(g({}, parts), [
    [0, { x: BX, y: BY, opacity: 0 }],
    [PAGE, { opacity: 1 }, 'step'],
    [CLOSE, { opacity: 1 }],
    [CLOSE + 0.3, { opacity: 0 }],
    [BACK, { opacity: 1 }, 'step'],
    [RESET, { opacity: 1 }],
    [RESET + 0.5, { opacity: 0 }],
  ]));
}

// One line of claude's screen. It scrolls up a row each time the screen
// is full and another arrives, and is gone off the top.
function screenLine(s, [, text, fill = C.dim], i) {
  const row = (t) => i - Math.max(0, SHOWN.filter((v) => v <= t).length - ROWS);
  const keys = [[0, { x: TX, y: rowY(row(SHOWN[i])), opacity: 0 }], [SHOWN[i], { opacity: 1 }, 'step']];
  let last = row(SHOWN[i]);
  for (const t of [...new Set(SHOWN)].filter((v) => v > SHOWN[i])) {
    const r = row(t);
    if (r === last) continue;
    keys.push([t, r < 0 ? { y: rowY(r), opacity: 0 } : { y: rowY(r) }, 'step']);
    last = r;
  }
  // SVG collapses leading spaces, so an indent is a column.
  const indent = text.length - text.trimStart().length;
  const parts = [s.text(text.trimStart(), { x: col(indent), y: 0, font: 'mono', size: 12, fill })];
  if (i === ASK_ROW) {
    parts.push(during(s, s.text('y', { x: col(text.length), y: 0, font: 'mono', size: 12, fill: C.text }), [[TYPE_Y, LOOP]]));
    parts.push(caret(s, [[SHOWN[i], text.length], [TYPE_Y, text.length + 1]], ENTER));
  }
  if (i === PROMPT_ROW) {
    KEYS_AT.forEach((t, k) => parts.push(during(s,
      s.text(INSTRUCTION.slice(0, k + 1), { x: col(text.length), y: 0, font: 'mono', size: 12, fill: C.text }),
      [[t, KEYS_AT[k + 1] ?? LOOP]])));
    parts.push(caret(s, [[SHOWN[i], text.length], ...KEYS_AT.map((t, k) => [t, text.length + k + 1])], SEND));
  }
  return s.anim(g({}, parts), keys);
}

// A blinking block that follows the typing: [second, column] moves, gone at `until`.
function caret(s, moves, until) {
  const block = s.anim(el('rect', { y: -10, width: 7, height: 13, fill: C.text, class: 'px' }),
    [[0, { opacity: 1 }], [0.5, { opacity: 0 }, 'step']], { period: 1 });
  const keys = [[0, { x: col(moves[0][1]), y: 0 }], ...moves.map(([t, n]) => [t, { x: col(n) }, 'step'])];
  return during(s, s.anim(block, keys), [[moves[0][0], until]]);
}

// While the tab is closed: nobody is watching, and it runs on.
function nobody(s) {
  s.add(s.anim(g({},
    el('rect', { width: BW, height: BH, fill: 'none', stroke: C.line, 'stroke-width': 2, 'stroke-dasharray': '6 6', class: 'px' }),
    s.text('NOBODY WATCHING', { x: BW / 2, y: BH / 2 - 4, font: 'pixel', size: 16, fill: C.notstarted, anchor: 'middle' }),
    s.text('claude keeps working on dev-box', { x: BW / 2, y: BH / 2 + 22, font: 'mono', size: 12, fill: C.dim, anchor: 'middle' })),
  [[0, { x: BX, y: BY, opacity: 0 }], [CLOSE + 0.3, { opacity: 0 }], [CLOSE + 0.6, { opacity: 1 }], [BACK, { opacity: 0 }, 'step']]));
}

// ---------------------------------------------------------------- the agents
const AGENT_X = { hermes: 580, codex: 860, claude: 1000 };

function agent(s, m, i) {
  const x = AGENT_X[m.name];
  const dance = [[DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]];
  if (m.name === 'claude') {
    // Asks, works, is stopped, works on through the drop, and finishes.
    mascot(s, m, i, {
      x,
      hops: [[5, 10], [ENTER + 0.2, 12], [ESC, 8], [SEND + 0.2, 12], [DONE, 22], ...dance],
      ask: [[5, ENTER + 0.2]],
      alert: [[ESC, PROMPT + 0.4]],
      work: [[0.4, 5], [ENTER + 0.2, ESC], [SEND + 0.2, DONE]],
      done: [[DONE, RESET]],
    });
  } else if (m.name === 'codex') {
    mascot(s, m, i, { x, hops: [[DONE + 0.4, 14], ...dance], work: [[0.6, DONE + 0.4]], done: [[DONE + 0.4, RESET]] });
  } else {
    // hermes opens the same session near the end.
    mascot(s, m, i, { x, hops: [[SHARE, 14], ...dance], alert: [[SHARE, DANCE]], done: [[DANCE, RESET]] });
  }
}

// You: one click on >_ for claude's session; the rest is the keyboard.
function pointer(s) {
  cursor(s, [
    [0, OFF],
    [0.6, OFF],
    [1.6, openButton, 'inOut'],
    ...press(OPEN, openButton),
    [OPEN + 0.4, openButton],
    [OPEN + 1, OFF, 'inOut'],
  ]);
}
