// AgentRQ's own task-title model, as a vertical short of about a minute and forty
// seconds, told over real screens of the app: Ada types a task in storefront and the
// sparkle writes its title, a chatty request gets a short one too, and a task created
// with no title shows as Untitled until the browser names it in the background. Every
// title on screen was written by the model, in the browser, when the shots were taken
// (src/capture.js against a local AgentRQ). Cards carry the rest: the hook, the
// promise, the model's own card and its score next to FLAN-T5-base.
// Build: node bin/video.js videos/shorts/task-title-model-short.js --size 1080x1920
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { el, g } from '../../src/index.js';
import { C } from '../../kit/agentrq.js';
import { loadTimeline, beatsById } from '../lib.js';
import { loadShots } from '../screen.js';
import { pane, tagChip, from } from '../house.js';
import { shortScene, shortScreen, screenFrame, shortCaptions, shortChips, shortCards, crowd, endArt, PAD, SW } from '../short.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'task-title-model-short.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, '../screens/task-title-model');

const X = PAD;
const W = SW - 2 * PAD;
const strike = (s, x, y, w, t) => from(s, el('rect', { x, y, width: w, height: 3, fill: C.blocked, class: 'px' }), t);
const tile = (s, x, y, w, kind, line, t, color = C.lit) => from(s, g({},
  el('rect', { x, y, width: w, height: 76, fill: C.panel, stroke: color, 'stroke-width': 2, class: 'px' }),
  s.text(kind, { x: x + 18, y: y + 30, font: 'pixel', size: 15, fill: color }),
  s.text(line, { x: x + 18, y: y + 58, font: 'body', size: 19, fill: C.text })), t);

// The hook: a title box, three tries at a name, each crossed out.
function artNaming(s, y, at) {
  const tries = [['Coupon bug', 1.0], ['Fix removeCoupon total', 1.9], ['Checkout: coupon remov', 2.8]];
  return g({},
    pane(s, { x: X, y, w: W, h: 230, title: 'TASK TITLE', color: C.dim }),
    ...tries.map(([text, o], i) => g({},
      from(s, s.text(text, { x: X + 26, y: y + 66 + i * 54, font: 'mono', size: 24, fill: C.text }), at('hook', o)),
      strike(s, X + 22, y + 58 + i * 54, text.length * 14.5 + 8, at('hook', o + 0.6)))),
    from(s, tagChip(s, 'longer than the task', { x: X + 26, y: y + 250, fill: C.ask }), at('hook', 4.7)));
}

// The promise: a task with its title written, and where that happens.
function artPromise(s, y, at) {
  return g({},
    pane(s, { x: X, y, w: W, h: 190, title: 'STOREFRONT · NEW TASK', color: C.lit }),
    ...[560, 520, 300].map((w, i) => el('rect', { x: X + 22, y: y + 100 + i * 22, width: w, height: 10, fill: C.line, class: 'px' })),
    from(s, s.text('Fix checkout price after coupon removal', { x: X + 22, y: y + 70, font: 'semi', size: 22, fill: C.lit }), at('promise', 1.2)),
    from(s, tagChip(s, 'its own small model', { x: X, y: y + 214, fill: C.ask }), at('promise', 3.1)),
    from(s, tagChip(s, 'in your browser', { x: X + 270, y: y + 214, fill: C.ask }), at('promise', 5.2)));
}

// Its own model: made for one job, free to use.
function artOwn(s, y, at) {
  return g({},
    tile(s, X, y, W, 'AGENTRQ\'S OWN', 'Fine-tuned for one job: task titles', at('own', 1.6)),
    tile(s, X, y + 96, W, 'APACHE-2.0', 'Free for anyone to use', at('own', 5.8)),
    tile(s, X, y + 192, W, 'IN THE BROWSER', 'WebGPU, or WebAssembly', at('own', 7.0), C.dim));
}

// The score: good titles on 1,000 test tasks, next to FLAN-T5-base.
function artScore(s, y, at) {
  const bar = (label, pct, row, t, tv, color) => g({},
    from(s, s.text(label, { x: X, y: y + row * 120 + 24, font: 'semi', size: 24, fill: C.text }), t),
    from(s, el('rect', { x: X, y: y + row * 120 + 40, width: W, height: 46, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }), t),
    from(s, el('rect', { x: X + 4, y: y + row * 120 + 44, width: Math.round((W - 8) * pct / 100), height: 38, fill: color, class: 'px' }), tv),
    from(s, s.text(`${pct}%`, { x: X + W, y: y + row * 120 + 26, font: 'bold', size: 30, fill: color, anchor: 'end' }), tv));
  return g({},
    bar('AgentRQ title model', 98, 0, at('model', 0.5), at('model', 4.6), C.lit),
    bar('FLAN-T5-base', 75, 1, at('model', 6.1), at('model', 8.2), C.dim));
}

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);
  const s = shortScene({
    tl,
    poster: at('named', 1.5),
    thumbnail: at('named', 1.5),
    description: 'A vertical short of AgentRQ\'s own task-title model over real screens of the app: Ada types a task in storefront and clicks the sparkle, which titles it "Fix checkout price after coupon removal"; a chatty request becomes "Draft Acme renewal email"; and a task created with no title shows as Untitled until the browser names it "Rerun nightly S3 export" in the background. The model runs in the browser, so the task text never leaves the device. It is fine-tuned for this one job, Apache-2.0, and wrote a good title for 98% of 1,000 test tasks, where FLAN-T5-base managed 75%.',
  });

  shortCards(s, [
    { span: [0, end('hook')], kicker: 'NAMING TASKS IS A CHORE', headline: ['Every task', 'needs a title.'], mark: 1, sub: 'And naming it takes longer than the task.',
      art: (sc, y) => artNaming(sc, y, at) },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ', headline: ['Titles that', 'write themselves.'], mark: 1, sub: 'A small model, in your browser.',
      art: (sc, y) => artPromise(sc, y, at) },
    { span: [start('own'), end('own')], kicker: 'ITS OWN MODEL', headline: ['Made for', 'one job.'], mark: 1, sub: 'Fine-tuned by AgentRQ. Free to use.',
      art: (sc, y) => artOwn(sc, y, at) },
    { span: [start('model'), end('model')], kicker: 'ON 1,000 TEST TASKS', headline: ['A good title,', '98% of the time.'], mark: 1, sub: 'The same tasks, the same check.',
      art: (sc, y) => artScore(sc, y, at) },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Write the task.', 'Skip the title.'], mark: 1, sub: 'Named in your browser, privately.',
      art: (sc, y) => endArt(sc, y, { question: 'What would you hand off first?', line: 'Free during beta. Open source.' }) },
  ]);
  crowd(s, ['claude', 'codex', 'agy', 'hermes'], { y: 740, spans: [[start('cta'), tl.end]], hops: [at('cta', 1), at('cta', 1.2), at('cta', 1.4), at('cta', 1.6)], gap: 130 });

  const sc = shortScreen(s, loadShots(SHOTS));

  // The form's text runs 6.2 px a character in the description and 6.6 in the title,
  // from x 377 and 403; the list's new rows sit at y 280, 369 and 456.
  // 01 The sparkle
  sc.show('typed-1', start('typed'), { fade: 0 }).cut(start('typed'), [361, 225, 766, 200]);
  sc.look(at('typed', 1.0), [370, 250, 400, 50], { dur: 1.0 });
  sc.callout(at('typed', 2.3), at('typed', 3.9), [494, 270, 62, 20], { label: 'the old price', side: 'below' });
  sc.look(at('typed', 4.0), [720, 250, 400, 50], { dur: 0.6 });
  sc.callout(at('typed', 4.7), end('typed') - 0.2, [824, 270, 58, 20], { label: 'after a coupon', side: 'below' });
  sc.look(start('sparkle'), [740, 212, 390, 60], { dur: 0.5 });
  sc.callout(at('sparkle', 0.7), at('sparkle', 1.8), 'sparkle', { label: 'the sparkle', side: 'below' });
  sc.click(at('sparkle', 2.0), 'sparkle');
  sc.show('gen-1', at('sparkle', 2.2), { fade: 0.2 }).away(at('sparkle', 2.3));
  sc.show('named-1', start('named'), { fade: 0.3 }).look(start('named'), [385, 212, 420, 60], { dur: 0.5 });
  sc.callout(at('named', 0.7), at('named', 3.0), [399, 232, 266, 20], { label: 'its title', side: 'below' });
  sc.callout(at('named', 3.1), at('named', 4.4), [399, 232, 266, 20], { label: 'short', side: 'below' });
  sc.callout(at('named', 4.5), end('named') - 0.2, [567, 232, 98, 20], { label: 'the detail that matters', side: 'below' });

  sc.show('typed-2', start('second'), { fade: 0.3 }).cut(start('second'), [361, 225, 766, 200]);
  sc.look(at('second', 1.0), [366, 250, 400, 50], { dur: 1.0 });
  sc.callout(at('second', 2.3), at('second', 3.9), [374, 270, 300, 20], { label: 'a chatty request', side: 'below' });
  sc.look(at('second', 3.9), [740, 212, 390, 60], { dur: 0.5 });
  sc.click(at('second', 4.6), 'sparkle');
  sc.show('gen-2', at('second', 4.7), { fade: 0.2 }).away(at('second', 4.8));
  sc.show('named-2', at('second', 5.0), { fade: 0.25 }).look(at('second', 5.0), [385, 212, 420, 60], { dur: 0.5 });
  sc.callout(at('second', 5.6), end('second') - 0.2, [399, 232, 174, 20], { label: 'its title', side: 'below' });

  // 02 No title at all
  sc.show('typed-3', start('untitled'), { fade: 0.3 }).cut(start('untitled'), [380, 212, 500, 70]);
  sc.callout(at('untitled', 0.9), at('untitled', 2.2), [399, 232, 300, 20], { label: 'no title', side: 'below' });
  sc.show('untitled', at('untitled', 2.3), { fade: 0.3 }).cut(at('untitled', 2.3), [95, 230, 400, 300]);
  sc.callout(at('untitled', 2.6), at('untitled', 4.8), [100, 270, 345, 260], { label: 'created', side: 'right' });
  sc.look(at('untitled', 4.8), [95, 440, 380, 110], { dur: 0.5 });
  sc.callout(at('untitled', 5.4), end('untitled') - 0.2, 'row', { label: 'Untitled, for now', side: 'above' });
  sc.callout(at('auto', 0.2), at('auto', 3.5), 'row', { label: 'named in the browser', side: 'above' });
  sc.show('auto-named', at('auto', 3.6), { fade: 0.4 });
  sc.callout(at('auto', 4.0), end('auto') - 0.2, [109, 482, 160, 29], { label: 'Rerun nightly S3 export', side: 'above' });

  // 03 Private
  sc.look(start('private'), [95, 230, 400, 300], { dur: 0.7 });
  sc.callout(at('private', 0.8), at('private', 4.0), [100, 270, 345, 260], { label: 'no server call', side: 'right' });
  sc.callout(at('private', 4.1), end('private') - 0.3, [100, 270, 345, 260], { label: 'stays on your device', side: 'right' });

  const on = [[start('typed'), end('private')]];
  sc.visible(on).build();
  screenFrame(s, on);
  shortChips(s, [['01 / SPARKLE', 'typed', 'second'], ['02 / NO TITLE', 'untitled', 'auto'], ['03 / PRIVATE', 'private', 'private']]
    .map(([label, a, z]) => [label, start(a), end(z)]));
  shortCaptions(s, tl);
  return s;
};
