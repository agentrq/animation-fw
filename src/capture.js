// Screenshots of a real app for a video: each shot is a page in some state,
// saved as a lossless WebP, with the boxes of the parts a video points at
// (its "regions"), so a scene frames and labels them by name instead of by
// measured pixels. Everything goes in one folder with a manifest.json:
//
//   { viewport: { width, height }, scale, shots: { <name>: { file, route, width, height, regions: { <key>: [x, y, w, h] } } } }
//
// Region boxes are in CSS pixels of the viewport; the image is `scale` times larger.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

// Motion frozen at a readable frame, no caret, no transitions mid-way.
export const FREEZE_CSS = [
  '*, *::before, *::after { caret-color: transparent !important; transition: none !important; animation-play-state: paused !important; }',
  '.animate-pulse { animation: none !important; opacity: 1 !important; }',
  '.animate-ping { animation-delay: -0.35s !important; }',
].join('\n');

const round = (n) => Math.round(n * 10) / 10;

// A region given as a selector string, { sel, nth, pad, optional }, or a fixed [x, y, w, h].
// An optional region missing from the page is left out instead of failing the shot.
export function regionSpec(spec) {
  if (Array.isArray(spec)) return { box: spec };
  if (typeof spec === 'string') return { sel: spec, nth: 0, pad: 0 };
  return { nth: 0, pad: 0, ...spec };
}

// The manifest as JSON with each box on one line, so a re-shoot's diff reads by region.
export function formatManifest(manifest) {
  return `${JSON.stringify(manifest, null, 1).replace(/\[\s*(-?[\d.]+(?:,\s*-?[\d.]+)*)\s*\]/g, (_, nums) => `[${nums.split(/,\s*/).join(', ')}]`)}\n`;
}

// Sets each storage pair before any page script runs. A string, not a function:
// it runs in the browser, never here.
const storageScript = (pairs) => `for (const [k, v] of Object.entries(${JSON.stringify(pairs)})) {
  try { localStorage.setItem(k, v); } catch { /* an opaque origin has no storage */ }
}`;

export function readManifest(dir) {
  const file = path.join(dir, 'manifest.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { shots: {} };
}

async function act(page, a, baseURL) {
  const loc = (sel, nth = 0) => page.locator(sel).nth(nth);
  if (a.goto !== undefined) await page.goto(new URL(a.goto, baseURL).href, { waitUntil: 'networkidle' });
  else if (a.click) await loc(a.click, a.nth).click();
  else if (a.fill) await loc(a.fill, a.nth).fill(a.text);
  else if (a.type) await loc(a.type, a.nth).pressSequentially(a.text, { delay: a.delay ?? 0 });
  else if (a.hover) await loc(a.hover, a.nth).hover();
  else if (a.press) await page.keyboard.press(a.press);
  else if (a.eval) await page.evaluate(a.eval, a.arg);
  else if (a.waitFor) await loc(a.waitFor, a.nth).waitFor();
  else if (a.wait === undefined) throw new Error(`unknown action ${JSON.stringify(a)}`);
  await page.waitForTimeout(a.wait ?? 150);
}

// Opens one browser page for a run of shots, so state (a signed-in session, an
// open menu) carries from one shot to the next. close() writes the manifest,
// merged into the one already in outDir.
export async function openShooter({
  baseURL, outDir, viewport = { width: 1440, height: 810 }, scale = 3, colorScheme = 'dark',
  cookies = [], storage = {}, css = FREEZE_CSS, settle = 600, launch = (o) => chromium.launch(o), log = () => {},
}) {
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = readManifest(outDir);
  Object.assign(manifest, { viewport, scale });
  const browser = await launch();
  const context = await browser.newContext({ viewport, deviceScaleFactor: scale, colorScheme });
  if (cookies.length) await context.addCookies(cookies);
  await context.addInitScript({ content: storageScript(storage) });
  const page = await context.newPage();

  async function shoot({ name, route, actions = [], regions = {}, wait = settle, mouse = [viewport.width - 1, viewport.height - 1] }) {
    if (!name) throw new Error('a shot needs a name');
    if (route !== undefined) await page.goto(new URL(route, baseURL).href, { waitUntil: 'networkidle' });
    for (const a of actions) await act(page, a, baseURL);
    if (css) await page.addStyleTag({ content: css });
    if (mouse) await page.mouse.move(...mouse);
    await page.waitForTimeout(wait);
    const boxes = {};
    for (const [key, spec] of Object.entries(regions)) {
      const r = regionSpec(spec);
      if (r.box) { boxes[key] = r.box; continue; }
      const b = await page.locator(r.sel).nth(r.nth).boundingBox({ timeout: 2000 }).catch(() => null);
      if (!b && r.optional) continue;
      if (!b) throw new Error(`${name}: region "${key}" (${r.sel}) is not on the page`);
      boxes[key] = [round(b.x - r.pad), round(b.y - r.pad), round(b.width + 2 * r.pad), round(b.height + 2 * r.pad)];
    }
    const file = `${name}.webp`;
    const png = await page.screenshot({ type: 'png' });
    const info = await sharp(png).webp({ lossless: true, effort: 4 }).toFile(path.join(outDir, file));
    manifest.shots[name] = { file, route: new URL(page.url()).pathname, width: info.width, height: info.height, regions: boxes };
    log(`shot ${name} (${(info.size / 1024).toFixed(0)} KB)`);
    return manifest.shots[name];
  }

  async function close() {
    await browser.close();
    fs.writeFileSync(path.join(outDir, 'manifest.json'), formatManifest(manifest));
    return manifest;
  }

  return { page, shoot, close, manifest };
}
