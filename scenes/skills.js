// AgentRQ's skills: playbooks imported once into the account, turned on in
// the workspaces that need them, and loaded by each agent when a task
// matches. One copy, so an edit reaches every workspace.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, PX, GROUND, OFF, newScene, sky, ground, intro, frame, button, mascot, cursor, press, during,
} from '../kit/agentrq.js';

// The three skills in the repository, each with its own book.
const SKILLS = [
  { name: 'tdd', lines: ['Write the failing test', 'first, then the code.'], cover: '#4ade80', spine: '#15803d' },
  { name: 'code-review', lines: ['Check a diff for bugs', 'before it merges.'], cover: '#60a5fa', spine: '#1d4ed8' },
  { name: 'release', lines: ['Tag, build and announce', 'a new version.'], cover: '#c084fc', spine: '#7e22ce' },
];

// The workspaces they are turned on in, and the agent working in each. Each
// agent's task matches the skill in the same place.
const WORKSPACES = ['api', 'web', 'docs'];
const AGENTS = [0, 1, 2].map((i) => ({ m: MASCOTS[i], x: 580 + i * 240 }));

const URL = 'https://github.com/acme/playbooks';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const FOCUS = 0.8;                         // you click into the Import field
const IMPORT = 3;                          // and click Import
const POP = (i) => 3.5 + 0.35 * i;         // each skill's card lands
const ON = (i) => 5.4 + 0.6 * i;           // you turn them on in a workspace
const TASK = (i) => 8 + 0.5 * i;           // its agent gets a task
const MATCH = (i) => TASK(i) + 0.7;        // its search finds the skill
const FLY = (i) => MATCH(i) + 0.2;         // the book leaves the card
const LAND = (i) => FLY(i) + 1;            // and reaches the agent
const EDIT = 13.2;                         // you edit code-review
const SPREAD = EDIT + 0.4;                 // the change leaves the card
const ARRIVE = (i) => EDIT + 1 + 0.15 * i; // and reaches each workspace
const FRESH = EDIT + 1.4;                  // codex has the new copy
const DONE = [15.8, 16.8, 16.2];
const DANCE = 18;
const RESET = 22.6;

// What the Import field holds, a few keys at a time: [second, text].
const TYPED = [
  [1, 'https://'], [1.35, 'https://github.com/'], [1.7, 'https://github.com/acme/'],
  [2.05, 'https://github.com/acme/play'], [2.4, URL],
];

// ---------------------------------------------------------------- the window
const BX = 440;
const BY = 20;
const BW = 740;
const BH = 272;

const FIELD = { x: BX + 16, y: BY + 70, w: BW - 32 - 136, h: 30 };
const IMPORT_BTN = { x: BX + BW - 16 - 124, y: FIELD.y + 3, w: 124 };
const CH = 7.8;                            // one mono character at 13 px

const CARD_W = 156;
const CARD_H = 144;
const cardAt = (i) => ({ x: BX + 16 + i * (CARD_W + 12), y: BY + 116 });

const PANEL = { x: BX + 16 + 3 * (CARD_W + 12) + 4, y: BY + 116, w: 0 };
PANEL.w = BX + BW - 16 - PANEL.x;
const rowAt = (i) => ({ x: PANEL.x, y: PANEL.y + 20 + i * 42 });
const ROW_H = 36;
const switchAt = (i) => ({ x: PANEL.x + PANEL.w - 12 - 40, y: rowAt(i).y + 8 });

const BOOK = `
  dccccccc
  dcwwwwcc
  dccccccc
  dccccccc
  dccccccc
  dccccccc
  dppppppp
  .ddddddd`;
const book = (k, opts) => sprite(BOOK, { c: SKILLS[k].cover, d: SKILLS[k].spine, w: '#fafafa', p: '#e4e4e7' }, opts);

// Where a mascot's bubble sits, as the kit places it.
function bubbleAt({ m, x }) {
  const rows = m.art.split('\n').map((l) => l.trim()).filter(Boolean);
  const width = Math.max(...rows.map((r) => r.length)) * PX;
  const top = GROUND - rows.length * PX - (m.float ? 12 : 0);
  return { x: x + width / 2 - 6, y: top - 34 };
}

export default function skills() {
  const s = newScene({
    poster: 10.25,
    description: 'AgentRQ skills: you paste a GitHub link and import three skills, tdd, code-review and release, then turn them on in the api, web and docs workspaces. Each agent, claude, codex and agy, gets a task, finds the skill that matches and loads it; you edit code-review and the one copy updates in every workspace, and the agents finish and celebrate.',
  });

  sky(s);
  ground(s);
  story(s);
  screen(s);
  field(s);
  SKILLS.forEach((_, k) => card(s, k));
  WORKSPACES.forEach((_, i) => row(s, i));
  ripple(s);
  AGENTS.forEach((_, i) => flight(s, i, i, FLY(i), LAND(i)));
  flight(s, 1, 1, SPREAD, FRESH);
  AGENTS.forEach((a, i) => agent(s, a, i));
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'skills',
    headline: ['Teach it once,', 'every agent knows.'],
    sub: 'Shared playbooks, loaded when they match.',
    steps: [['import', FOCUS, ON(0) - 0.4], ['enable', ON(0) - 0.4, TASK(0)], ['match', TASK(0), EDIT], ['share', EDIT, RESET]],
    log: [
      [0, FOCUS, '> no skills yet_'],
      [FOCUS, POP(0), '> you: github.com/acme/playbooks'],
      [POP(0), ON(0), '> imported 3 skills', C.lit],
      [ON(0), TASK(0), '> on in api, web and docs'],
      [TASK(0), MATCH(0), '> 3 tasks: searching skills'],
      [MATCH(0), LAND(2) + 0.6, '> loading tdd, code-review, release'],
      [LAND(2) + 0.6, EDIT, '> 3 agents at work'],
      [EDIT, ARRIVE(0), '> you: edit code-review'],
      [ARRIVE(0), DONE[1] + 0.4, '> code-review updated everywhere', C.lit],
      [DONE[1] + 0.4, RESET, '> 3 of 3 done', C.lit],
    ],
  });
}

// The Skills page.
function screen(s) {
  frame(s, { x: BX, y: BY, w: BW, h: BH, title: 'Skills' });
  s.add(el('rect', { x: BX + 2, y: BY + 40, width: BW - 4, height: 1, fill: C.line, class: 'px' }));
}

const textAt = (k) => TYPED[k][0];
const until = (k) => (k + 1 < TYPED.length ? TYPED[k + 1][0] : RESET + 0.3);

// Import from GitHub: the link a few keys at a time, then Import.
function field(s) {
  const { x, y, w, h } = FIELD;
  s.add(
    s.text('IMPORT FROM GITHUB', { x, y: y - 10, font: 'semi', size: 10, fill: '#71717a', spacing: 1.5 }),
    el('rect', { x, y, width: w, height: h, fill: C.bg, stroke: '#3f3f46', 'stroke-width': 1, class: 'px' }),
    during(s, el('rect', { x, y, width: w, height: h, fill: 'none', stroke: '#71717a', 'stroke-width': 2, class: 'px' }), [[FOCUS, IMPORT + 0.3]]),
    during(s, s.text('https://github.com/owner/repo', { x: x + 12, y: y + 20, font: 'mono', size: 13, fill: '#52525b' }), [[0, textAt(0)], [RESET + 0.3, 24]]),
  );
  TYPED.forEach(([t, text], k) => s.add(during(s, s.text(text, { x: x + 12, y: y + 20, font: 'mono', size: 13, fill: C.text }), [[t, until(k)]])));
  const caret = s.anim(el('rect', { x: x + 13 + URL.length * CH, y: y + 7, width: 2, height: 16, fill: C.text, class: 'px' }),
    [[0, { opacity: 1 }], [0.5, { opacity: 0 }, 'step']], { period: 1 });
  s.add(during(s, caret, [[textAt(TYPED.length - 1), IMPORT]]));
  button(s, { ...IMPORT_BTN, label: 'IMPORT', clicks: [IMPORT] });
}

// How many workspaces a skill is on in, as its card says.
const COUNTS = ['Not on in any workspace', 'On in 1 workspace', 'On in 2 workspaces', 'On in 3 workspaces'];

// A skill's card: its book, name, description and where it is on. It glows
// when a search finds it, and flashes when you edit it.
function card(s, k) {
  const { name, lines } = SKILLS[k];
  const review = name === 'code-review';
  const spans = [[0, ON(0)], [ON(0), ON(1)], [ON(1), ON(2)], [ON(2), 24]];

  const parts = [
    el('rect', { width: CARD_W, height: CARD_H, fill: C.card, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    book(k, { px: 4, x: 12, y: 12 }),
    s.text(name, { x: 12, y: 66, font: 'mono', size: 13, fill: C.text }),
    s.text(lines[0], { x: 12, y: 88, font: 'body', size: 11, fill: C.dim }),
    s.text(lines[1], { x: 12, y: 103, font: 'body', size: 11, fill: C.dim }),
    ...COUNTS.map((text, n) => during(s, s.text(text, { x: 12, y: CARD_H - 14, font: 'body', size: 10, fill: '#71717a' }), [spans[n]])),
    during(s, el('rect', { width: CARD_W, height: CARD_H, fill: 'none', stroke: C.lit, 'stroke-width': 2, class: 'px' }), [[MATCH(k), MATCH(k) + 1]]),
  ];
  if (review) {
    // Your edit: a flash, the app's Modified badge, and a lit edge while
    // the change goes out.
    parts.push(
      s.anim(el('rect', { width: CARD_W, height: CARD_H, fill: C.lit, class: 'px' }),
        [[0, { opacity: 0 }], [EDIT - 0.15, { opacity: 0.3 }, 'step'], [EDIT + 0.3, { opacity: 0 }]]),
      during(s, el('rect', { width: CARD_W, height: CARD_H, fill: 'none', stroke: C.lit, 'stroke-width': 2, class: 'px' }), [[EDIT, ARRIVE(2) + 0.3]]),
      during(s, g({},
        el('rect', { x: CARD_W - 74, y: 14, width: 62, height: 16, fill: 'none', stroke: '#b45309', 'stroke-width': 1, class: 'px' }),
        s.text('MODIFIED', { x: CARD_W - 43, y: 26, font: 'semi', size: 8, fill: '#fcd34d', anchor: 'middle', spacing: 1 })),
      [[EDIT + 0.3, RESET + 0.5]]),
    );
  }

  const { x, y } = cardAt(k);
  s.add(s.anim(g({}, parts), [
    [0, { x, y: y + 10, opacity: 0, scale: 0.8 }],
    [POP(k), { opacity: 0 }, 'step'],
    [POP(k) + 0.35, { y, opacity: 1, scale: 1 }, 'back'],
    [RESET, { opacity: 1 }],
    [RESET + 0.5, { opacity: 0 }],
  ], { origin: 'center' }));
}

// A pixel on/off switch, on from `on`.
function toggle(s, { x, y }, on) {
  const off = g({},
    el('rect', { x, y, width: 40, height: 20, fill: '#3f3f46', class: 'px' }),
    el('rect', { x: x + 4, y: y + 4, width: 12, height: 12, fill: C.dim, class: 'px' }));
  const lit = g({},
    el('rect', { x, y, width: 40, height: 20, fill: C.text, class: 'px' }),
    el('rect', { x: x + 24, y: y + 4, width: 12, height: 12, fill: C.ink, class: 'px' }));
  s.add(during(s, off, [[0, on], [RESET + 0.5, 24]]), during(s, lit, [[on, RESET + 0.5]]));
}

// Turn on in: a row per workspace, with its agent and its switch. A row
// lights when you turn it on and when your edit reaches it.
function row(s, i) {
  if (i === 0) s.add(s.text('TURN ON IN', { x: PANEL.x, y: PANEL.y + 8, font: 'semi', size: 10, fill: '#71717a', spacing: 1.5 }));
  const { x, y } = rowAt(i);
  const { m } = AGENTS[i];
  s.add(
    el('rect', { x, y, width: PANEL.w, height: ROW_H, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    during(s, el('rect', { x, y, width: PANEL.w, height: ROW_H, fill: C.lit, opacity: 0.18, class: 'px' }),
      [[ON(i), ON(i) + 0.4], [ARRIVE(i), ARRIVE(i) + 0.6]]),
    el('rect', { x: x + 12, y: y + 15, width: 6, height: 6, fill: m.color, class: 'px' }),
    s.text(WORKSPACES[i], { x: x + 26, y: y + 23, font: 'mono', size: 13, fill: C.text }),
    s.text(m.name, { x: x + 70, y: y + 22, font: 'mono', size: 10, fill: '#71717a' }),
  );
  toggle(s, switchAt(i), ON(i));
}

// Your edit going out: a pulse per workspace, up out of the card, along the
// lane above the cards and into that workspace's row.
function ripple(s) {
  const c = cardAt(1);
  const lane = c.y - 10;
  const turn = PANEL.x - 14;
  WORKSPACES.forEach((_, i) => {
    const r = rowAt(i);
    const lag = 0.12 * i;
    const p = (x, y) => ({ x: x - 5, y: y - 5 });
    s.add(s.anim(el('rect', { width: 10, height: 10, fill: C.lit, class: 'px' }), [
      [0, { ...p(c.x + CARD_W / 2, c.y + 20), opacity: 0 }],
      [SPREAD + lag, { opacity: 1 }, 'step'],
      [SPREAD + lag + 0.15, p(c.x + CARD_W / 2, lane)],
      [ARRIVE(i) - 0.25, p(turn, lane)],
      [ARRIVE(i) - 0.1, p(turn, r.y + ROW_H / 2)],
      [ARRIVE(i), p(r.x + 4, r.y + ROW_H / 2)],
      [ARRIVE(i) + 0.05, { opacity: 0 }, 'step'],
    ]));
  });
}

// A book flying from skill k's card to agent i's bubble.
function flight(s, k, i, from, to) {
  const c = cardAt(k);
  const start = { x: c.x + 16, y: c.y + 16 };
  const end = { ...bubbleAt(AGENTS[i]) };
  end.x += 1;
  const lift = { x: start.x + (end.x - start.x) * 0.1, y: start.y - 20 };
  s.add(s.anim(book(k, { px: 4 }), [
    [0, { ...start, opacity: 0 }],
    [from, { opacity: 1 }, 'step'],
    [from + 0.25, lift, 'out'],
    [to, end, 'inOut'],
    [to + 0.05, { opacity: 0 }, 'step'],
  ]));
}

// Each agent hops when its workspace is turned on, gets a task, loads its
// book, works and finishes; codex gets the new code-review mid-task.
function agent(s, a, i) {
  const codex = i === 1;
  const fresh = book(1, { px: 2, x: 9, y: 4 });
  const say = [[book(i, { px: 2, x: 9, y: 4 }), [[LAND(i), LAND(i) + 1.2]]]];
  if (codex) say.push([fresh, [[FRESH, FRESH + 1]], C.lit]);
  const work = codex ? [[LAND(i) + 1.2, FRESH], [FRESH + 1, DONE[i]]] : [[LAND(i) + 1.2, DONE[i]]];
  const hops = [[ON(i) + 0.1, 10], [TASK(i), 14], [LAND(i), 14], [DONE[i], 22], [DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]];
  if (codex) hops.push([FRESH, 14]);
  mascot(s, a.m, i, { x: a.x, hops, alert: [[TASK(i), LAND(i)]], say, work, done: [[DONE[i], RESET]] });
  // Its workspace, beside its name.
  s.add(s.text(`@${WORKSPACES[i]}`, { x: a.x + a.m.name.length * 6 + 10, y: GROUND + 28, font: 'mono', size: 12, fill: '#71717a' }));
}

// You: click the field, Import, the three switches, then the code-review card.
function pointer(s) {
  const box = { x: FIELD.x + 300, y: FIELD.y + 16 };
  const imp = { x: IMPORT_BTN.x + 60, y: IMPORT_BTN.y + 13 };
  const sw = (i) => ({ x: switchAt(i).x + 20, y: switchAt(i).y + 10 });
  const review = { x: cardAt(1).x + 90, y: cardAt(1).y + 70 };
  cursor(s, [
    [0, OFF],
    [0.2, OFF],
    [FOCUS - 0.15, box, 'inOut'],
    ...press(FOCUS, box),
    [IMPORT - 0.6, box],
    [IMPORT - 0.2, imp, 'inOut'],
    ...press(IMPORT, imp),
    [POP(2) + 0.2, imp],
    ...[0, 1, 2].flatMap((i) => [[ON(i) - 0.35, sw(i), 'inOut'], ...press(ON(i), sw(i))]),
    [ON(2) + 0.4, sw(2)],
    [ON(2) + 1, OFF, 'inOut'],
    [EDIT - 0.8, OFF],
    [EDIT - 0.2, review, 'inOut'],
    ...press(EDIT, review),
    [EDIT + 0.6, review],
    [EDIT + 1.3, OFF, 'inOut'],
  ]);
}
