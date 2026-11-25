// A short of "Agent cards" (videos/agent-cards.js): buttons and forms. About a minute
// and a half, vertical, over the same real screens: the agent posts the voice of a new
// video with a player and three buttons, Ada clicks Schedule and it is posted as her
// reply, then the agent asks with a form (elicit) and gets every value back at once.
// Build: node bin/video.js videos/shorts/agent-cards-ask-short.js --size 1080x1920
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTimeline, beatsById } from '../lib.js';
import { loadShots } from '../screen.js';
import { shortScene, shortScreen, screenFrame, shortCaptions, shortChips, shortCards, moved, crowd, endArt, retime } from '../short.js';
import { artRounds, artPromise } from '../agent-cards.js';
import { PROMISE } from './agent-cards-charts-short.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'agent-cards-ask-short.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, '../screens/agent-cards');

// The long video's back and forth, one bubble per question as the voice asks it.
const HOOK = Object.fromEntries([3.0, 3.3, 3.6, 4.1, 4.7].map((t, i) => [`ask-pain:${0.4 + i * 0.45}`, t]).concat([['ask-pain:3', 5.4]]));

const CLOSE = [672, 222, 420, 355]; // a card's title and its left side
const RIGHT = [990, 340, 410, 346]; // the buttons and her reply
const FIELDS = [672, 262, 420, 355]; // the form's fields
const WIDE = [668, 215, 740, 625]; // the whole card

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);
  const s = shortScene({
    tl,
    poster: at('buttons', 6.0),
    thumbnail: at('buttons', 6.0),
    description: 'A vertical short of AgentRQ agent cards (A2UI) over real screens of the app: the agent posts a new video\'s voice with a player and three buttons, Ada clicks Schedule and it is posted as her reply, the card stays read only with her choice marked, then the agent asks with a form (a title, channels, a date and time, a slider and a checkbox), Ada picks LinkedIn and dev.to, and the agent gets every value at once.',
  });

  shortCards(s, [
    { span: [0, end('hook')], kicker: 'REPLY WITH A, B OR C', headline: ['Five rounds.', 'One plan.'], mark: 1, sub: 'Your agent asks. You type. Again.',
      art: (sc, y) => moved(artRounds(sc, retime(at, 'hook', HOOK)), y) },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ + A2UI', headline: ['Agents ask', 'with cards.'], mark: 1, sub: 'Built on A2UI, the open standard.',
      art: (sc, y) => moved(artPromise(sc, retime(at, 'promise', PROMISE)), y) },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Answer in', 'one click.'], mark: 1, sub: 'Buttons and forms, in the thread.',
      art: (sc, y) => endArt(sc, y, { question: 'What should it ask with a button?', line: 'Free during beta. Open source.' }) },
  ]);
  crowd(s, ['claude', 'codex', 'agy'], { y: 740, spans: [[start('cta'), tl.end]], hops: [at('cta', 1), at('cta', 1.2), at('cta', 1.4)], gap: 150 });

  const sc = shortScreen(s, loadShots(SHOTS));

  // 01 Buttons
  sc.show('ask-buttons', start('buttons'), { fade: 0 }).cut(start('buttons'), CLOSE);
  sc.callout(at('buttons', 0.8), at('buttons', 2.8), [686, 229, 236, 26], { label: 'the voice is ready', side: 'below' });
  sc.callout(at('buttons', 3.2), at('buttons', 5.3), [700, 326, 392, 30], { label: 'a player', side: 'below' });
  sc.look(at('buttons', 5.4), RIGHT, { dur: 0.4 });
  sc.callout(at('buttons', 5.9), end('buttons') - 0.3, [966, 388, 414, 34], { label: 'three buttons', side: 'below' });
  sc.callout(start('click'), at('click', 1.5), { region: 'sched' }, { label: 'Schedule Monday 09:00', side: 'below' });
  sc.click(at('click', 1.7), { region: 'sched' });
  sc.show('ask-clicked', at('click', 1.9), { fade: 0.2 }).away(at('click', 2.0));
  sc.callout(at('click', 2.5), end('click') - 0.3, [1215, 528, 172, 50], { label: 'posted as her reply', side: 'left' });
  sc.show('ask-done', start('done'), { fade: 0.3 }).cut(start('done'), [668, 450, 420, 355]);
  sc.callout(at('done', 0.6), at('done', 2.3), [670, 640, 300, 24], { label: 'the agent read it', side: 'above' });
  sc.look(at('done', 2.4), RIGHT, { dur: 0.4 });
  sc.callout(at('done', 2.9), end('done') - 0.3, [1178, 388, 202, 34], { label: 'read only, her choice', side: 'below' });

  // 02 A form
  sc.show('ask-form', start('form'), { fade: 0.3 }).cut(start('form'), WIDE);
  sc.look(at('form', 2.9), CLOSE, { dur: 0.5 });
  sc.callout(at('form', 3.5), end('form') - 0.3, [686, 229, 190, 26], { label: 'it asks, and waits', side: 'right' });
  sc.look(start('fields'), FIELDS, { dur: 0.4 });
  sc.callout(at('fields', 0.6), at('fields', 1.5), [686, 288, 400, 30], { label: 'a title', side: 'above' });
  sc.callout(at('fields', 1.6), at('fields', 2.5), [688, 354, 262, 24], { label: 'channels', side: 'right' });
  sc.callout(at('fields', 2.6), at('fields', 3.7), [686, 418, 400, 26], { label: 'date and time', side: 'above' });
  sc.callout(at('fields', 3.8), at('fields', 4.7), [686, 460, 400, 42], { label: 'a slider', side: 'above' });
  sc.callout(at('fields', 4.8), end('fields') - 0.3, [686, 509, 196, 22], { label: 'a checkbox', side: 'right' });
  sc.callout(at('guess', 0.6), at('guess', 2.7), [686, 288, 400, 30], { label: 'its best guess, filled in', side: 'above' });
  sc.click(at('guess', 3.4), [800, 354, 24, 24]);
  sc.click(at('guess', 4.2), [900, 354, 24, 24]);
  sc.show('ask-picked', at('guess', 4.4), { fade: 0.2 }).away(at('guess', 4.5));
  sc.callout(at('guess', 4.6), at('guess', 5.3), [768, 354, 180, 24], { label: 'LinkedIn, dev.to', side: 'right' });
  sc.look(at('guess', 5.4), [960, 300, 440, 371], { dur: 0.4 });
  sc.callout(at('guess', 5.9), end('guess') - 0.3, [1100, 470, 280, 30], { label: 'moved to 4', side: 'above' });
  sc.click(at('send', 1.0), [1288, 579, 92, 32]);
  sc.show('ask-submitted', at('send', 1.3), { fade: 0.2 }).away(at('send', 1.4)).cut(at('send', 1.3), [660, 330, 520, 439]);
  sc.callout(at('send', 2.0), end('send') - 0.3, [668, 562, 90, 26], { label: 'every value, at once', side: 'right' });

  const on = [[start('buttons'), end('send')]];
  sc.visible(on).build();
  screenFrame(s, on);
  shortChips(s, [['01 / BUTTONS', 'buttons', 'done'], ['02 / A FORM', 'form', 'send']].map(([label, a, z]) => [label, start(a), end(z)]));
  shortCaptions(s, tl);
  return s;
};
