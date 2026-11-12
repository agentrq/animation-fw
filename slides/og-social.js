// The GitHub social preview (and agentrq.com og-image), animated. Every part is
// cut from the real 1280 x 640 image in slides/assets/og-social.png, so the
// frame the loop settles on is that image; the framework brings the parts in
// one by one, ticks the WebMCP tools, pulses the memory chips, settles on
// the whole image and walks a highlight across the twelve feature tiles.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { Scene, el, g } from '../src/index.js';

export const W = 1280;
export const H = 640;
export const LOOP = 14;
export const SOURCE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets/og-social.png');

const LIT = '#86efac';
const POPOVER = '#0e1a11';

// [x, y, w, h, corner radius], measured on the source image. A part with a
// radius is clipped to its rounded box; the title is a plain rectangle.
export const PARTS = {
  logo: [64, 101, 68, 68, 14],
  title: [150, 84, 430, 102, 0],
  pills: [[831, 98, 123, 35, 17], [964, 98, 114, 35, 17], [1088, 98, 128, 35, 17]],
  card: [63, 197, 406, 354, 14],
  banner: [481, 197, 736, 87, 12],
  chips: [[912, 229, 89, 23, 11], [1007, 229, 105, 23, 11], [1118, 229, 80, 23, 11]],
  // The three ticks in the WebMCP popover, one per tool.
  ticks: [[316, 349, 13, 12], [316, 366, 13, 11], [316, 381, 13, 11]],
};
// Twelve tiles, three columns by four rows, in reading order.
PARTS.tiles = [293, 359, 426, 492].flatMap((y) => [482, 730, 978].map((x) => [x, y, 238, 58, 8]));

// The boxes lifted out of the source to make the backdrop: the header parts
// one by one, then the card and the right-hand column whole, with the glow
// around them (it comes back with the full picture at the end).
export const HOLES = [
  [61, 98, 74, 74], [150, 84, 430, 102], [828, 95, 129, 41], [961, 95, 120, 41], [1085, 95, 134, 41],
  [36, 182, 440, 398], [476, 182, 768, 398],
];

export const T = {
  logo: 0.2, title: 0.5, pills: 1.0, card: 1.6, ticks: 2.6, banner: 2.2, chips: 3.6,
  tiles: 4.0, tileEvery: 0.12, full: 5.9, sweep: 6.6, sweepEvery: 0.5, out: 13.2,
};

async function slice(img, [x, y, w, h]) {
  const png = await img.clone().extract({ left: x, top: y, width: w, height: h }).png().toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

// The backdrop: the source with every part's box filled from the pixels
// around it (the mean of a left-right and a top-bottom blend), so what is
// left is the gradient and grid the parts sit on.
export function plate(data, width, channels, boxes) {
  const out = Buffer.from(data);
  const at = (x, y, c) => out[(y * width + x) * channels + c];
  for (const [bx, by, bw, bh] of boxes) {
    const x0 = bx - 1, x1 = bx + bw, y0 = by - 1, y1 = by + bh;
    for (let y = by; y < y1; y++) {
      for (let x = bx; x < x1; x++) {
        const fx = (x - x0) / (x1 - x0), fy = (y - y0) / (y1 - y0);
        for (let c = 0; c < channels; c++) {
          const h = at(x0, y, c) * (1 - fx) + at(x1, y, c) * fx;
          const v = at(x, y0, c) * (1 - fy) + at(x, y1, c) * fy;
          out[(y * width + x) * channels + c] = Math.round((h + v) / 2);
        }
      }
    }
  }
  return out;
}

export default async function () {
  const s = new Scene({
    width: W, height: H, loop: LOOP, background: '#09090b', poster: 12.6,
    description: 'AgentRQ, the agent-human collaboration platform: the logo and title appear, then the open source, MCP native and self-hostable badges, the Chrome extension card with Claude Code live in the browser as its WebMCP tools tick on, the distributed memory banner for every agent, machine and fork, and twelve feature tiles from the visual task board to desktop, web and CLI.',
  });
  const img = sharp(SOURCE);
  let clips = 0;

  // A cut of the source image at its own place, clipped to its rounded box.
  const part = async (box) => {
    const [x, y, w, h, r = 0] = box;
    if (!r) return el('image', { x, y, width: w, height: h, href: await slice(img, box) });
    const id = `c${clips++}`;
    s.def(el('clipPath', { id }, el('rect', { x, y, width: w, height: h, rx: r })));
    return el('image', { x, y, width: w, height: h, href: await slice(img, box), 'clip-path': `url(#${id})` });
  };
  // Fades and slides a node in at `at` (dx, dy say from where), then out with the loop.
  const enter = (node, at, { dx = 0, dy = 12, pop = false } = {}) => {
    const from = pop ? { opacity: 0, scale: 0.6, x: 0, y: 0 } : { opacity: 0, x: dx, y: dy, scale: 1 };
    return s.anim(node, [[0, from], [at, from], [at + 0.45, { opacity: 1, x: 0, y: 0, scale: 1 }, pop ? 'back' : 'out'],
      [T.out, { opacity: 1 }], [T.out + 0.6, { opacity: 0 }, 'in']], pop ? { origin: 'center' } : {});
  };

  // The backdrop: the source with the parts lifted out, as a JPEG.
  const { data, info } = await img.clone().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const back = await sharp(plate(data, info.width, info.channels, HOLES), { raw: info }).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toBuffer();
  s.add(el('image', { x: 0, y: 0, width: W, height: H, href: `data:image/jpeg;base64,${back.toString('base64')}` }));

  // Header: logo, name and tagline, then the three badges.
  s.add(enter(await part(PARTS.logo), T.logo, { pop: true }));
  s.add(enter(await part(PARTS.title), T.title, { dx: -24, dy: 0 }));
  for (const [i, box] of PARTS.pills.entries()) s.add(enter(await part(box), T.pills + i * 0.15, { pop: true }));

  // The Chrome extension card, whose WebMCP tools then tick on one by one.
  // Each tick starts covered in the popover's own green-black and is uncovered in turn.
  const covers = PARTS.ticks.map(([x, y, w, h], i) => s.anim(el('rect', { x, y, width: w, height: h, fill: POPOVER }),
    [[0, { opacity: 1 }], [T.ticks + i * 0.35, { opacity: 0 }, 'step']]));
  s.add(enter(g({}, await part(PARTS.card), ...covers), T.card, { dy: 24 }));

  // Distributed memory, then its three chips pulse in turn.
  s.add(enter(await part(PARTS.banner), T.banner, { dx: 32, dy: 0 }));
  for (const [i, box] of PARTS.chips.entries()) {
    const at = T.chips + i * 0.2;
    s.add(s.anim(await part(box),
      [[0, { scale: 1, opacity: 0 }], [T.banner + 0.45, { opacity: 1 }, 'step'], [at, { scale: 1 }], [at + 0.15, { scale: 1.12 }, 'out'], [at + 0.35, { scale: 1 }, 'in'],
        [T.out, { opacity: 1 }], [T.out + 0.6, { opacity: 0 }, 'in']], { origin: 'center' }));
  }

  // Twelve tiles in reading order.
  for (const [i, box] of PARTS.tiles.entries()) s.add(enter(await part(box), T.tiles + i * T.tileEvery));

  // Then the whole source fades in over the parts, glow and all, so the loop
  // holds on the real image; a highlight walks across the tiles on top.
  s.add(s.anim(el('image', { x: 0, y: 0, width: W, height: H, href: await slice(img, [0, 0, W, H]) }),
    [[0, { opacity: 0 }], [T.full, { opacity: 0 }], [T.full + 0.5, { opacity: 1 }, 'inOut'], [T.out, { opacity: 1 }], [T.out + 0.6, { opacity: 0 }, 'in']]));
  const [x0, y0, tw, th] = PARTS.tiles[0];
  const ring = el('rect', { x: -1, y: -1, width: tw + 2, height: th + 2, rx: 9, fill: LIT, 'fill-opacity': 0.06, stroke: LIT, 'stroke-width': 2 });
  const keys = [[0, { x: x0, y: y0, opacity: 0 }], [T.sweep, { x: x0, y: y0, opacity: 0 }, 'step']];
  for (const [i, [x, y]] of PARTS.tiles.entries()) {
    const at = T.sweep + i * T.sweepEvery;
    keys.push([at, { x, y, opacity: 1 }, 'step'], [at + T.sweepEvery - 0.01, { x, y, opacity: 1 }]);
  }
  keys.push([T.sweep + PARTS.tiles.length * T.sweepEvery, { opacity: 0 }, 'step']);
  s.add(s.anim(ring, keys));
  return s;
}
