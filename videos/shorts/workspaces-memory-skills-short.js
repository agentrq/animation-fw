// The short of "AgentRQ workspaces, memory and skills" (videos/workspaces-memory-skills.js):
// about two minutes, vertical, told over the same real screens. Isolated
// workspaces first (billing gets its own, Codex connects, a task reaches only
// billing's agent, a key per workspace), then the learning every agent shares
// (one rule saved, read first the next day, shared with a fork, never
// overwritten), then skills (one copy, switched on per workspace, fixed once).
// Build: node bin/video.js videos/shorts/workspaces-memory-skills-short.js --size 1080x1920
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTimeline, beatsById } from '../lib.js';
import { loadShots } from '../screen.js';
import { shortScene, shortScreen, screenFrame, shortCaptions, shortChips, shortCards, moved, crowd, endArt, retime } from '../short.js';
import { artWrongRepo, artPromise } from '../workspaces-memory-skills.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'workspaces-memory-skills-short.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, '../screens/workspaces-memory-skills');

// The long video's hook art, timed to this hook's words: the ask, the wrong repo, the chat gone by morning.
const HOOK = { 'hook:4.2': 0.4, 'hook:5.4': 2.6, 'pain:0.6': 0, 'pain:4.4': 4.0, 'pain:5.4': 4.8, 'pain:5.6': 5.0 };

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);
  const s = shortScene({
    tl,
    poster: at('mem-next', 4),
    thumbnail: at('mem-next', 4),
    description: 'A vertical short of AgentRQ workspaces, memory and skills over real screens of the app: billing gets its own workspace and Codex connects to it, a billing task reaches only billing\'s agent, each workspace has its own key, billing\'s agent saves the rule that its tests need Postgres on 5433 and the next task reads it first, a fork shares that memory, a stale save is refused, and one release skill is switched on per workspace and fixed once to version two.',
  });

  shortCards(s, [
    { span: [0, end('hook')], kicker: 'ONE AGENT, THREE PROJECTS', headline: ['Wrong repo.', 'Zero memory.'], mark: 1, sub: 'Every morning it starts over.',
      art: (sc, y) => moved(artWrongRepo(sc, retime(at, 'hook', HOOK)), y) },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ WORKSPACES', headline: ['Isolated.', 'And they learn.'], mark: 1, sub: 'Memory for facts, skills for steps.',
      art: (sc, y) => moved(artPromise(sc, (id, o) => at('promise', o * 0.55)), y) },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Teach it once.', 'Every agent knows.'], mark: 1, sub: 'Isolated workspaces, shared learning.',
      art: (sc, y) => endArt(sc, y, { question: 'What does your agent relearn?', line: 'Free during beta. Open source.' }) },
  ]);
  crowd(s, ['claude', 'codex', 'agy'], { y: 740, spans: [[start('cta'), tl.end]], hops: [at('cta', 1), at('cta', 1.3), at('cta', 1.6)] });

  const sc = shortScreen(s, loadShots(SHOTS));

  // Chat text runs 730 px wide: the camera frames about 340 px of it (k ~1.8), so a phone reads
  // it, and moves along the sentence with the voice. Text rows measured with rows.cjs.
  // 01 Isolated workspaces
  sc.show('new-typed', start('ws-create'), { fade: 0 }).cut(start('ws-create'), [345, 350, 420, 100]);
  sc.callout(at('ws-create', 0.6), at('ws-create', 3.0), 'name', { label: 'its own workspace', side: 'below' });
  sc.look(at('ws-create', 3.1), [850, 350, 420, 100], { dur: 0.8 });
  sc.callout(at('ws-create', 4.4), end('ws-create') - 0.3, 'dir', { label: "the repo's folder", side: 'below' });
  sc.show('home-online', start('ws-online'), { fade: 0.3 }).cut(start('ws-online'), [270, 150, 400, 120]);
  sc.callout(at('ws-online', 0.8), at('ws-online', 3.4), 'billing', { label: 'billing: Codex, online', side: 'below' });
  sc.look(at('ws-online', 3.5), [1015, 150, 400, 120], { dur: 0.8 });
  sc.callout(at('ws-online', 4.5), end('ws-online') - 0.3, 'storefront', { label: 'its own agent', side: 'below' });
  sc.show('task-billing', start('ws-tasks'), { fade: 0.3 }).cut(start('ws-tasks'), [668, 196, 340, 50]);
  sc.callout(at('ws-tasks', 0.8), at('ws-tasks', 3.6), [669, 215, 306, 24], { label: "billing's agent", side: 'below' });
  sc.show('home-detailed', at('ws-tasks', 3.7), { fade: 0.3 }).cut(at('ws-tasks', 3.7), [1015, 150, 400, 220]);
  sc.callout(at('ws-tasks', 4.0), end('ws-tasks') - 0.3, 'storefront', { label: 'never sees it', side: 'below' });
  sc.show('setup-key', start('ws-key'), { fade: 0.3 }).cut(start('ws-key'), [560, 270, 480, 200]);
  sc.callout(at('ws-key', 1.4), at('ws-key', 3.4), { region: 'config', w: 0.6 }, { label: 'a key for billing alone', side: 'below' });
  sc.show('reset-modal', at('ws-key', 3.6), { fade: 0.3 }).cut(at('ws-key', 3.6), [560, 290, 380, 190]);
  sc.callout(at('ws-key', 4.0), end('ws-key') - 0.3, 'text', { label: 'old tokens stop', side: 'below' });

  // 02 Shared learning
  sc.show('mem-saved', start('mem-save'), { fade: 0 }).cut(start('mem-save'), [905, 284, 340, 40]);
  sc.callout(at('mem-save', 2.6), at('mem-save', 4.2), [925, 292, 199, 24], { label: 'an hour to find', side: 'below' });
  sc.look(at('mem-save', 4.3), [668, 382, 340, 40], { dur: 0.7 });
  sc.callout(at('mem-save', 5.6), end('mem-save') - 0.3, [669, 390, 220, 24], { label: 'one rule, saved', side: 'below' });
  sc.show('mem-next', start('mem-next'), { fade: 0.3 }).cut(start('mem-next'), [668, 206, 340, 40]);
  sc.callout(at('mem-next', 3.0), at('mem-next', 4.8), [669, 215, 235, 24], { label: 'memory first', side: 'below' });
  sc.look(at('mem-next', 4.9), [990, 206, 340, 40], { dur: 0.7 });
  sc.callout(at('mem-next', 5.7), end('mem-next') - 0.3, [1038, 215, 246, 24], { label: 'the right port', side: 'below' });
  sc.show('fork-modal', start('mem-fork'), { fade: 0.3 }).cut(start('mem-fork'), [520, 230, 450, 370]);
  sc.callout(at('mem-fork', 0.6), at('mem-fork', 2.6), 'text', { label: 'a second agent', side: 'below' });
  sc.show('fork-memory', at('mem-fork', 2.8), { fade: 0.3 }).cut(at('mem-fork', 2.8), [555, 195, 360, 70]);
  sc.callout(at('mem-fork', 3.2), at('mem-fork', 4.4), [588, 153, 310, 24], { label: 'shares that memory', side: 'below' });
  sc.look(at('mem-fork', 4.5), [555, 300, 360, 70], { dur: 0.6 });
  sc.callout(at('mem-fork', 5.2), end('mem-fork') - 0.3, 'link', { label: "billing's note, here too", side: 'below' });
  sc.show('mem-conflict', start('mem-safe'), { fade: 0.3 }).cut(start('mem-safe'), [668, 300, 340, 60]);
  sc.callout(at('mem-safe', 2.6), at('mem-safe', 4.0), [669, 313, 237, 24], { label: 'stale save: refused', side: 'below' });
  sc.show('memories-full', at('mem-safe', 4.1), { fade: 0.3 }).cut(at('mem-safe', 4.1), [555, 240, 400, 80]);
  sc.callout(at('mem-safe', 4.4), end('mem-safe') - 0.3, [556, 243, 462, 74], { label: 'nothing overwritten', side: 'below' });

  // 03 Skills
  sc.show('skills-import', start('skill-import'), { fade: 0 }).cut(start('skill-import'), [550, 230, 480, 150]);
  sc.callout(at('skill-import', 2.4), at('skill-import', 4.2), { region: 'url', w: 0.68 }, { label: 'import from GitHub', side: 'below' });
  sc.look(at('skill-import', 4.3), [880, 340, 500, 170], { dur: 0.7 });
  sc.callout(at('skill-import', 5.1), end('skill-import') - 0.3, 'release', { label: 'written by an agent', side: 'below' });
  sc.show('skill-page', start('skill-on'), { fade: 0.3 }).cut(start('skill-on'), [545, 290, 360, 100]);
  sc.callout(at('skill-on', 0.6), at('skill-on', 1.8), [543, 348, 242, 33], { label: 'one copy', side: 'below' });
  sc.click(at('skill-on', 2.4), 'shop');
  sc.show('skill-page-on', at('skill-on', 2.6), { fade: 0.25 }).away(at('skill-on', 2.8));
  sc.callout(at('skill-on', 3.0), end('skill-on') - 0.3, 'shop', { label: 'on, per workspace', side: 'below' });
  sc.show('skill-fix', start('skill-fix'), { fade: 0.3 }).cut(start('skill-fix'), [662, 206, 360, 40]);
  sc.callout(at('skill-fix', 1.6), at('skill-fix', 3.4), [669, 215, 339, 24], { label: 'a missing step', side: 'below' });
  sc.look(at('skill-fix', 3.5), [662, 304, 360, 40], { dur: 0.6 });
  sc.callout(at('skill-fix', 4.1), at('skill-fix', 4.9), [669, 313, 261, 24], { label: 'version 2', side: 'below' });
  sc.show('skill-v2', at('skill-fix', 5.0), { fade: 0.3 }).cut(at('skill-fix', 5.0), [795, 525, 345, 60]);
  sc.callout(at('skill-fix', 5.4), end('skill-fix') - 0.3, [797, 545, 270, 23], { label: 'every workspace, at once', side: 'below' });

  const on = [[start('ws-create'), end('skill-fix')]];
  sc.visible(on).build();
  screenFrame(s, on);
  shortChips(s, [['01 / ISOLATED', 'ws-create', 'ws-key'], ['02 / SHARED LEARNING', 'mem-save', 'mem-safe'], ['03 / SKILLS', 'skill-import', 'skill-fix']]
    .map(([label, a, z]) => [label, start(a), end(z)]));
  shortCaptions(s, tl);
  return s;
};
