// What GitHub (and any <img>) will and will not run, checked before a scene
// ships. Each problem is one readable line.
const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-monospace']);

export function check(svg, { maxBytes = 800_000 } = {}) {
  const problems = [];
  const bytes = Buffer.byteLength(svg);
  if (bytes > maxBytes) problems.push(`${(bytes / 1000).toFixed(0)} KB is over the ${(maxBytes / 1000).toFixed(0)} KB budget`);

  if (/<script\b/i.test(svg)) problems.push('has a <script>: GitHub strips it');
  if (/\son[a-z]+\s*=/i.test(svg)) problems.push('has an on* event attribute: GitHub strips it');
  if (/<foreignObject\b/i.test(svg)) problems.push('has a <foreignObject>: it does not render in an <img>');
  if (/@import\b/i.test(svg)) problems.push('has an @import: an <img> loads nothing from outside');
  for (const m of svg.matchAll(/(?:href\s*=\s*["']|url\(\s*["']?)(?!#|data:)([^"')\s]+)/gi)) {
    problems.push(`refers to ${m[1]}: an <img> loads nothing from outside`);
  }

  const root = svg.match(/<svg\b[^>]*>/)?.[0] ?? '';
  if (!/\sviewBox="/.test(root)) problems.push('the root has no viewBox');
  if (!/\srole="img"/.test(root) || !/\saria-label="[^"]+"/.test(root)) problems.push('the root needs role="img" and an aria-label');
  if (!/<title>[^<]+<\/title>/.test(svg)) problems.push('has no <title>');

  const loop = Number(root.match(/\sdata-loop="([\d.]+)"/)?.[1]);
  for (const m of svg.matchAll(/animation:\s*([\w-]+)\s+([\d.]+)s/g)) {
    const period = Number(m[2]);
    if (loop && +(loop / period).toFixed(6) % 1 !== 0) {
      problems.push(`${m[1]} runs every ${period}s, which does not divide the ${loop}s loop`);
    }
  }

  const faces = new Set([...svg.matchAll(/@font-face\{font-family:'([^']+)'/g)].map((m) => m[1]));
  for (const m of svg.matchAll(/font-family="([^",]+)/g)) {
    const fam = m[1].trim().replace(/^['"]|['"]$/g, '');
    if (!faces.has(fam) && !GENERIC.has(fam)) problems.push(`font ${fam} is not embedded`);
  }
  return [...new Set(problems)];
}
