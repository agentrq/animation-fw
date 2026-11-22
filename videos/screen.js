// Real screens in a narrated video: screenshots taken with src/capture.js, shown
// in an app window with a camera that frames them, crossfades or wipes from one
// state of the app to the next, green callouts on the parts the voice names, and
// a pointer that clicks. Everything is still CSS keyframes on the scene's loop.
//
//   const shots = loadShots('videos/screens/pano-collaboration');
//   const screen = new Screen(s, shots);
//   screen.show('board', T(3, 0)).look(T(3, 1), 'card0').callout(T(3, 2), T(3, 5), 'foot0', { label: 'who wrote it' });
//   screen.visible([[T(3, 0), tl.beatEnd(9)]]).build();
//
// Region names come from the shot's manifest (the capture's `regions`), so a
// re-shoot moves the camera and the callouts with the app.
import fs from 'node:fs';
import path from 'node:path';
import { el, g, keyframes, num, sprite } from '../src/index.js';
import { C } from '../kit/agentrq.js';

const BEZIER = { linear: [0, 0, 1, 1], in: [0.5, 0, 1, 1], out: [0, 0, 0.5, 1], inOut: [0.6, 0, 0.4, 1], back: [0.3, 1.6, 0.6, 1] };

// How far along an eased segment is at `p` (0-1 of its time): the same curves
// the timeline hands CSS, so overlays drawn from it land where the camera is.
export function ease(name, p) {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  if (name === 'step') return 0;
  const [x1, y1, x2, y2] = BEZIER[name ?? 'linear'] ?? BEZIER.linear;
  const bez = (a, b, t) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (bez(x1, x2, mid) < p) lo = mid; else hi = mid;
  }
  return bez(y1, y2, (lo + hi) / 2);
}

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

// The camera that shows `rect` ([x, y, w, h] in screen pixels) as large as it
// fits in `safe`, centred. With `bounds` (the window), a close-up never shows
// past the window's edge: it slides back in until the frame is full.
export function fit(rect, safe, { pad = 0, bounds } = {}) {
  const [x, y, w, h] = rect;
  const k = Math.min((safe.w - 2 * pad) / w, (safe.h - 2 * pad) / h);
  let tx = safe.x + safe.w / 2 - k * (x + w / 2);
  let ty = safe.y + safe.h / 2 - k * (y + h / 2);
  if (bounds) {
    const [bx, by, bw, bh] = bounds;
    if (k * bw >= safe.w) tx = clamp(tx, safe.x + safe.w - k * (bx + bw), safe.x - k * bx);
    if (k * bh >= safe.h) ty = clamp(ty, safe.y + safe.h - k * (by + bh), safe.y - k * by);
  }
  return { x: +tx.toFixed(2), y: +ty.toFixed(2), scale: +k.toFixed(4) };
}

// A box grown by `by` on every side, or shaped by { x, y, w, h } fractions of it
// (a part of a region: { y: 0.5, h: 0.5 } is its bottom half).
export function part([x, y, w, h], { by = 0, x: fx = 0, y: fy = 0, w: fw = 1, h: fh = 1 } = {}) {
  return [x + fx * w - by, y + fy * h - by, fw * w + 2 * by, fh * h + 2 * by];
}

export function loadShots(dir) {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const data = new Map();
  return {
    dir,
    viewport: manifest.viewport,
    names: Object.keys(manifest.shots),
    get(name) {
      const shot = manifest.shots[name];
      if (!shot) throw new Error(`no shot "${name}" in ${dir}`);
      return shot;
    },
    // The image as a data URI, read once: the scene stays one self-contained file.
    href(name) {
      if (!data.has(name)) data.set(name, `data:image/webp;base64,${fs.readFileSync(path.join(dir, this.get(name).file)).toString('base64')}`);
      return data.get(name);
    },
  };
}

// An animation on the element itself, not on a wrapping <g>: a clipPath only
// takes shapes, so its moving rect cannot sit inside a group.
function animOn(s, keys) {
  const name = `a${s.anims++}`;
  s.css.push(keyframes(name, keys, s.loop), `.${name}{animation:${name} ${s.loop}s linear infinite}`);
  return `a ${name}`;
}

const GREEN = '#4ade80';
const GREEN_INK = '#052e16';

export class Screen {
  constructor(s, shots, { safe = { x: 0, y: 0, w: 1200, h: 595 }, bar = 30, host = 'app.agentrq.com', pad = 28 } = {}) {
    Object.assign(this, { s, shots, safe, bar, host, pad });
    this.vw = shots.viewport.width;
    this.vh = shots.viewport.height;
    this.states = [];
    this.keys = [];
    this.marks = [];
    this.pointer = [];
    this.spans = [];
  }

  // The window, title bar included, with a margin round it.
  get bounds() { return [0, -this.bar, this.vw, this.vh + this.bar]; }

  // Shows shot `name` from second `t` until the next state takes over: a fade, or
  // with `wipe` a reveal from the top down over that many seconds (typing, a list growing).
  show(name, t, { fade = 0.35, wipe = 0 } = {}) {
    this.shots.get(name);
    this.states.push({ name, t, fade: wipe ? 0 : fade, wipe });
    this.states.sort((a, b) => a.t - b.t);
    return this;
  }

  stateAt(t) {
    const state = [...this.states].reverse().find((st) => st.t <= t + 1e-6) ?? this.states[0];
    if (!state) throw new Error('the screen shows nothing yet: call show() first');
    return state;
  }

  // A focus as a box in screen pixels: 'window', a region of the shot showing at
  // `t`, [x, y, w, h], or { region, shot?, by?, x?, y?, w?, h? } for a part of one.
  rect(focus, t) {
    if (focus === 'window') return part(this.bounds, { by: 12 });
    if (Array.isArray(focus)) return focus;
    const spec = typeof focus === 'string' ? { region: focus } : focus;
    const shot = this.shots.get(spec.shot ?? this.stateAt(t).name);
    const box = shot.regions[spec.region];
    if (!box) throw new Error(`shot "${spec.shot ?? this.stateAt(t).name}" has no region "${spec.region}"`);
    return part(box, spec);
  }

  // The camera arrives at `focus` at t + dur, leaving where it was at t.
  look(t, focus, { dur = 1.2, ease: e = 'inOut', pad = this.pad } = {}) {
    const cam = fit(this.rect(focus, t + dur), this.safe, { pad, bounds: this.bounds });
    this.keys.push({ t, dur, ease: e, cam });
    this.keys.sort((a, b) => a.t - b.t);
    return this;
  }

  cut(t, focus, opts = {}) { return this.look(t, focus, { ...opts, dur: 0 }); }

  cameraAt(t) {
    if (!this.keys.length) return fit(part(this.bounds, { by: 12 }), this.safe, { pad: this.pad });
    let cam = this.keys[0].cam;
    for (const k of this.keys) {
      if (t < k.t) break;
      if (t >= k.t + k.dur) { cam = k.cam; continue; }
      const p = ease(k.ease, (t - k.t) / k.dur);
      cam = { x: cam.x + (k.cam.x - cam.x) * p, y: cam.y + (k.cam.y - cam.y) * p, scale: cam.scale + (k.cam.scale - cam.scale) * p };
    }
    return cam;
  }

  moving(from, to) {
    return this.keys.some((k) => k.dur > 0 && k.t < to && k.t + k.dur > from);
  }

  toScene(t, [x, y, w = 0, h = 0]) {
    const c = this.cameraAt(t);
    return [c.x + c.scale * x, c.y + c.scale * y, c.scale * w, c.scale * h];
  }

  // A green box round `focus` from `from` to `to`, with a label beside it. The
  // camera must hold still meanwhile (the box is drawn where the region is).
  // `dim` darkens the rest of the frame.
  callout(from, to, focus, { label, side = 'auto', pad = 6, dim = false } = {}) {
    if (this.moving(from, to)) throw new Error(`callout "${label ?? focus}" at ${from}s: the camera moves while it shows`);
    const [x, y, w, h] = this.toScene(from, part(this.rect(focus, from), { by: pad / this.cameraAt(from).scale }));
    this.marks.push({ from, to, box: [x, y, w, h], label, side, dim });
    return this;
  }

  // The pointer glides to `focus` and clicks it at `t`.
  click(t, focus, { glide = 0.7 } = {}) {
    const [x, y, w, h] = this.toScene(t, this.rect(focus, t));
    const p = { x: +(x + w / 2).toFixed(1), y: +(y + h / 2).toFixed(1) };
    const last = this.pointer.at(-1);
    this.pointer.push({ t: t - glide, p: last ? last.p : { x: p.x + 160, y: p.y + 120 }, ease: 'step' }, { t: t - 0.15, p, ease: 'inOut' }, { t, p, click: true });
    return this;
  }

  // The pointer leaves the frame.
  away(t) {
    const last = this.pointer.at(-1);
    if (last) this.pointer.push({ t, p: last.p, ease: 'step' }, { t: t + 0.5, p: { x: this.safe.x + this.safe.w + 40, y: last.p.y + 80 }, ease: 'in' });
    return this;
  }

  // The window is on stage during these [from, to] spans, fading in and out.
  visible(spans, { fade = 0.4 } = {}) {
    this.spans.push(...spans.map(([from, to]) => ({ from, to, fade })));
    return this;
  }

  build() {
    const { s } = this;
    if (!this.states.length) throw new Error('the screen shows nothing: call show() first');
    if (!this.spans.length) throw new Error('the screen is never on stage: call visible() first');
    for (const name of new Set(this.states.map((st) => st.name))) {
      s.def(el('image', { id: `shot-${name}`, href: this.shots.href(name), width: this.vw, height: this.vh, preserveAspectRatio: 'none' }));
    }
    const end = s.loop;
    const layers = this.states.map((st, i) => {
      const next = this.states[i + 1];
      const until = next ? next.t + Math.max(next.fade, next.wipe) : end;
      const keys = [[0, { opacity: 0 }]];
      if (st.fade) keys.push([st.t, { opacity: 0 }, 'step'], [Math.min(st.t + st.fade, end), { opacity: 1 }]);
      else keys.push([st.t, { opacity: 1 }, 'step']);
      if (until < end) keys.push([until, { opacity: 0 }, 'step']);
      let clip;
      if (st.wipe) {
        const id = `wipe-${i}`;
        const cls = animOn(s, [[0, { y: -this.vh }], [st.t, { y: -this.vh }, 'step'], [Math.min(st.t + st.wipe, end), { y: 0 }, 'linear']]);
        s.def(el('clipPath', { id }, el('rect', { width: this.vw, height: this.vh, class: cls })));
        clip = `url(#${id})`;
      }
      const url = s.text(`${this.host}${this.shots.get(st.name).route}`, { x: this.vw / 2, y: -this.bar / 2 + 4, font: 'body', size: 12, fill: C.dim, anchor: 'middle' });
      return s.anim(g({}, el('use', { href: `#shot-${st.name}`, 'clip-path': clip }), url), keys);
    });

    const chrome = g({},
      el('rect', { x: -1.5, y: -this.bar - 1.5, width: this.vw + 3, height: this.vh + this.bar + 3, rx: 8, fill: '#000', stroke: C.line, 'stroke-width': 3 }),
      el('rect', { x: 0, y: -this.bar, width: this.vw, height: this.bar, rx: 6, fill: '#1c1c1f' }),
      ...['#ef4444', '#f59e0b', '#22c55e'].map((fill, i) => el('circle', { cx: 18 + i * 16, cy: -this.bar / 2, r: 5, fill })),
      el('rect', { x: this.vw / 2 - 210, y: -this.bar / 2 - 10, width: 420, height: 20, rx: 10, fill: '#27272a' }));

    const first = this.keys[0]?.cam ?? this.cameraAt(0);
    const camKeys = [[0, first]];
    for (const k of this.keys) {
      camKeys.push([k.t, this.cameraAt(k.t), 'step']);
      camKeys.push([k.t + k.dur, k.cam, k.dur ? k.ease : 'step']);
    }
    const camera = s.anim(g({}, chrome, ...layers), camKeys.map(([t, c, e]) => [Math.min(t, end), { x: c.x, y: c.y, scale: c.scale }, e]));

    const marks = this.marks.map((m) => this.mark(m));
    const pointer = this.cursor();
    const on = [[0, { opacity: 0 }]];
    for (const { from, to, fade } of this.spans) on.push([from, { opacity: 0 }, 'step'], [from + fade, { opacity: 1 }], [to - fade, { opacity: 1 }], [to, { opacity: 0 }]);
    s.add(s.anim(g({}, camera, ...marks, pointer), on));
    return this;
  }

  mark({ from, to, box: [x, y, w, h], label, side, dim }) {
    const { s, safe } = this;
    const parts = [];
    if (dim) {
      const r = 8;
      parts.push(el('path', {
        d: `M${num(safe.x)} ${num(safe.y)}h${num(safe.w)}v${num(safe.h)}h${num(-safe.w)}z`
          + `M${num(x + r)} ${num(y)}h${num(w - 2 * r)}a${r} ${r} 0 0 1 ${r} ${r}v${num(h - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${r}h${num(-(w - 2 * r))}a${r} ${r} 0 0 1 ${-r} ${-r}v${num(-(h - 2 * r))}a${r} ${r} 0 0 1 ${r} ${-r}z`,
        fill: '#000', 'fill-opacity': 0.5, 'fill-rule': 'evenodd',
      }));
    }
    parts.push(el('rect', { x, y, width: w, height: h, rx: 8, fill: GREEN, 'fill-opacity': 0.08, stroke: GREEN, 'stroke-width': 3 }));
    if (label) {
      const lw = Math.round(label.length * 8.6 + 28);
      const lh = 30;
      const room = { below: safe.y + safe.h - (y + h), above: y - safe.y, right: safe.x + safe.w - (x + w), left: x - safe.x };
      const pick = side !== 'auto' ? side
        : room.below >= lh + 14 ? 'below' : room.above >= lh + 14 ? 'above' : room.right >= lw + 14 ? 'right' : 'left';
      let lx = pick === 'right' ? x + w + 12 : pick === 'left' ? x - lw - 12 : x + w / 2 - lw / 2;
      let ly = pick === 'below' ? y + h + 12 : pick === 'above' ? y - lh - 12 : y + h / 2 - lh / 2;
      lx = clamp(lx, safe.x + 8, safe.x + safe.w - lw - 8);
      ly = clamp(ly, safe.y + 8, safe.y + safe.h - lh - 8);
      parts.push(el('rect', { x: lx, y: ly, width: lw, height: lh, rx: 15, fill: GREEN }),
        s.text(label, { x: lx + lw / 2, y: ly + 20, font: 'semi', size: 15, fill: GREEN_INK, anchor: 'middle' }));
    }
    return s.anim(g({}, parts), [[0, { opacity: 0 }], [from, { opacity: 0 }, 'step'], [from + 0.25, { opacity: 1 }], [to - 0.2, { opacity: 1 }], [to, { opacity: 0 }]]);
  }

  cursor() {
    const { s } = this;
    if (!this.pointer.length) return null;
    const hide = { x: this.safe.x + this.safe.w + 40, y: this.safe.y + this.safe.h / 2 };
    const keys = [[0, hide]];
    const ripples = [];
    for (const k of this.pointer) {
      keys.push([k.t, k.p, k.ease]);
      if (k.click) {
        keys.push([k.t - 0.12, { ...k.p, scale: 0.85 }, 'step'], [k.t + 0.05, { ...k.p, scale: 1 }, 'step']);
        ripples.push(s.anim(el('circle', { r: 18, fill: 'none', stroke: GREEN, 'stroke-width': 3 }),
          [[0, { ...k.p, scale: 0.2, opacity: 0 }], [k.t, { scale: 0.2, opacity: 0 }, 'step'], [k.t + 0.02, { scale: 0.3, opacity: 1 }, 'step'], [k.t + 0.5, { scale: 1.6, opacity: 0 }, 'out']]));
      }
    }
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
    return g({}, ...ripples, s.anim(arrow, keys.map(([t, p, e]) => [Math.min(Math.max(t, 0), s.loop), p, e])));
  }
}
