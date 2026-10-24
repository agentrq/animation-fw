// AgentRQ's workspace forks: a second workspace made from a busy one, so a
// second agent takes some of its tasks in parallel, sharing the parent's
// memory, skills and settings, then merged back with every task.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, CHECK, OFF, GROUND, newScene, sky, ground, intro, frame, button, mascot, cursor, press, during,
} from '../kit/agentrq.js';

const [CLAUDE, CODEX] = MASCOTS;

// The parent's queue. claude works the top row; the bottom row moves to the
// fork for codex.
const TASKS = ['Fix login redirect', 'Add rate limits', 'Cache user lookups', 'Write API docs', 'Paginate /tasks', 'Add audit log'];
const MOVED = [3, 4, 5];

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const DROP = (k) => 0.3 + 0.15 * k;        // the queue fills
const START = 1.4;                         // claude takes the first task
const RCLICK = 3;                          // you right-click api
const FORK = 3.9;                          // and choose Fork workspace
const BRANCH = FORK + 0.1;                 // the branch line grows
const SPROUT = FORK + 0.6;                 // the fork's window appears
const SELECT = (j) => 5.7 + 0.4 * j;       // you select three cards
const MOVE = 7.2;                          // and click Move
const FLY = (j) => MOVE + 0.2 + 0.15 * j;  // each card leaves for the fork
const SLIDE = 0.6;
const WAKE = FLY(2) + SLIDE;               // codex is told
const PICK = [WAKE + 0.6, 10.6, 12.2];     // codex takes each fork task
const FIXED = [10.6, 12.2, 13.6];          // and finishes it
const CLAIM = [START, 9.6, 12.8];          // claude takes each of its own
const CLOSE = [9.6, 12.8, 16.4];           // and finishes it
const SHARE = [9.2, 11.8];                 // memory and skills reach both
const MERGE = 14.4;                        // you click Merge into api
const BACK = (j) => MERGE + 0.6 + 0.15 * j; // each card returns
const FOLD = BACK(2) + SLIDE;              // the fork folds into api
const DANCE = 17.6;
const RESET = 22.6;

// ---------------------------------------------------------------- the stage
// The parent's window across the top, the fork's below it and to the right,
// joined by a git branch line, the way the sidebar nests a fork.
const P = { x: 440, y: 20, w: 740, h: 116 };
const F = { x: 560, y: 186, w: 620, h: 100 };
const CARD_W = 184;
const CARD_H = 32;
const apiAt = (k) => ({ x: P.x + 16 + (k % 3) * 196, y: P.y + 38 + Math.floor(k / 3) * 38 });
const forkAt = (j) => ({ x: F.x + 16 + j * 196, y: F.y + 44 });
const MOVE_BTN = { x: P.x + P.w - 16 - 80, y: P.y + 9, w: 80 };
const MERGE_BTN = { x: F.w - 16 - 124, y: 9, w: 124 };
const CHIP = { x: 820, y: P.y + P.h + 11, w: 240, h: 28 };

const FORK_MARK = `
  #...#
  #...#
  .###.
  ..#..
  ..#..`;
const FOLDER = `
  ###....
  #######
  #.....#
  #.....#
  #######`;
const THREAD = `
  #####
  #...#
  #####
  .#...`;
const BOOK = `
  dccccc
  dcwwcc
  dccccc
  dccccc
  dppppp`;

export default function workspaceForks() {
  const s = newScene({
    poster: 11.2,
    description: "AgentRQ workspace forks: claude has six tasks in the api workspace, so you fork it into api-fork and move three tasks there. codex works the fork while claude works api, both sharing the same memory, skills and settings; when the fork's tasks are done you merge it back, its three tasks return to api with their threads, and the agents celebrate.",
  });

  sky(s);
  ground(s);
  story(s);
  parent(s);
  branch(s);
  fork(s);
  shared(s);
  TASKS.forEach((_, k) => card(s, k));
  menu(s);
  agents(s);
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'forks',
    headline: ['Too much work?', 'Fork it.'],
    sub: 'A second agent takes tasks in parallel.',
    steps: [['fork', RCLICK, SELECT(0) - 0.3], ['split', SELECT(0) - 0.3, WAKE], ['parallel', WAKE, MERGE], ['merge', MERGE, RESET]],
    log: [
      [0, RCLICK, '> api: 6 tasks, 1 agent'],
      [RCLICK, FORK, '> you: fork workspace'],
      [FORK, MOVE, '> forked api → api-fork', C.lit],
      [MOVE, WAKE + 0.6, '> 3 tasks moved'],
      [WAKE + 0.6, SHARE[0], '> 2 agents in parallel'],
      [SHARE[0], MERGE, '> one memory, skills, settings'],
      [MERGE, BACK(2) + SLIDE, '> you: merge into api'],
      [BACK(2) + SLIDE, CLOSE[2], '> merged: 3 tasks back', C.lit],
      [CLOSE[2], RESET, '> 6 of 6 done', C.lit],
    ],
  });
}

// The parent's window, with the Move button for the selected cards.
function parent(s) {
  frame(s, { ...P, title: 'api' });
  button(s, { ...MOVE_BTN, label: 'Move', clicks: [MOVE] });
}

// The fork's branch: a pixel git line from the parent down to the fork,
// growing a segment at a time, gone when the fork folds back.
function branch(s) {
  const x = P.x + 28;
  const top = P.y + P.h;
  const bend = F.y + 22;
  const segs = [
    [x, top, 4, 28], [x, top + 28, 4, 28], [x, top + 56, 4, bend - top - 56 + 4],
    [x + 4, bend, 28, 4], [x + 32, bend, 28, 4], [x + 60, bend, F.x - x - 60, 4],
  ];
  segs.forEach(([sx, sy, w, h], n) => {
    const t = BRANCH + 0.08 * n;
    s.add(s.anim(el('rect', { x: sx, y: sy, width: w, height: h, fill: C.lit, class: 'px' }),
      [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step'], [FOLD - 0.3 + 0.05 * (segs.length - n), { opacity: 0 }, 'step']]));
  });
  // A commit dot where the branch leaves the parent.
  s.add(during(s, el('rect', { x: x - 3, y: top + 2, width: 10, height: 10, fill: C.lit, class: 'px' }), [[BRANCH, FOLD]]));
}

// The fork's window: its fork mark and name, its own folder, and Merge.
function fork(s) {
  const parts = [
    el('rect', { width: F.w, height: F.h, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    sprite(FORK_MARK, { '#': C.dim }, { px: 2, x: 16, y: 14 }),
    s.text('api-fork', { x: 32, y: 26, font: 'semi', size: 15, fill: C.text }),
    sprite(FOLDER, { '#': '#d4a72c' }, { px: 2, x: 112, y: 15 }),
    s.text('own worktree', { x: 132, y: 25, font: 'mono', size: 11, fill: '#71717a' }),
  ];
  // Merge into api, drawn as the kit's button but inside the moving window.
  const { x: bx, y: by, w: bw } = MERGE_BTN;
  parts.push(
    el('rect', { x: bx, y: by, width: bw, height: 24, fill: C.text, class: 'px' }),
    s.anim(el('rect', { x: bx, y: by, width: bw, height: 24, fill: C.ongoing, class: 'px' }),
      [[0, { opacity: 0 }], [MERGE - 0.15, { opacity: 0.8 }, 'step'], [MERGE, { opacity: 0 }, 'step']]),
    s.text('Merge into api', { x: bx + bw / 2, y: by + 17, font: 'semi', size: 13, fill: C.ink, anchor: 'middle' }),
  );
  s.add(s.anim(g({}, parts), [
    [0, { x: F.x, y: F.y, opacity: 0, scale: 0.9 }],
    [SPROUT, { opacity: 0 }, 'step'],
    [SPROUT + 0.35, { opacity: 1, scale: 1 }, 'back'],
    [FOLD, { x: F.x, y: F.y }],
    [FOLD + 0.5, { x: P.x + 40, y: P.y + P.h - 60, opacity: 0, scale: 0.4 }, 'in'],
  ]));
}

// What the two share: one chip between the windows, linked to both, with a
// pulse along each link when an agent reads or saves.
function shared(s) {
  const { x, y, w, h } = CHIP;
  const links = [x + 30, x + w - 30];
  const book = sprite(BOOK, { c: '#60a5fa', d: '#1d4ed8', w: '#fafafa', p: '#e4e4e7' }, { px: 2, x: x + 10, y: y + 9 });
  const parts = [
    ...links.flatMap((lx) => [
      el('rect', { x: lx, y: P.y + P.h, width: 4, height: y - P.y - P.h, fill: '#3f3f46', class: 'px' }),
      el('rect', { x: lx, y: y + h, width: 4, height: F.y - y - h, fill: '#3f3f46', class: 'px' }),
    ]),
    el('rect', { x, y, width: w, height: h, fill: C.column, stroke: '#3f3f46', 'stroke-width': 2, class: 'px' }),
    book,
    s.text('memory · skills · settings', { x: x + 30, y: y + 19, font: 'mono', size: 12, fill: C.dim }),
  ];
  for (const t of SHARE) {
    parts.push(during(s, el('rect', { x, y, width: w, height: h, fill: 'none', stroke: C.lit, 'stroke-width': 2, class: 'px' }), [[t, t + 0.8]]));
    // Up to the parent from one link, down to the fork from the other.
    links.forEach((lx, n) => {
      const from = n ? y + h : y;
      const to = n ? F.y : P.y + P.h;
      s.add(s.anim(el('rect', { width: 8, height: 8, fill: C.lit, class: 'px' }), [
        [0, { x: lx - 2, y: from - 4, opacity: 0 }],
        [t, { opacity: 1 }, 'step'],
        [t + 0.4, { x: lx - 2, y: to - 4 }],
        [t + 0.45, { opacity: 0 }, 'step'],
      ]));
    });
  }
  s.add(s.anim(g({}, parts), [[0, { opacity: 0 }], [SPROUT + 0.3, { opacity: 1 }, 'step'], [FOLD, { opacity: 1 }], [FOLD + 0.4, { opacity: 0 }]]));
}

// The workspace's row menu, open from your right-click to your choice.
function menu(s) {
  const x = P.x + 40;
  const y = P.y + 34;
  s.add(during(s, g({},
    el('rect', { x: x + 4, y: y + 4, width: 176, height: 60, fill: '#000', opacity: 0.4, class: 'px' }),
    el('rect', { x, y, width: 176, height: 60, fill: C.card, stroke: '#3f3f46', 'stroke-width': 1, class: 'px' }),
    during(s, el('rect', { x: x + 4, y: y + 4, width: 168, height: 24, fill: '#3f3f46', class: 'px' }), [[FORK - 0.5, FORK + 0.2]]),
    sprite(FORK_MARK, { '#': C.text }, { px: 2, x: x + 12, y: y + 11 }),
    s.text('Fork workspace', { x: x + 30, y: y + 21, font: 'semi', size: 12, fill: C.text }),
    s.text('Rename', { x: x + 30, y: y + 47, font: 'semi', size: 12, fill: C.dim }),
  ), [[RCLICK, FORK + 0.2]]));
}

// A task card: dropped into api, worked where it is, or moved to the fork
// and back. Its bar takes the status colour, its agent shows once taken, and
// a moved card keeps its thread the whole way.
function card(s, k) {
  const j = MOVED.indexOf(k);
  const moved = j >= 0;
  const m = moved ? CODEX : CLAUDE;
  const take = moved ? PICK[j] : CLAIM[k];
  const finish = moved ? FIXED[j] : CLOSE[k];
  const home = apiAt(k);

  const keys = [
    [0, { ...home, y: home.y - 14, opacity: 0 }],
    [DROP(k), { opacity: 0 }, 'step'],
    [DROP(k) + 0.35, { ...home, opacity: 1 }, 'back'],
  ];
  if (moved) {
    keys.push(
      [FLY(j), home], [FLY(j) + SLIDE, forkAt(j), 'inOut'],
      [BACK(j), forkAt(j)], [BACK(j) + SLIDE, home, 'inOut'],
    );
  }
  keys.push([RESET, { opacity: 1 }], [RESET + 0.5, { opacity: 0 }]);

  const check = sprite(CHECK, { '#': C.ongoing }, { px: 2, x: CARD_W - 22, y: 11 });
  const parts = [
    el('rect', { width: CARD_W, height: CARD_H, fill: C.card, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    s.anim(el('rect', { width: 4, height: CARD_H, class: 'px' }), [
      [0, { fill: C.notstarted }], [take, { fill: C.ongoing }, 'step'], [finish, { fill: C.done }, 'step'], [RESET + 0.6, { fill: C.notstarted }, 'step'],
    ]),
    s.text(TASKS[k], { x: 12, y: 14, font: 'semi', size: 12, fill: C.text }),
    during(s, g({},
      el('rect', { x: 12, y: 20, width: 6, height: 6, fill: m.color, class: 'px' }),
      s.text(m.name, { x: 22, y: 27, font: 'mono', size: 10, fill: C.dim })), [[take, RESET + 0.6]]),
    during(s, check, [[finish, RESET + 0.6]]),
  ];
  if (moved) {
    // Its thread: a message count that grows while codex works it.
    parts.push(
      sprite(THREAD, { '#': '#71717a' }, { px: 2, x: CARD_W - 64, y: 16 }),
      during(s, s.text('1', { x: CARD_W - 50, y: 27, font: 'mono', size: 10, fill: '#71717a' }), [[0, take], [RESET + 0.6, 24]]),
      during(s, s.text('3', { x: CARD_W - 50, y: 27, font: 'mono', size: 10, fill: '#71717a' }), [[take, finish]]),
      during(s, s.text('5', { x: CARD_W - 50, y: 27, font: 'mono', size: 10, fill: C.dim }), [[finish, RESET + 0.6]]),
      during(s, el('rect', { width: CARD_W, height: CARD_H, fill: 'none', stroke: C.lit, 'stroke-width': 2, class: 'px' }), [[SELECT(j), FLY(j) + SLIDE]]),
    );
  }
  s.add(s.anim(g({}, parts), keys));
}

// claude is busy from the start and finishes its three; codex sleeps until
// the fork hands it work, finishes the fork's three, and says bye at the
// merge. Both celebrate at the end.
function agents(s) {
  const cx = 600;
  const kx = 940;
  mascot(s, CLAUDE, 0, {
    x: cx,
    hops: [[START, 12], ...CLOSE.slice(0, 2).map((t) => [t, 14]), [CLOSE[2], 22], [DANCE, 16], [DANCE + 0.9, 16]],
    work: CLAIM.map((t, n) => [t + 0.2, CLOSE[n]]).filter(([a, b]) => b > a),
    done: [[CLOSE[2], RESET]],
  });
  mascot(s, CODEX, 1, {
    x: kx,
    hops: [[WAKE, 14], ...FIXED.map((t) => [t, 14]), [MERGE + 0.3, 18], [MERGE + 0.75, 18], [DANCE + 0.15, 16], [DANCE + 1.05, 16]],
    say: [['zZ', [[0.6, WAKE]]], ['bye', [[MERGE + 0.2, BACK(2) + SLIDE]]]],
    alert: [[WAKE, PICK[0]]],
    work: PICK.map((t, n) => [t + 0.1, FIXED[n]]).filter(([a, b]) => b > a),
    done: [[FIXED[2], MERGE + 0.2], [DANCE - 0.4, RESET]],
  });
  s.add(
    s.text('@api', { x: cx + 42, y: GROUND + 28, font: 'mono', size: 12, fill: '#71717a' }),
    s.text('@api-fork', { x: kx + 36, y: GROUND + 28, font: 'mono', size: 12, fill: '#71717a' }),
  );
}

// You: right-click api and fork it, select three cards and Move them, then
// Merge into api.
function pointer(s) {
  const title = { x: P.x + 30, y: P.y + 20 };
  const item = { x: P.x + 160, y: P.y + 54 };
  const sel = (j) => ({ x: apiAt(MOVED[j]).x + 90, y: apiAt(MOVED[j]).y + 18 });
  const mv = { x: MOVE_BTN.x + 40, y: MOVE_BTN.y + 13 };
  const mg = { x: F.x + MERGE_BTN.x + 62, y: F.y + MERGE_BTN.y + 13 };
  cursor(s, [
    [0, OFF],
    [RCLICK - 0.9, OFF],
    [RCLICK - 0.15, title, 'inOut'],
    ...press(RCLICK, title),
    [FORK - 0.6, title],
    [FORK - 0.2, item, 'inOut'],
    ...press(FORK, item),
    [SELECT(0) - 0.8, item],
    [SELECT(0) - 0.2, sel(0), 'inOut'],
    ...[0, 1, 2].flatMap((j) => [[SELECT(j) - 0.15, sel(j), j ? 'inOut' : undefined], ...press(SELECT(j), sel(j))]),
    [MOVE - 0.5, sel(2)],
    [MOVE - 0.15, mv, 'inOut'],
    ...press(MOVE, mv),
    [MOVE + 0.4, mv],
    [MOVE + 1, OFF, 'inOut'],
    [MERGE - 0.9, OFF],
    [MERGE - 0.2, mg, 'inOut'],
    ...press(MERGE, mg),
    [MERGE + 0.5, mg],
    [MERGE + 1.1, OFF, 'inOut'],
  ]);
}
