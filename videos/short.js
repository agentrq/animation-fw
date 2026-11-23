// Vertical shorts (9:16, 1080x1920) told over the real screens of the long
// videos: a hook card that holds from the first frame, the app in a box with
// the camera close up, big captions under it, and an end card with the
// question to answer in the comments.
//
// YouTube draws over a short: its controls along the top, a column of buttons
// on the right and the title and channel along the bottom. Everything here sits
// inside a padded area clear of all three: the header at TOP, the screen box,
// the captions, and nothing below BOTTOM but the starfield.
//
// Build one at full size: node bin/video.js videos/shorts/<name>.js --size 1080x1920
import { Scene, FONTS, el, g } from '../src/index.js';
import { C, rng, mascot, mascotByName } from '../kit/agentrq.js';
import { Screen } from './screen.js';
import { logo, collect, fadeSpan, FADE } from './house.js';
import { wrap } from './lib.js';

export const SW = 720;
export const SH = 1280;
export const PAD = 40;
export const TOP = 150; // the header row: below YouTube's top controls
export const BOTTOM = 940; // YouTube's title and channel go below this
export const SCREEN = { x: PAD, y: 206, w: SW - 2 * PAD, h: 540 };
export const CAPTION = { mid: 836, size: 34, chars: 26, gap: 44, lines: 3 };
const CARD_TOP = 196; // a card covers the screen box and the captions' place

export function shortScene({ description, tl, poster, thumbnail }) {
  const s = new Scene({ width: SW, height: SH, loop: tl.loop, background: C.bg, poster, description })
    .font('pixel', FONTS.silkscreen, { fallback: 'monospace' })
    .font('bold', FONTS.inter, { axes: { wght: 700, opsz: 32 } })
    .font('semi', FONTS.inter, { axes: { wght: 600, opsz: 14 } })
    .font('body', FONTS.inter, { axes: { wght: 500, opsz: 18 } })
    .font('mono', FONTS.jetbrainsMono, { axes: { wght: 500 }, fallback: 'monospace' });
  s.videoEnd = tl.end;
  s.thumbnail = thumbnail;
  stars(s);
  // The logo, always: at TOP rather than the long videos' 32.
  s.add(g({ transform: `translate(0 ${TOP - 32})` }, logo(s)));
  return s;
}

// The night sky over the whole frame. The blinks run on 2, 3, 4 and 6 s periods,
// which the timeline's loop (a multiple of 12 s) holds.
function stars(s) {
  const r = rng(17);
  for (let i = 0; i < 80; i++) {
    const big = r() > 0.8;
    const star = el('rect', { x: Math.round(r() * SW), y: Math.round(r() * SH), width: big ? 4 : 2, height: big ? 4 : 2, fill: big ? '#52525b' : '#3f3f46', class: 'px' });
    if (r() > 0.6) {
      const period = [2, 3, 4, 6][Math.floor(r() * 4)];
      const t = +(r() * period * 0.8).toFixed(1);
      s.add(s.anim(star, [[0, { opacity: 1 }], [t, { opacity: 0.15 }, 'step'], [+(t + 0.2 * period).toFixed(1), { opacity: 1 }, 'step']], { period }));
    } else s.add(star);
  }
}

// The app in the box under the header: clipped to it, framed, with labels sized
// for a phone. `spans` are when it is on stage.
export function shortScreen(s, shots) {
  return new Screen(s, shots, { safe: SCREEN, clip: true, pad: 16, labels: { size: 20, char: 11.4, h: 38 } });
}

export function screenFrame(s, spans) {
  const { x, y, w, h } = SCREEN;
  const frame = el('rect', { x: x - 1.5, y: y - 1.5, width: w + 3, height: h + 3, rx: 15, fill: 'none', stroke: C.line, 'stroke-width': 3 });
  for (const span of spans) s.add(fadeSpan(s, frame, span));
}

// The narration, one sentence at a time, big and centred under the screen. A
// sentence that would need more than three lines is a script to split.
export function shortCaptions(s, tl, { mid = CAPTION.mid, size = CAPTION.size, chars = CAPTION.chars, gap = CAPTION.gap } = {}) {
  for (const beat of tl.sentences) {
    for (const { text, from, to } of beat) {
      const lines = wrap(text, chars);
      if (lines.length > CAPTION.lines) throw new Error(`caption "${text}" needs ${lines.length} lines: split the sentence`);
      const top = mid - ((lines.length - 1) * gap) / 2 + size / 3;
      const node = g({}, lines.map((l, i) => s.text(l, { x: SW / 2, y: top + i * gap, font: 'bold', size, fill: C.text, anchor: 'middle', spacing: -0.5 })));
      s.add(s.anim(node, [[0, { opacity: 0 }], [from, { opacity: 1 }, 'step'], [to, { opacity: 0 }, 'step']]));
    }
  }
}

// The chapter, at the right of the header row, while its screens show.
export function shortChips(s, chapters) {
  for (const [label, t0, t1] of chapters) {
    const w = Math.round(label.length * 11 + 28);
    const x = SW - PAD - w;
    s.add(fadeSpan(s, g({}, el('rect', { x, y: TOP + 2, width: w, height: 32, rx: 6, fill: '#09090bdd', stroke: C.line }),
      s.text(label, { x: x + w / 2, y: TOP + 24, font: 'pixel', size: 13, fill: C.lit, anchor: 'middle' })), [t0, t1]));
  }
}

// A card: kicker, a headline of up to three big lines, a line under it, and art
// below it (`art(s, y)` draws from y down, ending above the captions at about
// y 750). The first card holds its opening frame: a short must hook from frame one.
export function shortCards(s, cards) {
  for (const c of cards) {
    // As big as the longest line allows across the padded width (Inter bold is about 0.58 em a character).
    const size = Math.min(62, Math.floor((SW - 2 * PAD) / (Math.max(...c.headline.map((l) => l.length)) * 0.58)));
    const lh = Math.round(size * 1.13);
    const subY = 318 + (c.headline.length - 1) * lh + 46;
    const node = g({},
      el('rect', { x: 0, y: CARD_TOP, width: SW, height: BOTTOM - CARD_TOP, fill: C.bg }),
      s.text(c.kicker, { x: PAD, y: 250, font: 'pixel', size: 18, fill: C.lit }),
      ...c.headline.map((line, i) => s.text(line, { x: PAD, y: 318 + i * lh, font: 'bold', size, fill: i === c.mark ? C.lit : C.text, spacing: -1.5 })),
      s.text(c.sub, { x: PAD, y: subY, font: 'body', size: 25, fill: C.dim }),
      c.art ? c.art(s, subY + 28) : null);
    s.add(onStage(s, node, c.span));
  }
}

// On stage during `span`. One that starts at 0 is there on the first frame (a short's
// hook) and only fades out; any other fades in and out.
function onStage(s, node, span) {
  return span[0] === 0 ? s.anim(node, [[0, { opacity: 1 }], [span[1] - FADE, { opacity: 1 }], [span[1], { opacity: 0 }]]) : fadeSpan(s, node, span);
}

// Art drawn for a long video's card (x from 560, y from 70) moved under a short's headline.
export const moved = (node, y, { x = PAD, scale = 0.9 } = {}) => g({ transform: `translate(${x} ${y}) scale(${scale}) translate(-560 -70)` }, node);

// A long video's card art retimed to a short's words. The art asks for its times as
// (id, offset) in the long video's beats. `times` maps 'id:offset' to an offset into the
// short's beat `beat`, and a time not in it lands at `rest(offset)`.
export const retime = (at, beat, times, rest = (o) => o) => (id, o) => at(beat, times[`${id}:${o}`] ?? rest(o));

// The agents, standing on a line at `y` during `spans`, each hopping once at its
// time in `hops` (no bubbles: on a card they would land on the text above).
export function crowd(s, names, { y, spans, hops, gap = 150 }) {
  const x0 = SW / 2 - ((names.length - 1) * gap) / 2;
  const nodes = collect(s, () => names.forEach((n, i) => {
    mascot(s, { ...mascotByName(n), name: n === 'agy' ? 'antigravity' : n }, i, { x: x0 + i * gap, hops: [[hops[i], 16]] });
  }));
  // The kit stands mascots on y 400; their names sit 28 under it.
  const node = g({ transform: `translate(0 ${y - 400})` }, nodes);
  for (const span of spans) s.add(onStage(s, node, span));
}

// The end card's middle: where to try it, and the question for the comments.
export function endArt(s, y, { question, line }) {
  const w = Math.max(question.length * 13.6 + 48, 420);
  return g({},
    s.text('agentrq.com', { x: SW / 2, y: y + 70, font: 'bold', size: 72, fill: C.text, anchor: 'middle', spacing: -2 }),
    s.text(line, { x: SW / 2, y: y + 116, font: 'body', size: 22, fill: C.dim, anchor: 'middle' }),
    el('rect', { x: SW / 2 - w / 2, y: y + 150, width: w, height: 62, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
    s.text(question, { x: SW / 2, y: y + 189, font: 'semi', size: 24, fill: C.lit, anchor: 'middle' }));
}
