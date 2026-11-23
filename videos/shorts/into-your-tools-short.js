// The short of "AgentRQ, into your tools" (videos/into-your-tools.js): about a minute
// and three quarters, vertical, told over the same real screens. Any agent connects
// from the Setup tab with one MCP config and one start command, Claude Code opens
// with the workspace as a channel, a real task comes back with its test output and
// a question, Slack is linked with a private channel, and Sam, on call, hands the
// agent work with /t and approves its commands in the thread.
// Two Slack moments are drawn, as in the long video, from what AgentRQ posted there
// (no Slack workspace was captured): Sam's /t, and the Allow and Deny in the thread.
// Build: node bin/video.js videos/shorts/into-your-tools-short.js --size 1080x1920
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { el, g } from '../../src/index.js';
import { C } from '../../kit/agentrq.js';
import { loadTimeline, beatsById } from '../lib.js';
import { loadShots } from '../screen.js';
import { pane, tagChip, from, fadeSpan } from '../house.js';
import { shortScene, shortScreen, screenFrame, shortCaptions, shortChips, shortCards, moved, crowd, endArt, retime, SCREEN } from '../short.js';
import { artRelay, artPromise } from '../into-your-tools.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'into-your-tools-short.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, '../screens/into-your-tools');

// The long video's art, timed to this short's words: the agent's terminal from the first
// frame, the team's Slack on "your team", and you carrying each message across.
const HOOK = {
  'hook:2.1': 2.6, 'pain:0.8': 3.3, 'hook:3.3': 4.2, 'hook:4': 4.6, 'pain:2.6': 4.9,
  'pain:4.8': 5.3, 'hook:4.6': 5.6, 'pain:6.3': 5.9, 'pain:5.6': 6.2, 'pain:7.8': 6.5,
};
const PROMISE = { 'promise:1.5': 2.6, 'promise:3.6': 3.0, 'promise:6.4': 5.0 };

// ---------------------------------------------------------------- Slack, drawn at the short's scale

const GREEN = '#86efac';
const CHANNEL = 'agentrq-storefront-4zf0d7xrjybp';
const PEOPLE = { bot: ['R', C.lit, 'AgentRQ', 'APP'], sam: ['S', '#f9a8d4', 'Sam'] };
const X = SCREEN.x + 16;
const Y = SCREEN.y + 16;
// Drawn at 1.3x so its text reads like the captions on a phone: a 468 x 391 window, scaled
// into the box. Everything below is in the window's own coordinates.
const SCALE = 1.3;
const LW = Math.round((SCREEN.w - 32) / SCALE);
const LH = Math.round((SCREEN.h - 32) / SCALE);
const LX = 20; // where messages start

// Shown from t0 (> 0) to t1 only.
const between = (s, node, t0, t1) => s.anim(node, [[0, { opacity: 0 }],
  [t0, { opacity: 0 }, 'step'], [t0 + 0.05, { opacity: 1 }, 'step'], [t1, { opacity: 1 }, 'step'], [t1 + 0.05, { opacity: 0 }, 'step']]);

// One message: avatar, name (and APP for the bot), time, and its lines.
function msg(s, who, x, y, rows, { time = '', fills = [], bold = [] } = {}) {
  const [letter, color, name, badge] = PEOPLE[who];
  const nameW = name.length * 11 + 4;
  return g({},
    el('rect', { x, y, width: 40, height: 40, rx: 8, fill: color }),
    s.text(letter, { x: x + 20, y: y + 28, font: 'bold', size: 20, fill: C.ink, anchor: 'middle' }),
    s.text(name, { x: x + 54, y: y + 16, font: 'bold', size: 18, fill: C.text }),
    ...(badge ? [el('rect', { x: x + 60 + nameW, y: y + 2, width: 36, height: 18, rx: 3, fill: '#27272a' }),
      s.text(badge, { x: x + 78 + nameW, y: y + 15, font: 'semi', size: 11, fill: C.dim, anchor: 'middle' })] : []),
    s.text(time, { x: x + 60 + nameW + (badge ? 44 : 0), y: y + 16, font: 'body', size: 14, fill: C.dim }),
    ...rows.map((t, i) => s.text(t, { x: x + 54, y: y + 42 + i * 26, font: bold.includes(i) ? 'semi' : 'body', size: 17, fill: fills[i] ?? C.text })));
}

const button = (s, label, x, y, stroke) => g({},
  el('rect', { x, y, width: 100, height: 38, rx: 6, fill: C.panel, stroke, 'stroke-width': 2 }),
  s.text(label, { x: x + 50, y: y + 25, font: 'semi', size: 17, fill: C.text, anchor: 'middle' }));

// The window over the screen box: the private channel AgentRQ made, with its lock, and `content`.
function slackWindow(s, title, ...content) {
  return g({},
    el('rect', { x: SCREEN.x, y: SCREEN.y, width: SCREEN.w, height: SCREEN.h, rx: 14, fill: C.bg }),
    g({ transform: `translate(${X} ${Y}) scale(${SCALE})` },
      pane(s, { x: 0, y: 0, w: LW, h: LH, title, color: C.ask }),
      el('rect', { x: 20, y: 46, width: 12, height: 10, fill: C.dim, class: 'px' }),
      el('rect', { x: 22, y: 39, width: 8, height: 7, fill: 'none', stroke: C.dim, 'stroke-width': 2, class: 'px' }),
      s.text(CHANNEL, { x: 42, y: 57, font: 'bold', size: 19, fill: C.text }),
      el('rect', { x: 2, y: 74, width: LW - 4, height: 2, fill: C.line }),
      ...content));
}

// Sam joins, types /t with a title, and AgentRQ makes the task.
function slackT(s, at) {
  const box = { x: LX, y: LH - 76, w: LW - 40, h: 58 };
  return slackWindow(s, 'SLACK · STOREFRONT',
    s.text('Sam joined the channel.', { x: LX, y: 108, font: 'body', size: 17, fill: C.dim }),
    from(s, tagChip(s, 'on call this week', { x: LX + 200, y: 90, fill: C.ask }), at('slack-t', 1.0)),
    el('rect', { x: box.x, y: box.y, width: box.w, height: box.h, rx: 8, fill: '#0b0b0d', stroke: C.line, 'stroke-width': 2 }),
    s.anim(s.text(`Message #${CHANNEL}`, { x: box.x + 14, y: box.y + 36, font: 'body', size: 15, fill: C.dim }),
      [[0, { opacity: 1 }], [at('slack-t', 2.0), { opacity: 1 }, 'step'], [at('slack-t', 2.05), { opacity: 0 }, 'step']]),
    between(s, s.text('/t "Merged cart loses items"', { x: box.x + 14, y: box.y + 37, font: 'mono', size: 17, fill: C.text }), at('slack-t', 2.0), at('slack-t', 3.0)),
    from(s, msg(s, 'sam', LX, 128, ['/t "Merged cart loses items"'], { time: '7:41 AM', fills: [C.dim] }), at('slack-t', 3.0)),
    from(s, msg(s, 'bot', LX, 198, ['Task created successfully:', 'Merged cart loses items'], { time: '7:41 AM', fills: [GREEN, GREEN] }), at('slack-t', 3.3)));
}

// A permission request in a task's thread: Allow and Deny post there, and Sam allows it.
function slackApproval(s, at) {
  const BY = 240;
  return slackWindow(s, 'SLACK · THREAD',
    msg(s, 'bot', LX, 90, ['Agent: Run the test suite'], { time: '7:21 AM' }),
    from(s, msg(s, 'bot', LX, 156, ['Tool Call Request: Bash', 'Run the test suite'], { time: '7:21 AM', bold: [0] }), at('appr', 1.0)),
    between(s, g({}, button(s, 'Allow', LX + 54, BY, GREEN), button(s, 'Deny', LX + 168, BY, C.blocked)), at('appr', 2.4), at('appr', 5.3)),
    between(s, tagChip(s, 'in the thread', { x: LX + 286, y: BY + 6, fill: C.ask }), at('appr', 3.0), at('appr', 5.3)),
    between(s, el('rect', { x: LX + 48, y: BY - 6, width: 112, height: 50, rx: 10, fill: 'none', stroke: GREEN, 'stroke-width': 3 }), at('appr', 4.5), at('appr', 5.3)),
    from(s, g({},
      el('rect', { x: LX + 54, y: BY + 8, width: 16, height: 16, rx: 3, fill: GREEN }),
      s.text('Allowed by @Sam', { x: LX + 80, y: BY + 23, font: 'semi', size: 18, fill: GREEN })), at('appr', 5.3)),
    from(s, msg(s, 'bot', LX, 296, ['Agent: Trace how many pages are read', 'under backpressure'], { time: '7:22 AM' }), at('appr', 5.8)));
}

// ---------------------------------------------------------------- the video

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);
  const s = shortScene({
    tl,
    poster: at('appr', 5.6),
    thumbnail: at('appr', 5.6),
    description: 'A vertical short of plugging AgentRQ into your tools over real screens of the app: the Setup tab with Claude Code, Codex, Antigravity and any ACP agent, one MCP config copied into the project and one start command, Claude Code opening with the workspace as a channel, an order-export task that comes back with its test output and a question Ada answers, Slack linked with a private channel, Sam creating a task with /t, and Allow and Deny posted in the Slack thread, where Sam allows a command.',
  });

  shortCards(s, [
    { span: [0, end('hook')], kicker: 'COPY, PASTE, REPEAT', headline: ['You are the', 'go-between.'], mark: 1, sub: 'Between your agent and your team.',
      art: (sc, y) => moved(artRelay(sc, retime(at, 'hook', HOOK)), y) },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ', headline: ['Plug agents', 'into your tools.'], mark: 1, sub: 'One MCP config. Slack for your team.',
      art: (sc, y) => moved(artPromise(sc, retime(at, 'promise', PROMISE)), y) },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Plug AgentRQ', 'into your tools.'], mark: 1, sub: 'One config, any agent, your team in Slack.',
      art: (sc, y) => endArt(sc, y, { question: 'Which tool should we plug into next?', line: 'Free during beta. Open source.' }) },
  ]);
  crowd(s, ['claude', 'codex', 'agy'], { y: 740, spans: [[start('cta'), tl.end]], hops: [at('cta', 1), at('cta', 1.3), at('cta', 1.6)] });

  const sc = shortScreen(s, loadShots(SHOTS));

  // The camera frames about 340 px of a text row (k ~1.8) so a phone reads it.
  // Rows and words measured with rows.cjs and wordx.cjs.
  // 01 Any agent
  sc.show('setup-top', start('setup'), { fade: 0 }).cut(start('setup'), [95, 110, 340, 110]);
  sc.callout(at('setup', 0.6), at('setup', 2.2), 'nav', { label: 'Setup', side: 'right' });
  sc.cut(at('setup', 2.3), [345, 600, 400, 80]);
  sc.callout(at('setup', 3.1), at('setup', 3.7), 'claude', { label: 'Claude Code', side: 'above' });
  sc.callout(at('setup', 3.75), at('setup', 4.1), [548, 629, 48, 33], { label: 'Codex', side: 'above' });
  sc.callout(at('setup', 4.1), at('setup', 4.8), [452, 629, 88, 33], { label: 'Antigravity', side: 'above' });
  sc.callout(at('setup', 4.85), end('setup') - 0.3, [412, 629, 30, 33], { label: 'any ACP agent', side: 'above' });
  sc.show('setup-config', start('config'), { fade: 0.3 }).cut(start('config'), [370, 200, 340, 180]);
  sc.callout(at('config', 0.6), at('config', 2.0), [376, 236, 330, 142], { label: 'one MCP config', side: 'below' });
  sc.look(at('config', 2.05), [1040, 170, 340, 120], { dur: 0.45 });
  sc.click(at('config', 2.6), 'copy');
  sc.show('setup-copied', at('config', 2.8), { fade: 0.2 }).away(at('config', 2.9));
  sc.callout(at('config', 3.0), at('config', 3.6), 'copied', { label: 'into the project', side: 'below' });
  sc.show('setup-start', at('config', 3.7), { fade: 0.3 }).cut(at('config', 3.7), [385, 585, 340, 60]);
  sc.callout(at('config', 4.0), end('config') - 0.3, [388, 607, 340, 22], { label: 'one start command', side: 'below' });
  sc.show('c6-2', start('channel'), { fade: 0.3 }).cut(start('channel'), [92, 160, 340, 110]);
  sc.callout(at('channel', 0.6), at('channel', 2.0), [98, 168, 250, 56], { label: 'Claude Code', side: 'above' });
  sc.callout(at('channel', 2.1), at('channel', 3.6), [92, 238, 340, 22], { label: 'the workspace, as a channel', side: 'below' });
  sc.look(at('channel', 3.65), [1005, 670, 420, 130], { dur: 0.45 });
  sc.callout(at('channel', 4.1), end('channel') - 0.3, [1016, 690, 404, 96], { label: 'tasks reach it on their own', side: 'above' });

  // 02 A real task
  sc.show('ex-new', start('task'), { fade: 0.3 }).cut(start('task'), [370, 225, 340, 130]);
  sc.callout(at('task', 0.8), at('task', 1.9), [376, 236, 256, 18], { label: 'a real task', side: 'above' });
  sc.callout(at('task', 2.0), at('task', 3.4), [374, 264, 336, 20], { label: 'the export times out', side: 'below' });
  sc.callout(at('task', 3.5), at('task', 4.2), [374, 324, 240, 20], { label: 'so stream it', side: 'below' });
  sc.show('ex2-reply-file', at('task', 4.3), { fade: 0.3 }).cut(at('task', 4.3), [478, 495, 340, 110]);
  sc.callout(at('task', 4.5), at('task', 5.3), [480, 527, 336, 20], { label: 'it reports back', side: 'above' });
  sc.callout(at('task', 5.4), end('task') - 0.3, [480, 572, 128, 26], { label: 'the test output', side: 'right' });
  sc.show('ex2-ask', start('ask'), { fade: 0.3 }).cut(start('ask'), [478, 245, 340, 230]);
  sc.callout(at('ask', 0.8), at('ask', 3.4), [490, 251, 152, 18], { label: 'it asks on the task', side: 'right' });
  sc.show('ans-typed', at('ask', 3.5), { fade: 0.3 }).cut(at('ask', 3.5), [475, 680, 340, 70]);
  sc.callout(at('ask', 3.7), at('ask', 4.4), [482, 701, 320, 22], { label: 'Ada answers', side: 'above' });
  sc.show('ans-reply', at('ask', 4.5), { fade: 0.3 }).cut(at('ask', 4.5), [476, 505, 340, 70]);
  sc.callout(at('ask', 4.7), end('ask') - 0.3, [478, 537, 242, 22], { label: 'and it carries on', side: 'below' });

  // 03 Your team, in Slack
  sc.show('slack-off', start('slack-add'), { fade: 0.3 }).cut(start('slack-add'), [378, 220, 340, 90]);
  sc.callout(at('slack-add', 0.6), at('slack-add', 1.5), [376, 239, 188, 20], { label: 'not linked yet', side: 'right' });
  sc.look(at('slack-add', 1.55), [1030, 320, 340, 100], { dur: 0.4 });
  sc.callout(at('slack-add', 2.0), at('slack-add', 2.6), 'add', { label: 'Add to Slack', side: 'below' });
  sc.click(at('slack-add', 2.65), 'add');
  sc.show('slack-linked', at('slack-add', 2.85), { fade: 0.25 }).away(at('slack-add', 2.95)).cut(at('slack-add', 2.85), [370, 230, 340, 160]);
  sc.callout(at('slack-add', 3.0), at('slack-add', 3.7), [376, 248, 145, 20], { label: 'linked', side: 'right' });
  sc.callout(at('slack-add', 3.8), end('slack-add') - 0.3, [375, 364, 200, 20], { label: 'its own private channel', side: 'below' });
  // slack-t opens on the drawn Slack window (below); the real task follows it.
  sc.show('tm-board', at('slack-t', 3.9), { fade: 0 }).cut(at('slack-t', 3.9), [95, 100, 340, 130]);
  sc.callout(at('slack-t', 4.1), at('slack-t', 5.1), [100, 150, 345, 58], { label: 'in AgentRQ', side: 'below' });
  sc.show('tm-mention', at('slack-t', 5.2), { fade: 0.3 }).cut(at('slack-t', 5.2), [985, 225, 400, 130]);
  sc.callout(at('slack-t', 5.4), end('slack-t') - 0.3, [1000, 245, 130, 18], { label: 'from Slack', side: 'above' });

  const on = [[start('setup'), end('appr')]];
  sc.visible(on).build();
  // Drawn where no screen shows it: Sam's /t, and the approval in the thread.
  s.add(fadeSpan(s, slackT(s, at), [start('slack-t'), at('slack-t', 3.9)]));
  s.add(fadeSpan(s, slackApproval(s, at), [start('appr'), end('appr')]));
  screenFrame(s, on);
  shortChips(s, [['01 / ANY AGENT', 'setup', 'channel'], ['02 / A REAL TASK', 'task', 'ask'], ['03 / YOUR TEAM, IN SLACK', 'slack-add', 'appr']]
    .map(([label, a, z]) => [label, start(a), end(z)]));
  shortCaptions(s, tl);
  return s;
};
