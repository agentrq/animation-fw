// AgentRQ's task board handing work to five agents at once.
import { Scene, FONTS, sprite, el, g } from '../src/index.js';

const W = 1200;
const H = 440;
const LOOP = 24;

const C = {
  bg: '#09090b', panel: '#18181b', column: '#111114', line: '#27272a', card: '#1f1f23',
  text: '#fafafa', dim: '#a1a1aa',
  notstarted: '#71717a', ongoing: '#22c55e', blocked: '#ef4444', done: '#15803d', ask: '#facc15',
};

// ---------------------------------------------------------------- mascots
// Pixel art that nods to each agent's own mark; 4 px per pixel.
const MASCOTS = [
  {
    name: 'claude', color: '#d97757', task: 'Fix login redirect',
    art: `
      ..oooooooooo..
      ..oooooooooo..
      ..oo#oooo#oo..
      ..oo#oooo#oo..
      oooooooooooooo
      oooooooooooooo
      ..oooooooooo..
      ..oooooooooo..
      ..o.o....o.o..
      ..o.o....o.o..`,
    palette: { o: '#d97757', '#': '#1c1917' },
    eyes: [[4, 2, 1, 2], [9, 2, 1, 2]], skin: '#d97757',
  },
  {
    name: 'codex', color: '#e4e4e7', task: 'Migrate users table',
    art: `
      .....wwwww.....
      ...wwwwwwwwww..
      ..wwwwwwwwwwww.
      .wwwwwwwwwwwwww
      .ww#wwwwwwwwwww
      .www#wwwwwwwwww
      .ww#ww####wwwww
      .wwwwwwwwwwwwww
      ..wwwwwwwwwwww.
      ...ww......ww..`,
    palette: { w: '#e4e4e7', '#': '#18181b' },
  },
  {
    name: 'agy', color: '#4285f4', task: 'Polish settings UI', float: true,
    art: `
      .....bbrryy.....
      ...bbbbrryyyy...
      ..bbbbbrryyyyy..
      .bbb#bbrryy#yyy.
      .bbb#bbrryy#yyy.
      bbbbb......ggggg
      bbbb........gggg
      bbbb........gggg
      bbb..........ggg`,
    palette: { b: '#4285f4', r: '#ea4335', y: '#fbbc05', g: '#34a853', '#': '#0b0b0f' },
    eyes: [[4, 3, 1, 2]], skin: '#4285f4',
  },
  {
    name: 'hermes', color: '#a78bfa', task: 'Write release notes',
    art: `
      yy..........yy
      yyy.ssssss.yyy
      .yyssssssssyy.
      ..ssssssssss..
      ..sffffffffs..
      ..sf#ff#fffs..
      ..sffffffffs..
      ...pppppppp...
      ..pppppppppp..
      ...pp....pp...`,
    palette: { y: '#facc15', s: '#d4d4d8', f: '#fde2c8', '#': '#1c1917', p: '#a78bfa' },
    eyes: [[4, 5, 1, 1], [7, 5, 1, 1]], skin: '#fde2c8',
  },
  {
    name: 'openclaw', color: '#f43f5e', task: 'Triage new issues',
    art: `
      r..r......r..r
      rr.rr....rr.rr
      .rrr......rrr.
      ..r..rrrr..r..
      ...rrrrrrrr...
      ...r#rrrr#r...
      ...rrrrrrrr...
      ....rrrrrr....
      ...r.r..r.r...`,
    palette: { r: '#f43f5e', '#': '#1c1917' },
    eyes: [[4, 5, 1, 1], [9, 5, 1, 1]], skin: '#f43f5e',
  },
];

const PX = 5;
const GROUND = 400;
const mascotX = (i) => 514 + i * 148;

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const ADD = (i) => 1.2 + 0.6 * i;          // you add the task
const PICK = (i) => 5.2 + 0.6 * i;         // its agent takes it
const DONE = [10, 16, 11, 13, 14.2];       // it lands in Done
const ASK = 9.2;                           // codex blocks on a question
const ALLOW = 11.4;                        // you click Allow
const RESUME = 12;                         // codex goes back to work
const DANCE = 18;
const RESET = 22.6;
const MOVE = 0.6;

// ---------------------------------------------------------------- the board
const BX = 440;
const BY = 20;
const BW = 740;
const COLS = ['Not Started', 'Ongoing', 'Blocked', 'Done'];
const COL_DOT = [C.notstarted, C.ongoing, C.blocked, C.done];
const colX = (c) => BX + 10 + c * 182;
const CARD_W = 168;
const CARD_H = 34;
const slotY = (s) => BY + 76 + s * 38;
const at = (c, s) => ({ x: colX(c) + 3, y: slotY(s) });

// Which column each card is in, and when. Done lists the newest first, as
// the app does; the other columns append.
const MOVES = [
  ...MASCOTS.flatMap((m, i) => [
    { t: ADD(i), card: i, col: 0 },
    { t: PICK(i), card: i, col: 1 },
    { t: DONE[i], card: i, col: 3, top: true },
  ]),
  { t: ASK, card: 1, col: 2 },
  { t: RESUME, card: 1, col: 1 },
];

// Replays the moves and returns, per card, every [t, column, slot] it takes,
// including the slides when a card above it leaves.
function layout(moves) {
  const cols = COLS.map(() => []);
  const where = new Map();
  const track = new Map();
  for (const { t, card, col, top } of [...moves].sort((a, b) => a.t - b.t)) {
    if (where.has(card)) cols[where.get(card)].splice(cols[where.get(card)].indexOf(card), 1);
    if (top) cols[col].unshift(card); else cols[col].push(card);
    where.set(card, col);
    cols.forEach((list, c) => list.forEach((id, slot) => {
      const k = track.get(id) ?? [];
      const last = k.at(-1);
      if (!last || last[1] !== c || last[2] !== slot) k.push([t, c, slot]);
      track.set(id, k);
    }));
  }
  return track;
}
const TRACKS = layout(MOVES);

// Small seeded random, so every build draws the same sky.
function rng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

export default function taskBoard() {
  const s = new Scene({
    width: W, height: H, loop: LOOP, background: C.bg, poster: 17.5,
    description: 'AgentRQ task board: you add five tasks and five agents, claude, codex, agy, hermes and openclaw, each pick up their own. Cards move from Not Started to Ongoing; codex asks a question and its card turns Blocked until you click Allow; then every card lands in Done and the agents celebrate.',
  })
    .font('pixel', FONTS.silkscreen, { fallback: 'monospace' })
    .font('bold', FONTS.inter, { axes: { wght: 700, opsz: 32 } })
    .font('semi', FONTS.inter, { axes: { wght: 600, opsz: 14 } })
    .font('body', FONTS.inter, { axes: { wght: 500, opsz: 18 } })
    .font('mono', FONTS.jetbrainsMono, { axes: { wght: 500 }, fallback: 'monospace' });

  sky(s);
  ground(s);
  intro(s);
  board(s);
  MASCOTS.forEach((m, i) => card(s, m, i));
  MASCOTS.forEach((m, i) => mascot(s, m, i));
  cursor(s);
  return s;
}

function sky(s) {
  const r = rng(7);
  for (let i = 0; i < 46; i++) {
    const x = Math.round(r() * W);
    const y = Math.round(r() * 380);
    const big = r() > 0.8;
    const star = el('rect', { x, y, width: big ? 4 : 2, height: big ? 4 : 2, fill: big ? '#52525b' : '#3f3f46', class: 'px' });
    if (r() > 0.6) {
      const period = [2, 3, 4, 6][Math.floor(r() * 4)];
      const t = +(r() * period * 0.8).toFixed(1);
      s.add(s.anim(star, [[0, { opacity: 1 }], [t, { opacity: 0.15 }, 'step'], [+(t + 0.2 * period).toFixed(1), { opacity: 1 }, 'step']], { period }));
    } else s.add(star);
  }
}

function intro(s) {
  // The hexagon mark from the app's favicon.
  const logo = g({ transform: 'translate(40 32) scale(1.1)' },
    el('rect', { width: 32, height: 32, rx: 8, fill: C.panel, stroke: C.line }),
    g({ transform: 'translate(4 4)', fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
      el('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
      el('path', { d: 'M12 7l-3.5 8M12 7l3.5 8M9.5 12h5' })));
  s.add(
    logo,
    s.text('AgentRQ', { x: 86, y: 59, font: 'bold', size: 22, fill: C.text }),
    s.text('task board', { x: 186, y: 58, font: 'pixel', size: 16, fill: C.dim }),
    s.text('One board,', { x: 40, y: 132, font: 'bold', size: 46, fill: C.text, spacing: -1 }),
    s.text('every agent.', { x: 40, y: 184, font: 'bold', size: 46, fill: C.text, spacing: -1 }),
    s.text('Hand out tasks. Watch them move.', { x: 40, y: 220, font: 'body', size: 18, fill: C.dim }),
  );

  // Step chips, lit in turn.
  const steps = [['assign', 1, 5], ['pick up', 5, ASK], ['ask', ASK, RESUME + 0.5], ['done', RESUME + 0.5, RESET]];
  let x = 40;
  for (const [label, from, to] of steps) {
    const w = label.length * 10 + 22;
    s.add(el('rect', { x, y: 244, width: w, height: 26, fill: 'none', stroke: C.line, 'stroke-width': 2, class: 'px' }));
    s.add(s.anim(el('rect', { x, y: 244, width: w, height: 26, fill: '#22c55e', class: 'px' }),
      [[0, { opacity: 0 }], [from, { opacity: 0.22 }, 'step'], [to, { opacity: 0 }, 'step']]));
    s.add(s.text(label, { x: x + w / 2, y: 262, font: 'pixel', size: 16, fill: C.dim, anchor: 'middle' }));
    s.add(s.anim(s.text(label, { x: x + w / 2, y: 262, font: 'pixel', size: 16, fill: '#86efac', anchor: 'middle' }),
      [[0, { opacity: 0 }], [from, { opacity: 1 }, 'step'], [to, { opacity: 0 }, 'step']]));
    x += w + 10;
  }

  // The log line under the chips says what just happened.
  s.add(el('rect', { x: 40, y: 284, width: 370, height: 36, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }));
  const log = [
    [0, 1, '> waiting for work_'],
    [1, PICK(0), '> you: 5 tasks, 5 agents'],
    [PICK(0), ASK, '> each agent pulls its own'],
    [ASK, ALLOW, '> codex: run the migration?'],
    [ALLOW, 13, '> you: allow'],
    [13, DONE[1] + MOVE, '> agents finishing up'],
    [DONE[1] + MOVE, RESET, '> 5 of 5 done'],
  ];
  for (const [from, to, line] of log) {
    const t = s.text(line, { x: 54, y: 307, font: 'mono', size: 14, fill: line.startsWith('> codex') ? C.ask : C.text });
    s.add(s.anim(t, [[0, { opacity: from === 0 ? 1 : 0 }], [from, { opacity: 1 }, 'step'], [to, { opacity: 0 }, 'step']]));
  }

}

function board(s) {
  s.add(
    el('rect', { x: BX, y: BY, width: BW, height: 272, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    s.text('All workspaces', { x: BX + 16, y: BY + 26, font: 'semi', size: 15, fill: C.text }),
  );
  // + New task, which flashes on each click.
  const bx = BX + BW - 116;
  s.add(el('rect', { x: bx, y: BY + 9, width: 104, height: 24, fill: '#fafafa', class: 'px' }));
  s.add(s.anim(el('rect', { x: bx, y: BY + 9, width: 104, height: 24, fill: '#22c55e', class: 'px' }),
    [[0, { opacity: 0 }], ...MASCOTS.flatMap((_, i) => [[ADD(i) - 0.15, { opacity: 0.8 }, 'step'], [ADD(i), { opacity: 0 }, 'step']])]));
  s.add(s.text('+ New task', { x: bx + 52, y: BY + 26, font: 'semi', size: 13, fill: '#09090b', anchor: 'middle' }));

  COLS.forEach((title, c) => {
    s.add(el('rect', { x: colX(c), y: BY + 44, width: 174, height: 220, fill: C.column, class: 'px' }));
    s.add(el('rect', { x: colX(c) + 10, y: BY + 56, width: 6, height: 6, fill: COL_DOT[c], class: 'px' }));
    s.add(s.text(title, { x: colX(c) + 22, y: BY + 63, font: 'semi', size: 12, fill: C.dim }));
  });
}

function card(s, m, i) {
  const codex = m.name === 'codex';
  const done = DONE[i];
  const [[t0, c0, s0], ...rest] = TRACKS.get(i);

  // Dropped in, then every slide the layout asks for, then gone.
  const keys = [
    [0, { ...at(c0, s0), y: slotY(s0) - 14, opacity: 0 }],
    [t0, { opacity: 0 }, 'step'],
    [t0 + 0.35, { ...at(c0, s0), opacity: 1 }, 'back'],
  ];
  let prev = at(c0, s0);
  for (const [t, c, slot] of rest) {
    keys.push([t, prev], [t + MOVE, at(c, slot), 'inOut']);
    prev = at(c, slot);
  }
  keys.push([RESET, { opacity: 1 }], [RESET + 0.5, { opacity: 0 }]);

  // The bar down its left edge takes the column's colour on arrival.
  const bar = [[0, { fill: C.notstarted }]];
  for (const [t, c] of rest) bar.push([t + MOVE, { fill: COL_DOT[c] }, 'step']);
  bar.push([RESET + 0.6, { fill: C.notstarted }, 'step']);

  const check = sprite(`
    ......#
    .....##
    #...##.
    ##.##..
    .###...
    ..#....`, { '#': '#22c55e' }, { px: 2, x: CARD_W - 22, y: 11 });

  const parts = [
    el('rect', { width: CARD_W, height: CARD_H, fill: C.card, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    s.anim(el('rect', { width: 4, height: CARD_H, class: 'px' }), bar),
    s.text(m.task, { x: 12, y: 15, font: 'semi', size: 12, fill: C.text }),
    el('rect', { x: 12, y: 21, width: 6, height: 6, fill: m.color, class: 'px' }),
    s.text(m.name, { x: 22, y: 28, font: 'mono', size: 10, fill: C.dim }),
    s.anim(check, [[0, { opacity: 0 }], [done + MOVE, { opacity: 1 }, 'step'], [RESET + 0.6, { opacity: 0 }, 'step']]),
  ];
  if (codex) {
    // The Allow button, there only while the card is blocked.
    parts.push(s.anim(g({},
      el('rect', { x: CARD_W - 52, y: 17, width: 44, height: 14, fill: C.ask, class: 'px' }),
      s.text('allow', { x: CARD_W - 30, y: 28, font: 'pixel', size: 8, fill: '#09090b', anchor: 'middle' })),
    [[0, { opacity: 0 }], [ASK + MOVE, { opacity: 1 }, 'step'], [ALLOW + 0.2, { opacity: 0.4 }, 'step'], [RESUME, { opacity: 0 }, 'step']]));
  }
  s.add(s.anim(g({}, parts), keys));
}

function ground(s) {
  const r = rng(3);
  s.add(el('rect', { x: 0, y: GROUND, width: W, height: H - GROUND, fill: '#101013', class: 'px' }));
  s.add(el('rect', { x: 0, y: GROUND, width: W, height: 4, fill: C.line, class: 'px' }));
  for (let i = 0; i < 30; i++) {
    s.add(el('rect', { x: Math.round(r() * W / 4) * 4, y: GROUND + 8 + Math.round(r() * 6) * 4, width: 8, height: 4, fill: '#18181b', class: 'px' }));
  }
}

function bubble(s, content, { fill = '#fafafa', w = 34 } = {}) {
  const h = 24;
  return g({},
    el('rect', { x: 4, y: 0, width: w - 8, height: h, fill, class: 'px' }),
    el('rect', { x: 0, y: 4, width: w, height: h - 8, fill, class: 'px' }),
    el('rect', { x: 4, y: h, width: 8, height: 4, fill, class: 'px' }),
    el('rect', { x: 4, y: h + 4, width: 4, height: 4, fill, class: 'px' }),
    typeof content === 'string'
      ? s.text(content, { x: w / 2, y: 18, font: 'pixel', size: 16, fill: '#09090b', anchor: 'middle' })
      : content);
}

const hop = (t, high = 14) => [[t, { y: 0 }], [t + 0.18, { y: -high }, 'out'], [t + 0.36, { y: 0 }, 'in']];

function mascot(s, m, i) {
  const codex = m.name === 'codex';
  const { width, height } = spriteSize(m.art);
  const cx = mascotX(i);
  const left = cx - width / 2;
  const top = GROUND - height - (m.float ? 12 : 0);

  // Shadow on the ground.
  s.add(el('rect', { x: cx - width / 2 + 4, y: GROUND - 4, width: width - 8, height: 4, fill: '#000', opacity: 0.5, class: 'px' }));

  // Blinks: the body colour drawn over the eyes for a moment.
  const lids = (m.eyes ?? []).map(([x, y, w, h]) =>
    el('rect', { x: x * PX, y: y * PX, width: w * PX, height: h * PX, fill: m.skin, class: 'px' }));
  const blinkAt = 1 + (i * 0.7) % 3;
  const body = g({},
    sprite(m.art, m.palette, { px: PX }),
    lids.length ? s.anim(g({}, lids), [[0, { opacity: 0 }], [blinkAt, { opacity: 1 }, 'step'], [blinkAt + 0.15, { opacity: 0 }, 'step']], { period: 4 }) : null);

  // Idle: a one-pixel bob; agy floats instead.
  const idle = m.float
    ? s.anim(body, [[0, { y: 0 }], [1, { y: -6 }, 'inOut'], [2, { y: 0 }, 'inOut']], { period: 2 })
    : s.anim(body, [[0, { y: i % 2 ? -PX : 0 }], [0.5, { y: i % 2 ? 0 : -PX }, 'step'], [1, { y: i % 2 ? -PX : 0 }, 'step']], { period: 1 });

  // Hops: a small one when the task arrives and when it is picked up, a big
  // one when it is done, and two for the dance.
  const hops = [...hop(ADD(i) + 0.35, 8), ...hop(PICK(i)), ...hop(DONE[i] + MOVE, 22),
    ...hop(DANCE + i * 0.15, 16), ...hop(DANCE + 0.9 + i * 0.15, 16)];
  if (codex) hops.push(...hop(RESUME));
  s.add(s.anim(idle, [[0, { x: left, y: 0 }], ...hops.map(([t, p, e]) => [t, { ...p }, e])].map(([t, p, e]) => [t, { x: left, ...p, y: top + p.y }, e])));

  s.add(s.text(m.name, { x: cx, y: GROUND + 28, font: 'pixel', size: 16, fill: m.color, anchor: 'middle' }));

  // What the agent is up to, over its head.
  const bx = cx + width / 2 - 6;
  const by = top - 34;
  const dots = g({},
    s.anim(el('rect', { x: 8, y: 10, width: 4, height: 4, fill: '#09090b', class: 'px' }), [[0, { opacity: 0.3 }], [0.25, { opacity: 1 }, 'step'], [1, { opacity: 1 }]], { period: 1 }),
    s.anim(el('rect', { x: 15, y: 10, width: 4, height: 4, fill: '#09090b', class: 'px' }), [[0, { opacity: 0.3 }], [0.5, { opacity: 1 }, 'step'], [1, { opacity: 1 }]], { period: 1 }),
    s.anim(el('rect', { x: 22, y: 10, width: 4, height: 4, fill: '#09090b', class: 'px' }), [[0, { opacity: 0.3 }], [0.75, { opacity: 1 }, 'step'], [1, { opacity: 1 }]], { period: 1 }));
  const tick = sprite(`
    .....#
    ....##
    #..##.
    ####..
    .##...`, { '#': '#09090b' }, { px: 3, x: 8, y: 4 });

  const work = codex ? [[PICK(i) + MOVE, ASK], [RESUME + MOVE, DONE[i]]] : [[PICK(i) + MOVE, DONE[i]]];
  const shows = [
    [bubble(s, '!'), [[ADD(i) + 0.35, PICK(i)]]],
    [bubble(s, dots), work],
    [bubble(s, '?', { fill: C.ask }), codex ? [[ASK + MOVE, RESUME]] : []],
    [bubble(s, tick, { fill: '#86efac' }), [[DONE[i] + MOVE, RESET]]],
  ];
  for (const [content, spans] of shows) {
    if (!spans.length) continue;
    const keys = [[0, { x: bx, y: by, opacity: 0 }]];
    for (const [from, to] of spans) keys.push([from, { opacity: 1 }, 'step'], [to, { opacity: 0 }, 'step']);
    s.add(s.anim(content, keys));
  }
}

function spriteSize(art) {
  const rows = art.split('\n').map((l) => l.trim()).filter(Boolean);
  return { width: Math.max(...rows.map((r) => r.length)) * PX, height: rows.length * PX };
}

function cursor(s) {
  const arrow = sprite(`
    #.........
    ##........
    #w#.......
    #ww#......
    #www#.....
    #wwww#....
    #wwwww#...
    #wwwwww#..
    #wwwwwww#.
    #wwww#####
    #ww#w#....
    #w#.#w#...
    ##..#w#...
    .....##...`, { '#': '#09090b', w: '#fafafa' }, { px: 2 });
  const btn = { x: BX + BW - 70, y: BY + 22 };
  const allow = { x: at(2, 0).x + CARD_W - 32, y: at(2, 0).y + 24 };
  const off = { x: W + 20, y: 200 };
  const press = (t, p) => [[t - 0.15, { ...p, scale: 0.85 }, 'step'], [t, { ...p, scale: 1 }, 'step']];
  s.add(s.anim(arrow, [
    [0, off],
    [0.4, off],
    [1, btn, 'inOut'],
    ...MASCOTS.flatMap((_, i) => press(ADD(i), btn)),
    [ADD(4) + 0.3, btn],
    [ADD(4) + 0.9, off, 'inOut'],
    [ALLOW - 0.8, off],
    [ALLOW - 0.2, allow, 'inOut'],
    ...press(ALLOW + 0.2, allow),
    [RESUME + 0.4, allow],
    [RESUME + 1, off, 'inOut'],
  ]));
}
