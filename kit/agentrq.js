// The AgentRQ house style: every README scene is built from these pieces, so
// they read as one series. See SCENES.md for the layout and the rules.
import { Scene, FONTS, sprite, el, g } from '../src/index.js';

export const W = 1200;
export const H = 440;
export const LOOP = 24;
export const PX = 5;
export const GROUND = 400;

// The app's own zinc greys and status colours.
export const C = {
  bg: '#09090b', panel: '#18181b', column: '#111114', line: '#27272a', card: '#1f1f23',
  text: '#fafafa', dim: '#a1a1aa', ink: '#09090b',
  notstarted: '#71717a', ongoing: '#22c55e', blocked: '#ef4444', done: '#15803d', ask: '#facc15',
  lit: '#86efac', cron: '#67e8f9',
};

// Pixel art that nods to each agent's own mark. `eyes` are [x, y, w, h] in
// pixels, painted over with `skin` to blink.
export const MASCOTS = [
  {
    name: 'claude', color: '#d97757',
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
    name: 'codex', color: '#e4e4e7',
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
    name: 'agy', color: '#4285f4', float: true,
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
    name: 'hermes', color: '#a78bfa',
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
    name: 'openclaw', color: '#f43f5e',
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

export const mascotByName = (name) => MASCOTS.find((m) => m.name === name);

// Five mascots stand evenly under the stage on the right.
export const mascotX = (i) => 514 + i * 148;

// Small seeded random, so every build draws the same sky.
export function rng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

// A scene with the house canvas, loop and fonts.
export function newScene({ description, poster, loop = LOOP }) {
  return new Scene({ width: W, height: H, loop, background: C.bg, poster, description })
    .font('pixel', FONTS.silkscreen, { fallback: 'monospace' })
    .font('bold', FONTS.inter, { axes: { wght: 700, opsz: 32 } })
    .font('semi', FONTS.inter, { axes: { wght: 600, opsz: 14 } })
    .font('body', FONTS.inter, { axes: { wght: 500, opsz: 18 } })
    .font('mono', FONTS.jetbrainsMono, { axes: { wght: 500 }, fallback: 'monospace' });
}

export function sky(s) {
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

export function ground(s) {
  const r = rng(3);
  s.add(el('rect', { x: 0, y: GROUND, width: W, height: H - GROUND, fill: '#101013', class: 'px' }));
  s.add(el('rect', { x: 0, y: GROUND, width: W, height: 4, fill: C.line, class: 'px' }));
  for (let i = 0; i < 30; i++) {
    s.add(el('rect', { x: Math.round(r() * W / 4) * 4, y: GROUND + 8 + Math.round(r() * 6) * 4, width: 8, height: 4, fill: '#18181b', class: 'px' }));
  }
}

// Shows `node` only during each [from, to] span.
export function during(s, node, spans) {
  const keys = [[0, { opacity: spans.some(([from]) => from === 0) ? 1 : 0 }]];
  for (const [from, to] of spans) keys.push([from, { opacity: 1 }, 'step'], [to, { opacity: 0 }, 'step']);
  return s.anim(node, keys);
}

// The left column: logo and feature name, a two-line headline, a subtitle,
// the story's steps as chips lit in turn, and a log line saying what just
// happened. steps: [label, from, to]; log: [from, to, line, colour?].
export function intro(s, { kicker, headline, sub, steps, log }) {
  // The hexagon mark from the app's favicon.
  const logo = g({ transform: 'translate(40 32) scale(1.1)' },
    el('rect', { width: 32, height: 32, rx: 8, fill: C.panel, stroke: C.line }),
    g({ transform: 'translate(4 4)', fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
      el('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
      el('path', { d: 'M12 7l-3.5 8M12 7l3.5 8M9.5 12h5' })));
  s.add(
    logo,
    s.text('AgentRQ', { x: 86, y: 59, font: 'bold', size: 22, fill: C.text }),
    s.text(kicker, { x: 186, y: 58, font: 'pixel', size: 16, fill: C.dim }),
    s.text(headline[0], { x: 40, y: 132, font: 'bold', size: 46, fill: C.text, spacing: -1 }),
    s.text(headline[1], { x: 40, y: 184, font: 'bold', size: 46, fill: C.text, spacing: -1 }),
    s.text(sub, { x: 40, y: 220, font: 'body', size: 18, fill: C.dim }),
  );

  let x = 40;
  for (const [label, from, to] of steps) {
    const w = label.length * 10 + 22;
    s.add(el('rect', { x, y: 244, width: w, height: 26, fill: 'none', stroke: C.line, 'stroke-width': 2, class: 'px' }));
    s.add(s.anim(el('rect', { x, y: 244, width: w, height: 26, fill: C.ongoing, class: 'px' }),
      [[0, { opacity: 0 }], [from, { opacity: 0.22 }, 'step'], [to, { opacity: 0 }, 'step']]));
    s.add(s.text(label, { x: x + w / 2, y: 262, font: 'pixel', size: 16, fill: C.dim, anchor: 'middle' }));
    s.add(s.anim(s.text(label, { x: x + w / 2, y: 262, font: 'pixel', size: 16, fill: C.lit, anchor: 'middle' }),
      [[0, { opacity: 0 }], [from, { opacity: 1 }, 'step'], [to, { opacity: 0 }, 'step']]));
    x += w + 10;
  }

  s.add(el('rect', { x: 40, y: 284, width: 370, height: 36, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }));
  for (const [from, to, line, fill = C.text] of log) {
    s.add(during(s, s.text(line, { x: 54, y: 307, font: 'mono', size: 14, fill }), [[from, to]]));
  }
}

// An app window on the stage: a panel with a title.
export function frame(s, { x, y, w, h, title }) {
  s.add(
    el('rect', { x, y, width: w, height: h, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    s.text(title, { x: x + 16, y: y + 26, font: 'semi', size: 15, fill: C.text }),
  );
}

// A white button that flashes green at each second in `clicks`.
export function button(s, { x, y, w, label, clicks = [] }) {
  s.add(el('rect', { x, y, width: w, height: 24, fill: C.text, class: 'px' }));
  if (clicks.length) {
    s.add(s.anim(el('rect', { x, y, width: w, height: 24, fill: C.ongoing, class: 'px' }),
      [[0, { opacity: 0 }], ...clicks.flatMap((t) => [[t - 0.15, { opacity: 0.8 }, 'step'], [t, { opacity: 0 }, 'step']])]));
  }
  s.add(s.text(label, { x: x + w / 2, y: y + 17, font: 'semi', size: 13, fill: C.ink, anchor: 'middle' }));
}

export function bubble(s, content, { fill = C.text, w = 34 } = {}) {
  const h = 24;
  return g({},
    el('rect', { x: 4, y: 0, width: w - 8, height: h, fill, class: 'px' }),
    el('rect', { x: 0, y: 4, width: w, height: h - 8, fill, class: 'px' }),
    el('rect', { x: 4, y: h, width: 8, height: 4, fill, class: 'px' }),
    el('rect', { x: 4, y: h + 4, width: 4, height: 4, fill, class: 'px' }),
    typeof content === 'string'
      ? s.text(content, { x: w / 2, y: 18, font: 'pixel', size: 16, fill: C.ink, anchor: 'middle' })
      : content);
}

export const CHECK = `
  ......#
  .....##
  #...##.
  ##.##..
  .###...
  ..#....`;

export const hop = (t, high = 14) => [[t, { y: 0 }], [t + 0.18, { y: -high }, 'out'], [t + 0.36, { y: 0 }, 'in']];

function spriteSize(art) {
  const rows = art.split('\n').map((l) => l.trim()).filter(Boolean);
  return { width: Math.max(...rows.map((r) => r.length)) * PX, height: rows.length * PX };
}

// A mascot standing on the ground, with its name under it. It idles (a bob,
// or a float for agy) and blinks on its own. `hops` are [second, height];
// the bubble spans are [from, to]: alert '!', work '...', ask '?', done tick.
// say adds bubbles of your own: [content, spans, fill?], content a short
// string ('zZ') or a node.
export function mascot(s, m, i, { x = mascotX(i), hops = [], alert = [], work = [], ask = [], done = [], say = [] } = {}) {
  const { width, height } = spriteSize(m.art);
  const left = x - width / 2;
  const top = GROUND - height - (m.float ? 12 : 0);

  s.add(el('rect', { x: x - width / 2 + 4, y: GROUND - 4, width: width - 8, height: 4, fill: '#000', opacity: 0.5, class: 'px' }));

  // Blinks: the body colour drawn over the eyes for a moment.
  const lids = (m.eyes ?? []).map(([ex, ey, ew, eh]) =>
    el('rect', { x: ex * PX, y: ey * PX, width: ew * PX, height: eh * PX, fill: m.skin, class: 'px' }));
  const blinkAt = 1 + (i * 0.7) % 3;
  const body = g({},
    sprite(m.art, m.palette, { px: PX }),
    lids.length ? s.anim(g({}, lids), [[0, { opacity: 0 }], [blinkAt, { opacity: 1 }, 'step'], [blinkAt + 0.15, { opacity: 0 }, 'step']], { period: 4 }) : null);

  const idle = m.float
    ? s.anim(body, [[0, { y: 0 }], [1, { y: -6 }, 'inOut'], [2, { y: 0 }, 'inOut']], { period: 2 })
    : s.anim(body, [[0, { y: i % 2 ? -PX : 0 }], [0.5, { y: i % 2 ? 0 : -PX }, 'step'], [1, { y: i % 2 ? -PX : 0 }, 'step']], { period: 1 });

  const jumps = hops.flatMap(([t, high]) => hop(t, high));
  s.add(s.anim(idle, [[0, { y: 0 }], ...jumps].map(([t, p, e]) => [t, { x: left, ...p, y: top + p.y }, e])));

  s.add(s.text(m.name, { x, y: GROUND + 28, font: 'pixel', size: 16, fill: m.color, anchor: 'middle' }));

  const at = { x: x + width / 2 - 6, y: top - 34 };
  const shows = [];
  if (alert.length) shows.push([bubble(s, '!'), alert]);
  if (work.length) {
    const dot = (dx, t) => s.anim(el('rect', { x: dx, y: 10, width: 4, height: 4, fill: C.ink, class: 'px' }),
      [[0, { opacity: 0.3 }], [t, { opacity: 1 }, 'step'], [1, { opacity: 1 }]], { period: 1 });
    shows.push([bubble(s, g({}, dot(8, 0.25), dot(15, 0.5), dot(22, 0.75))), work]);
  }
  if (ask.length) shows.push([bubble(s, '?', { fill: C.ask }), ask]);
  if (done.length) {
    const tick = sprite(`
      .....#
      ....##
      #..##.
      ####..
      .##...`, { '#': C.ink }, { px: 3, x: 8, y: 4 });
    shows.push([bubble(s, tick, { fill: C.lit }), done]);
  }
  for (const [content, spans, fill] of say) {
    const w = typeof content === 'string' ? Math.max(34, content.length * 12 + 14) : 34;
    shows.push([bubble(s, content, { fill, w }), spans]);
  }
  for (const [content, spans] of shows) {
    const keys = [[0, { ...at, opacity: 0 }]];
    for (const [from, to] of spans) keys.push([from, { opacity: 1 }, 'step'], [to, { opacity: 0 }, 'step']);
    s.add(s.anim(content, keys));
  }
}

// Your pointer. Give it a path of [second, {x, y}, ease] keys; press() makes
// a click, and OFF parks it outside the canvas.
export const OFF = { x: W + 20, y: 200 };
export const press = (t, p) => [[t - 0.15, { ...p, scale: 0.85 }, 'step'], [t, { ...p, scale: 1 }, 'step']];

export function cursor(s, keys) {
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
    .....##...`, { '#': C.ink, w: C.text }, { px: 2 });
  s.add(s.anim(arrow, keys));
}
