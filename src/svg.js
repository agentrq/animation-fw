// Markup that is already safe to splice into the document. Everything else
// passed as a child is text, and is escaped.
export class Raw {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}

export const raw = (s) => new Raw(s);

export const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Two decimals is below a pixel at any size a README shows, and every digit
// is paid for once per keyframe.
export const num = (n) => (Number.isInteger(n) ? String(n) : String(+n.toFixed(2)));

export function el(tag, attrs = {}, ...children) {
  const a = Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(typeof v === 'number' ? num(v) : v)}"`))
    .join('');
  const body = children.flat(Infinity)
    .filter((c) => c !== undefined && c !== null && c !== false)
    .map((c) => (c instanceof Raw ? c.s : esc(c)))
    .join('');
  return raw(body ? `<${tag}${a}>${body}</${tag}>` : `<${tag}${a}/>`);
}

export const g = (attrs, ...children) => el('g', attrs, ...children);
