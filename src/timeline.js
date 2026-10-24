import { num } from './svg.js';

// A track is a list of [seconds, props, ease?]. Props carry forward, so a key
// names only what changes. `ease` shapes the segment that *arrives* at the
// key: 'step' holds the previous value and jumps at that second.
//
// x, y, scale, rotate become one transform; any other prop is written as the
// CSS property of the same name (opacity, fill, ...).
const TRANSFORM = { x: 0, y: 0, rotate: 0, scale: 1 };

const EASE = {
  step: 'steps(1,end)',
  linear: 'linear',
  in: 'cubic-bezier(.5,0,1,1)',
  out: 'cubic-bezier(0,0,.5,1)',
  inOut: 'cubic-bezier(.6,0,.4,1)',
  back: 'cubic-bezier(.3,1.6,.6,1)',
};

export const easing = (e) => EASE[e ?? 'linear'] ?? e;

// Every stop names the same list of functions, or the browser falls back to
// interpolating matrices.
const transform = (s) =>
  `translate(${num(s.x)}px,${num(s.y)}px) rotate(${num(s.rotate)}deg) scale(${num(s.scale)})`;

function declarations(s, usesTransform) {
  const out = [];
  if (usesTransform) out.push(`transform:${transform(s)}`);
  for (const [k, v] of Object.entries(s)) {
    if (k in TRANSFORM) continue;
    out.push(`${k}:${typeof v === 'number' ? num(v) : v}`);
  }
  return out.join(';');
}

// Merge keys at the same second, sort, and check they fit the period.
export function normalize(keys, period) {
  const byT = new Map();
  for (const [t, props = {}, ease] of keys) {
    if (!(t >= 0 && t <= period)) throw new Error(`key at ${t}s is outside the ${period}s period`);
    const k = byT.get(t) ?? { t, props: {}, ease: undefined };
    Object.assign(k.props, props);
    k.ease = ease ?? k.ease;
    byT.set(t, k);
  }
  return [...byT.values()].sort((a, b) => a.t - b.t);
}

export function keyframes(name, keys, period) {
  const ks = normalize(keys, period);
  if (!ks.length) throw new Error(`${name}: a track needs at least one key`);
  const names = new Set(ks.flatMap((k) => Object.keys(k.props)));
  const usesTransform = [...names].some((n) => n in TRANSFORM);

  // A prop first named late holds its first value from the start.
  let state = {};
  for (const n of names) {
    state[n] = n in TRANSFORM ? TRANSFORM[n] : ks.find((k) => n in k.props).props[n];
  }
  if (usesTransform) state = { ...TRANSFORM, ...state };

  const stops = [];
  for (const k of ks) {
    state = { ...state, ...k.props };
    if (stops.length) stops[stops.length - 1].ease = easing(k.ease);
    stops.push({ t: k.t, state, ease: 'linear' });
  }
  if (stops[0].t > 0) stops.unshift({ ...stops[0], t: 0, ease: 'steps(1,end)' });
  if (stops.at(-1).t < period) stops.push({ ...stops.at(-1), t: period });

  const pct = (t) => `${+((t / period) * 100).toFixed(4)}%`;
  const body = stops.map((s, i) => {
    const ease = i < stops.length - 1 && s.ease !== 'linear' ? `;animation-timing-function:${s.ease}` : '';
    return `${pct(s.t)}{${declarations(s.state, usesTransform)}${ease}}`;
  }).join('');
  return `@keyframes ${name}{${body}}`;
}

// Repeat a short track `times` times across a longer period, so one loop
// can hold several blinks without a second animation clock.
export function repeat(keys, every, times) {
  const out = [];
  for (let i = 0; i < times; i++) for (const [t, p, e] of keys) out.push([t + i * every, p, e]);
  return out;
}
