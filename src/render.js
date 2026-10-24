import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

// PNGs of the scene at the given seconds. Every animation is paused and set
// to the same moment, so a frame is exact rather than a lucky screenshot.
export async function frames(svgPath, times, { width, height } = {}) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(pathToFileURL(svgPath).href);
    // A pause completes a frame later and then sets its own time, undoing a
    // seek made before it: pause everything once and wait for that.
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(document.getAnimations().map((a) => { a.pause(); return a.ready; }));
    });
    const out = [];
    for (const t of times) {
      await page.evaluate((ms) => {
        for (const a of document.getAnimations()) a.currentTime = ms;
      }, t * 1000);
      out.push(await page.screenshot({ type: 'png' }));
    }
    return out;
  } finally {
    await browser.close();
  }
}

export async function gif(pngs, { fps = 10, width = 600 } = {}) {
  const resized = await Promise.all(pngs.map((p) => sharp(p).resize({ width }).png().toBuffer()));
  return sharp(resized, { join: { animated: true } })
    .gif({ delay: Math.round(1000 / fps), loop: 0, colours: 128, effort: 7 })
    .toBuffer();
}

// One image of labelled frames, for reviewing a whole loop at a glance.
export async function sheet(pngs, times, { cols = 2, width = 600 } = {}) {
  const tiles = await Promise.all(pngs.map((p) => sharp(p).resize({ width }).png().toBuffer()));
  const { height } = await sharp(tiles[0]).metadata();
  const label = 22;
  const rows = Math.ceil(tiles.length / cols);
  const composite = tiles.flatMap((input, i) => {
    const left = (i % cols) * width;
    const top = Math.floor(i / cols) * (height + label);
    const tag = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${label}">`
      + `<text x="6" y="16" font-family="monospace" font-size="13" fill="#a1a1aa">t = ${times[i].toFixed(1)}s</text></svg>`);
    return [{ input: tag, left, top }, { input, left, top: top + label }];
  });
  return sharp({ create: { width: cols * width, height: rows * (height + label), channels: 3, background: '#09090b' } })
    .composite(composite).png().toBuffer();
}
