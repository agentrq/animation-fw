import { el, g, raw } from './svg.js';
import { keyframes } from './timeline.js';
import { subsetWoff2 } from './fonts.js';

const BASE_CSS = [
  '.px rect,rect.px{shape-rendering:crispEdges}',
  "text{font-variant-ligatures:none;font-feature-settings:'liga' 0,'calt' 0}",
].join('');

// One looping scene. Every animation runs on the scene's loop, or on a period
// that divides it, so the whole picture repeats as one.
export class Scene {
  constructor({ width, height, loop, description, background, poster = 0 }) {
    if (!description) throw new Error('a scene needs a description: it is the alt text');
    Object.assign(this, { width, height, loop, description, background, poster });
    this.fonts = new Map();
    this.css = [];
    this.defs = [];
    this.body = [];
    this.anims = 0;
  }

  // `name` is what text() refers to; `axes` pins a variable font's style.
  font(name, file, { axes = {}, fallback = 'sans-serif' } = {}) {
    this.fonts.set(name, { file, axes, fallback, chars: new Set() });
    return this;
  }

  text(str, { x = 0, y = 0, font, size = 16, fill = '#fff', anchor, spacing, ...attrs } = {}) {
    const f = this.fonts.get(font);
    if (!f) throw new Error(`text "${str}": font "${font}" is not registered`);
    for (const c of String(str)) f.chars.add(c);
    return el('text', {
      x, y, 'font-family': `F-${font},${f.fallback}`, 'font-size': size, fill,
      'text-anchor': anchor, 'letter-spacing': spacing, ...attrs,
    }, str);
  }

  // Wraps `content` in a group that follows `keys`. Draw the content at the
  // origin and give its position as x/y: the CSS transform replaces any
  // transform attribute on the same element.
  anim(content, keys, { period = this.loop, origin, ...attrs } = {}) {
    if (+(this.loop / period).toFixed(6) % 1 !== 0) {
      throw new Error(`a ${period}s period does not divide the ${this.loop}s loop`);
    }
    const name = `a${this.anims++}`;
    const box = origin ? `;transform-box:fill-box;transform-origin:${origin}` : '';
    this.css.push(keyframes(name, keys, period), `.${name}{animation:${name} ${period}s linear infinite${box}}`);
    return g({ class: `a ${name}`, ...attrs }, content);
  }

  add(...nodes) { this.body.push(...nodes); return this; }
  def(...nodes) { this.defs.push(...nodes); return this; }
  style(css) { this.css.push(css); return this; }

  fontFaces() {
    return [...this.fonts].filter(([, f]) => f.chars.size).map(([name, f]) => {
      const b64 = subsetWoff2(f.file, [...f.chars].join(''), f.axes);
      return `@font-face{font-family:'F-${name}';src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
    }).join('');
  }

  toSVG() {
    // With reduced motion, every clock stops on the poster frame.
    const still = `@media (prefers-reduced-motion:reduce){.a{animation-play-state:paused!important;animation-delay:-${this.poster}s!important}}`;
    const css = BASE_CSS + this.fontFaces() + this.css.join('') + still;
    const { width, height } = this;
    return String(el('svg', {
      xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${width} ${height}`, width, height,
      role: 'img', 'aria-label': this.description, 'data-loop': this.loop,
    },
    el('title', {}, this.description),
    el('defs', {}, el('style', {}, raw(css)), this.defs),
    this.background ? el('rect', { width, height, fill: this.background }) : null,
    this.body));
  }
}
