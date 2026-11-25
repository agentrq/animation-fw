// A short of "Agent cards" (videos/agent-cards.js): live cards. About a minute and a
// half, vertical, over the same real screens: the agent builds and checks the website
// with one card that it edits after every step (queued, 2 of 4, all four done in 15 s),
// with no notification per update, and the checks' report as a card.
// Build: node bin/video.js videos/shorts/agent-cards-live-short.js --size 1080x1920
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTimeline, beatsById } from '../lib.js';
import { loadShots } from '../screen.js';
import { shortScene, shortScreen, screenFrame, shortCaptions, shortChips, shortCards, moved, crowd, endArt, retime } from '../short.js';
import { artSpam, artPromise } from '../agent-cards.js';
import { PROMISE } from './agent-cards-charts-short.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'agent-cards-live-short.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, '../screens/agent-cards');

// The long video's stream of updates, landing as the voice says "drown".
const HOOK = Object.fromEntries([0, 1, 2, 3, 4, 5].map((i) => [`live-pain:${0.3 + i * 0.35}`, 4.4 + i * 0.3]).concat([['live-pain:2.8', 6.2]]));

const CLOSE = [672, 215, 420, 355]; // the card's title and its steps
const WIDE = [668, 215, 740, 625]; // the whole card, with its chart
const L_TITLE = [686, 223, 205, 26];

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);
  const s = shortScene({
    tl,
    poster: at('run', 4.0),
    thumbnail: at('run', 4.0),
    description: 'A vertical short of AgentRQ agent cards (A2UI) over real screens of the app: Ada asks the agent to build and check the website with a live card, the agent posts one card with four queued steps and edits it after every step (2 of 4, then all four done in 15 seconds, the chart filling in), with no notification per update, and the checks come back as a card with the lint warnings marked.',
  });

  shortCards(s, [
    { span: [0, end('hook')], kicker: 'LONG JOBS', headline: ['Wait in the dark,', 'or drown.'], mark: 1, sub: 'One message for every step.',
      art: (sc, y) => moved(artSpam(sc, retime(at, 'hook', HOOK)), y) },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ + A2UI', headline: ['One card that', 'moves.'], mark: 1, sub: 'Built on A2UI, the open standard.',
      art: (sc, y) => moved(artPromise(sc, retime(at, 'promise', PROMISE)), y) },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Watch it', 'happen.'], mark: 1, sub: 'Live cards, in the task thread.',
      art: (sc, y) => endArt(sc, y, { question: 'What long job would you watch?', line: 'Free during beta. Open source.' }) },
  ]);
  crowd(s, ['claude', 'codex', 'agy'], { y: 740, spans: [[start('cta'), tl.end]], hops: [at('cta', 1), at('cta', 1.2), at('cta', 1.4)], gap: 150 });

  const sc = shortScreen(s, loadShots(SHOTS));

  // 01 One card
  sc.show('live-queued', start('start'), { fade: 0 }).cut(start('start'), WIDE);
  sc.look(at('start', 1.0), CLOSE, { dur: 0.6 });
  sc.callout(at('start', 2.2), end('start') - 0.3, L_TITLE, { label: 'a live card', side: 'right' });
  sc.callout(at('queued', 0.8), at('queued', 2.3), L_TITLE, { label: 'one card', side: 'right' });
  sc.callout(at('queued', 2.4), at('queued', 4.0), [686, 307, 150, 126], { label: 'four steps, queued', side: 'right' });
  sc.look(at('queued', 4.1), WIDE, { dur: 0.4 });
  sc.callout(at('queued', 4.6), end('queued') - 0.3, [686, 440, 700, 196], { label: 'an empty chart', side: 'above' });

  // 02 Edited after every step
  sc.show('live-running', start('run'), { fade: 0.25 }).cut(start('run'), CLOSE);
  sc.callout(at('run', 0.8), at('run', 3.0), L_TITLE, { label: 'the same card: 2/4', side: 'right' });
  sc.callout(at('run', 3.1), end('run') - 0.3, [686, 307, 150, 56], { label: 'install, build: 5 s', side: 'right' });
  sc.callout(at('tests', 0.8), at('tests', 2.6), [686, 374, 145, 24], { label: 'tests: running', side: 'right' });
  sc.look(at('tests', 2.7), WIDE, { dur: 0.4 });
  sc.callout(at('tests', 3.2), end('tests') - 0.3, [686, 440, 700, 196], { label: 'the chart fills in', side: 'above' });
  sc.show('live-done', start('done'), { fade: 0.25 }).cut(start('done'), CLOSE);
  sc.callout(at('done', 0.8), at('done', 2.8), [686, 258, 126, 18], { label: 'done in 15 s', side: 'right' });
  sc.callout(at('done', 2.9), end('done') - 0.3, [686, 307, 150, 126], { label: 'all four done', side: 'right' });
  sc.callout(at('quiet', 0.5), at('quiet', 2.6), L_TITLE, { label: 'an edit, not a message', side: 'below' });
  sc.callout(at('quiet', 2.7), end('quiet') - 0.3, L_TITLE, { label: 'no notification', side: 'below' });

  // 03 The report, as a card
  sc.show('stat-checks', start('report'), { fade: 0.3 }).cut(start('report'), [672, 222, 420, 355]);
  sc.callout(at('report', 0.6), at('report', 2.4), [686, 229, 160, 26], { label: 'the checks, as a card', side: 'below' });
  sc.callout(at('report', 2.5), at('report', 3.8), [686, 314, 330, 58], { label: 'pass', side: 'right' });
  sc.callout(at('report', 3.9), end('report') - 0.3, [686, 380, 320, 24], { label: '304 warnings', side: 'below' });

  const on = [[start('start'), end('report')]];
  sc.visible(on).build();
  screenFrame(s, on);
  shortChips(s, [['01 / ONE CARD', 'start', 'queued'], ['02 / LIVE', 'run', 'quiet'], ['03 / THE REPORT', 'report', 'report']].map(([label, a, z]) => [label, start(a), end(z)]));
  shortCaptions(s, tl);
  return s;
};
