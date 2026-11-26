// A short of "How a task board for AI agents should work" (videos/task-manager.js):
// work is pushed, not polled. A workspace per project, a task pushed straight to its
// agent in seconds, a message that reaches the agent mid-task, one status per task,
// /clear before the next task, one board for every workspace and the task keyboard.
// Build: node bin/video.js videos/shorts/task-manager-push-short.js --size 1080x1920
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTimeline, beatsById } from '../lib.js';
import { loadShots } from '../screen.js';
import { shortScene, shortScreen, screenFrame, shortCaptions, shortChips, shortCards, moved, crowd, endArt, retime } from '../short.js';
import { artWrongRepo, artReaders } from '../task-manager.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'task-manager-push-short.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, '../screens/task-manager');

const map = (id, pairs) => Object.fromEntries(pairs.map(([o, t]) => [`${id}:${o}`, t]));
// The long video's pain art, on this hook's words: the ask, the projects, wrong repo, asleep.
const HOOK = map('arrive-pain', [[2.4, 0.9], ...[0, 1, 2].map((i) => [3.3 + i * 0.3, 1.5 + i * 0.3]), [4.8, 4.0], [6.4, 5.4]]);
// The two readers: the agent, the people, and the worked example.
const PROMISE = map('promise', [[4.0, 2.0], [5.6, 2.6], [9.7, 4.5]]);

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);
  const s = shortScene({
    tl,
    poster: at('answer', 2.0),
    thumbnail: at('answer', 2.0),
    description: 'A vertical short of AgentRQ, the task manager for AI agents, over real screens of the app: a workspace per project with its agent named on its card, a task pushed straight to billing\'s agent with no polling, a message typed while the agent works that reaches it mid-task, one status per task on one live Kanban, /clear run before the next task, and the task keyboard.',
  });

  shortCards(s, [
    { span: [0, end('hook')], kicker: 'TASK MANAGER FOR AI AGENTS', headline: ['Wrong project,', 'or no wake-up.'], mark: 1, sub: 'Work has to reach the right agent.',
      art: (sc, y) => moved(artWrongRepo(sc, retime(at, 'hook', HOOK)), y) },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ', headline: ['Pushed,', 'not polled.'], mark: 1, sub: 'Seconds from a task to its agent.',
      art: (sc, y) => moved(artReaders(sc, retime(at, 'promise', PROMISE)), y) },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Work that finds', 'its agent.'], mark: 1, sub: 'An agent task board, open source.',
      art: (sc, y) => endArt(sc, y, { question: 'Does your agent wait for work?', line: 'Free during beta. Open source.' }) },
  ]);
  crowd(s, ['claude', 'codex', 'agy', 'hermes'], { y: 740, spans: [[start('cta'), tl.end]], hops: [at('cta', 1), at('cta', 1.2), at('cta', 1.4), at('cta', 1.6)], gap: 140 });

  const sc = shortScreen(s, loadShots(SHOTS));

  // 01 Pushed to it
  sc.show('home-online', start('ws'), { fade: 0 }).cut(start('ws'), [280, 130, 400, 338]);
  sc.callout(at('ws', 1.2), at('ws', 3.2), 'billing', { label: 'a workspace per project', side: 'below' });
  sc.look(at('ws', 3.3), [652, 130, 400, 338], { dur: 0.4 });
  sc.callout(at('ws', 3.9), end('ws') - 0.3, 'docs', { label: 'its agent, green: connected', side: 'below' });
  sc.show('task-billing', start('push'), { fade: 0.3 }).cut(start('push'), [660, 100, 420, 355]);
  sc.callout(at('push', 2.9), end('push') - 0.3, [667, 209, 410, 33], { label: "pushed to billing's agent", side: 'below' });
  sc.look(start('latency'), [10, 180, 420, 355], { dur: 0.5 });
  sc.callout(at('latency', 2.0), end('latency') - 0.3, 'row', { label: 'task latency: seconds', side: 'above' });

  // 02 Mid-task
  sc.show('midturn-typed', start('live'), { fade: 0.3 }).cut(start('live'), [475, 400, 420, 355]);
  sc.callout(at('live', 3.4), end('live') - 0.3, [482, 694, 410, 46], { label: 'typed while it works', side: 'above' });
  sc.show('midturn', start('answer'), { fade: 0.25 }).cut(start('answer'), [985, 230, 420, 355]);
  sc.callout(at('answer', 1.2), at('answer', 2.9), 'said', { label: 'reaches it at once', side: 'below' });
  sc.look(at('answer', 3.0), [470, 260, 420, 355], { dur: 0.4 });
  sc.callout(at('answer', 3.5), at('answer', 4.4), [475, 396, 410, 33], { label: 'answered mid-task', side: 'above' });
  sc.callout(at('answer', 4.5), end('answer') - 0.3, [481, 460, 410, 16], { label: 'still working', side: 'below' });

  // 03 One board
  sc.show('kanban', start('status'), { fade: 0.3 }).cut(start('status'), [280, 100, 560, 473]);
  sc.callout(at('status', 2.9), at('status', 3.8), [289, 113, 266, 380], { label: 'Not Started', side: 'below' });
  sc.callout(at('status', 3.9), at('status', 4.4), [568, 113, 266, 380], { label: 'Ongoing', side: 'below' });
  sc.look(at('status', 4.4), [840, 100, 560, 473], { dur: 0.3 });
  sc.callout(at('status', 4.8), at('status', 5.2), [846, 113, 266, 380], { label: 'Blocked', side: 'below' });
  sc.callout(at('status', 5.3), end('status') - 0.3, [1124, 113, 266, 380], { label: 'Done', side: 'below' });
  sc.show('c-form', start('clear'), { fade: 0.3 }).cut(start('clear'), [340, 230, 520, 439]);
  sc.callout(at('clear', 1.3), at('clear', 3.2), 'eraser', { label: 'start fresh', side: 'below' });
  sc.show('c-term-1', at('clear', 3.3), { fade: 0.25 }).cut(at('clear', 3.3), [40, 150, 480, 405]);
  sc.callout(at('clear', 4.1), at('clear', 5.3), [86, 290, 74, 20], { label: '/clear, typed for it', side: 'right' });
  sc.show('c-term-3', at('clear', 5.4), { fade: 0.2 });
  sc.callout(at('clear', 5.6), end('clear') - 0.3, [86, 324, 420, 20], { label: 'then the task', side: 'below' });
  sc.show('kanban', start('board'), { fade: 0.3 }).cut(start('board'), [560, 200, 440, 371]);
  sc.callout(at('board', 1.6), at('board', 3.6), 'where', { label: 'its workspace', side: 'right' });
  sc.callout(at('board', 3.7), end('board') - 0.3, 'exports', { label: 'one board, live', side: 'above' });
  sc.show('k-help', start('keys'), { fade: 0.3 }).cut(start('keys'), [480, 105, 480, 405]);
  sc.callout(at('keys', 3.0), at('keys', 4.1), [508, 250, 260, 26], { label: 'N: a new task', side: 'right' });
  sc.callout(at('keys', 4.2), end('keys') - 0.3, [508, 203, 260, 26], { label: 'Cmd K: find a task', side: 'right' });

  const on = [[start('ws'), end('keys')]];
  sc.visible(on).build();
  screenFrame(s, on);
  shortChips(s, [['01 / PUSHED TO IT', 'ws', 'latency'], ['02 / MID-TASK', 'live', 'answer'], ['03 / ONE BOARD', 'status', 'keys']].map(([label, a, z]) => [label, start(a), end(z)]));
  shortCaptions(s, tl);
  return s;
};
