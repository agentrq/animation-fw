import { el, g } from './svg.js';

// A sprite is drawn as text: one character per pixel, mapped to a colour by
// the palette. '.' and ' ' are transparent.
//
//   sprite(`
//     .##.
//     #oo#
//   `, { '#': '#fff', o: '#000' }, { px: 4 })
export function parseGrid(art) {
  const lines = (Array.isArray(art) ? art : art.split('\n')).map((l) => l.replace(/\s+$/, ''));
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines.at(-1).trim()) lines.pop();
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(indent));
}

// Fewest rectangles, greedily: runs of a colour along a row, then runs with
// the same span stacked down the rows. A sprite costs its shapes, not its
// pixels.
export function rects(grid, palette) {
  const out = [];
  const open = new Map(); // "x,w,colour" -> rect still growing downwards
  grid.forEach((row, y) => {
    const seen = new Set();
    for (let x = 0; x < row.length;) {
      const c = row[x];
      let w = 1;
      while (row[x + w] === c) w++;
      if (c !== '.' && c !== ' ') {
        const fill = palette[c];
        if (!fill) throw new Error(`sprite: no colour for '${c}'`);
        const key = `${x},${w},${fill}`;
        const r = open.get(key);
        if (r && r.y + r.h === y) r.h++;
        else { const n = { x, y, w, h: 1, fill }; out.push(n); open.set(key, n); }
        seen.add(key);
      }
      x += w;
    }
    for (const k of open.keys()) if (!seen.has(k)) open.delete(k);
  });
  return out;
}

export function sprite(art, palette, { px = 4, x = 0, y = 0, ...attrs } = {}) {
  const grid = parseGrid(art);
  const shapes = rects(grid, palette).map((r) =>
    el('rect', { x: r.x * px, y: r.y * px, width: r.w * px, height: r.h * px, fill: r.fill }));
  return g({ class: 'px', transform: x || y ? `translate(${x} ${y})` : undefined, ...attrs }, shapes);
}

export const size = (art, px = 4) => {
  const grid = parseGrid(art);
  return { width: Math.max(...grid.map((r) => r.length)) * px, height: grid.length * px };
};
