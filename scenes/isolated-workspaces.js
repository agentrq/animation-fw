// AgentRQ's isolated workspaces: each workspace has its own MCP server and
// token, its own folder, tasks, memory and settings, and an agent connected
// to one sees nothing of another.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, CHECK, OFF, newScene, sky, ground, intro, mascot, cursor, press, during,
} from '../kit/agentrq.js';

const [CLAUDE, CODEX, AGY] = MASCOTS;

// One window per workspace, each with its own agent, token colour, folder,
// queue, memory and auto-allowed commands.
const SPACES = [
  { name: 'api', m: CLAUDE, key: '#f59e0b', tasks: ['Add rate limits', 'Fix login redirect'], note: '- make mocks first', allow: 'auto-allow: go test' },
  { name: 'web', m: CODEX, key: '#f472b6', tasks: ['Dark mode toggle', 'Fix navbar on mobile'], note: null, allow: 'auto-allow: npm test' },
  { name: 'docs', m: AGY, key: '#38bdf8', tasks: ['Write API guide', 'Update changelog'], note: '- one idea a line', allow: 'auto-allow: none' },
];
const API = 0;
const WEB = 1;
const DOCS = 2;

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const DROP = (i, n) => 0.3 + 0.2 * i + 0.12 * n; // the queues fill
const CONNECT = (i) => 1.6 + 1.0 * i;            // each token flies to its agent
const KEY_FLY = 0.6;
const LINKED = (i) => CONNECT(i) + KEY_FLY;      // its lane lights
const TAKE = [[4.8, 8.8], [5.1, 11.2], [5.4, 14.2]]; // each takes its own tasks
const DONE = [[8.4, 14.6], [10.8, 15.4], [13.8, 16.2]];
const SAVE = 7.2;                                // codex saves a memory
const SEE = 9.0;                                 // what codex can see
const SEE_END = 10.6;
const ASK = 11.6;                                // agy asks to git push
const ALLOW = 13.0;                              // you allow it, in docs
const DANCE = 17.4;
const RESET = 22.6;

// ---------------------------------------------------------------- the stage
const WIN_W = 236;
const WIN_Y = 20;
const WIN_H = 280;
const winX = (i) => 440 + i * (WIN_W + 16);
const midX = (i) => winX(i) + WIN_W / 2;
const CARD_W = WIN_W - 32;
const CARD_H = 32;
const cardAt = (i, n) => ({ x: winX(i) + 16, y: WIN_Y + 72 + n * 38 });
const MEM_Y = WIN_Y + 152;
const SET_Y = WIN_Y + 210;
const REQ_Y = WIN_Y + 244;
const LANE_TOP = WIN_Y + WIN_H;
const LANE_BOTTOM = 336;
const ALLOW_BTN = { x: winX(DOCS) + WIN_W - 16 - 60, y: REQ_Y + 4, w: 60 };

const KEY = `
  .##.....
  #..#####
  #..#.#.#
  .##.....`;
const LOCK = `
  .###.
  #...#
  #####
  ##.##
  #####`;
const BOOK = `
  dccccc
  dcwwcc
  dccccc
  dccccc
  dppppp`;

export default function isolatedWorkspaces() {
  const s = newScene({
    poster: 12.3,
    description: "AgentRQ isolated workspaces: api, web and docs each have their own MCP server and token, folder, tasks, memory and settings. claude, codex and agy connect with their own workspace's token and take only its tasks; codex saves a memory and it lands in web alone, and codex sees web and nothing else. agy asks to push in docs and you allow it there, then all six tasks are done and the agents celebrate.",
  });

  sky(s);
  ground(s);
  story(s);
  SPACES.forEach((_, i) => {
    workspace(s, i);
    lane(s, i);
    SPACES[i].tasks.forEach((__, n) => card(s, i, n));
  });
  walls(s);
  spotlight(s);
  request(s);
  agents(s);
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'workspaces',
    headline: ['Every workspace', 'stands alone.'],
    sub: 'Own MCP server, token, tasks and memory.',
    steps: [['connect', CONNECT(0), TAKE[0][0]], ['tasks', TAKE[0][0], SAVE], ['scoped', SAVE, ASK], ['allow', ASK, ALLOW + 0.4]],
    log: [
      [0, CONNECT(0), '> 3 workspaces, 3 missions'],
      ...SPACES.map(({ name, m }, i) => [CONNECT(i), i < 2 ? CONNECT(i + 1) : TAKE[0][0], `> ${m.name} → ${name}, with its token`]),
      [TAKE[0][0], SAVE, '> each agent takes its own queue'],
      [SAVE, SEE, '> codex: memory saved, web only', C.lit],
      [SEE, ASK, '> codex sees web, nothing else'],
      [ASK, ALLOW, '> agy asks in docs: git push'],
      [ALLOW, DONE[2][1], '> you: allow, in docs', C.lit],
      [DONE[2][1], RESET, '> 6 of 6 done, nothing crossed', C.lit],
    ],
  });
}

// A workspace's window: its name and folder, its own MCP host with the key
// of its token, its memory and its auto-allowed commands.
function workspace(s, i) {
  const { name, key, note, allow } = SPACES[i];
  const x = winX(i);
  s.add(
    el('rect', { x, y: WIN_Y, width: WIN_W, height: WIN_H, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    s.text(name, { x: x + 16, y: WIN_Y + 26, font: 'semi', size: 15, fill: C.text }),
    s.text(`~/${name}`, { x: x + WIN_W - 16, y: WIN_Y + 25, font: 'mono', size: 11, fill: '#71717a', anchor: 'end' }),
    el('rect', { x: x + 16, y: WIN_Y + 38, width: CARD_W, height: 24, fill: C.column, stroke: '#3f3f46', 'stroke-width': 1, class: 'px' }),
    sprite(KEY, { '#': key }, { px: 2, x: x + 24, y: WIN_Y + 46 }),
    s.text(`${name}.mcp.agentrq.com`, { x: x + 46, y: WIN_Y + 54, font: 'mono', size: 11, fill: C.dim }),
    el('rect', { x: x + 16, y: MEM_Y, width: CARD_W, height: 48, fill: C.column, stroke: '#3f3f46', 'stroke-width': 1, class: 'px' }),
    sprite(BOOK, { c: '#60a5fa', d: '#1d4ed8', w: '#fafafa', p: '#e4e4e7' }, { px: 2, x: x + 24, y: MEM_Y + 7 }),
    s.text('memory', { x: x + 42, y: MEM_Y + 16, font: 'mono', size: 11, fill: '#71717a' }),
    s.text(allow, { x: x + 16, y: SET_Y + 17, font: 'mono', size: 11, fill: '#71717a' }),
  );
  if (note) {
    s.add(s.text(note, { x: x + 24, y: MEM_Y + 37, font: 'mono', size: 12, fill: C.dim }));
    return;
  }
  // web starts with an empty memory, and gets the note codex saves.
  const at = { x: x + 24, y: MEM_Y + 37, font: 'mono', size: 12 };
  s.add(
    during(s, s.text('(empty)', { ...at, fill: '#52525b' }), [[0, SAVE + 0.4], [RESET + 0.5, 24]]),
    during(s, s.text('- use pnpm', { ...at, fill: C.lit }), [[SAVE + 0.4, SAVE + 1.6]]),
    during(s, s.text('- use pnpm', { ...at, fill: C.dim }), [[SAVE + 1.6, RESET + 0.5]]),
    during(s, el('rect', { x: x + 16, y: MEM_Y, width: CARD_W, height: 48, fill: 'none', stroke: C.lit, 'stroke-width': 2, class: 'px' }), [[SAVE + 0.4, SAVE + 1.2]]),
  );
}

// The line from a workspace down to its agent: dark until the token arrives,
// then in the token's colour, with a pulse up it at each call the agent makes.
function lane(s, i) {
  const { key } = SPACES[i];
  const x = midX(i) - 2;
  const h = LANE_BOTTOM - LANE_TOP;
  s.add(el('rect', { x, y: LANE_TOP, width: 4, height: h, fill: C.line, class: 'px' }));
  s.add(during(s, el('rect', { x, y: LANE_TOP, width: 4, height: h, fill: key, class: 'px' }), [[LINKED(i), RESET + 0.5]]));

  // The token's key, out of the window's MCP chip and down to the agent.
  const from = { x: winX(i) + 24, y: WIN_Y + 46 };
  s.add(s.anim(sprite(KEY, { '#': key }, { px: 3 }), [
    [0, { ...from, opacity: 0 }],
    [CONNECT(i), { opacity: 1 }, 'step'],
    [CONNECT(i) + 0.2, { x: from.x, y: from.y - 10 }, 'out'],
    [LINKED(i), { x: x - 10, y: LANE_BOTTOM - 6 }, 'inOut'],
    [LINKED(i) + 0.05, { opacity: 0 }, 'step'],
  ]));

  const calls = [...TAKE[i], ...(i === WEB ? [SAVE] : []), ...(i === DOCS ? [ASK] : [])];
  for (const t of calls) {
    s.add(s.anim(el('rect', { width: 8, height: 8, fill: C.text, class: 'px' }), [
      [0, { x: x - 2, y: LANE_BOTTOM - 8, opacity: 0 }],
      [t - 0.4, { opacity: 1 }, 'step'],
      [t, { x: x - 2, y: LANE_TOP - 4 }, 'in'],
      [t + 0.05, { opacity: 0 }, 'step'],
    ]));
  }
}

// A task card in its own workspace's queue: its bar takes the status colour,
// and its agent shows once taken.
function card(s, i, n) {
  const { m, tasks } = SPACES[i];
  const take = TAKE[i][n];
  const finish = DONE[i][n];
  const home = cardAt(i, n);
  const check = sprite(CHECK, { '#': C.ongoing }, { px: 2, x: CARD_W - 22, y: 11 });
  const parts = [
    el('rect', { width: CARD_W, height: CARD_H, fill: C.card, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    s.anim(el('rect', { width: 4, height: CARD_H, class: 'px' }), [
      [0, { fill: C.notstarted }], [take, { fill: C.ongoing }, 'step'], [finish, { fill: C.done }, 'step'], [RESET + 0.6, { fill: C.notstarted }, 'step'],
    ]),
    s.text(tasks[n], { x: 12, y: 14, font: 'semi', size: 12, fill: C.text }),
    during(s, g({},
      el('rect', { x: 12, y: 20, width: 6, height: 6, fill: m.color, class: 'px' }),
      s.text(m.name, { x: 22, y: 27, font: 'mono', size: 10, fill: C.dim })), [[take, RESET + 0.6]]),
    during(s, check, [[finish, RESET + 0.6]]),
  ];
  // agy's first task waits on you while it asks.
  if (i === DOCS && n === 0) {
    parts.push(s.anim(el('rect', { width: 4, height: CARD_H, fill: C.ask, class: 'px' }),
      [[0, { opacity: 0 }], [ASK, { opacity: 1 }, 'step'], [ALLOW, { opacity: 0 }, 'step']]));
  }
  s.add(s.anim(g({}, parts), [
    [0, { ...home, y: home.y - 14, opacity: 0 }],
    [DROP(i, n), { opacity: 0 }, 'step'],
    [DROP(i, n) + 0.35, { ...home, opacity: 1 }, 'back'],
    [RESET, { opacity: 1 }],
    [RESET + 0.5, { opacity: 0 }],
  ]));
}

// A lock in each gap between windows, lit while codex looks around.
function walls(s) {
  for (const i of [0, 1]) {
    const x = winX(i) + WIN_W + 3;
    for (const y of [70, 150, 230]) {
      s.add(sprite(LOCK, { '#': '#3f3f46' }, { px: 2, x, y }));
      s.add(during(s, sprite(LOCK, { '#': C.lit }, { px: 2, x, y }), [[SEE, SEE_END]]));
    }
  }
}

// What codex sees: web, lit, and the other two windows dark.
function spotlight(s) {
  for (const i of [API, DOCS]) {
    s.add(s.anim(el('rect', { x: winX(i) - 1, y: WIN_Y - 1, width: WIN_W + 2, height: WIN_H + 2, fill: C.bg, class: 'px' }),
      [[0, { opacity: 0 }], [SEE, { opacity: 0 }], [SEE + 0.3, { opacity: 0.82 }], [SEE_END - 0.3, { opacity: 0.82 }], [SEE_END, { opacity: 0 }]]));
  }
  s.add(during(s, el('rect', { x: winX(WEB), y: WIN_Y, width: WIN_W, height: WIN_H, fill: 'none', stroke: C.lit, 'stroke-width': 2, class: 'px' }), [[SEE + 0.3, SEE_END - 0.3]]));
}

// agy's permission request, in docs alone, with its Allow button.
function request(s) {
  const x = winX(DOCS) + 16;
  const { x: bx, y: by, w: bw } = ALLOW_BTN;
  s.add(during(s, g({},
    el('rect', { x, y: REQ_Y, width: CARD_W, height: 32, fill: C.card, stroke: C.ask, 'stroke-width': 2, class: 'px' }),
    s.text('git push', { x: x + 10, y: REQ_Y + 21, font: 'mono', size: 12, fill: C.text }),
    el('rect', { x: bx, y: by, width: bw, height: 24, fill: C.text, class: 'px' }),
    s.anim(el('rect', { x: bx, y: by, width: bw, height: 24, fill: C.ongoing, class: 'px' }),
      [[0, { opacity: 0 }], [ALLOW - 0.15, { opacity: 0.8 }, 'step'], [ALLOW, { opacity: 0 }, 'step']]),
    s.text('Allow', { x: bx + bw / 2, y: by + 17, font: 'semi', size: 13, fill: C.ink, anchor: 'middle' }),
  ), [[ASK, ALLOW + 0.3]]));
}

// Each agent under its own workspace: alerted as its token arrives, working
// its own two tasks, and celebrating at the end. agy asks once.
function agents(s) {
  SPACES.forEach(({ m }, i) => {
    const [t1, t2] = TAKE[i];
    const [d1, d2] = DONE[i];
    const ask = i === DOCS ? [[ASK, ALLOW]] : [];
    mascot(s, m, i, {
      x: midX(i),
      hops: [[LINKED(i), 14], [d1, 14], [d2, 22], [DANCE + 0.15 * i, 16], [DANCE + 0.9 + 0.15 * i, 16]],
      alert: [[LINKED(i), t1]],
      work: i === DOCS ? [[t1 + 0.2, ASK], [ALLOW, d1], [t2 + 0.2, d2]] : [[t1 + 0.2, d1], [t2 + 0.2, d2]],
      ask,
      done: [[d2, RESET]],
    });
  });
}

// You: Allow agy's push, in docs.
function pointer(s) {
  const btn = { x: ALLOW_BTN.x + 30, y: ALLOW_BTN.y + 13 };
  cursor(s, [
    [0, OFF],
    [ALLOW - 0.6, OFF],
    [ALLOW - 0.2, btn, 'inOut'],
    ...press(ALLOW, btn),
    [ALLOW + 0.5, btn],
    [ALLOW + 1.1, OFF, 'inOut'],
  ]);
}
