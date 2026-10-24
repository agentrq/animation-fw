// AgentRQ's Pano: one board of markdown docs shared by every workspace of the
// account. An agent posts a plan and hands its id to agents in other
// workspaces; they read it, comment, and their checklist items tick
// themselves as their tasks finish. You write a note of your own and turn it
// into a task.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, PX, GROUND, OFF, newScene, sky, ground, intro, frame, mascot, mascotX, cursor, press, during,
} from '../kit/agentrq.js';

const ID = '#7Kp2';

// The app's post-it colours: paper, tape, title and body ink, the footer's
// muted ink, the accent, and the progress track.
const YELLOW = { paper: '#fffbeb', tape: '#fef08a', title: '#713f12', body: '#542d0c', muted: '#854d0e', ink: '#b15f00', track: '#fef08a' };
const PINK = { paper: '#fdf2f8', tape: '#fbcfe8', title: '#9d174d', body: '#831843', muted: '#be185d', ink: '#db2777', track: '#fce7f3' };
const GREEN = { paper: '#f0fdf4', tape: '#bbf7d0', title: '#166534', body: '#14532d', muted: '#15803d', ink: '#16a34a', track: '#dcfce7' };
const DOTS = ['#facc15', '#f472b6', '#86efac', '#93c5fd'];

// An assigned item's chip: its task's status.
const STATUS = { notstarted: '#94a3b8', ongoing: '#2563eb', done: '#16a34a' };

// Release plan's checklist, each item assigned to an agent's workspace.
const ITEMS = [
  { label: 'Build binaries', agent: 'agy' },
  { label: 'Smoke test', agent: 'codex' },
  { label: 'Changelog', agent: 'openclaw' },
];

// The agents who get the id, in the order the tags leave claude.
const SHARED = ['codex', 'agy', 'openclaw'];
const idx = (name) => MASCOTS.findIndex((m) => m.name === name);

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const POST = 1;                                  // claude's note drops on
const LINE = (k) => POST + 0.4 + 0.15 * k;       // its text appears
const ROW = (k) => POST + 0.8 + 0.2 * k;         // and its checklist
const SHARE = 4;                                 // claude hands out the id
const FLY = (j) => SHARE + 0.3 + 0.25 * j;       // a tag leaves claude
const LAND = (j) => FLY(j) + 0.5 + (mascotX(idx(SHARED[j])) - mascotX(0)) / 600;
const READ = 1.4;                                // reading, after landing
const COMMENT = { agy: 7.4, openclaw: 8.6 };     // two of them comment
const TICK = [10.4, 11.6, 12.8];                 // each item's task is done
const DOT = 13.8;                                // you start a green note
const NOTE = DOT + 0.3;                          // it lands on the board
const TYPED = [[NOTE + 0.3, 'Try'], [NOTE + 0.6, 'Try dark'], [NOTE + 0.9, 'Try dark mode']];
const TO_TASK = 15.8;                            // you click Make it a task
const PICK = 16.6;                               // and pick hermes
const HERMES_DONE = 19.2;
const DANCE = 19.6;
const RESET = 22.6;

const startOf = (name) => {
  const j = SHARED.indexOf(name);
  return name in COMMENT ? COMMENT[name] + 0.9 : LAND(j) + READ;
};
const itemOf = (name) => ITEMS.findIndex((it) => it.agent === name);

// ---------------------------------------------------------------- the board
const BX = 440;
const BY = 20;
const BW = 740;
const BH = 272;
const CY = BY + 62;
const CH = 196;

const NEW = { x: BX + 16, w: 112 };
const PLAN = { x: NEW.x + NEW.w + 16, w: 232 };
const CHART = { x: PLAN.x + PLAN.w + 16, w: 152 };
const MINE = { x: CHART.x + CHART.w + 16, w: 164 };

const rowY = (k) => 66 + k * 22;
const dotAt = (c) => ({ x: NEW.x + 22 + c * 18, y: CY + 150 });
const clipAt = { x: MINE.x + MINE.w - 30, y: CY + CH - 21 };
const MENU = { x: MINE.x + MINE.w - 134, y: CY + 70, w: 124 };
const menuRow = (k) => MENU.y + 26 + k * 22;
const MENU_ROWS = ['agy', 'hermes', 'openclaw'];

const TICK_ART = `
  .....#
  ....##
  #..##.
  ####..
  .##...`;

// Make it a task: a clipboard with a tick.
const CLIP = `
  ..###..
  #######
  #.....#
  #....##
  #...#.#
  ##.#..#
  #.#...#
  #.....#
  #######`;

const SPEECH = `
  #######
  #.....#
  #.....#
  #######
  .##....
  .#.....`;

const EYES = `
  ##..##
  ##..##
  ##..##`;

export default function pano() {
  const s = newScene({
    poster: 12.2,
    description: "AgentRQ Pano: claude posts a Release plan on the board every workspace shares, with a checklist assigned to agy, codex and openclaw, and hands its id to them. They read it and comment, and each item ticks itself as its task finishes until it reads 3 of 3 done; then you write a note of your own, turn it into a task for hermes, and everyone celebrates.",
  });

  sky(s);
  ground(s);
  story(s);
  screen(s);
  newNote(s);
  chart(s);
  plan(s);
  mine(s);
  SHARED.forEach((name, j) => tag(s, j));
  MASCOTS.forEach((m, i) => agent(s, m, i));
  menu(s);
  pointer(s);
  return s;
}

function story(s) {
  const done = TICK.at(-1) + 0.3;
  intro(s, {
    kicker: 'pano',
    headline: ['One wall,', 'every workspace.'],
    sub: 'Agents post, share and tick off plans.',
    steps: [['post', POST - 0.4, SHARE], ['share', SHARE, COMMENT.agy - 0.4], ['comment', COMMENT.agy - 0.4, TICK[0] - 0.4], ['track', TICK[0] - 0.4, RESET]],
    log: [
      [0, POST - 0.4, '> claude writing a plan_'],
      [POST - 0.4, SHARE, '> claude posted Release plan'],
      [SHARE, LAND(2) + 0.2, `> shared ${ID} with 3 workspaces`],
      [LAND(2) + 0.2, COMMENT.agy, '> codex, agy, openclaw reading'],
      [COMMENT.agy, COMMENT.openclaw, '> agy commented'],
      [COMMENT.openclaw, TICK[0], '> openclaw commented'],
      [TICK[0], TICK[1], '> agy done: 1 of 3'],
      [TICK[1], TICK[2], '> codex done: 2 of 3'],
      [TICK[2], DOT, '> 3 of 3 done', C.lit],
      [DOT, PICK, '> you: a note of your own'],
      [PICK, HERMES_DONE, '> you: a task for hermes', C.ask],
      [HERMES_DONE, RESET, '> plan shipped, note done', C.lit],
    ],
  });
}

// The Pano window: its title and the colour filter pills.
function screen(s) {
  frame(s, { x: BX, y: BY, w: BW, h: BH, title: 'Pano' });
  const px = BX + 72;
  s.add(
    el('rect', { x: px, y: BY + 12, width: 34, height: 18, fill: '#d97706', class: 'px' }),
    s.text('All', { x: px + 17, y: BY + 25, font: 'semi', size: 11, fill: C.text, anchor: 'middle' }),
    ...DOTS.map((fill, c) => el('rect', { x: px + 44 + c * 18, y: BY + 16, width: 10, height: 10, fill, class: 'px' })),
    el('rect', { x: BX + 2, y: BY + 40, width: BW - 4, height: 1, fill: C.line, class: 'px' }),
  );
}

// The first card on the board: New note, with a dot per colour to start one.
function newNote(s) {
  const { x, w } = NEW;
  const mid = x + w / 2;
  s.add(
    el('rect', { x, y: CY, width: w, height: CH, fill: C.column, stroke: '#3f3f46', 'stroke-width': 1, 'stroke-dasharray': '4 4', class: 'px' }),
    el('rect', { x: mid - 18, y: CY + 50, width: 36, height: 36, fill: '#ffdcb5', class: 'px' }),
    el('rect', { x: mid - 2, y: CY + 58, width: 4, height: 20, fill: '#7a3d06', class: 'px' }),
    el('rect', { x: mid - 10, y: CY + 66, width: 20, height: 4, fill: '#7a3d06', class: 'px' }),
    s.text('New note', { x: mid, y: CY + 112, font: 'bold', size: 14, fill: C.text, anchor: 'middle' }),
    el('rect', { x: dotAt(0).x - 8, y: dotAt(0).y - 7, width: 4 * 18 + 6, height: 14 + 0, fill: '#27272a', class: 'px' }),
    ...DOTS.map((fill, c) => el('rect', { x: dotAt(c).x - 5, y: dotAt(c).y - 5, width: 10, height: 10, fill, class: 'px' })),
  );
  // Your click on the green dot.
  s.add(during(s, el('rect', { x: dotAt(2).x - 8, y: dotAt(2).y - 8, width: 16, height: 16, fill: 'none', stroke: C.text, 'stroke-width': 2, class: 'px' }), [[DOT - 0.1, DOT + 0.4]]));
}

// A post-it's paper, tape, title and footer, drawn at the origin.
function paper(s, { w, color, title, author, when = 'now' }) {
  return [
    el('rect', { x: 3, y: 3, width: w, height: CH, fill: '#000', opacity: 0.35, class: 'px' }),
    el('rect', { width: w, height: CH, fill: color.paper, class: 'px' }),
    el('rect', { x: w / 2 - 28, y: -6, width: 56, height: 12, fill: color.tape, opacity: 0.9, class: 'px' }),
    title ? s.text(title, { x: 14, y: 32, font: 'bold', size: 16, fill: color.title }) : null,
    el('rect', { x: 0, y: CH - 32, width: w, height: 1, fill: color.title, opacity: 0.15, class: 'px' }),
    el('rect', { x: 14, y: CH - 24, width: 16, height: 16, fill: color.ink, class: 'px' }),
    s.text(author[0].toUpperCase(), { x: 22, y: CH - 12, font: 'bold', size: 10, fill: '#fff', anchor: 'middle' }),
    s.text(`${author} · ${when}`, { x: 38, y: CH - 12, font: 'semi', size: 11, fill: color.muted }),
  ];
}

// A line of text, sketched as a bar.
const bar = (x, y, w, color) => el('rect', { x, y, width: w, height: 4, fill: color.body, opacity: 0.28, class: 'px' });

// Someone's earlier chart, on the board all along.
function chart(s) {
  const { x, w } = CHART;
  const heights = [24, 38, 30, 52, 64];
  s.add(g({ transform: `translate(${x} ${CY})` },
    ...paper(s, { w, color: PINK, title: 'Q3 metrics', author: 'agy', when: '2h' }),
    bar(14, 44, 110, PINK),
    ...heights.map((h, k) => el('rect', { x: 18 + k * 24, y: 136 - h, width: 16, height: h, fill: k === 4 ? PINK.ink : '#f9a8d4', class: 'px' })),
    el('rect', { x: 14, y: 136, width: 124, height: 2, fill: PINK.title, opacity: 0.4, class: 'px' }),
  ));
}

// claude's Release plan: text, a checklist that ticks itself, the progress
// bar and pill, and the comment counter.
function plan(s) {
  const { x, w } = PLAN;
  const c = YELLOW;
  const parts = [
    ...paper(s, { w, color: c, title: 'Release plan', author: 'claude' }),
    during(s, bar(14, 42, 190, c), [[LINE(0), 24]]),
    during(s, bar(14, 52, 140, c), [[LINE(1), 24]]),
  ];

  ITEMS.forEach((it, k) => {
    const y = rowY(k);
    const start = startOf(it.agent);
    const chipW = it.agent.length * 6 + 26;
    const chipX = w - 14 - chipW;
    const row = g({},
      el('rect', { x: 14, y: y + 2, width: 12, height: 12, fill: c.paper, stroke: c.muted, 'stroke-width': 2, class: 'px' }),
      during(s, g({},
        el('rect', { x: 13, y: y + 1, width: 14, height: 14, fill: c.ink, class: 'px' }),
        sprite(TICK_ART, { '#': '#fff' }, { px: 2, x: 14, y: y + 3 })), [[TICK[k], 24]]),
      s.text(it.label, { x: 34, y: y + 13, font: 'semi', size: 12, fill: c.body }),
      el('rect', { x: chipX, y: y + 1, width: chipW, height: 15, fill: c.tape, class: 'px' }),
      s.anim(el('rect', { x: chipX + 7, y: y + 6, width: 6, height: 6, class: 'px' }),
        [[0, { fill: STATUS.notstarted }], [start, { fill: STATUS.ongoing }, 'step'], [TICK[k], { fill: STATUS.done }, 'step']]),
      s.text(it.agent, { x: chipX + 18, y: y + 12, font: 'mono', size: 10, fill: c.title }),
    );
    parts.push(during(s, row, [[ROW(k), 24]]));
  });

  // Progress: a third of the bar per item, and the pill under it.
  const by = 138;
  const third = (w - 28) / 3;
  const progress = [
    el('rect', { x: 14, y: by, width: w - 28, height: 6, fill: c.track, class: 'px' }),
    ...TICK.map((t, k) => s.anim(el('rect', { x: 14 + k * third, y: by, width: third, height: 6, fill: c.ink, class: 'px' }),
      [[0, { opacity: 0 }], [t, { opacity: 0 }, 'step'], [t + 0.3, { opacity: 1 }]])),
    el('rect', { x: 14, y: by + 12, width: 86, height: 16, fill: c.tape, class: 'px' }),
    el('rect', { x: 21, y: by + 18, width: 4, height: 4, fill: c.ink, class: 'px' }),
    ...[0, 1, 2, 3].map((n) => during(s, s.text(`${n} OF 3 DONE`, { x: 30, y: by + 24, font: 'bold', size: 9, fill: c.title, spacing: 1 }),
      [[n ? TICK[n - 1] : 0, n < 3 ? TICK[n] : 24]])),
  ];
  parts.push(during(s, g({}, progress), [[ROW(2) + 0.2, 24]]));

  // The comment counter, from the first comment.
  parts.push(during(s, sprite(SPEECH, { '#': c.muted }, { px: 2, x: w - 40, y: CH - 22 }), [[COMMENT.agy, 24]]));
  [COMMENT.agy, COMMENT.openclaw].forEach((t, k) => parts.push(
    during(s, s.text(String(k + 1), { x: w - 20, y: CH - 12, font: 'bold', size: 11, fill: c.muted }), [[t, k ? 24 : COMMENT.openclaw]]),
    during(s, el('rect', { x: w - 46, y: CH - 28, width: 40, height: 24, fill: c.ink, opacity: 0.18, class: 'px' }), [[t, t + 0.4]]),
  ));

  // Lit while the tags are out, and as each item ticks.
  parts.push(during(s, el('rect', { width: w, height: CH, fill: 'none', stroke: C.lit, 'stroke-width': 3, class: 'px' }),
    [[SHARE, LAND(2)], ...TICK.map((t) => [t, t + 0.4])]));

  s.add(s.anim(g({}, parts), [
    [0, { x, y: CY - 16, opacity: 0 }],
    [POST, { opacity: 0 }, 'step'],
    [POST + 0.35, { y: CY, opacity: 1 }, 'back'],
    [RESET, { opacity: 1 }],
    [RESET + 0.5, { opacity: 0 }],
  ]));
}

// Your green note: it lands, its title is typed, and its button makes it a
// task.
function mine(s) {
  const { x, w } = MINE;
  const c = GREEN;
  const parts = [
    ...paper(s, { w, color: c, author: 'You' }),
    ...TYPED.map(([t, text], k) => during(s, s.text(text, { x: 14, y: 32, font: 'bold', size: 16, fill: c.title }),
      [[t, k + 1 < TYPED.length ? TYPED[k + 1][0] : 24]])),
    during(s, bar(14, 42, 120, c), [[TYPED[2][0] + 0.3, 24]]),
    during(s, bar(14, 52, 84, c), [[TYPED[2][0] + 0.45, 24]]),
    sprite(CLIP, { '#': c.muted }, { px: 2, x: w - 37, y: CH - 27 }),
    during(s, el('rect', { x: w - 42, y: CH - 30, width: 24, height: 26, fill: c.ink, opacity: 0.2, class: 'px' }), [[TO_TASK - 0.15, PICK]]),
    // Once it is a task: the app's chip for hermes, ongoing then done.
    during(s, g({},
      el('rect', { x: 14, y: 66, width: 68, height: 15, fill: c.tape, class: 'px' }),
      s.anim(el('rect', { x: 21, y: 71, width: 6, height: 6, class: 'px' }),
        [[0, { fill: STATUS.ongoing }], [HERMES_DONE, { fill: STATUS.done }, 'step']]),
      s.text('hermes', { x: 32, y: 77, font: 'mono', size: 10, fill: c.title })), [[PICK + 0.2, 24]]),
  ];
  s.add(s.anim(g({}, parts), [
    [0, { x, y: CY - 16, opacity: 0 }],
    [NOTE, { opacity: 0 }, 'step'],
    [NOTE + 0.35, { y: CY, opacity: 1 }, 'back'],
    [RESET, { opacity: 1 }],
    [RESET + 0.5, { opacity: 0 }],
  ]));
}

// Make a task in: the workspaces, hermes picked.
function menu(s) {
  const { x, y, w } = MENU;
  const h = 26 + MENU_ROWS.length * 22 + 4;
  const parts = [
    el('rect', { x: x + 3, y: y + 3, width: w, height: h, fill: '#000', opacity: 0.4, class: 'px' }),
    el('rect', { x, y, width: w, height: h, fill: C.panel, stroke: '#3f3f46', 'stroke-width': 1, class: 'px' }),
    s.text('MAKE A TASK IN', { x: x + 10, y: y + 17, font: 'bold', size: 8, fill: '#71717a', spacing: 1.5 }),
    during(s, el('rect', { x: x + 1, y: menuRow(1) - 1, width: w - 2, height: 22, fill: '#27272a', class: 'px' }), [[PICK - 0.4, 24]]),
    ...MENU_ROWS.map((name, k) => g({},
      el('rect', { x: x + 10, y: menuRow(k) + 7, width: 6, height: 6, fill: MASCOTS[idx(name)].color, class: 'px' }),
      s.text(name, { x: x + 22, y: menuRow(k) + 14, font: 'semi', size: 12, fill: C.text }))),
  ];
  s.add(during(s, g({}, parts), [[TO_TASK, PICK + 0.15]]));
}

// Where a mascot's bubble sits, as the kit places it.
function bubbleAt(i) {
  const m = MASCOTS[i];
  const rows = m.art.split('\n').map((l) => l.trim()).filter(Boolean);
  const width = Math.max(...rows.map((r) => r.length)) * PX;
  const top = GROUND - rows.length * PX - (m.float ? 12 : 0);
  return { x: mascotX(i) + width / 2 - 6, y: top - 34 };
}

// The id, as a tag flying from claude to agent j.
function tag(s, j) {
  const start = bubbleAt(0);
  const end = bubbleAt(idx(SHARED[j]));
  const mid = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - 26 };
  const chip = g({},
    el('rect', { width: 52, height: 20, fill: YELLOW.tape, class: 'px' }),
    s.text(ID, { x: 26, y: 14, font: 'mono', size: 11, fill: YELLOW.title, anchor: 'middle' }));
  s.add(s.anim(chip, [
    [0, { ...start, opacity: 0 }],
    [FLY(j), { opacity: 1 }, 'step'],
    [(FLY(j) + LAND(j)) / 2, mid, 'out'],
    [LAND(j), end, 'in'],
    [LAND(j) + 0.05, { opacity: 0 }, 'step'],
  ]));
}

// Each agent: claude writes and shares; the others get the id, read it,
// some comment, work their item and finish; hermes gets your note.
function agent(s, m, i) {
  const eyes = sprite(EYES, { '#': C.ink }, { px: 3, x: 8, y: 7 });
  const speech = sprite(SPEECH, { '#': C.ink }, { px: 2, x: 10, y: 6 });
  if (m.name === 'claude') {
    mascot(s, m, i, {
      hops: [[POST, 14], [SHARE, 10], [TICK[2], 22], [DANCE, 16], [DANCE + 0.9, 16]],
      work: [[0.2, POST]],
      done: [[TICK[2], RESET]],
    });
    return;
  }
  if (m.name === 'hermes') {
    mascot(s, m, i, {
      hops: [[PICK + 0.2, 14], [HERMES_DONE, 22], [DANCE + 0.45, 16], [DANCE + 1.35, 16]],
      alert: [[PICK + 0.2, PICK + 1]],
      work: [[PICK + 1, HERMES_DONE]],
      done: [[HERMES_DONE, RESET]],
    });
    return;
  }
  const j = SHARED.indexOf(m.name);
  const k = itemOf(m.name);
  const comment = COMMENT[m.name];
  const say = [[eyes, [[LAND(j), LAND(j) + READ]]]];
  if (comment) say.push([speech, [[comment, comment + 0.9]], C.lit]);
  const hops = [[LAND(j), 10], [TICK[k], 22], [DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]];
  if (comment) hops.push([comment, 12]);
  mascot(s, m, i, {
    hops,
    say,
    work: [[startOf(m.name), TICK[k]]],
    done: [[TICK[k], RESET]],
  });
}

// You: the green dot under New note, then Make it a task, then hermes.
function pointer(s) {
  const dot = { x: dotAt(2).x - 2, y: dotAt(2).y - 2 };
  const clip = { x: clipAt.x - 4, y: clipAt.y - 4 };
  const hermes = { x: MENU.x + 50, y: menuRow(1) + 8 };
  cursor(s, [
    [0, OFF],
    [DOT - 1.2, OFF],
    [DOT - 0.2, dot, 'inOut'],
    ...press(DOT, dot),
    [DOT + 0.5, dot],
    [TO_TASK - 0.7, clip, 'inOut'],
    ...press(TO_TASK, clip),
    [TO_TASK + 0.2, clip],
    [PICK - 0.4, hermes, 'inOut'],
    ...press(PICK, hermes),
    [PICK + 0.5, hermes],
    [PICK + 1.2, OFF, 'inOut'],
  ]);
}
