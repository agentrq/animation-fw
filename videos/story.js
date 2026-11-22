// A generic narrated story: videos/stories/<slug>.json holds, per beat, the script
// text, the left column's headline and the stage (cards, big words, chat, terminal,
// approval, flow, keys, bar, grid, count, wave). videos/<slug>.js is a two-line
// wrapper (tools/story-wrap.mjs writes it and the narration file the voice reads).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { el, g } from '../src/index.js';
import { C, mascotByName, mascot, cursor, press, OFF } from '../kit/agentrq.js';
import { loadTimeline, videoScene, beatSpan, showDuring, story, tag, captions } from './lib.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const X0 = 440;
const W = 740;
const TOP = 28;
const BOTTOM = 318;
const DOT = { g: C.ongoing, y: C.ask, r: C.blocked, b: '#60a5fa', z: C.notstarted, c: C.cron };
const CHIPBG = { g: '#14532d', y: '#713f12', r: '#7f1d1d', b: '#1e3a8a', z: '#27272a', c: '#164e63' };
const CHIPFG = { g: '#bbf7d0', y: '#fef08a', r: '#fecaca', b: '#bfdbfe', z: '#d4d4d8', c: '#a5f3fc' };
const TERM = { p: C.lit, r: C.blocked, g: C.ongoing, y: C.ask };

const height = (o) => ({
  card: 62, big: o.sub ? 112 : 84, msg: 52, term: 26 * (o.lines?.length ?? 1) + 18, btns: 118,
  flow: 96, kbd: 96, bar: 64, grid: 100, count: 100, wave: 72,
}[o.k] ?? 60);

// Each draw returns a node for an element placed at (X0, y); `t0` is when it appears.
function draw(s, o, y, t0) {
  switch (o.k) {
    case 'card': {
      const chip = o.chip;
      return g({},
        el('rect', { x: X0, y, width: W, height: 54, fill: C.card, stroke: C.line, 'stroke-width': 2, class: 'px' }),
        el('rect', { x: X0 + 18, y: y + 21, width: 12, height: 12, fill: DOT[o.dot] ?? C.notstarted, class: 'px' }),
        s.text(o.title, { x: X0 + 46, y: y + 24, font: 'semi', size: 17, fill: C.text }),
        s.text(o.sub ?? '', { x: X0 + 46, y: y + 43, font: 'body', size: 13, fill: C.dim }),
        chip ? tag(s, chip[0], { x: X0 + W - 16 - Math.round(chip[0].length * 7.2 + 16), y: y + 16, fill: CHIPBG[chip[1]], color: CHIPFG[chip[1]], stroke: CHIPBG[chip[1]] }) : null);
    }
    case 'big': {
      const lines = o.text.split('|');
      const mono = !o.text.includes(' ') && /_/.test(o.text);
      return g({},
        ...lines.map((l, i) => s.text(l, { x: X0 + W / 2, y: y + 44 + i * 52, font: mono ? 'mono' : 'bold', size: mono ? 44 : 50, fill: mono ? C.lit : C.text, anchor: 'middle', spacing: -1 })),
        o.sub ? s.text(o.sub, { x: X0 + W / 2, y: y + 44 + (lines.length - 1) * 52 + 36, font: 'body', size: 20, fill: C.dim, anchor: 'middle' }) : null);
    }
    case 'msg': {
      const you = o.from === 'user';
      const w = Math.min(W - 80, o.text.length * 9.2 + 40);
      const x = you ? X0 + W - w : X0;
      return g({},
        s.text(o.who ?? (you ? 'You' : 'Agent'), { x, y: y + 12, font: 'pixel', size: 12, fill: C.dim }),
        el('rect', { x, y: y + 18, width: w, height: 32, fill: you ? C.text : C.card, stroke: C.line, 'stroke-width': 2, class: 'px' }),
        s.text(o.text, { x: x + 14, y: y + 40, font: 'semi', size: 15, fill: you ? C.ink : C.text }));
    }
    case 'term': {
      return g({},
        el('rect', { x: X0, y, width: W, height: height(o), fill: '#000', stroke: C.line, 'stroke-width': 2, class: 'px' }),
        ...o.lines.map(([t, c], i) => s.anim(s.text(t, { x: X0 + 18, y: y + 28 + i * 26, font: 'mono', size: 16, fill: TERM[c] ?? C.text }),
          [[0, { opacity: 0 }], [t0 + i * 0.5, { opacity: 1 }, 'step']])));
    }
    case 'btns': {
      const tap = o.tap;
      return g({},
        el('rect', { x: X0, y, width: W, height: 106, fill: C.card, stroke: C.ask, 'stroke-width': 2, class: 'px' }),
        s.text('NEEDS INPUT', { x: X0 + 18, y: y + 26, font: 'pixel', size: 12, fill: C.ask }),
        el('rect', { x: X0 + 18, y: y + 38, width: W - 36, height: 26, fill: '#000', class: 'px' }),
        s.text(o.code, { x: X0 + 28, y: y + 56, font: 'mono', size: 14, fill: C.lit }),
        ...o.buttons.map((b, i) => g({},
          el('rect', { x: X0 + 18 + i * 118, y: y + 72, width: 108, height: 26, fill: i === o.press ? C.text : C.line, class: 'px' }),
          i === o.press && tap ? s.anim(el('rect', { x: X0 + 18 + i * 118, y: y + 72, width: 108, height: 26, fill: C.ongoing, class: 'px' }),
            [[0, { opacity: 0 }], [tap - 0.15, { opacity: 0.85 }, 'step'], [tap, { opacity: 0 }, 'step']]) : null,
          s.text(b, { x: X0 + 72 + i * 118, y: y + 90, font: 'semi', size: 13, fill: i === o.press ? C.ink : C.blocked, anchor: 'middle' }))));
    }
    case 'flow': {
      const n = o.nodes.length;
      const gap = 44;
      const w = (W - gap * (n - 1)) / n;
      return g({}, ...o.nodes.flatMap(([a, b], i) => {
        const x = X0 + i * (w + gap);
        return [
          s.anim(g({},
            el('rect', { x, y: y + 6, width: w, height: 72, fill: C.card, stroke: i === n - 1 ? C.ongoing : C.line, 'stroke-width': 2, class: 'px' }),
            s.text(a, { x: x + w / 2, y: y + 38, font: 'semi', size: Math.min(18, Math.floor(w / (a.length * 0.62))), fill: C.text, anchor: 'middle' }),
            s.text(b, { x: x + w / 2, y: y + 62, font: 'mono', size: 13, fill: C.lit, anchor: 'middle' })),
          [[0, { opacity: 0 }], [t0 + i * 0.7, { opacity: 1 }, 'step']]),
          i < n - 1 ? s.anim(s.text('>', { x: x + w + gap / 2, y: y + 50, font: 'bold', size: 26, fill: C.dim, anchor: 'middle' }),
            [[0, { opacity: 0 }], [t0 + i * 0.7 + 0.35, { opacity: 1 }, 'step']]) : null,
        ];
      }));
    }
    case 'kbd': {
      const w0 = o.keys.map((k) => Math.max(64, k.length * 18 + 30));
      let x = X0 + W / 2 - (w0.reduce((a, b) => a + b, 0) + 12 * (o.keys.length - 1)) / 2;
      return g({},
        ...o.keys.map((k, i) => { const kx = x; x += w0[i] + 12; return g({},
          el('rect', { x: kx, y: y + 4, width: w0[i], height: 54, fill: C.card, stroke: C.text, 'stroke-width': 2, class: 'px' }),
          s.text(k, { x: kx + w0[i] / 2, y: y + 40, font: 'mono', size: 24, fill: C.text, anchor: 'middle' })); }),
        s.text(o.label ?? '', { x: X0 + W / 2, y: y + 86, font: 'body', size: 18, fill: C.dim, anchor: 'middle' }));
    }
    case 'bar': {
      let x = X0;
      return g({}, ...o.segs.map(([label, pct, c], i) => {
        const w = (W * pct) / 100;
        const sx = x; x += w;
        return s.anim(g({},
          el('rect', { x: sx, y: y + 8, width: w - 4, height: 34, fill: DOT[c] ?? C.notstarted, class: 'px' }),
          s.text(label, { x: sx + (w - 4) / 2, y: y + 31, font: 'semi', size: 15, fill: C.ink, anchor: 'middle' })),
        [[0, { opacity: 0 }], [t0 + i * 0.7, { opacity: 1 }, 'step']]);
      }));
    }
    case 'grid': {
      const n = o.cells.length;
      const w = (W - 12 * (n - 1)) / n;
      return g({}, ...o.cells.map((c, i) => s.anim(g({},
        el('rect', { x: X0 + i * (w + 12), y: y + 6, width: w, height: 70, fill: C.card, stroke: C.line, 'stroke-width': 2, class: 'px' }),
        s.text(c, { x: X0 + i * (w + 12) + w / 2, y: y + 49, font: 'semi', size: 20, fill: C.text, anchor: 'middle' })),
      [[0, { opacity: 0 }], [t0 + i * 0.25, { opacity: 1 }, 'step']])));
    }
    case 'count': {
      const from = o.from ?? 3;
      return g({}, ...Array.from({ length: from + 1 }, (_, i) => showDuring(s,
        s.text(String(from - i), { x: X0 + W / 2, y: y + 76, font: 'pixel', size: 84, fill: C.lit, anchor: 'middle' }),
        [[t0 + i * (o.step ?? 1), t0 + (i + 1) * (o.step ?? 1)]])));
    }
    case 'wave': {
      return g({}, ...Array.from({ length: 28 }, (_, i) => {
        const h = 10 + 50 * Math.abs(Math.sin(i * 1.7)) * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.9)));
        return s.anim(el('rect', { x: X0 + 30 + i * 25, y: y + 36 - h / 2, width: 12, height: h, fill: C.lit, class: 'px' }),
          [[0, { opacity: 0.4 }], [0.3 + (i % 5) * 0.1, { opacity: 1 }, 'inOut'], [1, { opacity: 0.4 }, 'inOut']], { period: 1 });
      }));
    }
    default: return g({});
  }
}

export function storyScene(slug) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, 'stories', `${slug}.json`), 'utf8'));
  const tl = loadTimeline();
  if (tl.N !== data.lines.length) throw new Error(`${slug}: voice has ${tl.N} beats, story has ${data.lines.length}`);
  const { T, S } = tl;
  const s = videoScene({
    tl,
    poster: tl.at(Math.min(2, tl.N - 1), 0.8),
    thumbnail: tl.at(Math.min(3, tl.N - 1), 0.85),
    description: `${data.title} in AgentRQ, a narrated story: ${data.lines.map((l) => l.text).join(' ')}`,
  });

  story(s, tl, {
    kicker: data.kicker ?? data.title.toLowerCase(),
    steps: [],
    beats: data.lines.map((l, i) => ({ at: [i], headline: l.hed, sub: l.sub, log: l.log })),
  });

  // The stage: elements stack from the top, each fades in at its own moment.
  data.lines.forEach((l, b) => {
    let y = TOP;
    const end = tl.beatEnd(b);
    for (const o of l.scene) {
      const h = height(o);
      if (y + h > BOTTOM + 8) throw new Error(`${slug} beat "${l.id}": stage overflows by ${y + h - BOTTOM}px`);
      const t0 = T(b, o.at ?? 0.3);
      const node = draw(s, o, y, t0);
      s.add(showDuring(s, s.anim(node, [[0, { opacity: 1, y: 0 }], [t0, { y: 12 }, 'step'], [t0 + 0.3, { y: 0 }, 'back']]), [[t0, end]]));
      y += h + 10;
    }
  });

  // The agents on the ground, with a bubble for what each is doing in a beat.
  const names = data.mascots ?? ['claude', 'codex', 'agy'];
  names.forEach((n, i) => {
    const spans = { work: [], ask: [], done: [], alert: [] };
    const hops = [];
    data.lines.forEach((l, b) => {
      const what = l.mascot?.[n];
      if (what && spans[what]) { spans[what].push([T(b, 1.0), tl.beatEnd(b)]); hops.push([T(b, 1.0), 16]); }
    });
    mascot(s, { ...mascotByName(n), name: n }, i, { hops, ...spans });
  });

  // A pointer taps any approval buttons.
  const keys = [[0, OFF]];
  data.lines.forEach((l, b) => {
    let y = TOP;
    for (const o of l.scene) {
      if (o.k === 'btns' && o.tap) {
        const p = { x: X0 + 72 + o.press * 118, y: y + 86 };
        keys.push([T(b, o.tap - 1.0), OFF], [T(b, o.tap - 0.3), p, 'inOut'], ...press(T(b, o.tap) + 0.2, p), [T(b, o.tap + 0.6), p], [T(b, o.tap + 1.1), OFF, 'inOut']);
      }
      y += height(o) + 10;
    }
  });
  if (keys.length > 1) cursor(s, keys);

  captions(s, tl);
  return s;
}
