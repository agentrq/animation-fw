// The short of "AgentRQ Teams" (videos/teams-collaboration.js): about two minutes,
// vertical, told over the same real screens. Ada creates a team and invites Ben by
// link, he joins with his own account, each shares a storefront and the two become
// one team workspace with live tasks, Ben's agent saves Monday's fix to its memory
// and Ada's agent reads it first on Tuesday, the team's release skill gets its tag
// step once for everyone, and every share has its own switch.
// Build: node bin/video.js videos/shorts/teams-collaboration-short.js --size 1080x1920
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTimeline, beatsById } from '../lib.js';
import { loadShots } from '../screen.js';
import { shortScene, shortScreen, screenFrame, shortCaptions, shortChips, shortCards, moved, crowd, endArt, retime } from '../short.js';
import { artTwoAfternoons, artPromise } from '../teams-collaboration.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'teams-collaboration-short.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, '../screens/teams-collaboration');

// The long video's art, timed to this short's words: Monday's pane fills as the voice
// says the build flakes and "cracks it", Tuesday's as Ada's agent "starts from zero".
// The long video's pain chips sit left of the card's art, off the short's frame.
const HOOK = { 'hook:0.8': 2.7, 'hook:4.6': 5.5, 'pain:0.8': 4.1 };
// Each part's switch turns on as the voice names it (the art asks for 3.4 + i * 1.3).
const PROMISE = Object.fromEntries([4.3, 4.6, 4.9, 5.3].map((o, i) => [`promise:${3.4 + i * 1.3}`, o]));

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);
  const s = shortScene({
    tl,
    poster: at('memory-read', 5),
    thumbnail: at('memory-read', 5),
    description: 'A vertical short of AgentRQ Teams over real screens of the app: Ada creates a team called Platform and invites Ben by link, Ben joins with his own account, each shares a storefront workspace and the two become one team workspace where both see every task with its owner, Ben\'s agent saves the cause of a flaky build to its memory and Ada\'s agent reads it first the next day and goes green in two minutes, Ben\'s agent adds the missing tag step to the team\'s release skill once for everyone, and every share has its own switch.',
  });

  shortCards(s, [
    { span: [0, end('hook')], kicker: 'ONE TEAM, MANY AGENTS', headline: ['Same bug.', 'Two afternoons.'], mark: 1, sub: 'The fix lived on one laptop.',
      art: (sc, y) => moved(artTwoAfternoons(sc, retime(at, 'hook', HOOK)), y) },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ TEAMS', headline: ['Share what', 'you choose.'], mark: 1, sub: 'Tasks, memory, skills, Pano docs.',
      art: (sc, y) => moved(artPromise(sc, retime(at, 'promise', PROMISE)), y) },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Solve it once.', 'The team keeps it.'], mark: 1, sub: 'Share what you choose, per workspace.',
      art: (sc, y) => endArt(sc, y, { question: 'What has your agent learned?', line: 'Free during beta. Open source.' }) },
  ]);
  crowd(s, ['claude', 'codex', 'agy'], { y: 740, spans: [[start('cta'), tl.end]], hops: [at('cta', 1), at('cta', 1.2), at('cta', 1.4)] });

  const sc = shortScreen(s, loadShots(SHOTS));

  // The camera frames about 340 px of a row (k ~1.8) so a phone reads it; forms and
  // dialogs a little wider. Rows and words measured with rows.cjs and wordx.cjs.
  // 01 Set up
  sc.show('team-new', start('create'), { fade: 0 }).cut(start('create'), [110, 150, 520, 170]);
  sc.callout(at('create', 1.2), at('create', 2.3), [126, 209, 486, 54], { label: 'type a name', side: 'below' });
  sc.click(at('create', 2.4), 'create');
  sc.show('invite-typed', at('create', 2.7), { fade: 0.25 }).away(at('create', 2.8)).cut(at('create', 2.7), [345, 150, 340, 110]);
  sc.callout(at('create', 3.3), at('create', 4.3), [356, 185, 138, 24], { label: 'Ben, by email', side: 'below' });
  sc.show('invite-link', at('create', 4.4), { fade: 0.3 }).cut(at('create', 4.4), [490, 340, 440, 130]);
  sc.callout(at('create', 4.8), end('create') - 0.3, 'link', { label: 'a link to send', side: 'below' });
  sc.show('invite-accept', start('accept'), { fade: 0.3 }).cut(start('accept'), [490, 290, 460, 220]);
  sc.click(at('accept', 1.5), 'accept');
  sc.show('ben-joined', at('accept', 1.8), { fade: 0.25 }).away(at('accept', 1.9)).cut(at('accept', 1.8), [65, 690, 340, 110]);
  sc.callout(at('accept', 2.1), at('accept', 3.0), [77, 738, 265, 20], { label: 'Ben joined Platform', side: 'above' });
  sc.show('members', at('accept', 3.1), { fade: 0.3 }).cut(at('accept', 3.1), [345, 150, 340, 110]);
  sc.callout(at('accept', 3.4), at('accept', 4.2), [356, 164, 140, 90], { label: 'his own account', side: 'right' });
  sc.callout(at('accept', 4.3), end('accept') - 0.3, [356, 164, 140, 90], { label: 'no shared login', side: 'right' });

  // 02 Live tasks
  sc.show('share-off', start('share'), { fade: 0.3 }).cut(start('share'), [1030, 300, 340, 110]);
  sc.click(at('share', 1.5), [1314, 341, 44, 24]);
  sc.show('share-on', at('share', 1.7), { fade: 0.25 }).away(at('share', 1.8));
  sc.callout(at('share', 1.9), at('share', 2.5), [1308, 335, 56, 36], { label: 'shared', side: 'below' });
  sc.look(at('share', 2.6), [345, 312, 340, 110], { dur: 0.4 });
  sc.callout(at('share', 3.0), at('share', 3.8), [351, 344, 78, 20], { label: 'the storefront', side: 'below' });
  sc.show('activity-merged', at('share', 3.9), { fade: 0.3 }).cut(at('share', 3.9), [345, 150, 340, 120]);
  sc.callout(at('share', 4.1), at('share', 5.0), [354, 152, 196, 22], { label: 'Ben shared his too', side: 'above' });
  sc.callout(at('share', 5.2), end('share') - 0.3, [354, 243, 304, 22], { label: 'one team workspace', side: 'below' });
  sc.show('team-tasks', start('team-tasks'), { fade: 0.3 }).cut(start('team-tasks'), [85, 150, 360, 190]);
  sc.callout(at('team-tasks', 0.9), at('team-tasks', 3.3), [104, 154, 334, 182], { label: 'live, for both', side: 'below' });
  sc.callout(at('team-tasks', 3.6), end('team-tasks') - 0.3, 'owner0', { label: "the owner's name", side: 'right' });
  sc.callout(at('team-tasks', 3.6), end('team-tasks') - 0.3, 'owner1');

  // 03 Shared memory
  sc.show('ben-saved', start('memory-save'), { fade: 0.3 }).cut(start('memory-save'), [470, 190, 340, 110]);
  sc.callout(at('memory-save', 0.5), at('memory-save', 1.6), [478, 230, 172, 22], { label: 'Monday: cracked it', side: 'above' });
  sc.look(at('memory-save', 1.7), [700, 190, 340, 110], { dur: 0.4 });
  sc.callout(at('memory-save', 2.2), at('memory-save', 3.9), [773, 230, 121, 22], { label: 'the cause', side: 'below' });
  sc.look(at('memory-save', 4.0), [470, 280, 340, 110], { dur: 0.4 });
  sc.callout(at('memory-save', 4.4), end('memory-save') - 0.3, [478, 328, 180, 22], { label: 'saved to its memory', side: 'below' });
  sc.show('ada-fixed', start('memory-read'), { fade: 0.3 }).cut(start('memory-read'), [470, 230, 340, 110]);
  sc.callout(at('memory-read', 1.2), at('memory-read', 3.6), [478, 258, 248, 22], { label: "Tuesday: Ben's note first", side: 'above' });
  sc.callout(at('memory-read', 3.8), end('memory-read') - 0.3, [477, 279, 220, 22], { label: 'green in two minutes', side: 'below' });

  // 04 One playbook
  sc.show('team-skills', start('skills'), { fade: 0.3 }).cut(start('skills'), [85, 30, 340, 110]);
  sc.callout(at('skills', 0.5), at('skills', 1.8), [94, 72, 242, 20], { label: 'the team owns its skills', side: 'below' });
  sc.show('ben-skill-v2', at('skills', 1.9), { fade: 0.3 }).cut(at('skills', 1.9), [470, 230, 340, 110]);
  sc.callout(at('skills', 2.1), at('skills', 3.6), [478, 258, 256, 22], { label: 'no tag step', side: 'above' });
  sc.look(at('skills', 3.7), [800, 230, 340, 110], { dur: 0.4 });
  sc.callout(at('skills', 4.0), at('skills', 4.7), [912, 258, 128, 22], { label: 'added as step 4', side: 'above' });
  sc.show('skill-v1', at('skills', 4.75), { fade: 0.3 }).cut(at('skills', 4.75), [95, 420, 340, 110]);
  sc.show('skill-v2', at('skills', 5.2), { fade: 0.5 });
  sc.callout(at('skills', 5.5), end('skills') - 0.3, [107, 486, 146, 20], { label: 'version 2, for every agent', side: 'below' });

  // 05 Your control
  sc.show('control-sharing', start('control'), { fade: 0.3 }).cut(start('control'), [345, 180, 340, 110]);
  sc.callout(at('control', 0.5), at('control', 1.8), [351, 202, 68, 20], { label: 'yours to decide', side: 'right' });
  sc.callout(at('control', 2.0), at('control', 3.6), [350, 226, 176, 48], { label: 'a switch for each', side: 'below' });
  sc.look(at('control', 3.7), [1030, 180, 340, 110], { dur: 0.4 });
  sc.callout(at('control', 4.1), at('control', 4.6), 'sw', { label: 'per workspace', side: 'below' });
  sc.show('danger', at('control', 4.7), { fade: 0.3 }).cut(at('control', 4.7), [360, 150, 340, 110]);
  sc.callout(at('control', 5.0), end('control') - 0.3, [376, 182, 328, 38], { label: 'every share stops', side: 'below' });

  const on = [[start('create'), end('control')]];
  sc.visible(on).build();
  screenFrame(s, on);
  shortChips(s, [['01 / SET UP', 'create', 'accept'], ['02 / LIVE TASKS', 'share', 'team-tasks'], ['03 / SHARED MEMORY', 'memory-save', 'memory-read'],
    ['04 / ONE PLAYBOOK', 'skills', 'skills'], ['05 / YOUR CONTROL', 'control', 'control']].map(([label, a, z]) => [label, start(a), end(z)]));
  shortCaptions(s, tl);
  return s;
};
