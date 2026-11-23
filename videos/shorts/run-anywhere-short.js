// The short of "AgentRQ, run your agents anywhere" (videos/run-anywhere.js): about
// a minute and a half, vertical, told over the same real screens. Ada's dev box
// enrolled in two commands and online, storefront's agent started from the
// browser (Claude Code, Opus, high effort) with its terminal live in the tab,
// a waiting task spun up into a fork with an agent of its own, a toast and push
// when an agent needs her, and Always Allow turning one yes into a rule.
// Build: node bin/video.js videos/shorts/run-anywhere-short.js --size 1080x1920
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTimeline, beatsById } from '../lib.js';
import { loadShots } from '../screen.js';
import { shortScene, shortScreen, screenFrame, shortCaptions, shortChips, shortCards, moved, crowd, endArt, retime } from '../short.js';
import { artLaptop, artPromise } from '../run-anywhere.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'run-anywhere-short.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, '../screens/run-anywhere');

// The long video's art, timed to this short's words: the laptop works from the first frame,
// the lid closes as the voice says so and "the work stops" lands on "work". The long
// video's afternoon (its pain line) comes after this card, so it never shows.
const HOOK = { 'hook:3.9': 3.9, 'hook:5': 4.9 };
const PROMISE = { 'promise:3': 2.1, 'promise:4.4': 3.6, 'promise:6.7': 4.3, 'promise:9.3': 4.6 };

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);
  const s = shortScene({
    tl,
    poster: at('start-term', 4.5),
    thumbnail: at('start-term', 4.5),
    description: 'A vertical short of running AgentRQ agents on any machine over real screens of the app: Ada enrolls her dev box with two commands and it comes online with its CPU and memory, starts Claude Code for storefront from the browser with Opus and high effort and watches its terminal live in the tab, spins a waiting task up into a fork with a second agent, gets a toast when billing needs a permission, turns on push, and turns one Always Allow into a rule that stays on the record.',
  });

  shortCards(s, [
    { span: [0, end('hook')], kicker: 'ONE LAPTOP, ONE TERMINAL', headline: ['Close the lid.', 'The work stops.'], mark: 1, sub: 'Your agents live on one laptop.',
      art: (sc, y) => moved(artLaptop(sc, retime(at, 'hook', HOOK, () => 7)), y) },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ', headline: ['Run them', 'anywhere.'], mark: 1, sub: 'Your machines, from the browser.',
      art: (sc, y) => moved(artPromise(sc, retime(at, 'promise', PROMISE)), y) },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Run your agents', 'anywhere.'], mark: 1, sub: 'On machines you own, from the browser.',
      art: (sc, y) => endArt(sc, y, { question: 'Where would you run your agents?', line: 'Free during beta. Open source.' }) },
  ]);
  crowd(s, ['claude', 'codex', 'agy', 'hermes'], { y: 740, spans: [[start('cta'), tl.end]], hops: [at('cta', 1), at('cta', 1.2), at('cta', 1.4), at('cta', 1.6)], gap: 130 });

  const sc = shortScreen(s, loadShots(SHOTS));

  // The camera frames about 340 px of a text row (k ~1.8) so a phone reads it; the mono
  // commands run 7.2 px a character. Rows and words measured with rows.cjs and wordx.cjs.
  // 01 Your own machines
  sc.show('mach-add', start('mach-add'), { fade: 0 }).cut(start('mach-add'), [108, 130, 340, 70]);
  sc.callout(at('mach-add', 0.8), at('mach-add', 2.9), [112, 141, 338, 44], { label: 'two commands', side: 'below' });
  sc.look(at('mach-add', 3.0), [150, 300, 420, 80], { dur: 0.5 });
  sc.callout(at('mach-add', 3.6), at('mach-add', 4.6), [160, 340, 402, 20], { label: 'install the daemon', side: 'below' });
  sc.look(at('mach-add', 4.65), [150, 385, 340, 70], { dur: 0.4 });
  sc.callout(at('mach-add', 5.0), at('mach-add', 5.7), [160, 414, 116, 20], { label: 'enroll it', side: 'below' });
  sc.look(at('mach-add', 5.75), [400, 385, 340, 70], { dur: 0.4 });
  sc.callout(at('mach-add', 6.1), end('mach-add') - 0.3, [504, 414, 130, 20], { label: 'a one-time code', side: 'below' });
  sc.show('mach-online', start('mach-online'), { fade: 0.3 }).cut(start('mach-online'), [100, 125, 340, 120]);
  sc.callout(at('mach-online', 0.6), at('mach-online', 2.2), [110, 162, 166, 20], { label: 'the daemon, connected', side: 'below' });
  sc.callout(at('mach-online', 2.4), at('mach-online', 4.0), [106, 138, 92, 26], { label: 'green', side: 'right' });
  sc.callout(at('mach-online', 4.2), end('mach-online') - 0.3, [108, 205, 175, 34], { label: 'CPU and memory', side: 'below' });

  // 02 Start it from the browser
  sc.show('start-offline', start('start-card'), { fade: 0.3 }).cut(start('start-card'), [690, 365, 500, 200]);
  sc.callout(at('start-card', 0.6), at('start-card', 2.0), [700, 378, 472, 44], { label: 'no agent', side: 'above' });
  sc.callout(at('start-card', 2.1), at('start-card', 3.2), 'start', { label: 'it offers one', side: 'below' });
  sc.click(at('start-card', 3.3), 'start');
  sc.show('start-card', at('start-card', 3.5), { fade: 0.25 }).away(at('start-card', 3.6)).cut(at('start-card', 3.5), [740, 335, 380, 100]);
  sc.callout(at('start-card', 3.8), at('start-card', 4.7), [786, 362, 128, 24], { label: 'its folder', side: 'below' });
  sc.callout(at('start-card', 4.8), end('start-card') - 0.3, [912, 362, 66, 24], { label: 'the dev box', side: 'below' });
  sc.show('start-pick', start('start-pick'), { fade: 0.3 }).cut(start('start-pick'), [735, 420, 410, 230]);
  sc.callout(at('start-pick', 0.6), at('start-pick', 1.9), 'kind', { label: 'Claude Code', side: 'right' });
  sc.callout(at('start-pick', 2.0), at('start-pick', 2.7), 'model', { label: 'Opus', side: 'above' });
  sc.callout(at('start-pick', 2.75), end('start-pick') - 0.2, 'effort', { label: 'high effort', side: 'below' });
  sc.look(start('start-term'), [735, 560, 410, 230], { dur: 0.4 });
  sc.click(at('start-term', 0.6), 'go');
  sc.show('term-1', at('start-term', 0.9), { fade: 0.25 }).away(at('start-term', 1.0)).cut(at('start-term', 0.9), [92, 110, 400, 150]);
  sc.callout(at('start-term', 1.3), at('start-term', 3.3), [95, 188, 206, 52], { label: 'Claude Code, on the dev box', side: 'below' });
  sc.callout(at('start-term', 3.5), end('start-term') - 0.3, [139, 122, 54, 18], { label: 'live, in the browser', side: 'right' });
  sc.show('term-4', start('start-live'), { fade: 0.3 }).cut(start('start-live'), [1005, 685, 420, 120]);
  sc.callout(at('start-live', 0.5), at('start-live', 2.0), [1016, 696, 400, 90], { label: 'agent connected', side: 'above' });
  sc.show('start-live', at('start-live', 2.1), { fade: 0.3 }).cut(at('start-live', 2.1), [92, 35, 340, 180]);
  sc.callout(at('start-live', 2.3), end('start-live') - 0.3, 'title', { label: 'green, ready for tasks', side: 'right' });
  sc.show('spin-row', start('spin'), { fade: 0.3 }).cut(start('spin'), [97, 420, 350, 110]);
  sc.callout(at('spin', 0.6), at('spin', 2.6), 'row', { label: 'a waiting task', side: 'below' });
  sc.click(at('spin', 2.8), 'btn');
  sc.show('spin-pop', at('spin', 3.0), { fade: 0.25 }).away(at('spin', 3.1)).cut(at('spin', 3.0), [530, 178, 380, 110]);
  sc.callout(at('spin', 3.4), at('spin', 4.7), [540, 210, 364, 40], { label: 'forks the workspace', side: 'below' });
  sc.show('spin-term-2', at('spin', 4.8), { fade: 0.3 }).cut(at('spin', 4.8), [1005, 685, 420, 120]);
  sc.callout(at('spin', 5.1), end('spin') - 0.3, [1016, 696, 400, 90], { label: 'a second agent', side: 'above' });

  // 03 Hear when they need you
  sc.show('note-toast', start('note'), { fade: 0.3 }).cut(start('note'), [1005, 655, 420, 150]);
  sc.callout(at('note', 0.8), at('note', 2.2), 'toast', { label: 'billing needs you', side: 'above' });
  sc.callout(at('note', 2.3), at('note', 3.7), 'toast', { label: 'on any page', side: 'above' });
  sc.show('note-settings', at('note', 3.8), { fade: 0.3 }).cut(at('note', 3.8), [345, 445, 500, 100]);
  sc.callout(at('note', 4.2), end('note') - 0.3, 'push', { label: 'push: tab closed too', side: 'below' });

  // 04 Let the safe work run
  sc.show('yolo-ask', start('yolo'), { fade: 0.3 }).cut(start('yolo'), [478, 340, 340, 230]);
  sc.callout(at('yolo', 0.8), at('yolo', 1.9), [502, 477, 226, 20], { label: 'work you trust', side: 'above' });
  sc.callout(at('yolo', 2.0), at('yolo', 2.9), 'always', { label: 'Always Allow', side: 'below' });
  sc.click(at('yolo', 3.0), 'always');
  sc.show('yolo-list', at('yolo', 3.2), { fade: 0.25 }).away(at('yolo', 3.3)).cut(at('yolo', 3.2), [350, 140, 340, 280]);
  sc.callout(at('yolo', 3.4), at('yolo', 4.5), [354, 374, 200, 38], { label: 'now a rule', side: 'below' });
  sc.show('yolo-record', at('yolo', 4.6), { fade: 0.3 }).cut(at('yolo', 4.6), [845, 378, 330, 175]);
  sc.callout(at('yolo', 4.9), end('yolo') - 0.3, [852, 476, 160, 18], { label: 'on the record', side: 'right' });

  const on = [[start('mach-add'), end('yolo')]];
  sc.visible(on).build();
  screenFrame(s, on);
  shortChips(s, [['01 / YOUR MACHINES', 'mach-add', 'mach-online'], ['02 / FROM THE BROWSER', 'start-card', 'spin'], ['03 / ALERTS', 'note', 'note'], ['04 / ALWAYS ALLOW', 'yolo', 'yolo']]
    .map(([label, a, z]) => [label, start(a), end(z)]));
  shortCaptions(s, tl);
  return s;
};
