// A short of "Agent cards" (videos/agent-cards.js): charts. About a minute and a half,
// vertical, over the same real screens: Ada asks how many blog posts went out this
// year, the agent answers with a bar chart drawn in the app's own style (dark and
// light), a heatmap of the agentrq commits in November, and tabs that turn the same
// data into a line.
// Build: node bin/video.js videos/shorts/agent-cards-charts-short.js --size 1080x1920
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTimeline, beatsById } from '../lib.js';
import { loadShots } from '../screen.js';
import { shortScene, shortScreen, screenFrame, shortCaptions, shortChips, shortCards, moved, crowd, endArt, retime } from '../short.js';
import { artNumbers, artPromise } from '../agent-cards.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'agent-cards-charts-short.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, '../screens/agent-cards');

// The long video's art, timed to this short's words: the numbers land on "nine numbers",
// the question on "busiest", and the five kinds of card on the promise.
const HOOK = { 'chart-pain:0.8': 1.6, 'chart-pain:1.6': 2.4, 'chart-pain:3.4': 3.6 };
export const PROMISE = { 'promise:4.4': 2.6, 'promise:5': 3.0, 'promise:5.7': 3.4, 'promise:6.4': 3.8, 'promise:7.1': 4.2 };

// Frames in CSS px of a 1440x810 shot: about 420 px of a row, or the whole card.
const CLOSE = [672, 222, 420, 355]; // a card's title and its left side
const RIGHT = [990, 222, 410, 346]; // a card's right side
const RIGHT_LOW = [990, 260, 410, 346]; // its chart's right side
const WIDE = [668, 215, 740, 625]; // the whole card
const CTITLE = [686, 229, 240, 26];

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);
  const s = shortScene({
    tl,
    poster: at('bar', 4.4),
    thumbnail: at('bar', 4.4),
    description: 'A vertical short of AgentRQ agent cards (A2UI) over real screens of the app: Ada asks the docs agent how many blog posts went out this year, the agent answers with a bar chart drawn in the app\'s own style, dark and light, then a heatmap of the 190 agentrq commits in November with 31 on the busiest day, and tabs that turn the same data into a line with 618 commits in September.',
  });

  shortCards(s, [
    { span: [0, end('hook')], kicker: 'DOCS AGENT, A REPLY', headline: ['Nine numbers.', 'One sentence.'], mark: 1, sub: 'Which month was the busiest?',
      art: (sc, y) => moved(artNumbers(sc, retime(at, 'hook', HOOK)), y) },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ + A2UI', headline: ['Agents answer', 'with cards.'], mark: 1, sub: 'Built on A2UI, the open standard.',
      art: (sc, y) => moved(artPromise(sc, retime(at, 'promise', PROMISE)), y) },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Read it', 'at a glance.'], mark: 1, sub: 'Charts, right in the task thread.',
      art: (sc, y) => endArt(sc, y, { question: 'What should your agent chart?', line: 'Free during beta. Open source.' }) },
  ]);
  crowd(s, ['claude', 'codex', 'agy'], { y: 740, spans: [[start('cta'), tl.end]], hops: [at('cta', 1), at('cta', 1.2), at('cta', 1.4)], gap: 150 });

  const sc = shortScreen(s, loadShots(SHOTS));

  // 01 A plain question
  sc.show('what-ask', start('ask'), { fade: 0 }).cut(start('ask'), [318, 196, 450, 380]);
  sc.callout(at('ask', 0.6), at('ask', 2.6), [329, 230, 250, 26], { label: 'a task for the docs agent', side: 'above' });
  sc.callout(at('ask', 2.8), end('ask') - 0.3, [329, 258, 430, 40], { label: 'a plain question', side: 'below' });

  // 02 A bar chart, in the app's own style
  sc.show('what-card', start('bar'), { fade: 0.3 }).cut(start('bar'), CLOSE);
  sc.callout(at('bar', 0.9), at('bar', 2.3), CTITLE, { label: 'a card', side: 'right' });
  sc.callout(at('bar', 2.4), at('bar', 3.9), [686, 263, 316, 20], { label: '65 posts', side: 'below' });
  sc.look(at('bar', 4.0), RIGHT_LOW, { dur: 0.4 });
  sc.callout(at('bar', 4.5), end('bar') - 0.3, [1312, 336, 52, 108], { label: 'November: 14', side: 'left' });
  sc.look(start('light'), WIDE, { dur: 0.5 });
  sc.callout(at('light', 0.7), at('light', 3.4), [686, 336, 680, 110], { label: 'its own parts and style', side: 'above' });
  sc.show('what-card-light', at('light', 3.5), { fade: 0.3 });
  sc.callout(at('light', 3.9), end('light') - 0.3, [686, 336, 680, 110], { label: 'light', side: 'above' });

  // 03 A heatmap, then tabs and a line
  sc.show('chart-heat', start('heat'), { fade: 0.3 }).cut(start('heat'), WIDE);
  sc.callout(at('heat', 0.7), at('heat', 3.2), [686, 352, 700, 180], { label: 'a heatmap: a value per day', side: 'above' });
  sc.look(at('heat', 3.3), CLOSE, { dur: 0.4 });
  sc.callout(at('heat', 3.9), end('heat') - 0.3, [686, 263, 284, 20], { label: '190 in November', side: 'below' });
  sc.look(start('heat-top'), RIGHT, { dur: 0.4 });
  sc.callout(at('heat-top', 0.8), end('heat-top') - 0.3, [1210, 397, 166, 18], { label: 'Nov 23: 31', side: 'below' });
  sc.look(start('tabs'), CLOSE, { dur: 0.4 });
  sc.callout(at('tabs', 0.7), at('tabs', 2.2), [763, 296, 180, 24], { label: 'tabs', side: 'below' });
  sc.click(at('tabs', 2.9), { region: 'tab' });
  sc.show('chart-line', at('tabs', 3.2), { fade: 0.2 }).away(at('tabs', 3.3)).cut(at('tabs', 3.2), WIDE);
  sc.callout(at('tabs', 3.7), end('tabs') - 0.3, [686, 330, 700, 200], { label: 'the same data, as a line', side: 'above' });
  sc.look(start('line'), RIGHT_LOW, { dur: 0.4 });
  sc.callout(at('line', 0.8), end('line') - 0.3, [1150, 362, 60, 36], { label: 'September: 618', side: 'above' });

  // 04 Checked first
  sc.show('what-card', start('check'), { fade: 0.3 }).cut(start('check'), CLOSE);
  sc.callout(at('check', 0.7), at('check', 2.8), CTITLE, { label: 'checked before it posts', side: 'below' });
  sc.callout(at('check', 3.0), end('check') - 0.3, CTITLE, { label: 'a broken one: back to the agent', side: 'below' });

  const on = [[start('ask'), end('check')]];
  sc.visible(on).build();
  screenFrame(s, on);
  shortChips(s, [['01 / ASK', 'ask', 'ask'], ['02 / BARS', 'bar', 'light'], ['03 / HEATMAP, TABS', 'heat', 'line'], ['04 / CHECKED', 'check', 'check']]
    .map(([label, a, z]) => [label, start(a), end(z)]));
  shortCaptions(s, tl);
  return s;
};
