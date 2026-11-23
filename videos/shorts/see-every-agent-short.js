// The short of "See what every agent is doing" (videos/see-every-agent.js): about
// two minutes, vertical, told over the same real screens. Every agent on one
// screen (the workspace cards, the live board), the requests waiting on you
// (a migration to allow, a blocked task to answer), what each agent is doing
// now (its last tools, a message mid-turn), where the time went (the timeline)
// and every call on the record (the trajectory, a force push denied).
// Build: node bin/video.js videos/shorts/see-every-agent-short.js --size 1080x1920
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTimeline, beatsById } from '../lib.js';
import { loadShots } from '../screen.js';
import { shortScene, shortScreen, screenFrame, shortCaptions, shortChips, shortCards, moved, crowd, endArt, retime } from '../short.js';
import { artTerminals, artPromise } from '../see-every-agent.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'see-every-agent-short.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, '../screens/see-every-agent');

// The long video's art, timed to this short's words: the four terminals hold from the first
// frame, then "done", "stuck" and "waiting 40 min" land as the voice names them.
const HOOK = { 'hook:2.6': 0, 'hook:3.1': 0, 'hook:3.6': 0, 'hook:4.1': 0, 'pain:0.8': 2.5, 'pain:5': 3.9, 'pain:2.5': 4.9, 'pain:6.1': 6.6 };
const PROMISE = { 'promise:3.4': 2.4, 'promise:5': 3.1, 'promise:6.6': 3.5, 'promise:8': 4.0 };

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);
  const s = shortScene({
    tl,
    poster: at('allow', 3.4),
    thumbnail: at('allow', 3.4),
    description: 'A vertical short of seeing every AgentRQ agent on one screen, over real screens of the app: each workspace\'s card names its agent, the Kanban board moves billing\'s export to Done by itself, billing\'s agent asks to run a migration and Allow and Deny sit on its card, docs is blocked and picks up after an answer, a busy agent shows its last three tools and hears a message mid-turn, a task\'s timeline totals its time, and the trajectory shows a force push to main denied.',
  });

  shortCards(s, [
    { span: [0, end('hook')], kicker: 'FOUR AGENTS, FOUR TERMINALS', headline: ['Which one', 'needs you?'], mark: 1, sub: 'You only find out by checking.',
      art: (sc, y) => moved(artTerminals(sc, retime(at, 'hook', HOOK)), y) },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ', headline: ['Every agent,', 'one screen.'], mark: 1, sub: 'What it does, what it needs.',
      art: (sc, y) => moved(artPromise(sc, retime(at, 'promise', PROMISE, (o) => o * 0.5)), y) },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Every agent,', 'one screen.'], mark: 1, sub: 'And every call on the record.',
      art: (sc, y) => endArt(sc, y, { question: 'What do you check first?', line: 'Free during beta. Open source.' }) },
  ]);
  crowd(s, ['claude', 'codex', 'agy', 'hermes'], { y: 740, spans: [[start('cta'), tl.end]], hops: [at('cta', 1), at('cta', 1.2), at('cta', 1.4), at('cta', 1.6)], gap: 130 });

  const sc = shortScreen(s, loadShots(SHOTS));

  // 01 One screen
  sc.show('home-simple', start('home'), { fade: 0 }).cut(start('home'), [280, 160, 380, 170]);
  sc.callout(at('home', 0.8), at('home', 2.7), 'billing', { label: 'named for its agent', side: 'below' });
  sc.callout(at('home', 3.0), at('home', 4.4), [297, 190, 24, 22], { label: 'connected', side: 'above' });
  sc.show('ask-home', at('home', 4.6), { fade: 0.3 }).cut(at('home', 4.6), [280, 160, 380, 170]);
  sc.callout(at('home', 4.9), end('home') - 0.3, 'chip', { label: 'waits on you', side: 'below' });
  sc.show('kanban', start('kanban'), { fade: 0.3 }).cut(start('kanban'), [285, 100, 550, 280]);
  sc.callout(at('kanban', 0.8), at('kanban', 2.8), 'exports', { label: 'every task, one board', side: 'below' });
  sc.show('kanban-before', at('kanban', 2.9), { fade: 0.3 }).cut(at('kanban', 2.9), [565, 230, 280, 140]);
  sc.callout(at('kanban', 3.3), at('kanban', 4.6), 'exports', { label: "billing's export", side: 'below' });
  sc.show('kanban-done', at('kanban', 4.7), { fade: 0.3 }).look(at('kanban', 4.7), [1115, 140, 290, 140], { dur: 0.7 });
  sc.callout(at('kanban', 5.6), end('kanban') - 0.3, 'exports', { label: 'moved itself', side: 'below' });

  // 02 Waiting on you
  sc.show('ask-task', start('ask'), { fade: 0.3 }).cut(start('ask'), [478, 300, 400, 230]);
  sc.callout(at('ask', 0.8), at('ask', 2.8), [474, 304, 150, 30], { label: 'it asks first', side: 'below' });
  sc.callout(at('ask', 3.2), end('ask') - 0.3, [486, 440, 380, 26], { label: 'the exact command', side: 'below' });
  sc.callout(at('allow', 0.6), at('allow', 2.4), [490, 488, 248, 37], { label: 'once, always, or deny', side: 'above' });
  sc.show('ask-board2', at('allow', 2.5), { fade: 0.3 }).cut(at('allow', 2.5), [566, 234, 270, 124]);
  sc.callout(at('allow', 3.0), end('allow') - 0.3, [588, 305, 128, 36], { label: 'right on the card', side: 'below' });
  sc.show('blocked-board', start('blocked'), { fade: 0.3 }).cut(start('blocked'), [845, 120, 270, 150]);
  sc.callout(at('blocked', 1.0), at('blocked', 3.8), 'card', { label: 'docs: blocked', side: 'below' });
  sc.show('answered', at('blocked', 3.9), { fade: 0.3 }).cut(at('blocked', 3.9), [848, 368, 340, 56]);
  sc.callout(at('blocked', 4.2), at('blocked', 5.3), [851, 393, 122, 22], { label: 'your answer', side: 'below' });
  sc.look(at('blocked', 5.4), [476, 456, 340, 56], { dur: 0.6 });
  sc.callout(at('blocked', 6.1), end('blocked') - 0.3, [477, 480, 320, 22], { label: 'and it carries on', side: 'below' });

  // 03 What it's doing now
  sc.show('busy', start('busy'), { fade: 0.3 }).cut(start('busy'), [470, 270, 360, 110]);
  sc.callout(at('busy', 1.8), at('busy', 3.8), [478, 283, 170, 22], { label: 'working, and how long', side: 'right' });
  sc.callout(at('busy', 4.0), end('busy') - 0.3, [478, 303, 220, 68], { label: 'its last three tools', side: 'right' });
  sc.show('midturn-typed', start('midturn'), { fade: 0.3 }).cut(start('midturn'), [478, 650, 420, 100]);
  sc.callout(at('midturn', 0.6), at('midturn', 1.8), { region: 'box', w: 0.45 }, { label: 'while it works', side: 'above' });
  sc.show('midturn', at('midturn', 2.0), { fade: 0.3 }).cut(at('midturn', 2.0), [1000, 290, 400, 70]);
  sc.callout(at('midturn', 2.2), at('midturn', 3.5), 'said', { label: 'reaches it at once', side: 'below' });
  sc.look(at('midturn', 3.6), [470, 380, 400, 70], { dur: 0.5 });
  sc.callout(at('midturn', 4.2), end('midturn') - 0.3, [471, 399, 330, 24], { label: 'no restart', side: 'below' });

  // 04 Where the time went, and the record. The timeline's stops (measured): needs input 761-900,
  // blocked 1040-1180, labels and dates on y 162-200; the totals line runs 481-883 on y 146-153.
  sc.show('timeline-refunds', start('time'), { fade: 0.3 }).cut(start('time'), [478, 105, 420, 110]);
  sc.callout(at('time', 0.8), at('time', 2.4), [476, 159, 424, 43], { label: 'every change, timed', side: 'below' });
  sc.look(at('time', 2.5), [900, 105, 420, 110], { dur: 0.5 });
  sc.callout(at('time', 2.9), at('time', 3.95), [1034, 159, 154, 43], { label: 'red: blocked', side: 'below' });
  sc.look(at('time', 4.0), [620, 105, 420, 110], { dur: 0.5 });
  sc.callout(at('time', 4.5), at('time', 5.9), [755, 159, 154, 43], { label: 'yellow: waiting on you', side: 'below' });
  sc.look(at('time', 6.0), [478, 105, 420, 110], { dur: 0.4 });
  sc.callout(at('time', 6.45), end('time') - 0.3, [476, 141, 414, 18], { label: 'the totals', side: 'below' });
  sc.show('trace-tab', start('trace'), { fade: 0.3 }).cut(start('trace'), [460, 360, 400, 300]);
  sc.callout(at('trace', 0.8), at('trace', 2.6), [465, 366, 377, 280], { label: 'every call', side: 'below' });
  // The call's pane, the same in both shots: Status on y 481-489, the reason on y 532-542.
  sc.show('trace-detail', at('trace', 2.8), { fade: 0.3 }).cut(at('trace', 2.8), [845, 378, 330, 175]);
  sc.callout(at('trace', 3.3), at('trace', 5.3), [852, 474, 134, 22], { label: 'who said yes', side: 'right' });
  sc.show('trace-denied', at('trace', 5.4), { fade: 0.3 });
  sc.callout(at('trace', 5.8), at('trace', 6.95), [864, 527, 182, 20], { label: 'force push to main', side: 'below' });
  sc.callout(at('trace', 7.0), end('trace') - 0.2, [852, 474, 128, 22], { label: 'denied', side: 'right' });

  const on = [[start('home'), end('trace')]];
  sc.visible(on).build();
  screenFrame(s, on);
  shortChips(s, [['01 / ONE SCREEN', 'home', 'kanban'], ['02 / WAITING ON YOU', 'ask', 'blocked'], ['03 / RIGHT NOW', 'busy', 'midturn'], ['04 / THE RECORD', 'time', 'trace']]
    .map(([label, a, z]) => [label, start(a), end(z)]));
  shortCaptions(s, tl);
  return s;
};
