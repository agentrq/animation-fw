// AgentRQ skills with the / command: type / in a new task or a reply, pick a
// skill from the menu, and the agent loads it by name.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, OFF, LOOP, newScene, sky, ground, intro, mascot, cursor, press, during, mascotX,
} from '../kit/agentrq.js';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const S1 = [0.3, 6.6];                     // Skills tab in workspace settings
const S2 = [6.6, 14.0];                    // a new task
const S3 = [14.0, 23.0];                   // a reply in the task
const RESET = 23.0;

const URL_CLICK = 1.0;                     // click the GitHub link field
const IMPORT = 3.6;                        // Import
const COMPOSE = 7.2;                       // click into the new task
const SLASH = 8.6;                         // '/': the menu opens with every skill
const NARROW = 9.6;                        // '/re': release first, code-review second
const PICK = 10.9;                         // Enter: '/release ' takes the text
const CREATE = 13.2;                       // Create Task
const ARRIVE1 = CREATE + 0.8;
const CLAUDE1 = 15.6;                      // claude answers in the thread
const COMPOSE2 = 15.9;
const SLASH2 = 16.2;
const NARROW2 = 16.8;                      // '/co': code-review alone
const PICK2 = 17.6;
const SEND = 19.7;                         // Send
const ARRIVE2 = SEND + 0.8;
const DONE = 21.3;

const TASK = '/release v1.4.1';
const REPLY = '/code-review the release diff';

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

const SKILLS = [
  { name: 'tdd', body: 'write the failing test first' },
  { name: 'code-review', body: 'review a diff for bugs and risks' },
  { name: 'release', body: 'tag, build and publish a release' },
];

const rect = (a, f, extra = {}) => el('rect', { ...a, fill: f, class: 'px', ...extra });
const box = (x, y, w, h, fill = C.card, stroke = C.line) => el('rect', { x, y, width: w, height: h, fill, stroke, 'stroke-width': 1, class: 'px' });

export default function slashSkills() {
  const s = newScene({
    poster: 10.4,
    description: 'AgentRQ skills with the slash command: a workspace has tdd, code-review and release imported from a GitHub link; in a new task you type /, the menu lists the skills, /re narrows it to release, Enter inserts /release and you add v1.4.1; claude runs the skill and replies; in the thread you type /co, pick /code-review and send, and every agent in the workspace has the same skills.',
  });
  sky(s);
  ground(s);
  intro(s, {
    kicker: 'skills',
    headline: ['Type /, pick', 'a skill.'],
    sub: 'Every skill is one / away.',
    steps: [['import', S1[0], S1[1]], ['type /', S1[1], PICK], ['pick', PICK, CREATE], ['send', CREATE, RESET]],
    log: [
      [0, URL_CLICK, '> workspace: web app'],
      [URL_CLICK, IMPORT, '> import from github'],
      [IMPORT, COMPOSE, '> imported: 3 skills', C.lit],
      [COMPOSE, SLASH, '> new task'],
      [SLASH, PICK, '> / lists the skills', C.ask],
      [PICK, CREATE, '> /release is in'],
      [CREATE, CLAUDE1, '> sent to claude'],
      [CLAUDE1, SEND, '> claude: released v1.4.1'],
      [SEND, DONE, '> you: /code-review'],
      [DONE, RESET, '> same skills, every agent', C.lit],
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

// 1. The Skills tab of the workspace settings: import once from a GitHub link.
const GH = 'github.com/acme/skills';
function settings(s, parts) {
  parts.push(
    s.text('Workspace settings', { x: BX + 16, y: BY + 26, font: 'semi', size: 15, fill: C.text }),
    rect({ x: BX + 2, y: BY + 40, width: BW - 4, height: 1 }, C.line),
  );
  [['General', 0], ['Memories', 86], ['Skills', 178], ['Sharing', 240]].forEach(([t, dx]) => {
    const on = t === 'Skills';
    parts.push(s.text(t, { x: BX + 16 + dx, y: BY + 62, font: 'semi', size: 12, fill: on ? C.text : C.dim }));
    if (on) parts.push(rect({ x: BX + 16 + dx, y: BY + 69, width: 40, height: 2 }, C.text));
  });
  // The list.
  parts.push(label(s, 'SKILLS', BX + 16, BY + 92));
  const count = (n, from, to) => during(s, s.text(`${n} IMPORTED`, { x: BX + 16 + 330, y: BY + 92, font: 'semi', size: 10, fill: C.dim, anchor: 'end', spacing: 1 }), [[from, to]]);
  parts.push(count(0, 0, IMPORT + 0.1), count(3, IMPORT + 0.1, LOOP));
  SKILLS.forEach((p, k) => {
    const row = g({},
      box(BX + 16, SLOT(k), 330, 44),
      s.text(p.name, { x: BX + 30, y: SLOT(k) + 18, font: 'mono', size: 12, fill: C.text }),
      s.text(p.body, { x: BX + 30, y: SLOT(k) + 35, font: 'body', size: 11, fill: C.dim }));
    parts.push(s.anim(row, [[0, { opacity: 0 }], [IMPORT + 0.1 + k * 0.25, { opacity: 1 }, 'step']]));
  });
  // The import form.
  const FX = BX + 380;
  parts.push(
    label(s, 'IMPORT FROM GITHUB', FX, BY + 92),
    label(s, 'LINK', FX, BY + 114),
    box(FX, BY + 120, 344, 28, '#27272a', '#3f3f46'),
    during(s, el('rect', { x: FX, y: BY + 120, width: 344, height: 28, fill: 'none', stroke: '#71717a', 'stroke-width': 2, class: 'px' }), [[URL_CLICK, IMPORT]]),
    ...typing(s, [[URL_CLICK + 0.2, 'github'], [URL_CLICK + 0.6, 'github.com/acme'], [URL_CLICK + 1.0, 'github.com/acme/sk'], [URL_CLICK + 1.5, GH]],
      { x: FX + 12, y: BY + 139, size: 12, end: IMPORT, ch: 7.2 }),
    s.text('Every agent in the workspace can load what you import.', { x: FX, y: BY + 176, font: 'body', size: 11, fill: C.dim }),
    ...fakeButton(s, 'Import', FX, BY + 192, 90, [IMPORT]),
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
      [SLASH, '/'], [NARROW, '/re'], [PICK, '/release '],
      [PICK + 0.5, '/release v'], [PICK + 0.8, '/release v1.4'], [PICK + 1.1, TASK],
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
    s.text('Release v1.4.1', { x: BX + 16, y: BY + 26, font: 'semi', size: 15, fill: C.text }),
    ...chip(s, 'Ongoing', BX + BW - 108, BY + 10, C.ongoing, 96),
    rect({ x: BX + 2, y: BY + 40, width: BW - 4, height: 1 }, C.line),
    bubbleBox(s, 'You', TASK, C.text, BX_USER, BY + 48, BUBBLE_W),
    s.anim(bubbleBox(s, 'claude', 'Released v1.4.1. Anything else?', MASCOTS[0].color, BX + 16, BY + 90, 300),
      [[0, { opacity: 0 }], [CLAUDE1, { opacity: 1 }, 'step'], [SEND, { opacity: 0 }, 'step']]),
    s.anim(bubbleBox(s, 'You', REPLY, C.text, BX_USER + 70, BY + 90, 370),
      [[0, { opacity: 0 }], [SEND, { opacity: 1 }, 'step']]),
  );
  composerBox(s, parts, {
    click: COMPOSE2, end: RESET, button: 'Send', buttonAt: CP.x + CP.w - 90, clicks: [SEND],
    chunks: [[SLASH2, '/'], [NARROW2, '/co'], [PICK2, '/code-review '], [PICK2 + 0.6, '/code-review the'], [PICK2 + 1.0, '/code-review the release'], [PICK2 + 1.4, REPLY], [SEND, '']],
  });
}

// The / menu, as SlashCommandMenu draws it: /name, the description, 'skill'.
function menuAt(s, rows, from, to, hi = 0, enterAt = null) {
  const RH = 26;
  const h = rows.length * RH;
  const y = CP.y - 4 - h;
  const parts = [box(CP.x, y, CP.w, h, '#27272a', '#3f3f46')];
  rows.forEach((p, k) => {
    if (k === hi) parts.push(rect({ x: CP.x + 1, y: y + k * RH + 1, width: CP.w - 2, height: RH - 2 }, '#3f3f46'));
    parts.push(
      s.text(`/${p.name}`, { x: CP.x + 12, y: y + k * RH + 17, font: 'semi', size: 12, fill: C.text }),
      s.text(p.body, { x: CP.x + 12 + 118, y: y + k * RH + 17, font: 'body', size: 11, fill: C.dim }),
      s.text('skill', { x: CP.x + CP.w - 12, y: y + k * RH + 17, font: 'body', size: 10, fill: '#71717a', anchor: 'end' }));
  });
  return during(s, g({}, parts), [[from, to]]);
}

// The Enter key that chooses the highlighted row, shown just before it does.
function keycap(s, at) {
  const x = CP.x + CP.w - 84;
  const y = CP.y + 10;
  return during(s, g({},
    rect({ x, y, width: 70, height: 26 }, C.text),
    s.text('Enter', { x: x + 35, y: y + 18, font: 'semi', size: 12, fill: C.ink, anchor: 'middle' })), [[at - 0.5, at]]);
}

function menus(s) {
  const [tdd, review, release] = SKILLS;
  s.add(
    menuAt(s, [tdd, review, release], SLASH, NARROW),
    menuAt(s, [release, review], NARROW, PICK),
    menuAt(s, [tdd, review, release], SLASH2, NARROW2),
    menuAt(s, [review], NARROW2, PICK2),
    keycap(s, PICK),
    keycap(s, PICK2),
  );
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

// You: import the skills, then use them twice.
function pointer(s) {
  const at = (x, y) => ({ x, y });
  const FX = BX + 380;
  const urlP = at(FX + 200, BY + 134);
  const importP = at(FX + 45, BY + 204);
  const comp = at(TX + 300, TXT_Y - 6);
  const create = at(CP.x + 52, CP.y + CP.h + 22);
  const comp2 = at(TX + 380, TXT_Y - 6);
  const sendP = at(CP.x + CP.w - 90 + 30, CP.y + CP.h + 22);
  cursor(s, [
    [0, OFF],
    [0.2, OFF],
    [URL_CLICK - 0.15, urlP, 'inOut'], ...press(URL_CLICK, urlP),
    [IMPORT - 0.6, urlP],
    [IMPORT - 0.15, importP, 'inOut'], ...press(IMPORT, importP),
    [IMPORT + 0.8, importP],
    [COMPOSE - 0.15, comp, 'inOut'], ...press(COMPOSE, comp),
    [CREATE - 0.7, comp],
    [CREATE - 0.15, create, 'inOut'], ...press(CREATE, create),
    [CREATE + 0.6, create],
    [COMPOSE2 - 0.15, comp2, 'inOut'], ...press(COMPOSE2, comp2),
    [SEND - 0.7, comp2],
    [SEND - 0.15, sendP, 'inOut'], ...press(SEND, sendP),
    [SEND + 0.5, sendP],
    [SEND + 1.2, OFF, 'inOut'],
  ]);
}
