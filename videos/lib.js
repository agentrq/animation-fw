// Shared pieces for the narrated story videos: a 16:9 scene built from the
// house kit, a caption band under the stage, and the left column's story copy.
// The timing comes from the voice: bin/video.js speaks <scene>.narration.json
// (src/voice.js) and points VIDEO_TIMELINE at the timeline.json it writes.
import fs from 'node:fs';
import { Scene, FONTS, el, g } from '../src/index.js';
import { C, PX, sky, ground, during } from '../kit/agentrq.js';

export const VW = 1200;
export const VH = 675;
export const BAND = 440; // the house scene fills y 0-440, captions fill the rest

export function loadTimeline() {
  const file = process.env.VIDEO_TIMELINE;
  if (!file) throw new Error('set VIDEO_TIMELINE to the voice build\'s timeline.json');
  const tl = JSON.parse(fs.readFileSync(file, 'utf8'));
  const S = tl.starts;
  const beatEnd = (i) => (i + 1 < S.length ? S[i + 1] : tl.end);
  // Stage events are authored against each beat's nominal length and stretched
  // to the real one, so they follow what the voice is saying.
  const K = S.map((_, i) => Math.max(1, (beatEnd(i) - S[i]) / (tl.nominal?.[i] || (beatEnd(i) - S[i]))));
  const T = (b, o) => +(S[b] + o * K[b]).toFixed(2);
  // The sky's stars blink on 2, 3, 4 and 6 s periods: the loop must hold all of them.
  const loop = Math.ceil((tl.end + 0.5) / 12) * 12;
  // A moment `frac` of the way through beat b, for picking a poster frame.
  const at = (b, frac) => +(S[b] + frac * (beatEnd(b) - S[b])).toFixed(2);
  return { S, N: S.length, end: tl.end, beatEnd, K, T, at, loop, sentences: tl.sentences };
}

// `thumbnail` is the second the posters are taken at: pick a moment with the
// caption showing and the stage full (tl.at(beat, 0.7)). `poster` is the still
// the loop stops on for reduced motion, as in any scene.
export function videoScene({ description, tl, poster, thumbnail }) {
  const s = new Scene({ width: VW, height: VH, loop: tl.loop, background: C.bg, poster, description })
    .font('pixel', FONTS.silkscreen, { fallback: 'monospace' })
    .font('bold', FONTS.inter, { axes: { wght: 700, opsz: 32 } })
    .font('semi', FONTS.inter, { axes: { wght: 600, opsz: 14 } })
    .font('body', FONTS.inter, { axes: { wght: 500, opsz: 18 } })
    .font('mono', FONTS.jetbrainsMono, { axes: { wght: 500 }, fallback: 'monospace' });
  s.videoEnd = tl.end;
  s.thumbnail = thumbnail;
  sky(s);
  ground(s);
  return s;
}

// Shown from `from` to `to` on the loop, hidden otherwise.
export const showDuring = (s, node, spans) => during(s, node, spans);

// A beat's whole span, or the spans of several beats.
export const beatSpan = (tl, b0, b1 = b0) => [tl.S[b0], tl.beatEnd(b1)];

function wrap(text, max) {
  const lines = [];
  let line = '';
  for (const w of text.split(' ')) {
    if ((line + ' ' + w).trim().length > max && line) { lines.push(line); line = w; } else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

// The narration as captions, one sentence at a time while it is spoken.
export function captions(s, tl) {
  s.add(
    el('rect', { x: 0, y: BAND, width: VW, height: VH - BAND, fill: '#0c0c0f', class: 'px' }),
    el('rect', { x: 0, y: BAND, width: VW, height: 4, fill: C.line, class: 'px' }),
  );
  for (const beat of tl.sentences) {
    for (const { text, from, to } of beat) {
      const lines = wrap(text, 50);
      const top = BAND + 118 - (lines.length - 1) * 24;
      const node = g({}, lines.map((l, i) => s.text(l, { x: VW / 2, y: top + i * 50, font: 'bold', size: 40, fill: C.text, anchor: 'middle', spacing: -0.5 })));
      s.add(showDuring(s, node, [[from, to]]));
    }
  }
}

// The left column: the logo and kicker, then each beat's headline, subtitle and
// log line. beats: [{ at: [beatFrom, beatTo?], headline: [a, b], sub, log, logFill? }].
// steps: [label, from, to] chips lit in turn, as in the house intro().
export function story(s, tl, { kicker, beats, steps }) {
  const logo = g({ transform: 'translate(40 32) scale(1.1)' },
    el('rect', { width: 32, height: 32, rx: 8, fill: C.panel, stroke: C.line }),
    g({ transform: 'translate(4 4)', fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
      el('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
      el('path', { d: 'M12 7l-3.5 8M12 7l3.5 8M9.5 12h5' })));
  s.add(logo,
    s.text('AgentRQ', { x: 86, y: 59, font: 'bold', size: 22, fill: C.text }),
    s.text(kicker, { x: 186, y: 58, font: 'pixel', size: 16, fill: C.dim }));

  for (const { at, headline, sub } of beats) {
    const span = [beatSpan(tl, ...at)];
    s.add(showDuring(s, g({},
      s.text(headline[0], { x: 40, y: 132, font: 'bold', size: 46, fill: C.text, spacing: -1 }),
      s.text(headline[1], { x: 40, y: 184, font: 'bold', size: 46, fill: C.text, spacing: -1 }),
      s.text(sub, { x: 40, y: 220, font: 'body', size: 18, fill: C.dim })), span));
  }

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
  for (const { at, log, logs } of beats) {
    for (const [line, from, to, fill = C.text] of logs ?? [[log, tl.S[at[0]], tl.beatEnd(at.at(-1))]]) {
      s.add(showDuring(s, s.text(line, { x: 54, y: 307, font: 'mono', size: 14, fill }), [[from, to]]));
    }
  }
}

// A little pixel tag: text on a coloured rect.
export function tag(s, label, { x, y, fill = C.card, color = C.text, stroke = C.line, font = 'semi', size = 12 }) {
  const w = Math.round(label.length * (font === 'pixel' ? 10 : 7.2) + 16);
  return g({ transform: `translate(${x} ${y})` },
    el('rect', { width: w, height: 22, fill, stroke, 'stroke-width': 1, class: 'px' }),
    s.text(label, { x: w / 2, y: 15, font, size, fill: color, anchor: 'middle' }));
}

export { PX };
