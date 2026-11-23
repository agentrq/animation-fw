// The short of "AgentRQ, automate the work" (videos/automate-work.js): about two
// minutes, vertical, told over the same real screens. A schedule (the morning
// triage, daily at nine, a run a day), an event (api_changed: docs and mobile
// each get a task when billing's agent publishes it), a webhook (GitHub's failed
// build on main fires ci_failed, and storefront's agent is on it at 03:13) and a
// workflow (billing deploys, then docs and mobile, every Friday).
// Build: node bin/video.js videos/shorts/automate-work-short.js --size 1080x1920
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTimeline, beatsById } from '../lib.js';
import { loadShots } from '../screen.js';
import { shortScene, shortScreen, screenFrame, shortCaptions, shortChips, shortCards, moved, crowd, endArt, retime } from '../short.js';
import { artMorning, artPromise } from '../automate-work.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'automate-work-short.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, '../screens/automate-work');

// The long video's art, timed to this short's words: nine o'clock and the first prompt from the
// first frame, the other two as the voice says "three", and the two jobs you do by hand at the end.
const HOOK = { 'hook:2.2': 0, 'pain:2.2': 4.0, 'pain:4.2': 5.0, 'pain:6.6': 5.5, 'pain:7.4': 5.8 };
const PROMISE = { 'promise:1.4': 3.6, 'promise:3': 4.2, 'promise:5.6': 4.6, 'promise:7.6': 5.2 };

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);
  const s = shortScene({
    tl,
    poster: at('ev-publish', 4.5),
    thumbnail: at('ev-publish', 4.5),
    description: 'A vertical short of AgentRQ automating the work over real screens of the app: a morning error triage for storefront put on a daily schedule at nine, its runs each a task of their own, an api_changed event that docs and mobile subscribe to and that opens a task for each when billing\'s agent publishes it, a GitHub webhook that turns a failed build on main into ci_failed for storefront\'s agent, and a release workflow where billing deploys and then docs and mobile follow, every Friday.',
  });

  shortCards(s, [
    { span: [0, end('hook')], kicker: 'EVERY MORNING, BY HAND', headline: ['Same prompts.', 'Every morning.'], mark: 1, sub: 'Three agents, typed into by hand.',
      art: (sc, y) => moved(artMorning(sc, retime(at, 'hook', HOOK)), y) },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ', headline: ['Set it up once.', 'It runs itself.'], mark: 1, sub: 'Schedules, events, webhooks, workflows.',
      art: (sc, y) => moved(artPromise(sc, retime(at, 'promise', PROMISE)), y) },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Stop typing', 'the same prompts.'], mark: 1, sub: 'Schedules, events, webhooks, workflows.',
      art: (sc, y) => endArt(sc, y, { question: 'What would you automate first?', line: 'Free during beta. Open source.' }) },
  ]);
  crowd(s, ['claude', 'codex', 'agy', 'hermes'], { y: 740, spans: [[start('cta'), tl.end]], hops: [at('cta', 1), at('cta', 1.2), at('cta', 1.4), at('cta', 1.6)], gap: 130 });

  const sc = shortScreen(s, loadShots(SHOTS));

  // The camera frames about 340 px of a text row (k ~1.8) so a phone reads it.
  // Rows and words measured with rows.cjs and wordx.cjs.
  // 01 On a schedule
  sc.show('sched-form', start('sched-new'), { fade: 0 }).cut(start('sched-new'), [370, 222, 340, 80]);
  sc.callout(at('sched-new', 0.6), at('sched-new', 2.2), [400, 232, 220, 22], { label: 'a task for storefront', side: 'above' });
  sc.callout(at('sched-new', 2.3), at('sched-new', 3.8), [374, 271, 247, 20], { label: "last night's log", side: 'below' });
  sc.look(at('sched-new', 3.9), [760, 222, 340, 80], { dur: 0.5 });
  sc.callout(at('sched-new', 4.4), end('sched-new') - 0.3, [887, 271, 165, 20], { label: 'a task per new error', side: 'below' });
  sc.look(start('sched-pick'), [540, 370, 340, 110], { dur: 0.5 });
  sc.callout(at('sched-pick', 0.5), at('sched-pick', 1.5), 'schedule', { label: 'schedule', side: 'above' });
  sc.click(at('sched-pick', 1.55), 'schedule');
  sc.show('sched-daily', at('sched-pick', 1.8), { fade: 0.25 }).away(at('sched-pick', 1.9)).cut(at('sched-pick', 1.8), [665, 190, 320, 230]);
  sc.callout(at('sched-pick', 2.1), at('sched-pick', 2.8), 'preset', { label: 'daily', side: 'below' });
  sc.callout(at('sched-pick', 2.8), at('sched-pick', 3.7), 'time', { label: 'at nine', side: 'below' });
  sc.callout(at('sched-pick', 3.8), at('sched-pick', 4.9), [679, 381, 72, 26], { label: 'the cron line', side: 'above' });
  sc.callout(at('sched-pick', 5.0), end('sched-pick') - 0.3, [908, 381, 70, 26], { label: 'the next run', side: 'above' });
  sc.show('sched-run', start('sched-runs'), { fade: 0.3 }).cut(start('sched-runs'), [478, 105, 340, 110]);
  sc.callout(at('sched-runs', 0.8), at('sched-runs', 2.5), [478, 108, 330, 28], { label: 'a normal task', side: 'below' });
  sc.look(at('sched-runs', 2.6), [478, 325, 340, 60], { dur: 0.5 });
  sc.callout(at('sched-runs', 3.05), at('sched-runs', 3.9), [479, 336, 336, 20], { label: 'its own thread', side: 'below' });
  sc.show('sched-runs', at('sched-runs', 4.0), { fade: 0.3 }).cut(at('sched-runs', 4.0), [478, 220, 420, 110]);
  sc.callout(at('sched-runs', 4.3), end('sched-runs') - 0.3, [481, 288, 414, 28], { label: 'one run a day', side: 'below' });

  // 02 One agent hands off to the next
  sc.show('ev-form', start('ev-new'), { fade: 0.3 }).cut(start('ev-new'), [112, 215, 340, 100]);
  sc.callout(at('ev-new', 2.4), end('ev-new') - 0.3, [126, 247, 104, 24], { label: 'a new event', side: 'below' });
  sc.show('ev-triggers', start('ev-trigger'), { fade: 0.3 }).cut(start('ev-trigger'), [152, 160, 340, 160]);
  sc.callout(at('ev-trigger', 0.6), at('ev-trigger', 1.3), [155, 256, 338, 58], { label: 'docs', side: 'below' });
  sc.callout(at('ev-trigger', 1.35), at('ev-trigger', 2.8), [155, 169, 338, 58], { label: 'and mobile', side: 'above' });
  sc.show('ev-docs-task', at('ev-trigger', 3.0), { fade: 0.3 }).cut(at('ev-trigger', 3.0), [478, 105, 360, 200]);
  sc.callout(at('ev-trigger', 3.4), at('ev-trigger', 4.9), [478, 109, 245, 27], { label: 'a task for docs', side: 'below' });
  sc.callout(at('ev-trigger', 5.0), end('ev-trigger') - 0.3, [490, 183, 345, 22], { label: 'exactly what changed', side: 'below' });
  sc.show('ev-board', start('ev-publish'), { fade: 0.3 }).cut(start('ev-publish'), [1005, 385, 420, 170]);
  sc.callout(at('ev-publish', 0.8), at('ev-publish', 3.4), 'done', { label: 'billing: done', side: 'below' });
  sc.look(at('ev-publish', 3.5), [1005, 535, 420, 265], { dur: 0.5 });
  sc.callout(at('ev-publish', 4.0), end('ev-publish') - 0.3, [1012, 542, 408, 248], { label: 'both start at once', side: 'above' });

  // 03 Let GitHub start it
  sc.show('hook-form', start('hook-route'), { fade: 0.3 }).cut(start('hook-route'), [112, 245, 360, 95]);
  sc.callout(at('hook-route', 0.8), at('hook-route', 2.6), 'hook', { label: 'GitHub, built in', side: 'below' });
  sc.look(at('hook-route', 2.65), [112, 470, 360, 140], { dur: 0.5 });
  sc.callout(at('hook-route', 3.2), at('hook-route', 4.2), [116, 561, 200, 42], { label: 'a failed build', side: 'below' });
  sc.callout(at('hook-route', 4.25), at('hook-route', 4.9), [116, 483, 360, 38], { label: 'on main', side: 'above' });
  sc.look(at('hook-route', 4.95), [470, 470, 360, 140], { dur: 0.35 });
  sc.callout(at('hook-route', 5.25), end('hook-route') - 0.3, [589, 558, 222, 34], { label: 'ci_failed', side: 'below' });
  sc.show('hook-task', start('hook-task'), { fade: 0.3 }).cut(start('hook-task'), [478, 105, 340, 160]);
  sc.callout(at('hook-task', 0.6), at('hook-task', 1.5), [478, 108, 380, 26], { label: 'opened by the webhook', side: 'below' });
  sc.callout(at('hook-task', 1.6), at('hook-task', 2.5), [477, 204, 90, 24], { label: '03:13 AM', side: 'right' });
  sc.callout(at('hook-task', 2.6), at('hook-task', 4.1), [478, 146, 340, 20], { label: 'the failure', side: 'below' });
  sc.look(at('hook-task', 4.15), [478, 238, 340, 60], { dur: 0.5 });
  sc.callout(at('hook-task', 4.7), end('hook-task') - 0.3, [479, 259, 336, 20], { label: 'already on it', side: 'below' });

  // 04 The whole pipeline
  sc.show('wf-graph', start('wf-graph'), { fade: 0.3 }).cut(start('wf-graph'), [320, 140, 1060, 210]);
  sc.callout(at('wf-graph', 0.8), at('wf-graph', 2.3), 'canvas', { label: 'one workflow', side: 'below' });
  sc.look(at('wf-graph', 2.4), [590, 175, 340, 130], { dur: 0.5 });
  sc.callout(at('wf-graph', 2.9), at('wf-graph', 4.1), 'billing', { label: 'billing deploys first', side: 'below' });
  sc.look(at('wf-graph', 4.15), [1100, 140, 340, 180], { dur: 0.5 });
  sc.callout(at('wf-graph', 4.7), end('wf-graph') - 0.3, [1118, 148, 218, 162], { label: 'side by side', side: 'below' });
  sc.show('wf-tasks', start('wf-tasks'), { fade: 0.3 }).cut(start('wf-tasks'), [95, 545, 340, 200]);
  sc.callout(at('wf-tasks', 0.8), at('wf-tasks', 1.5), [108, 659, 300, 30], { label: 'in billing', side: 'below' });
  sc.callout(at('wf-tasks', 1.5), at('wf-tasks', 2.1), [108, 612, 300, 30], { label: 'in docs', side: 'below' });
  sc.callout(at('wf-tasks', 2.1), at('wf-tasks', 3.0), [108, 566, 300, 30], { label: 'in mobile', side: 'below' });
  sc.show('wf-weekly', at('wf-tasks', 3.2), { fade: 0.3 }).cut(at('wf-tasks', 3.2), [665, 190, 320, 230]);
  sc.callout(at('wf-tasks', 3.7), at('wf-tasks', 5.3), 'footer', { label: 'on a schedule', side: 'below' });
  sc.callout(at('wf-tasks', 5.4), end('wf-tasks') - 0.3, 'days', { label: 'every Friday', side: 'above' });

  const on = [[start('sched-new'), end('wf-tasks')]];
  sc.visible(on).build();
  screenFrame(s, on);
  shortChips(s, [['01 / ON A SCHEDULE', 'sched-new', 'sched-runs'], ['02 / EVENTS', 'ev-new', 'ev-publish'], ['03 / WEBHOOKS', 'hook-route', 'hook-task'], ['04 / WORKFLOWS', 'wf-graph', 'wf-tasks']]
    .map(([label, a, z]) => [label, start(a), end(z)]));
  shortCaptions(s, tl);
  return s;
};
