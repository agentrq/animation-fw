// The house pieces of a real-screen video: a pain card on the left (kicker,
// headline, a line under it) with pixel art on the right, the AgentRQ logo, a
// ground for the mascots, and the chapter chip shown over the screens. Shared by
// every video in videos/ that tells its story over screens of the app.
import { el, g, sprite } from '../src/index.js';
import { C, rng } from '../kit/agentrq.js';
import { VW } from './lib.js';

export const BAND = 595; // the screens above, the captions below
export const GROUND_Y = 520;
export const LIFT = GROUND_Y - 400; // the kit stands mascots on y 400
export const FADE = 0.4;
export const ARTX = 560; // where a card's art starts

// The nodes a kit call adds to the scene, taken back out so they can be placed.
export function collect(s, fn) {
  const n = s.body.length;
  fn();
  return s.body.splice(n);
}

export const fadeSpan = (s, node, [from, to], fade = FADE) => s.anim(node,
  [[0, { opacity: 0 }], [from, { opacity: 0 }, 'step'], [from + fade, { opacity: 1 }], [to - fade, { opacity: 1 }], [to, { opacity: 0 }]]);

export function logo(s) {
  return g({},
    g({ transform: 'translate(40 32) scale(1.1)' },
      el('rect', { width: 32, height: 32, rx: 8, fill: C.panel, stroke: C.line }),
      g({ transform: 'translate(4 4)', fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
        el('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
        el('path', { d: 'M12 7l-3.5 8M12 7l3.5 8M9.5 12h5' }))),
    s.text('AgentRQ', { x: 86, y: 59, font: 'bold', size: 22, fill: C.text }));
}

export function groundStrip(s) {
  const r = rng(11);
  s.add(el('rect', { x: 0, y: GROUND_Y, width: VW, height: BAND - GROUND_Y, fill: '#101013', class: 'px' }),
    el('rect', { x: 0, y: GROUND_Y, width: VW, height: 4, fill: C.line, class: 'px' }));
  for (let i = 0; i < 30; i++) {
    s.add(el('rect', { x: Math.round(r() * VW / 4) * 4, y: GROUND_Y + 10 + Math.round(r() * 12) * 4, width: 8, height: 4, fill: '#18181b', class: 'px' }));
  }
}

// The copy on the left of a card: kicker, two-line headline, a line under it.
export function cardText(s, { kicker, headline, sub }) {
  return g({},
    s.text(kicker, { x: 40, y: 112, font: 'pixel', size: 16, fill: C.lit }),
    s.text(headline[0], { x: 40, y: 178, font: 'bold', size: 48, fill: C.text, spacing: -1 }),
    s.text(headline[1], { x: 40, y: 234, font: 'bold', size: 48, fill: C.text, spacing: -1 }),
    s.text(sub, { x: 40, y: 276, font: 'body', size: 20, fill: C.dim }));
}

export function pane(s, { x, y, w, h, title, color }) {
  return g({},
    el('rect', { x, y, width: w, height: h, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    el('rect', { x: x + 2, y: y + 2, width: w - 4, height: 22, fill: '#1c1c1f', class: 'px' }),
    el('rect', { x: x + 10, y: y + 10, width: 6, height: 6, fill: color, class: 'px' }),
    s.text(title, { x: x + 22, y: y + 18, font: 'pixel', size: 11, fill: color }));
}

export function bubbleLine(s, { x, y, w, text, you = false, fill }) {
  return g({},
    el('rect', { x, y, width: w, height: 24, fill: fill ?? (you ? C.text : C.card), stroke: you ? 'none' : C.line, class: 'px' }),
    s.text(text, { x: x + 10, y: y + 16, font: 'semi', size: 12, fill: you ? C.ink : C.text }));
}

// A little paper doc: a page with a folded corner and lines, and a label.
export function doc(s, label, { fill = '#fef3c7', ink = '#78350f', w = 92 } = {}) {
  return g({},
    el('rect', { width: w, height: 30, fill, class: 'px' }),
    el('rect', { x: w - 10, width: 10, height: 10, fill: C.panel, class: 'px' }),
    el('rect', { x: w - 10, y: 0, width: 6, height: 6, fill: ink, opacity: 0.25, class: 'px' }),
    s.text(label, { x: 8, y: 20, font: 'mono', size: 11, fill: ink }));
}

export function tagChip(s, label, { x, y, fill, color = C.ink }) {
  const w = Math.round(label.length * 9.6 + 20);
  return g({}, el('rect', { x, y, width: w, height: 26, fill, class: 'px' }),
    s.text(label, { x: x + w / 2, y: y + 18, font: 'pixel', size: 12, fill: color, anchor: 'middle' }));
}

const ARROW = `
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
  .....##...`;
export const arrow = () => sprite(ARROW, { '#': C.ink, w: C.text }, { px: 2 });

// Shown from a moment on: a node that steps in at t and stays.
export const from = (s, node, t) => s.anim(node, [[0, { opacity: 0 }], [t, { opacity: 0 }, 'step'], [t + 0.05, { opacity: 1 }, 'step']]);

// The cards: each holds the logo, its copy and its art for its span. The first
// card holds its opening frame rather than fading in from black.
export function addCards(s, cards, at) {
  for (const c of cards) {
    const node = g({}, logo(s), cardText(s, c), c.art(s, at));
    s.add(c.span[0] === 0 ? s.anim(node, [[0, { opacity: 1 }], [c.span[1] - FADE, { opacity: 1 }], [c.span[1], { opacity: 0 }]]) : fadeSpan(s, node, c.span));
  }
}

// The chapter, in a corner, while its screens show: [[label, from, to]] in seconds.
export function chapterChips(s, chapters) {
  for (const [label, t0, t1] of chapters) {
    const w = Math.round(label.length * 11 + 28);
    s.add(fadeSpan(s, g({}, el('rect', { x: 16, y: 14, width: w, height: 30, rx: 6, fill: '#09090bdd', stroke: C.line }),
      s.text(label, { x: 16 + w / 2, y: 35, font: 'pixel', size: 13, fill: C.lit, anchor: 'middle' })), [t0, t1]));
  }
}
