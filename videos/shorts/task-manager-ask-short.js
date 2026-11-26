// A short of "How a task board for AI agents should work" (videos/task-manager.js):
// it asks, you answer. A risky command comes as a request with Allow and Deny, agents
// ask with A2UI cards (a button, a form) and show results the same way, a toast and
// push, email and Slack reach you, Yolo runs a trusted task, and every call is on record.
// Build: node bin/video.js videos/shorts/task-manager-ask-short.js --size 1080x1920
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTimeline, beatsById } from '../lib.js';
import { loadShots } from '../screen.js';
import { shortScene, shortScreen, screenFrame, shortCaptions, shortChips, shortCards, moved, crowd, endArt, retime } from '../short.js';
import { artTwoBad, artReaders } from '../task-manager.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'task-manager-ask-short.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, '../screens/task-manager');

const map = (id, pairs) => Object.fromEntries(pairs.map(([o, t]) => [`${id}:${o}`, t]));
// Let it do anything, or watch every terminal.
const HOOK = map('ask-pain', [[5.2, 4.4], [6.9, 6.0], [8.1, 7.0]]);
const PROMISE = map('promise', [[4.0, 1.1], [5.6, 2.8], [9.7, 4.6]]);

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);
  const s = shortScene({
    tl,
    poster: at('card', 2.0),
    thumbnail: at('card', 2.0),
    description: 'A vertical short of AgentRQ, the AI agent task board, over real screens of the app: a risky command comes as a request with Allow and Deny on its card, agents ask with A2UI cards (a button for a choice, a form for details) and answer with a chart or one live card, a toast and push, email and Slack reach you, Yolo runs a trusted task, and the trajectory and timeline keep every call on the record.',
  });

  shortCards(s, [
    { span: [0, end('hook')], kicker: 'AI AGENT TASK BOARD', headline: ['Anything goes,', 'or you watch.'], mark: 1, sub: 'Two bad options.',
      art: (sc, y) => moved(artTwoBad(sc, retime(at, 'hook', HOOK)), y) },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ + A2UI', headline: ['It asks.', 'You answer.'], mark: 1, sub: 'From any page, on the record.',
      art: (sc, y) => moved(artReaders(sc, retime(at, 'promise', PROMISE)), y) },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Approve from', 'anywhere.'], mark: 1, sub: 'Every step stays on the record.',
      art: (sc, y) => endArt(sc, y, { question: 'What would you still approve by hand?', line: 'Free during beta. Open source.' }) },
  ]);
  crowd(s, ['claude', 'codex', 'agy', 'hermes'], { y: 740, spans: [[start('cta'), tl.end]], hops: [at('cta', 1), at('cta', 1.2), at('cta', 1.4), at('cta', 1.6)], gap: 140 });

  const sc = shortScreen(s, loadShots(SHOTS));

  // 01 Asked
  sc.show('ask-board', start('req'), { fade: 0 }).cut(start('req'), [990, 430, 440, 371]);
  sc.callout(at('req', 1.6), at('req', 4.4), 'toast', { label: 'the exact command', side: 'above' });
  sc.look(at('req', 4.5), [560, 200, 440, 371], { dur: 0.4 });
  sc.callout(at('req', 5.0), end('req') - 0.3, [591, 309, 120, 28], { label: 'Allow and Deny', side: 'right' });

  // 02 Cards
  sc.show('ask-buttons', start('card'), { fade: 0.3 }).cut(start('card'), [660, 190, 440, 371]);
  sc.callout(at('card', 0.8), end('card') - 0.3, [673, 215, 420, 200], { label: 'an A2UI card, from the agent', side: 'below' });
  sc.look(start('form'), [960, 250, 440, 371], { dur: 0.4 });
  sc.callout(at('form', 0.8), at('form', 2.3), 'sched', { label: 'a choice: a button', side: 'above' });
  sc.show('ask-form', at('form', 2.4), { fade: 0.25 }).cut(at('form', 2.4), [660, 200, 520, 439]);
  sc.callout(at('form', 2.6), at('form', 3.9), [673, 215, 500, 409], { label: 'the details: a form', side: 'right' });
  sc.show('ask-clicked', at('form', 4.0), { fade: 0.25 }).cut(at('form', 4.0), [960, 250, 440, 371]);
  sc.callout(at('form', 4.3), end('form') - 0.3, [1198, 393, 176, 25], { label: 'one click answers', side: 'above' });
  sc.show('chart-heat', start('show'), { fade: 0.3 }).cut(start('show'), [660, 190, 520, 439]);
  sc.callout(at('show', 2.8), at('show', 3.5), [673, 215, 500, 320], { label: 'a chart', side: 'right' });
  sc.show('live-running', at('show', 3.6), { fade: 0.25 }).cut(at('show', 3.6), [660, 190, 520, 439]);
  sc.callout(at('show', 3.9), end('show') - 0.3, [673, 209, 500, 200], { label: 'one live card, updating', side: 'below' });

  // 03 Anywhere
  sc.show('note-toast', start('reach'), { fade: 0.3 }).cut(start('reach'), [990, 430, 440, 371]);
  sc.callout(at('reach', 1.0), at('reach', 2.9), 'toast', { label: 'on any page', side: 'above' });
  sc.show('note-settings', at('reach', 3.0), { fade: 0.3 }).cut(at('reach', 3.0), [340, 330, 500, 422]);
  sc.callout(at('reach', 3.2), end('reach') - 0.3, [350, 481, 444, 46], { label: 'push, email and Slack', side: 'below' });

  // 04 On the record
  sc.show('yolo-task', start('yolo'), { fade: 0.3 }).cut(start('yolo'), [340, 170, 520, 439]);
  sc.callout(at('yolo', 0.8), at('yolo', 2.6), [356, 214, 500, 262], { label: 'one task you trust', side: 'below' });
  sc.callout(at('yolo', 3.0), end('yolo') - 0.3, 'chip', { label: 'Yolo: autonomous', side: 'below' });
  sc.show('yolo-record', start('record'), { fade: 0.3 }).cut(start('record'), [560, 260, 520, 439]);
  sc.callout(at('record', 1.2), end('record') - 0.3, 'auto', { label: 'auto-allowed, on record', side: 'below' });
  sc.show('trace-denied', start('trace'), { fade: 0.3 }).cut(start('trace'), [455, 330, 520, 439]);
  sc.callout(at('trace', 1.3), at('trace', 3.6), [465, 366, 377, 300], { label: 'every tool call', side: 'right' });
  sc.look(at('trace', 3.7), [885, 330, 520, 439], { dur: 0.4 });
  sc.callout(at('trace', 4.4), end('trace') - 0.3, 'status', { label: 'and who said no', side: 'below' });
  sc.show('timeline-refunds', start('time'), { fade: 0.3 }).cut(start('time'), [470, 90, 440, 371]);
  sc.callout(at('time', 3.2), at('time', 3.7), [478, 141, 124, 18], { label: 'worked', side: 'below' });
  sc.callout(at('time', 3.8), at('time', 4.5), [612, 141, 76, 18], { label: 'blocked', side: 'below' });
  sc.callout(at('time', 4.6), end('time') - 0.3, [695, 141, 88, 18], { label: 'waiting on you', side: 'below' });

  const on = [[start('req'), end('time')]];
  sc.visible(on).build();
  screenFrame(s, on);
  shortChips(s, [['01 / ASKED', 'req', 'req'], ['02 / A2UI CARDS', 'card', 'show'], ['03 / ANYWHERE', 'reach', 'reach'], ['04 / ON THE RECORD', 'yolo', 'time']].map(([label, a, z]) => [label, start(a), end(z)]));
  shortCaptions(s, tl);
  return s;
};
