// A short of "How a task board for AI agents should work" (videos/task-manager.js):
// five agents, one lesson. A workspace shared with the team (tasks, memory, skills),
// teammates' tasks live and read-only, Ben's agent saves a fix that Ada's agent reads
// first, team skills, and an activity log and one switch per share.
// Build: node bin/video.js videos/shorts/task-manager-team-short.js --size 1080x1920
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTimeline, beatsById } from '../lib.js';
import { loadShots } from '../screen.js';
import { shortScene, shortScreen, screenFrame, shortCaptions, shortChips, shortCards, moved, crowd, endArt, retime } from '../short.js';
import { artAlone, artLoop } from '../task-manager.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'task-manager-team-short.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, '../screens/task-manager');

const map = (id, pairs) => Object.fromEntries(pairs.map(([o, t]) => [`${id}:${o}`, t]));
// Five people learning the same thing, then the count.
const HOOK = map('people-pain', [...[0, 1, 2, 3, 4].map((i) => [3.5 + i * 0.3, 0.8 + i * 0.3]), [6.0, 5.9]]);
// The loop, and the team around it.
const PROMISE = map('loop', [[4.0, 0.7], [5.8, 0.9], [6.6, 1.1], [7.1, 1.3], [7.8, 1.5], [9.0, 2.0], [10.8, 2.8]]);

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);
  const s = shortScene({
    tl,
    poster: at('ada', 2.0),
    thumbnail: at('ada', 2.0),
    description: 'A vertical short of AgentRQ, the task manager for agents, over real screens of the app: a workspace shared with the team with its tasks, memory and skills, teammates seeing every task live and read-only with the owner\'s name, Ben\'s agent saving a fix that Ada\'s agent reads before it starts, teammates\' memory read but never edited, team skills, and an activity log and one switch per share.',
  });

  shortCards(s, [
    { span: [0, end('hook')], kicker: 'TASK MANAGER FOR AGENTS', headline: ['Five agents,', 'one lesson.'], mark: 1, sub: 'Every agent learns alone.',
      art: (sc, y) => moved(artAlone(sc, retime(at, 'hook', HOOK)), y) },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ TEAMS', headline: ['Learn it once,', 'as a team.'], mark: 1, sub: 'Share tasks, memory and skills.',
      art: (sc, y) => moved(artLoop(sc, retime(at, 'promise', PROMISE)), y) },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['One team,', 'one lesson.'], mark: 1, sub: 'Tasks, memory and skills, shared.',
      art: (sc, y) => endArt(sc, y, { question: 'What should your agents learn once?', line: 'Free during beta. Open source.' }) },
  ]);
  crowd(s, ['claude', 'codex', 'agy', 'hermes'], { y: 740, spans: [[start('cta'), tl.end]], hops: [at('cta', 1), at('cta', 1.2), at('cta', 1.4), at('cta', 1.6)], gap: 140 });

  const sc = shortScreen(s, loadShots(SHOTS));

  // 01 Shared
  sc.show('ws-sharing', start('share'), { fade: 0 }).cut(start('share'), [340, 170, 520, 439]);
  sc.callout(at('share', 0.9), at('share', 3.2), [354, 190, 500, 112], { label: 'shared with the team', side: 'below' });
  sc.callout(at('share', 3.3), end('share') - 0.3, [354, 225, 230, 24], { label: 'tasks, memory, skills', side: 'right' });
  sc.callout(at('same', 1.0), end('same') - 0.3, [354, 190, 150, 30], { label: 'one team workspace', side: 'right' });
  sc.show('team-tasks', start('see'), { fade: 0.3 }).cut(start('see'), [70, 100, 480, 405]);
  sc.callout(at('see', 1.0), at('see', 3.4), [81, 110, 392, 380], { label: 'every task, live', side: 'right' });
  sc.callout(at('see', 3.5), end('see') - 0.3, 'owner0', { label: "the owner's name", side: 'right' });
  sc.look(start('ro'), [30, 400, 480, 405], { dur: 0.5 });
  sc.callout(at('ro', 1.0), end('ro') - 0.3, [65, 764, 440, 30], { label: 'read-only', side: 'above' });

  // 02 One lesson
  sc.show('ben-saved', start('ben'), { fade: 0.3 }).cut(start('ben'), [470, 180, 440, 371]);
  sc.callout(at('ben', 1.5), end('ben') - 0.3, [477, 323, 430, 29], { label: "Ben's agent saves it", side: 'below' });
  sc.show('ada-fixed', start('ada'), { fade: 0.3 }).cut(start('ada'), [470, 160, 440, 371]);
  sc.callout(at('ada', 1.0), at('ada', 3.9), [477, 253, 430, 51], { label: "Ada's agent reads it first", side: 'below' });
  sc.look(at('ada', 4.0), [950, 160, 450, 380], { dur: 0.4 });
  sc.callout(at('ada', 4.4), end('ada') - 0.3, [955, 253, 440, 51], { label: 'right the first time', side: 'below' });
  sc.show('ws-sharing', start('own'), { fade: 0.3 }).cut(start('own'), [340, 290, 520, 439]);
  sc.callout(at('own', 1.0), end('own') - 0.3, [354, 318, 500, 128], { label: 'read, never edited', side: 'below' });

  // 03 Team skills
  sc.show('team-skill', start('skill'), { fade: 0.3 }).cut(start('skill'), [80, 300, 520, 439]);
  sc.callout(at('skill', 1.0), at('skill', 2.6), [97, 330, 500, 50], { label: 'the team owns its skills', side: 'below' });
  sc.callout(at('skill', 2.8), end('skill') - 0.3, [104, 486, 464, 18], { label: 'the missing step', side: 'below' });
  sc.show('members', start('ctl'), { fade: 0.3 }).cut(start('ctl'), [340, 100, 520, 439]);
  sc.callout(at('ctl', 0.6), at('ctl', 2.3), [354, 154, 500, 114], { label: 'no owners, no admins', side: 'below' });
  sc.show('activity', at('ctl', 2.4), { fade: 0.25 });
  sc.callout(at('ctl', 2.6), at('ctl', 4.3), [354, 154, 500, 123], { label: 'who did what', side: 'below' });
  sc.show('share-on', at('ctl', 4.4), { fade: 0.25 });
  sc.callout(at('ctl', 4.6), end('ctl') - 0.3, [354, 182, 500, 195], { label: 'one switch per share', side: 'below' });

  const on = [[start('share'), end('ctl')]];
  sc.visible(on).build();
  screenFrame(s, on);
  shortChips(s, [['01 / SHARED', 'share', 'ro'], ['02 / ONE LESSON', 'ben', 'own'], ['03 / TEAM SKILLS', 'skill', 'ctl']].map(([label, a, z]) => [label, start(a), end(z)]));
  shortCaptions(s, tl);
  return s;
};
