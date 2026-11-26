// A short of "How a task board for AI agents should work" (videos/task-manager.js):
// learned today, kept tomorrow. The agent saves one short note to the workspace memory,
// the next task loads it first, a stale save is refused and merged, skills are switched
// on per workspace and loaded when needed, and bigger plans live on the Pano.
// Build: node bin/video.js videos/shorts/task-manager-memory-short.js --size 1080x1920
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTimeline, beatsById } from '../lib.js';
import { loadShots } from '../screen.js';
import { shortScene, shortScreen, screenFrame, shortCaptions, shortChips, shortCards, moved, crowd, endArt, retime } from '../short.js';
import { artForget, artReaders } from '../task-manager.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'task-manager-memory-short.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, '../screens/task-manager');

const map = (id, pairs) => Object.fromEntries(pairs.map(([o, t]) => [`${id}:${o}`, t]));
// Monday learns the port, Tuesday learns it again.
const HOOK = map('ctx-pain', [[3.0, 2.3], [6.6, 5.9], [7.8, 7.0]]);
const PROMISE = map('promise', [[4.0, 1.0], [5.6, 2.0], [9.7, 3.7]]);

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);
  const s = shortScene({
    tl,
    poster: at('next', 2.0),
    thumbnail: at('next', 2.0),
    description: 'A vertical short of AgentRQ, the agent task manager, over real screens of the app: before it marks a task done the agent saves one short note to the workspace memory, the next task loads it first and goes to the right port, a stale save is refused and the agent merges and saves version 3, skills are switched on per workspace and loaded only when a task needs them, and plans live on the Pano and tick as tasks finish.',
  });

  shortCards(s, [
    { span: [0, end('hook')], kicker: 'AGENT TASK MANAGER', headline: ['Learned today,', 'gone tomorrow.'], mark: 1, sub: 'Every session starts empty.',
      art: (sc, y) => moved(artForget(sc, retime(at, 'hook', HOOK)), y) },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ', headline: ['The workspace', 'remembers.'], mark: 1, sub: 'Memory, skills and the Pano.',
      art: (sc, y) => moved(artReaders(sc, retime(at, 'promise', PROMISE)), y) },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Learn it', 'once.'], mark: 1, sub: 'Shared memory for every task.',
      art: (sc, y) => endArt(sc, y, { question: 'What does it relearn each morning?', line: 'Free during beta. Open source.' }) },
  ]);
  crowd(s, ['claude', 'codex', 'agy', 'hermes'], { y: 740, spans: [[start('cta'), tl.end]], hops: [at('cta', 1), at('cta', 1.2), at('cta', 1.4), at('cta', 1.6)], gap: 140 });

  const sc = shortScreen(s, loadShots(SHOTS));

  // 01 Memory
  sc.show('mem-saved', start('save'), { fade: 0 }).cut(start('save'), [660, 200, 420, 355]);
  sc.callout(at('save', 0.8), at('save', 2.9), [667, 286, 410, 55], { label: 'what it learned', side: 'above' });
  sc.callout(at('save', 3.0), end('save') - 0.3, [667, 384, 410, 33], { label: 'one short note, saved', side: 'below' });
  sc.show('mem-next', start('next'), { fade: 0.3 }).cut(start('next'), [660, 130, 420, 355]);
  sc.callout(at('next', 0.9), at('next', 2.6), [667, 209, 410, 55], { label: 'memory first', side: 'below' });
  sc.look(at('next', 2.7), [985, 130, 420, 355], { dur: 0.4 });
  sc.callout(at('next', 3.2), end('next') - 0.3, [990, 209, 400, 55], { label: 'the right port', side: 'below' });
  sc.show('mem-conflict', start('version'), { fade: 0.3 }).cut(start('version'), [660, 220, 420, 355]);
  sc.callout(at('version', 4.2), end('version') - 0.3, [667, 307, 410, 55], { label: 'the stale save: refused', side: 'below' });
  sc.look(start('merge'), [985, 220, 420, 355], { dur: 0.4 });
  sc.callout(at('merge', 1.6), end('merge') - 0.3, [990, 307, 400, 55], { label: 'merged: version 3', side: 'below' });
  sc.look(start('safe'), [660, 220, 420, 355], { dur: 0.5 });
  sc.callout(at('safe', 1.2), end('safe') - 0.3, [667, 307, 410, 55], { label: 'nothing lost', side: 'below' });

  // 02 Skills
  sc.show('skill-v2', start('skill'), { fade: 0.3 }).cut(start('skill'), [520, 215, 520, 439]);
  sc.callout(at('skill', 2.6), at('skill', 4.5), [546, 332, 490, 46], { label: 'on per workspace', side: 'below' });
  sc.look(at('skill', 4.6), [790, 420, 520, 439], { dur: 0.4 });
  sc.callout(at('skill', 5.0), end('skill') - 0.3, 'step', { label: 'one fix, everywhere', side: 'above' });
  sc.look(start('load'), [520, 180, 520, 439], { dur: 0.5 });
  sc.callout(at('load', 1.4), end('load') - 0.3, [546, 276, 490, 15], { label: 'loaded when a task needs it', side: 'above' });

  // 03 The Pano
  sc.show('tick-5', start('pano'), { fade: 0.3 }).cut(start('pano'), [97, 113, 520, 439]);
  sc.callout(at('pano', 1.4), at('pano', 3.4), [138, 154, 470, 38], { label: 'a plan on the Pano', side: 'below' });
  sc.callout(at('pano', 3.5), end('pano') - 0.3, 'progress', { label: 'ticked as tasks finish', side: 'below' });
  sc.look(start('docs'), [97, 260, 520, 439], { dur: 0.5 });
  sc.callout(at('docs', 1.5), end('docs') - 0.3, [138, 302, 470, 300], { label: 'markdown, shared', side: 'above' });

  const on = [[start('save'), end('docs')]];
  sc.visible(on).build();
  screenFrame(s, on);
  shortChips(s, [['01 / MEMORY', 'save', 'safe'], ['02 / SKILLS', 'skill', 'load'], ['03 / THE PANO', 'pano', 'docs']].map(([label, a, z]) => [label, start(a), end(z)]));
  shortCaptions(s, tl);
  return s;
};
