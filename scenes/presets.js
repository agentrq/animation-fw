// AgentRQ presets: a workspace keeps named messages; typing #name in a new
// task or a reply puts the whole message in place of the name.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, OFF, LOOP, newScene, sky, ground, intro, mascot, cursor, press, during, mascotX,
} from '../kit/agentrq.js';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const S1 = [0.3, 7.0];                     // Presets tab in workspace settings
const S2 = [7.0, 13.6];                    // a new task
const S3 = [13.6, 22.6];                   // a reply in the task
const RESET = 22.6;

const NAME_CLICK = 1.0;
const BODY_CLICK = 2.8;
const ADD = 5.0;                           // Add Preset
const COMPOSE = 7.6;                       // click into the new task
const HASH = 9.4;                          // '#': the menu opens with every preset
const NARROW = 10.2;                       // '#pu': one left
const PICK = 11.2;                         // click it: the message takes its place
const CREATE = 12.6;                       // Create Task
const ARRIVE1 = CREATE + 0.8;
const CLAUDE1 = 14.6;                      // claude answers in the thread
const COMPOSE2 = 15.4;
const HASH2 = 15.8;
const NARROW2 = 16.5;
const PICK2 = 17.4;
const SEND = 18.6;                         // Send
const ARRIVE2 = SEND + 0.8;
const DONE = 20.4;

const PULL = 'pull latest main, tag and push';
const SHIP = 'run the release checklist and post notes';
const TASK = `fix the login bug, then ${PULL}`;

// ---------------------------------------------------------------- the window
const BX = 440;
const BY = 20;
const BW = 740;
const BH = 272;
const CH = 8.4;                            // one mono character at 14 px
const CP = { x: BX + 16, y: BY + 170, w: BW - 32, h: 52 };
const TX = CP.x + 14;
const TXT_Y = CP.y + 30;
const CLAUDE_X = mascotX(MASCOTS.findIndex((m) => m.name === 'claude'));

const PRESETS = [
  { name: 'pull-n-push', body: PULL },
  { name: 'review-pr', body: 'review the open pull request and list risks' },
  { name: 'ship-it', body: SHIP },
];

const rect = (a, f, extra = {}) => el('rect', { ...a, fill: f, class: 'px', ...extra });
const box = (x, y, w, h, fill = C.card, stroke = C.line) => el('rect', { x, y, width: w, height: h, fill, stroke, 'stroke-width': 1, class: 'px' });

export default function presets() {
  const s = newScene({
    poster: 12.2,
    description: 'AgentRQ presets: on a workspace\'s Presets tab you save #pull-n-push as the message \'pull latest main, tag and push\'; in a new task you type \'fix the login bug, then #\', the menu lists your presets, you pick #pull-n-push and the whole message takes the place of #pu and goes to claude; in the thread you reply with #ship-it the same way and claude gets the full message and releases.',
  });
  sky(s);
  ground(s);
  intro(s, {
    kicker: 'presets',
    headline: ['Type #, skip', 'the typing.'],
    sub: 'Saved messages, one # away.',
    steps: [['save', S1[0], S1[1]], ['type #', S1[1], PICK], ['pick', PICK, CREATE], ['send', CREATE, RESET]],
    log: [
      [0, NAME_CLICK, '> workspace: web app'],
      [NAME_CLICK, ADD, '> new preset: #pull-n-push'],
      [ADD, COMPOSE, '> saved: 3 presets', C.lit],
      [COMPOSE, HASH, '> new task: fix the login bug'],
      [HASH, PICK, '> # opens your presets', C.ask],
      [PICK, CREATE, '> #pu became the full message'],
      [CREATE, CLAUDE1, '> sent to claude'],
      [CLAUDE1, SEND, '> claude: pushed tag v1.4.1'],
      [SEND, DONE, '> you: #ship-it, one pick'],
      [DONE, RESET, '> claude: released', C.lit],
    ],
  });
  screen(s, S1, settings);
  screen(s, S2, newTask);
  screen(s, S3, thread);
  menus(s);
  letters(s);
  MASCOTS.forEach((m, i) => agent(s, m, i));
  pointer(s);
  return s;
}

// A screen of the app: the window, a title and a status, shown for a span.
function screen(s, span, draw) {
  const parts = [
    rect({ x: BX, y: BY, width: BW, height: BH }, C.panel, { stroke: C.line, 'stroke-width': 2 }),
  ];
  draw(s, parts);
  s.add(s.anim(g({}, parts), [
    [0, { opacity: span[0] === 0 ? 1 : 0 }],
    [span[0], { opacity: 1 }, 'step'],
    [span[1], { opacity: 0 }, 'step'],
  ]));
}

const label = (s, text, x, y) => s.text(text, { x, y, font: 'semi', size: 10, fill: C.dim, spacing: 1 });

// Text typed a few keys at a time: [second, text]; gone at `end`.
function typing(s, chunks, { x, y, font = 'mono', size = 14, end, caret = true, ch = CH }) {
  const out = [];
  chunks.forEach(([t, text], k) => {
    const to = k + 1 < chunks.length ? chunks[k + 1][0] : end;
    out.push(during(s, s.text(text, { x, y, font, size, fill: C.text }), [[t, to]]));
    if (caret) {
      const blink = s.anim(el('rect', { x: x + 1 + text.length * ch, y: y - 15, width: 2, height: 18, fill: C.text, class: 'px' }),
        [[0, { opacity: 1 }], [0.5, { opacity: 0 }, 'step']], { period: 1 });
      out.push(during(s, blink, [[t, to]]));
    }
  });
  return out;
}

function chip(s, text, x, y, color, w) {
  return [
    rect({ x, y, width: w, height: 22 }, C.column, { stroke: C.line, 'stroke-width': 1 }),
    rect({ x: x + 10, y: y + 8, width: 6, height: 6 }, color),
    s.text(text, { x: x + 24, y: y + 15, font: 'semi', size: 11, fill: C.dim }),
  ];
}

function fakeButton(s, text, x, y, w, clicks = []) {
  const b = [rect({ x, y, width: w, height: 24 }, C.text)];
  if (clicks.length) {
    b.push(s.anim(rect({ x, y, width: w, height: 24 }, C.ongoing),
      [[0, { opacity: 0 }], ...clicks.flatMap((t) => [[t - 0.15, { opacity: 0.8 }, 'step'], [t, { opacity: 0 }, 'step']])]));
  }
  b.push(s.text(text, { x: x + w / 2, y: y + 17, font: 'semi', size: 13, fill: C.ink, anchor: 'middle' }));
  return b;
}

const SLOT = (k) => BY + 104 + k * 52;

// 1. The Presets tab of the workspace settings.
function settings(s, parts) {
  parts.push(
    s.text('Workspace settings', { x: BX + 16, y: BY + 26, font: 'semi', size: 15, fill: C.text }),
    rect({ x: BX + 2, y: BY + 40, width: BW - 4, height: 1 }, C.line),
  );
  [['General', 0], ['Memories', 86], ['Presets', 178], ['Skills', 252]].forEach(([t, dx]) => {
    const on = t === 'Presets';
    parts.push(s.text(t, { x: BX + 16 + dx, y: BY + 62, font: 'semi', size: 12, fill: on ? C.text : C.dim }));
    if (on) parts.push(rect({ x: BX + 16 + dx, y: BY + 69, width: 52, height: 2 }, C.text));
  });
  // The list.
  parts.push(label(s, 'PRESETS', BX + 16, BY + 92));
  const count = (n, from, to) => during(s, s.text(`${n} SAVED`, { x: BX + 16 + 330, y: BY + 92, font: 'semi', size: 10, fill: C.dim, anchor: 'end', spacing: 1 }), [[from, to]]);
  parts.push(count(2, 0, ADD + 0.1), count(3, ADD + 0.1, LOOP));
  PRESETS.forEach((p, k) => {
    const row = g({},
      box(BX + 16, SLOT(k), 330, 44),
      s.text(`#${p.name}`, { x: BX + 30, y: SLOT(k) + 18, font: 'mono', size: 12, fill: C.text }),
      s.text(p.body, { x: BX + 30, y: SLOT(k) + 35, font: 'body', size: 11, fill: C.dim }));
    parts.push(k === 0 ? s.anim(row, [[0, { opacity: 0 }], [ADD + 0.1, { opacity: 1 }, 'step']]) : row);
  });
  // The form.
  const FX = BX + 380;
  parts.push(
    label(s, 'ADD A PRESET', FX, BY + 92),
    label(s, 'NAME', FX, BY + 114),
    box(FX, BY + 120, 344, 28, '#27272a', '#3f3f46'),
    label(s, 'MESSAGE', FX, BY + 166),
    box(FX, BY + 172, 344, 52, '#27272a', '#3f3f46'),
    during(s, el('rect', { x: FX, y: BY + 120, width: 344, height: 28, fill: 'none', stroke: '#71717a', 'stroke-width': 2, class: 'px' }), [[NAME_CLICK, BODY_CLICK]]),
    during(s, el('rect', { x: FX, y: BY + 172, width: 344, height: 52, fill: 'none', stroke: '#71717a', 'stroke-width': 2, class: 'px' }), [[BODY_CLICK, ADD]]),
    ...typing(s, [[NAME_CLICK + 0.2, 'pu'], [NAME_CLICK + 0.45, 'pull-'], [NAME_CLICK + 0.7, 'pull-n-'], [NAME_CLICK + 0.95, 'pull-n-pus'], [NAME_CLICK + 1.2, 'pull-n-push']],
      { x: FX + 12, y: BY + 139, size: 12, end: ADD, ch: 7.2 }),
    ...typing(s, [[BODY_CLICK + 0.2, 'pull la'], [BODY_CLICK + 0.5, 'pull latest m'], [BODY_CLICK + 0.8, 'pull latest main, t'], [BODY_CLICK + 1.1, 'pull latest main, tag a'], [BODY_CLICK + 1.4, PULL]],
      { x: FX + 12, y: BY + 194, size: 12, end: ADD, ch: 7.2 }),
    ...fakeButton(s, 'Add Preset', FX, BY + 236, 110, [ADD]),
  );
}

// The composer shared by the new task and the thread.
function composerBox(s, parts, { click, end, chunks, button, buttonAt, clicks }) {
  parts.push(
    box(CP.x, CP.y, CP.w, CP.h, '#27272a', '#3f3f46'),
    during(s, el('rect', { x: CP.x, y: CP.y, width: CP.w, height: CP.h, fill: 'none', stroke: '#71717a', 'stroke-width': 2, class: 'px' }), [[click, end]]),
    ...typing(s, chunks, { x: TX, y: TXT_Y, end }),
    ...fakeButton(s, button, buttonAt, CP.y + CP.h + 10, button.length * 9 + 30, clicks),
  );
}

// 2. A new task.
function newTask(s, parts) {
  parts.push(
    s.text('New task', { x: BX + 16, y: BY + 26, font: 'semi', size: 15, fill: C.text }),
    ...chip(s, 'web app', BX + BW - 108, BY + 10, C.ongoing, 96),
    rect({ x: BX + 2, y: BY + 40, width: BW - 4, height: 1 }, C.line),
    s.text('What should the agent do?', { x: BX + 16, y: BY + 66, font: 'body', size: 13, fill: C.dim }),
  );
  composerBox(s, parts, {
    click: COMPOSE, end: S2[1], button: 'Create Task', buttonAt: CP.x, clicks: [CREATE],
    chunks: [
      [COMPOSE + 0.4, 'fix the'], [COMPOSE + 0.7, 'fix the login'], [COMPOSE + 1.0, 'fix the login bug,'], [COMPOSE + 1.3, 'fix the login bug, then '],
      [HASH, 'fix the login bug, then #'], [NARROW, 'fix the login bug, then #pu'], [PICK, TASK],
    ],
  });
}

const BUBBLE_W = 440;
const BX_USER = BX + BW - 16 - BUBBLE_W;

function bubbleBox(s, who, text, color, x, y, w) {
  return g({},
    rect({ x, y, width: w, height: 40 }, who === 'You' ? '#2a2a2e' : C.column, who === 'You' ? {} : { stroke: C.line, 'stroke-width': 1 }),
    rect({ x: x + 12, y: y + 9, width: 6, height: 6 }, color),
    s.text(who, { x: x + 24, y: y + 16, font: 'mono', size: 10, fill: C.dim }),
    s.text(text, { x: x + 12, y: y + 32, font: 'semi', size: 13, fill: C.text }));
}

// 3. A reply in the thread.
function thread(s, parts) {
  parts.push(
    s.text('Fix login bug', { x: BX + 16, y: BY + 26, font: 'semi', size: 15, fill: C.text }),
    ...chip(s, 'Ongoing', BX + BW - 108, BY + 10, C.ongoing, 96),
    rect({ x: BX + 2, y: BY + 40, width: BW - 4, height: 1 }, C.line),
    bubbleBox(s, 'You', TASK, C.text, BX_USER, BY + 48, BUBBLE_W),
    s.anim(bubbleBox(s, 'claude', 'Pushed tag v1.4.1. Anything else?', MASCOTS[0].color, BX + 16, BY + 90, 300),
      [[0, { opacity: 0 }], [CLAUDE1, { opacity: 1 }, 'step'], [SEND, { opacity: 0 }, 'step']]),
    s.anim(bubbleBox(s, 'You', SHIP, C.text, BX_USER + 120, BY + 90, 320),
      [[0, { opacity: 0 }], [SEND, { opacity: 1 }, 'step']]),
  );
  composerBox(s, parts, {
    click: COMPOSE2, end: RESET, button: 'Send', buttonAt: CP.x + CP.w - 90, clicks: [SEND],
    chunks: [[HASH2, '#'], [NARROW2, '#sh'], [PICK2, SHIP], [SEND, '']],
  });
}

// The # menu, as SlashCommandMenu draws it: #name, the first line, 'preset'.
function menuAt(s, rows, from, to, hi = 0) {
  const RH = 26;
  const h = rows.length * RH;
  const y = CP.y - 4 - h;
  const parts = [box(CP.x, y, CP.w, h, '#27272a', '#3f3f46')];
  rows.forEach((p, k) => {
    if (k === hi) parts.push(rect({ x: CP.x + 1, y: y + k * RH + 1, width: CP.w - 2, height: RH - 2 }, '#3f3f46'));
    parts.push(
      s.text(`#${p.name}`, { x: CP.x + 12, y: y + k * RH + 17, font: 'semi', size: 12, fill: C.text }),
      s.text(p.body.length > 46 ? `${p.body.slice(0, 46)}...` : p.body, { x: CP.x + 12 + 108, y: y + k * RH + 17, font: 'body', size: 11, fill: C.dim }),
      s.text('preset', { x: CP.x + CP.w - 12, y: y + k * RH + 17, font: 'body', size: 10, fill: '#71717a', anchor: 'end' }));
  });
  return during(s, g({}, parts), [[from, to]]);
}

function menus(s) {
  const all = PRESETS;
  const pu = [PRESETS[0]];
  const sh = [PRESETS[2]];
  s.add(menuAt(s, all, HASH, NARROW), menuAt(s, pu, NARROW, PICK), menuAt(s, all, HASH2, NARROW2, 2), menuAt(s, sh, NARROW2, PICK2));
}

const LETTER = `
  wwwwwwwww
  ww.....ww
  w.w...w.w
  w..w.w..w
  w...w...w
  wwwwwwwww`;

// Each sent message flies from the Send button down to claude.
function letters(s) {
  const fly = (at, from) => s.add(s.anim(sprite(LETTER, { w: C.text }, { px: 3 }), [
    [0, { ...from, opacity: 0 }],
    [at + 0.15, { opacity: 1 }, 'step'],
    [at + 0.45, { x: from.x - 40, y: 230 }, 'out'],
    [at + 0.8, { x: CLAUDE_X + 20, y: 318, opacity: 1 }, 'in'],
    [at + 0.85, { opacity: 0 }, 'step'],
  ]));
  fly(CREATE, { x: CP.x + 40, y: CP.y + CP.h + 12 });
  fly(SEND, { x: CP.x + CP.w - 60, y: CP.y + CP.h + 12 });
}

function agent(s, m, i) {
  const dance = [[DONE + 0.4 + i * 0.15, 16], [DONE + 1.3 + i * 0.15, 16]];
  if (m.name !== 'claude') {
    mascot(s, m, i, { hops: dance, done: [[DONE + 0.4, RESET]] });
    return;
  }
  mascot(s, m, i, {
    hops: [[ARRIVE1, 14], [ARRIVE2, 14], ...dance],
    alert: [[ARRIVE1, ARRIVE1 + 0.6], [ARRIVE2, ARRIVE2 + 0.6]],
    work: [[ARRIVE1 + 0.6, CLAUDE1], [ARRIVE2 + 0.6, DONE]],
    done: [[CLAUDE1, ARRIVE2], [DONE, RESET]],
  });
}

// You: add a preset, then use it twice.
function pointer(s) {
  const at = (x, y) => ({ x, y });
  const FX = BX + 380;
  const nameP = at(FX + 200, BY + 134);
  const bodyP = at(FX + 200, BY + 198);
  const addP = at(FX + 55, BY + 248);
  const comp = at(TX + 300, TXT_Y - 6);
  const pickRow = at(CP.x + 120, CP.y - 4 - 13);
  const create = at(CP.x + 52, CP.y + CP.h + 22);
  const comp2 = at(TX + 380, TXT_Y - 6);
  const pickRow2 = at(CP.x + 80, CP.y - 4 - 13);
  const sendP = at(CP.x + CP.w - 90 + 30, CP.y + CP.h + 22);
  cursor(s, [
    [0, OFF],
    [0.2, OFF],
    [NAME_CLICK - 0.15, nameP, 'inOut'], ...press(NAME_CLICK, nameP),
    [BODY_CLICK - 0.3, nameP],
    [BODY_CLICK - 0.15, bodyP, 'inOut'], ...press(BODY_CLICK, bodyP),
    [ADD - 0.6, bodyP],
    [ADD - 0.15, addP, 'inOut'], ...press(ADD, addP),
    [ADD + 0.8, addP],
    [COMPOSE - 0.15, comp, 'inOut'], ...press(COMPOSE, comp),
    [PICK - 0.7, comp],
    [PICK - 0.15, pickRow, 'inOut'], ...press(PICK, pickRow),
    [PICK + 0.5, pickRow],
    [CREATE - 0.15, create, 'inOut'], ...press(CREATE, create),
    [CREATE + 0.6, create],
    [COMPOSE2 - 0.15, comp2, 'inOut'], ...press(COMPOSE2, comp2),
    [PICK2 - 0.7, comp2],
    [PICK2 - 0.15, pickRow2, 'inOut'], ...press(PICK2, pickRow2),
    [PICK2 + 0.4, pickRow2],
    [SEND - 0.15, sendP, 'inOut'], ...press(SEND, sendP),
    [SEND + 0.5, sendP],
    [SEND + 1.2, OFF, 'inOut'],
  ]);
}
