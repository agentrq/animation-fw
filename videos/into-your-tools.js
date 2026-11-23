// AgentRQ, into your tools, narrated, about five and a half minutes: each chapter opens
// on a pain in the house style (ground, mascots, pixel art), then shows the fix on real
// screens of the app, captured with src/capture.js from a local AgentRQ where Ada runs
// storefront. Everything on screen ran for real: the Setup tab gave the MCP config,
// Claude Code started with the workspace as its channel and listed its seven tools,
// it streamed the order export, asked about cancelled orders, saved what it learned
// to memory and fixed the cart bug Sam sent from Slack; the agentrq-ws CLI opened a
// task with a build log. The Slack side was real too, against a local stand-in for
// Slack's API: AgentRQ created the channel, posted every task and message, and took
// Sam's signed /t, mention and button clicks. The Slack panes are drawn from what it
// posted, and the terminals from the commands' real output.
// The captures and their regions are in videos/screens/into-your-tools.
// Build: node bin/video.js videos/into-your-tools.js --size 3840x2160
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { el, g } from '../src/index.js';
import { C, mascotByName, mascot } from '../kit/agentrq.js';
import { loadTimeline, beatsById, videoScene, showDuring, captions, VW } from './lib.js';
import { BAND, LIFT, ARTX, collect, fadeSpan, groundStrip, pane, tagChip, from, addCards, chapterChips } from './house.js';
import { Screen, loadShots } from './screen.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'into-your-tools.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, 'screens/into-your-tools');

// Storefront's agent, and the two that join through the gateway.
const NAMES = ['claude', 'codex', 'agy'];
const MX = (i) => 700 + i * 170;
const [SHOP] = NAMES.map((n) => mascotByName(n).color);
const GREEN = '#86efac';
const CHANNEL = 'agentrq-storefront-4zf0d7xrjybp';

// Shown from t0 to t1 only (0 < t0 < t1).
const between = (s, node, t0, t1) => s.anim(node, [[0, { opacity: 0 }],
  [t0, { opacity: 0 }, 'step'], [t0 + 0.05, { opacity: 1 }, 'step'], [t1, { opacity: 1 }, 'step'], [t1 + 0.05, { opacity: 0 }, 'step']]);

// Lines of mono text, each stepping in at its own moment: [[text, fill, t]]. An empty
// row keeps its place as a gap; a tab starts a second column at x + tab (SVG text
// collapses runs of spaces, so columns cannot be padded with them).
const lines = (s, x, y, rows, { size = 14, gap = 22, font = 'mono', tab = 120 } = {}) => g({},
  ...rows.map(([text, fill, t], i) => (text ? from(s, g({},
    ...text.split('\t').map((part, c) => s.text(part, { x: x + c * tab, y: y + i * gap, font, size, fill }))), t) : null)).filter(Boolean));

// ---------------------------------------------------------------- the cards' art

// The go-between: a bug comes in on Slack, goes into the terminal by hand, and the
// agent's question goes back the same way.
export function artRelay(s, at) {
  const SX = ARTX;
  const TX = ARTX + 350;
  return g({},
    pane(s, { x: TX, y: 96, w: 260, h: 200, title: 'STOREFRONT · CLAUDE', color: SHOP }),
    lines(s, TX + 14, 150, [['> working ...', C.dim, 0.01]]),
    from(s, g({},
      pane(s, { x: SX, y: 96, w: 260, h: 200, title: 'SLACK · #STOREFRONT', color: C.ask }),
      s.text('team chat', { x: SX + 14, y: 150, font: 'mono', size: 14, fill: C.dim })), at('hook', 2.1)),
    from(s, tagChip(s, 'YOU', { x: SX + 278, y: 176, fill: C.text }), at('hook', 3.3)),
    from(s, s.text('->', { x: SX + 296, y: 162, font: 'pixel', size: 16, fill: C.ask }), at('hook', 4.0)),
    from(s, s.text('<-', { x: SX + 296, y: 232, font: 'pixel', size: 16, fill: C.ask }), at('hook', 4.6)),
    lines(s, SX + 14, 178, [['sam: cart drops items', C.text, at('pain', 0.8)], ['', C.text, 0], ['', C.text, 0], ['you: guest or account?', C.ask, at('pain', 6.3)]]),
    lines(s, TX + 14, 178, [['> cart drops items', C.text, at('pain', 2.6)], ['', C.text, 0], ['? guest cart, or the', C.ask, at('pain', 4.8)], ['  account\'s?', C.ask, at('pain', 4.8)]]),
    from(s, tagChip(s, 'copy, paste, repeat', { x: SX + 60, y: 330, fill: C.ask }), at('pain', 5.6)),
    from(s, tagChip(s, 'all day', { x: SX + 300, y: 330, fill: C.blocked, color: C.text }), at('pain', 7.8)));
}

// The promise: one config, seven tools, and Slack.
export function artPromise(s, at) {
  const W = [['ONE CONFIG', 'any agent, connected', 1.5], ['SEVEN TOOLS', 'tasks, memory, skills ...', 3.6], ['SLACK', 'hand it work, approve it', 6.4]];
  return g({},
    ...W.map(([kind, line, o], i) => from(s, g({},
      el('rect', { x: ARTX + (i % 2) * 300, y: 80 + Math.floor(i / 2) * 120, width: 280, height: 100, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
      s.text(kind, { x: ARTX + (i % 2) * 300 + 18, y: 116 + Math.floor(i / 2) * 120, font: 'pixel', size: 14, fill: C.lit }),
      s.text(line, { x: ARTX + (i % 2) * 300 + 18, y: 150 + Math.floor(i / 2) * 120, font: 'body', size: 16, fill: C.text })), at('promise', o))));
}

// Every agent its own setup: files, flags and docs.
function artSetups(s, at) {
  const P = [
    ['FILES', ['.mcp.json', 'settings.local.json', 'config.toml'], 0.8],
    ['FLAGS', ['--channels ...', '--config ...', '--login'], 2.2],
    ['DOCS', ['a README each', 'a setup guide each', 'a page of caveats'], 3.6],
  ];
  return g({},
    ...P.map(([title, rows, o], i) => from(s, g({},
      pane(s, { x: ARTX + i * 200, y: 90 + i * 30, w: 190, h: 150, title, color: [SHOP, C.ask, C.dim][i] }),
      ...rows.map((r, j) => s.text(r, { x: ARTX + i * 200 + 12, y: 90 + i * 30 + 52 + j * 26, font: 'mono', size: 12, fill: C.text }))), at('conn-pain', o))),
    from(s, tagChip(s, 'a new setup, every agent', { x: ARTX + 120, y: 340, fill: C.blocked, color: C.text }), at('conn-pain', 4.8)));
}

// The team, busy in Slack.
function artTeam(s, at) {
  const X = ARTX + 20;
  const row = (who, color, text, y, t) => from(s, g({},
    el('rect', { x: X + 18, y, width: 26, height: 26, fill: color, class: 'px' }),
    s.text(who, { x: X + 56, y: y + 12, font: 'semi', size: 14, fill: C.text }),
    s.text(text, { x: X + 56, y: y + 32, font: 'body', size: 14, fill: C.dim })), t);
  return g({},
    pane(s, { x: X, y: 80, w: 560, h: 250, title: 'SLACK · #STOREFRONT', color: C.ask }),
    row('Sam', '#f9a8d4', 'on call this week. ping me', 120, at('slack-pain', 0.9)),
    row('Chen', '#fcd34d', 'the checkout fix is up for review', 182, at('slack-pain', 1.8)),
    row('Ben', '#a5b4fc', 'who looks at the cart bug?', 244, at('slack-pain', 2.7)),
    from(s, tagChip(s, 'not in one more tab', { x: X + 150, y: 350, fill: C.ask }), at('slack-pain', 4.0)));
}

// The end card: the question to answer, and where to try it.
function artEnd(s) {
  return g({},
    s.text('agentrq.com', { x: 860, y: 200, font: 'bold', size: 64, fill: C.text, anchor: 'middle', spacing: -1.5 }),
    s.text('Any agent, seven tools, and Slack', { x: 860, y: 244, font: 'body', size: 20, fill: C.dim, anchor: 'middle' }),
    el('rect', { x: 560, y: 290, width: 600, height: 54, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
    s.text('Which tool should we plug into next?', { x: 860, y: 324, font: 'semi', size: 18, fill: C.lit, anchor: 'middle' }));
}

// ---------------------------------------------------------------- Slack, drawn from what AgentRQ posted

// Who speaks in the channel: AgentRQ's bot, Sam and Ada.
const PEOPLE = { bot: ['R', C.lit, 'AgentRQ', 'APP'], sam: ['S', '#f9a8d4', 'Sam'], ada: ['A', '#93c5fd', 'Ada Park'] };

function avatar(s, who, x, y, size = 36) {
  const [letter, color] = PEOPLE[who];
  return g({}, el('rect', { x, y, width: size, height: size, rx: 8, fill: color }),
    s.text(letter, { x: x + size / 2, y: y + size * 0.7, font: 'bold', size: size / 2, fill: C.ink, anchor: 'middle' }));
}

// One message: avatar, name (and APP for the bot), time, and its lines.
function msg(s, who, x, y, rows, { time = '', fills = [], bold = [] } = {}) {
  const [, , name, badge] = PEOPLE[who];
  const nameW = name.length * 10.5 + 4;
  return g({},
    avatar(s, who, x, y),
    s.text(name, { x: x + 50, y: y + 14, font: 'bold', size: 16, fill: C.text }),
    ...(badge ? [el('rect', { x: x + 56 + nameW, y: y + 1, width: 34, height: 17, rx: 3, fill: '#27272a' }),
      s.text(badge, { x: x + 73 + nameW, y: y + 14, font: 'semi', size: 10, fill: C.dim, anchor: 'middle' })] : []),
    s.text(time, { x: x + 56 + nameW + (badge ? 42 : 0), y: y + 14, font: 'body', size: 12, fill: C.dim }),
    ...rows.map((t, i) => s.text(t, { x: x + 50, y: y + 38 + i * 23, font: bold.includes(i) ? 'semi' : 'body', size: 15, fill: fills[i] ?? C.text })));
}

const button = (s, label, x, y, stroke, w = 96) => g({},
  el('rect', { x, y, width: w, height: 32, rx: 6, fill: C.panel, stroke, 'stroke-width': 2 }),
  s.text(label, { x: x + w / 2, y: y + 21, font: 'semi', size: 14, fill: C.text, anchor: 'middle' }));
const ring = (s, x, y, w, h, t0, t1) => between(s, el('rect', { x: x - 6, y: y - 6, width: w + 12, height: h + 12, rx: 10, fill: 'none', stroke: GREEN, 'stroke-width': 3 }), t0, t1);
// The line a decided request turns into.
const verdict = (s, x, y, text, fill = GREEN) => g({},
  el('rect', { x, y: y - 14, width: 14, height: 14, rx: 3, fill }),
  s.text(text, { x: x + 22, y, font: 'semi', size: 15, fill }));
const fileChip = (s, name, x, y) => g({},
  el('rect', { x, y, width: name.length * 8.6 + 44, height: 34, rx: 6, fill: '#0b0b0d', stroke: C.line }),
  el('rect', { x: x + 10, y: y + 9, width: 12, height: 16, fill: C.dim, class: 'px' }),
  s.text(name, { x: x + 32, y: y + 22, font: 'mono', size: 13, fill: C.text }));

// The Slack window: a pane, the private channel's name with a lock, and a line under it.
function slackWindow(s, { x, y, w, h, title = 'SLACK' }) {
  return g({},
    el('rect', { x: 0, y: 0, width: VW, height: BAND, fill: C.bg }),
    pane(s, { x, y, w, h, title, color: C.ask }),
    el('rect', { x: x + 20, y: y + 44, width: 10, height: 8, fill: C.dim, class: 'px' }),
    el('rect', { x: x + 22, y: y + 38, width: 6, height: 6, fill: 'none', stroke: C.dim, 'stroke-width': 2, class: 'px' }),
    s.text(CHANNEL, { x: x + 38, y: y + 54, font: 'bold', size: 17, fill: C.text }),
    el('rect', { x: x + 2, y: y + 70, width: w - 4, height: 2, fill: C.line }));
}

// The thread side panel, on the right of the window.
function threadPanel(s, { x, y, w, h }) {
  return g({},
    el('rect', { x, y, width: w, height: h, fill: '#141417', stroke: C.line, 'stroke-width': 2 }),
    s.text('Thread', { x: x + 18, y: y + 28, font: 'bold', size: 16, fill: C.text }),
    s.text(`# ${CHANNEL}`, { x: x + 80, y: y + 28, font: 'body', size: 12, fill: C.dim }),
    el('rect', { x: x + 2, y: y + 42, width: w - 4, height: 2, fill: C.line }));
}

const X0 = 120;
const W0 = 960;
const Y0 = 36;
const H0 = 520;

// From Sam's invite to his first task, in one window: the channel AgentRQ made, a
// task's thread, and /t.
function slackChannel(s, at, start) {
  const MX0 = X0 + 24;
  const thr = { x: X0 + 520, y: Y0 + 80, w: 420, h: 420 };
  return g({},
    slackWindow(s, { x: X0, y: Y0, w: W0, h: H0, title: 'SLACK · STOREFRONT' }),
    // slack-invite: AgentRQ made the channel and invited Ada; she invites Sam.
    between(s, g({},
      s.text('AgentRQ created this private channel for storefront, and added Ada Park.', { x: MX0, y: Y0 + 108, font: 'body', size: 15, fill: C.dim }),
      from(s, msg(s, 'ada', MX0, Y0 + 130, ['/invite @Sam'], { time: '7:13 AM', fills: [C.lit] }), at('slack-invite', 1.0)),
      from(s, s.text('Sam joined the channel.', { x: MX0 + 50, y: Y0 + 220, font: 'body', size: 15, fill: C.dim }), at('slack-invite', 2.4)),
      from(s, tagChip(s, 'on call this week', { x: MX0 + 50, y: Y0 + 240, fill: C.ask }), at('slack-invite', 3.0))), start('slack-invite'), start('slack-thread')),
    // slack-thread: Ada's export task, posted as its own thread.
    between(s, g({},
      msg(s, 'bot', MX0, Y0 + 100, ['New Task: Order export times out on big stores', 'Admin > Orders > Download CSV times out for shops', 'with a lot of orders (ticket #4821). The export', 'builds the whole file in memory before it sends a byte.'], { time: '7:18 AM', bold: [0] }),
      s.text('29 replies', { x: MX0 + 50, y: Y0 + 244, font: 'semi', size: 14, fill: '#7dd3fc' }),
      from(s, g({},
        threadPanel(s, thr),
        msg(s, 'bot', thr.x + 16, thr.y + 62, ['To send replies to this task, use', '@AgentRQ <message> in this thread.'], { time: '7:18 AM' }),
        msg(s, 'bot', thr.x + 16, thr.y + 160, ['Agent: Started on #4821. The cause:', 'exportOrdersCsv loads every page into', 'one array, builds the whole CSV string,', 'and only then calls res.end.'], { time: '7:19 AM' }),
        msg(s, 'bot', thr.x + 16, thr.y + 290, ['Agent: #4821: the CSV export now', 'streams. npm test passes: 8 of 8.'], { time: '7:23 AM' })), at('slack-thread', 4.5))),
    start('slack-thread'), start('slack-t')),
    // slack-t: Sam types /t with a title and a description; AgentRQ posts the task.
    between(s, g({},
      el('rect', { x: MX0, y: Y0 + H0 - 84, width: W0 - 48, height: 60, rx: 8, fill: '#0b0b0d', stroke: C.line, 'stroke-width': 2 }),
      between(s, s.text('Message #' + CHANNEL, { x: MX0 + 16, y: Y0 + H0 - 48, font: 'body', size: 15, fill: C.dim }), start('slack-t'), at('slack-t', 0.9)),
      between(s, g({},
        s.text('/t "Merged cart loses items" "A shopper had 2 mugs as a guest and 1 in their', { x: MX0 + 16, y: Y0 + H0 - 58, font: 'mono', size: 13, fill: C.text }),
        s.text('account. After sign-in the cart shows 2, not 3. mergeCarts should add the quantities."', { x: MX0 + 16, y: Y0 + H0 - 38, font: 'mono', size: 13, fill: C.text })), at('slack-t', 0.9), at('slack-t', 3.6)),
      from(s, msg(s, 'sam', MX0, Y0 + 96, ['/t "Merged cart loses items" "A shopper had 2 mugs ..."'], { time: '7:41 AM', fills: [C.dim] }), at('slack-t', 3.6)),
      from(s, msg(s, 'bot', MX0, Y0 + 170, ['Task created successfully: Merged cart loses items'], { time: '7:41 AM', fills: [GREEN] }), at('slack-t', 4.2)),
      from(s, msg(s, 'bot', MX0, Y0 + 244, ['New Task: Merged cart loses items', 'A shopper had 2 mugs as a guest and 1 in their account. After', 'sign-in the cart shows 2, not 3. mergeCarts should add the quantities.'], { time: '7:41 AM', bold: [0] }), at('slack-t', 4.8))),
    start('slack-t'), at('slack-t', 7.0)));
}

// The cart task's thread: Sam steers the agent with a mention and the ticket.
function slackMention(s, at) {
  const MX0 = X0 + 24;
  return g({},
    slackWindow(s, { x: X0, y: Y0, w: W0, h: H0, title: 'SLACK · THREAD' }),
    msg(s, 'bot', MX0, Y0 + 96, ['New Task: Merged cart loses items', 'A shopper had 2 mugs as a guest and 1 in their account. After', 'sign-in the cart shows 2, not 3. mergeCarts should add the quantities.'], { time: '7:41 AM', bold: [0] }),
    el('rect', { x: MX0 + 50, y: Y0 + 196, width: W0 - 120, height: 2, fill: C.line }),
    msg(s, 'bot', MX0 + 50, Y0 + 214, ['To send replies to this task, use @AgentRQ <message> in this thread.'], { time: '7:41 AM' }),
    from(s, g({},
      msg(s, 'sam', MX0 + 50, Y0 + 290, ['@AgentRQ the ticket has the shopper\'s two carts. Add it as a test case.'], { time: '7:41 AM' }),
      fileChip(s, 'ticket-4907.json', MX0 + 100, Y0 + 344)), at('slack-mention', 0.9)),
    from(s, tagChip(s, 'the mention, the file', { x: MX0 + 100, y: Y0 + 400, fill: C.ask }), at('slack-mention', 2.6)));
}

// A permission request in the export task's thread, answered by Sam there.
function slackPermission(s, at) {
  const MX0 = X0 + 24;
  const BY = Y0 + 254;
  return g({},
    slackWindow(s, { x: X0, y: Y0, w: W0, h: H0, title: 'SLACK · THREAD' }),
    msg(s, 'bot', MX0, Y0 + 96, ['Agent: Run the test suite'], { time: '7:21 AM' }),
    from(s, g({},
      msg(s, 'bot', MX0, Y0 + 170, ['Tool Call Request: Bash Run the test suite'], { time: '7:21 AM', bold: [0] }),
      between(s, g({}, button(s, 'Allow', MX0 + 50, BY, GREEN), button(s, 'Deny', MX0 + 162, BY, C.blocked)), at('appr-ask', 1.5), at('appr-click', 2.6))), at('appr-ask', 1.5)),
    between(s, tagChip(s, 'Allow or Deny, in the thread', { x: MX0 + 290, y: BY + 3, fill: C.ask }), at('appr-ask', 4.0), at('appr-click', 2.5)),
    ring(s, MX0 + 50, BY, 96, 32, at('appr-click', 0.9), at('appr-click', 2.4)),
    from(s, verdict(s, MX0 + 50, BY + 22, 'Allowed by @Sam'), at('appr-click', 2.6)),
    from(s, msg(s, 'bot', MX0, Y0 + 320, ['Agent: Trace how many pages are read under backpressure'], { time: '7:22 AM' }), at('appr-click', 4.0)),
    from(s, tagChip(s, 'one line: allowed by Sam', { x: MX0 + 50, y: Y0 + 400, fill: GREEN }), at('appr-click', 5.0)));
}

// The cart task's thread, after Ada allowed its request in the browser.
function slackWeb(s, at) {
  const MX0 = X0 + 24;
  return g({},
    slackWindow(s, { x: X0, y: Y0, w: W0, h: H0, title: 'SLACK · THREAD' }),
    msg(s, 'bot', MX0, Y0 + 96, ['Agent: Run tests, then cart tests against old code'], { time: '7:42 AM' }),
    msg(s, 'bot', MX0, Y0 + 170, ['Tool Call Request: Bash Run tests, then cart tests against old code'], { time: '7:42 AM', bold: [0] }),
    from(s, verdict(s, MX0 + 50, Y0 + 276, 'Allowed by operator (via Web UI)'), at('appr-web', 3.4)),
    from(s, tagChip(s, 'no buttons left to click', { x: MX0 + 50, y: Y0 + 310, fill: GREEN }), at('appr-web', 5.0)),
    from(s, tagChip(s, 'answered once', { x: MX0 + 320, y: Y0 + 310, fill: C.ask }), at('appr-web', 6.0)));
}

// Requests that did not come from Slack, and the channel's members, who approve.
function slackGuards(s, at, start) {
  const X = 150;
  const Y = 70;
  const member = (who, y, note, t) => g({},
    avatar(s, who, X + 30, y),
    s.text(PEOPLE[who][2], { x: X + 80, y: y + 24, font: 'semi', size: 17, fill: C.text }),
    ...(note ? [from(s, tagChip(s, note, { x: X + 330, y: y + 6, fill: GREEN }), t)] : []));
  return g({},
    el('rect', { x: 0, y: 0, width: VW, height: BAND, fill: C.bg }),
    between(s, g({},
      pane(s, { x: X, y: Y, w: 900, h: 300, title: 'STOREFRONT · REQUESTS NOT FROM SLACK', color: C.lit }),
      lines(s, X + 24, Y + 70, [
        ['POST /slack/commands\tno signature', C.text, at('ctl-sig', 0.9)],
        ['-> 401\tinvalid signature', C.blocked, at('ctl-sig', 1.8)],
        ['', C.text, 0],
        ['POST /slack/commands\tsigned 10 minutes ago', C.text, at('ctl-sig', 3.4)],
        ['-> 401\tinvalid signature', C.blocked, at('ctl-sig', 4.3)],
      ], { size: 20, gap: 40, tab: 290 }),
      from(s, tagChip(s, 'older than 5 minutes: refused', { x: X + 24, y: Y + 330, fill: C.ask }), at('ctl-sig', 5.0))), start('ctl-sig'), start('ctl-members')),
    between(s, g({},
      pane(s, { x: X, y: Y, w: 900, h: 330, title: `SLACK · MEMBERS OF #${CHANNEL.toUpperCase()}`, color: C.ask }),
      member('ada', Y + 60, 'can approve', at('ctl-members', 0.9)),
      member('sam', Y + 130, 'can approve', at('ctl-members', 1.6)),
      member('bot', Y + 200),
      from(s, tagChip(s, 'the members are the approvers', { x: X + 30, y: Y + 360, fill: C.ask }), at('ctl-members', 4.2)),
      from(s, tagChip(s, 'keep the list short', { x: X + 400, y: Y + 360, fill: C.blocked, color: C.text }), at('ctl-members', 7.1))), start('ctl-members'), at('ctl-members', 8.4)));
}

// Drawn from the CLI's real output: the CI runner's terminal.
function cliTerminal(s, at) {
  const X = 90;
  const Y = 40;
  const T = (o) => at('tool-cli', o);
  return g({},
    el('rect', { x: 0, y: 0, width: VW, height: BAND, fill: C.bg }),
    pane(s, { x: X, y: Y, w: 1020, h: 500, title: 'CI RUNNER · STOREFRONT · TERMINAL', color: C.lit }),
    lines(s, X + 18, Y + 56, [
      ['$ agentrq-ws tools', C.lit, T(0.8)],
      ['help\tHow to call this server\'s tools.', C.text, T(2.4)],
      ['memory\tThis workspace\'s memory: notes that outlive a task, shared by every agent ...', C.text, T(2.6)],
      ['pano\tRead and write the Pano: markdown docs shared by every workspace ...', C.text, T(2.8)],
      ['siteTools\tThe WebMCP tools of websites the human shared with this workspace ...', C.text, T(3.0)],
      ['skills\tThe skills this workspace can use.', C.text, T(3.2)],
      ['task\tWork on this workspace\'s tasks and talk to the human in them.', C.text, T(3.4)],
      ['workspace\tThis workspace.', C.text, T(3.6)],
      ['$ agentrq-ws task create "Nightly build failed on main" \\', C.lit, T(6.0)],
      ['    --body "npm test failed in last night\'s run on main: 1 of 5 tests." --attach build.log', C.lit, T(6.0)],
      ['task created with id=0mTEineMVDp', GREEN, T(6.6)],
      ['$ agentrq-ws reply 0mTEineMVDp "Re-ran it this morning: same failure." \\', C.lit, T(7.2)],
      ['    --attach rerun.log', C.lit, T(7.2)],
      ['reply sent', GREEN, T(7.6)],
    ], { size: 14, gap: 30 }),
    from(s, tagChip(s, 'the same seven tools', { x: X + 760, y: Y + 72, fill: C.ask }), T(4.0)));
}

// The plugins: Claude Code's from the marketplace, Cursor's from its sidebar.
function plugins(s, at) {
  const X = 150;
  const Y = 70;
  return g({},
    el('rect', { x: 0, y: 0, width: VW, height: BAND, fill: C.bg }),
    from(s, g({},
      pane(s, { x: X, y: Y, w: 900, h: 190, title: 'CLAUDE CODE · PLUGIN', color: SHOP }),
      s.text('/plugin marketplace add https://github.com/agentrq/agentrq', { x: X + 24, y: Y + 80, font: 'mono', size: 18, fill: C.text }),
      s.text('/plugin install agentrq-workspace@agentrq', { x: X + 24, y: Y + 124, font: 'mono', size: 18, fill: C.text })), at('conn-more', 0.8)),
    from(s, g({},
      pane(s, { x: X, y: Y + 230, w: 900, h: 150, title: 'CURSOR · PLUGIN', color: C.dim }),
      s.text('Customize  >  AgentRQ  >  Install', { x: X + 24, y: Y + 320, font: 'mono', size: 18, fill: C.text })), at('conn-more', 2.0)));
}

// ---------------------------------------------------------------- the video

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);

  const s = videoScene({
    tl,
    ground: false,
    poster: at('promise', 9.0),
    thumbnail: at('promise', 9.0),
    description: 'AgentRQ, into your tools, narrated over real screens of the app: Ada connects Claude Code to her storefront workspace with one MCP config from the Setup tab, gives it a real task it streams, answers, and remembers; a CI job opens a task with the agentrq-ws CLI; she links Slack, where her teammate Sam hands the agent work with /t, steers it with a mention and approves its commands, while the tokens, the signature check and the channel\'s members keep it in hand.',
  });
  groundStrip(s);

  // ------------------------------------------------ cards
  const CARDS = [
    { span: [0, end('pain')], kicker: 'COPY, PASTE, REPEAT', headline: ['You are the', 'go-between.'], sub: 'Between your agent and your team, all day.', art: artRelay },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ', headline: ['Plug agents', 'into your tools.'], sub: 'One MCP config. Slack for your team.', art: artPromise },
    { span: [start('conn-pain'), end('conn-pain')], kicker: '01 / CONNECT ANY AGENT', headline: ['Every agent,', 'its own setup.'], sub: 'Its own files, flags and docs.', art: artSetups },
    { span: [start('slack-pain'), end('slack-pain')], kicker: '03 / YOUR TEAM, IN SLACK', headline: ['Your team', 'lives in Slack.'], sub: 'Not in one more tab.', art: artTeam },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Plug AgentRQ', 'into your tools.'], sub: 'Any agent, seven tools, and Slack.', art: artEnd },
  ];
  addCards(s, CARDS, at);

  // The mascots, the agents that connect, stand under every card and react to its story.
  const cardSpans = CARDS.map((c) => c.span);
  const sp = (id, a) => [at(id, a), end(id) - 0.2];
  const BEHAVE = {
    claude: { work: [[at('hook', 0.6), end('hook') - 0.2]], ask: [sp('pain', 4.8)], done: [sp('promise', 1.5), sp('cta', 1)], say: [['?', [sp('conn-pain', 0.8)]]] },
    codex: { work: [[at('hook', 0.8), end('hook') - 0.2]], done: [sp('promise', 3.6), sp('cta', 1.3)], say: [['?', [sp('conn-pain', 2.2)]]], alert: [sp('slack-pain', 0.9)] },
    agy: { done: [sp('promise', 6.4), sp('cta', 1.6)], say: [['zZ', [sp('pain', 7.8)]], ['?', [sp('conn-pain', 3.6)]]] },
  };
  const hopsAt = (spans) => spans.map(([t0]) => [t0, 16]);
  const crowd = collect(s, () => NAMES.forEach((n, i) => {
    const m = BEHAVE[n];
    mascot(s, { ...mascotByName(n), name: n === 'agy' ? 'antigravity' : n }, i, {
      x: MX(i), hops: hopsAt([...m.done, ...(m.alert ?? [])]), ...m,
    });
  }));
  s.add(showDuring(s, g({ transform: `translate(0 ${LIFT})` }, crowd), cardSpans));

  // ------------------------------------------------ screens
  const shots = loadShots(SHOTS);
  const sc = new Screen(s, shots, { safe: { x: 0, y: 0, w: VW, h: BAND } });
  // Frames for the camera (CSS px).
  const SETUP_FRAME = [90, 100, 1300, 590]; // the Setup tab, its agents' tabs included
  const TABS_FRAME = [330, 560, 640, 130];
  const CONFIG_FRAME = [340, 200, 1040, 300]; // 1 · the MCP config, below the page title (a cut title reads "ngs")
  const PERMS_FRAME = [340, 420, 1040, 370]; // 2 · Claude's permissions
  const START_FRAME = [340, 480, 1040, 210]; // 3 · the start command
  const CH_FRAME = [80, 150, 1340, 130]; // Claude Code's banner and its channel line
  const TOAST_FRAME = [860, 600, 580, 210]; // the corner where toasts come in
  const ACP_FRAME = [340, 300, 1040, 380]; // Codex: through the gateway
  const MACHINE_FRAME = [340, 120, 1040, 500];
  const MCP2_FRAME = [90, 500, 700, 110]; // /mcp: the project's server
  const MCP4_FRAME = [80, 550, 720, 200]; // its seven tools
  const NEW_FRAME = [330, 160, 830, 340]; // New Task
  const REPLY_FRAME = [460, 240, 960, 380];
  const ASK_FRAME = [470, 230, 960, 380];
  const ANS_FRAME = [470, 560, 960, 240];
  const GOT_FRAME = [470, 400, 960, 220];
  const MEM_FRAME = [80, 110, 1300, 280];
  const CI_FRAME = [460, 40, 980, 560];
  const SLACK_FRAME = [340, 190, 1040, 320];
  const BOARD_FRAME = [90, 80, 560, 280];
  const TASK_FRAME = [460, 80, 980, 420];
  const MENTION_FRAME = [940, 200, 480, 200]; // the task's last text line (y 150-160) stays out
  const PERM_FRAME = [494, 303, 912, 300]; // y 216-690: under the timeline (the chip sits on blank), above the composer
  const DANGER_FRAME = [340, 340, 1060, 170];
  const DIALOG_FRAME = [480, 230, 500, 360];
  // Measured on the shots (CSS px).
  const CODEX_TAB = [548, 629, 48, 33]; // setup-top: the agents' tabs
  const AGY_TAB = [452, 629, 88, 33];
  const ACP_TAB = [412, 629, 30, 33];
  const URL = [456, 304, 704, 22]; // setup-config: the workspace's address and token
  const TOKEN = [776, 304, 384, 22];
  const ALLOW = [412, 608, 202, 20]; // "mcp__agentrq-<workspace>__*"
  const CHANNELS = [90, 238, 1310, 22]; // c6-2: Channels: messages from server:agentrq-workspace
  const TOAST = [1016, 690, 404, 96]; // Agent connected
  const PROJECT = [100, 560, 450, 38]; // mcp-2: agentrq-workspace, 7 tools
  const TOOLS_HEAD = [100, 560, 300, 40]; // mcp-4: Tools for agentrq-workspace
  const TOOLS = [96, 606, 470, 128];
  const NEW_BOX = [360, 220, 768, 250];
  const SEND = [1082, 430, 30, 30];
  const EXTOAST = [1016, 648, 404, 136]; // not started -> ongoing
  const BODY = [476, 280, 930, 262]; // ex2-reply-file: its report
  const FILE = [480, 572, 128, 26]; // npm-test-output.txt
  const QUESTION = [488, 262, 894, 250]; // cancelled orders: the question and its options
  const GOTIT = [478, 516, 924, 76];
  const MEM_ROWS = [356, 256, 900, 92];
  const TASKHEAD = [474, 104, 560, 34];
  const TICKET = [1266, 310, 114, 26];
  const ALLOW_ONCE = [492, 496, 86, 24];
  const DIALOG = [516, 256, 428, 298];

  // 01 Connect any agent
  sc.show('setup-top', start('conn-setup'), { fade: 0 }).cut(start('conn-setup'), SETUP_FRAME);
  sc.callout(at('conn-setup', 0.7), at('conn-setup', 3.2), 'nav', { label: 'Setup, in every workspace', side: 'right' });
  sc.look(at('conn-setup', 3.3), TABS_FRAME, { dur: 0.5 });
  sc.callout(at('conn-setup', 3.9), at('conn-setup', 5.2), 'claude', { label: 'Claude Code', side: 'above' });
  sc.callout(at('conn-setup', 5.3), at('conn-setup', 6.4), CODEX_TAB, { label: 'Codex', side: 'above' });
  sc.callout(at('conn-setup', 6.5), at('conn-setup', 7.5), AGY_TAB, { label: 'Antigravity', side: 'above' });
  sc.callout(at('conn-setup', 7.6), end('conn-setup') - 0.3, ACP_TAB, { label: 'any ACP agent', side: 'above' });
  sc.show('setup-config', start('conn-config'), { fade: 0.3 }).cut(start('conn-config'), CONFIG_FRAME);
  sc.callout(at('conn-config', 0.7), at('conn-config', 2.6), 'head', { label: '1 · the same for every agent', side: 'below' });
  sc.callout(at('conn-config', 2.7), at('conn-config', 5.5), URL, { label: 'this workspace\'s address and token', side: 'below' });
  sc.click(at('conn-config', 5.7), 'copy');
  sc.show('setup-copied', at('conn-config', 5.9), { fade: 0.2 }).away(at('conn-config', 6.0));
  sc.callout(at('conn-config', 6.1), end('conn-config') - 0.3, 'copied', { label: 'into the project, as .mcp.json', side: 'left' });
  sc.look(start('conn-perm'), PERMS_FRAME, { dur: 0.6 });
  sc.callout(at('conn-perm', 0.8), at('conn-perm', 3.0), 'permsHead', { label: '2 · for Claude Code', side: 'below' });
  sc.callout(at('conn-perm', 3.1), end('conn-perm') - 0.3, ALLOW, { label: 'every workspace tool: allowed', side: 'right' });
  sc.show('setup-start', start('conn-start'), { fade: 0.3 }).cut(start('conn-start'), START_FRAME);
  sc.callout(at('conn-start', 0.8), at('conn-start', 2.4), 'cmd', { label: 'one start command', side: 'above' });
  sc.show('c6-2', at('conn-start', 2.5), { fade: 0.3 }).cut(at('conn-start', 2.5), CH_FRAME);
  sc.callout(at('conn-start', 2.8), at('conn-start', 5.4), CHANNELS, { label: 'the workspace, as a channel', side: 'below' });
  sc.look(at('conn-start', 5.5), TOAST_FRAME, { dur: 0.5 });
  sc.callout(at('conn-start', 6.1), end('conn-start') - 0.3, TOAST, { label: 'tasks reach it on their own', side: 'left' });
  sc.show('setup-codex', start('conn-acp'), { fade: 0.3 }).cut(start('conn-acp'), ACP_FRAME);
  sc.callout(at('conn-acp', 0.8), at('conn-acp', 2.8), 'card', { label: 'Codex: through the AgentRQ gateway', side: 'above' });
  sc.callout(at('conn-acp', 2.9), at('conn-acp', 5.0), 'login', { label: '1 · sign in once', side: 'right' });
  sc.callout(at('conn-acp', 5.1), end('conn-acp') - 0.3, 'bridge', { label: '2 · start it: it joins', side: 'right' });
  sc.show('setup-top', at('conn-more', 3.2), { fade: 0 }).cut(at('conn-more', 3.2), MACHINE_FRAME);
  sc.callout(at('conn-more', 4.1), end('conn-more') - 0.3, 'machine', { label: 'or start it from the browser, on dev-box', side: 'below' });

  // 02 Seven tools
  sc.show('mcp-2', start('tool-list'), { fade: 0.3 }).cut(start('tool-list'), MCP2_FRAME);
  sc.callout(at('tool-list', 0.9), at('tool-list', 3.4), PROJECT, { label: 'connected', side: 'right' });
  sc.show('mcp-4', at('tool-list', 3.5), { fade: 0.3 }).cut(at('tool-list', 3.5), MCP4_FRAME);
  sc.callout(at('tool-list', 3.7), at('tool-list', 5.0), TOOLS_HEAD, { label: 'seven tools', side: 'right' });
  sc.callout(at('tool-list', 5.1), end('tool-list') - 0.3, TOOLS, { label: 'tasks, memory, skills and more', side: 'right' });
  sc.show('ex-new', start('tool-task'), { fade: 0.3 }).cut(start('tool-task'), NEW_FRAME);
  sc.callout(at('tool-task', 0.8), at('tool-task', 5.3), NEW_BOX, { label: 'the export times out: stream it', side: 'below' });
  sc.click(at('tool-task', 5.5), SEND);
  sc.show('ex-start', at('tool-task', 5.8), { fade: 0.25 }).away(at('tool-task', 5.9));
  sc.look(at('tool-task', 5.8), TOAST_FRAME, { dur: 0.5 });
  sc.callout(at('tool-task', 6.4), end('tool-task') - 0.3, EXTOAST, { label: 'picked up: ongoing', side: 'left' });
  sc.show('ex2-reply-file', start('tool-reply'), { fade: 0.3 }).cut(start('tool-reply'), REPLY_FRAME);
  sc.callout(at('tool-reply', 1.0), at('tool-reply', 4.0), BODY, { label: 'it reports back on the task', side: 'above' });
  sc.callout(at('tool-reply', 4.1), end('tool-reply') - 0.3, FILE, { label: 'the test output, attached', side: 'right' });
  sc.show('ex2-ask', start('tool-ask'), { fade: 0.3 }).cut(start('tool-ask'), ASK_FRAME);
  sc.callout(at('tool-ask', 0.8), at('tool-ask', 5.3), QUESTION, { label: 'cancelled orders: in the file?', side: 'above' });
  sc.show('ans-typed', at('tool-ask', 5.4), { fade: 0.3 }).cut(at('tool-ask', 5.4), ANS_FRAME);
  sc.callout(at('tool-ask', 5.6), at('tool-ask', 6.9), 'box', { label: 'Ada answers on the task', side: 'above' });
  sc.show('ans-reply', at('tool-ask', 7.0), { fade: 0.3 }).cut(at('tool-ask', 7.0), GOT_FRAME);
  sc.callout(at('tool-ask', 7.1), end('tool-ask') - 0.3, GOTIT, { label: 'and it carries on', side: 'above' });
  sc.show('mem-list', start('tool-memory'), { fade: 0.3 }).cut(start('tool-memory'), MEM_FRAME);
  sc.callout(at('tool-memory', 0.9), at('tool-memory', 3.0), 'nav', { label: 'the workspace\'s memory', side: 'right' });
  sc.callout(at('tool-memory', 3.1), end('tool-memory') - 0.3, MEM_ROWS, { label: 'what it learned, for the next agent', side: 'below' });
  sc.show('ci-task', at('tool-cli', 7.6), { fade: 0 }).cut(at('tool-cli', 7.6), CI_FRAME);
  sc.callout(at('tool-cli', 8.2), end('tool-cli') - 0.3, 'file', { label: 'opened by CI, with its log', side: 'right' });

  // 03 Your team, in Slack
  sc.show('slack-off', start('slack-add'), { fade: 0 }).cut(start('slack-add'), SLACK_FRAME);
  sc.callout(at('slack-add', 0.8), at('slack-add', 2.4), 'status', { label: 'not linked yet', side: 'right' });
  sc.callout(at('slack-add', 2.5), at('slack-add', 4.6), 'add', { label: 'Add to Slack', side: 'below' });
  sc.click(at('slack-add', 4.8), 'add');
  sc.show('slack-linked', at('slack-add', 5.1), { fade: 0.25 }).away(at('slack-add', 5.2));
  sc.callout(at('slack-add', 5.3), at('slack-add', 7.0), 'status', { label: 'linked to Slack', side: 'right' });
  sc.callout(at('slack-add', 7.1), end('slack-add') - 0.3, 'channel', { label: 'a private channel, for storefront', side: 'below' });
  sc.show('tm-board', at('slack-t', 6.6), { fade: 0 }).cut(at('slack-t', 6.6), BOARD_FRAME);
  sc.callout(at('slack-t', 7.2), end('slack-t') - 0.3, 'card', { label: 'ongoing: it started right away', side: 'right' });
  sc.show('tm-mention', at('slack-mention', 3.9), { fade: 0 }).cut(at('slack-mention', 3.9), MENTION_FRAME);
  sc.callout(at('slack-mention', 4.6), end('slack-mention') - 0.3, TICKET, { label: 'the file came with it', side: 'below' });
  sc.look(start('slack-web'), TASK_FRAME, { dur: 0.6 });
  sc.callout(at('slack-web', 0.9), at('slack-web', 3.4), TASKHEAD, { label: 'the same task, in the browser', side: 'below' });
  sc.callout(at('slack-web', 3.5), end('slack-web') - 0.3, 'slack', { label: 'marked: from Slack', side: 'left' });

  // 04 Approve from Slack
  sc.show('tm-perm-1', at('appr-click', 7.0), { fade: 0 }).cut(at('appr-click', 7.0), PERM_FRAME);
  sc.callout(at('appr-web', 0.8), at('appr-web', 2.8), ALLOW_ONCE, { label: 'Ada allows it here first', side: 'below' });

  // 05 You stay in control
  sc.show('setup-config', at('appr-web', 6.0), { fade: 0 }).cut(at('appr-web', 6.0), CONFIG_FRAME);
  sc.callout(at('ctl-token', 0.9), at('ctl-token', 5.2), TOKEN, { label: 'a new token each visit, for a year', side: 'below' });
  sc.callout(at('ctl-token', 5.3), end('ctl-token') - 0.3, URL, { label: 'this workspace only', side: 'below' });
  sc.show('ctl-danger', start('ctl-reset'), { fade: 0.3 }).cut(start('ctl-reset'), DANGER_FRAME);
  sc.callout(at('ctl-reset', 1.0), at('ctl-reset', 4.0), 'reset', { label: 'if a token leaks', side: 'below' });
  sc.click(at('ctl-reset', 4.2), 'button');
  sc.show('ctl-reset-dialog', at('ctl-reset', 4.4), { fade: 0.25 }).away(at('ctl-reset', 4.5));
  sc.look(at('ctl-reset', 4.4), DIALOG_FRAME, { dur: 0.5 });
  sc.callout(at('ctl-reset', 5.0), end('ctl-reset') - 0.3, DIALOG, { label: 'a new address: old tokens stop', side: 'right' });

  // Recap: one screen for each.
  sc.show('setup-config', at('ctl-members', 8.0), { fade: 0 }).cut(at('ctl-members', 8.0), CONFIG_FRAME);
  sc.callout(at('recap', 0.9), at('recap', 3.0), 'config', { label: 'one config, any agent', side: 'below' });
  sc.show('mcp-4', at('recap', 3.1), { fade: 0.3 }).cut(at('recap', 3.1), MCP4_FRAME);
  sc.callout(at('recap', 3.3), at('recap', 5.5), TOOLS, { label: 'seven tools', side: 'right' });
  sc.show('tm-mention', at('recap', 5.6), { fade: 0.3 }).cut(at('recap', 5.6), MENTION_FRAME);
  sc.callout(at('recap', 5.8), end('recap') - 0.3, 'slack', { label: 'work and approvals, from Slack', side: 'left' });

  sc.visible([
    [start('conn-setup'), end('tool-cli')],
    [start('slack-add'), end('recap')],
  ]).build();

  // Drawn where no screen shows it: the plugins, the CI runner's terminal, the Slack
  // side, the requests Slack did not sign, and the channel's members.
  s.add(fadeSpan(s, plugins(s, at), [start('conn-more'), at('conn-more', 3.7)]));
  s.add(fadeSpan(s, cliTerminal(s, at), [start('tool-cli'), at('tool-cli', 8.0)]));
  s.add(fadeSpan(s, slackChannel(s, at, start), [start('slack-invite'), at('slack-t', 7.0)]));
  s.add(fadeSpan(s, slackMention(s, at), [start('slack-mention'), at('slack-mention', 4.3)]));
  s.add(fadeSpan(s, slackPermission(s, at), [start('appr-ask'), end('appr-click')]));
  s.add(fadeSpan(s, slackWeb(s, at), [at('appr-web', 3.0), end('appr-web')]));
  s.add(fadeSpan(s, slackGuards(s, at, start), [start('ctl-sig'), at('ctl-members', 8.4)]));

  // The chapter, in a corner, while its screens show.
  chapterChips(s, [['01 / CONNECT ANY AGENT', 'conn-setup', 'conn-more'], ['02 / SEVEN TOOLS', 'tool-list', 'tool-cli'], ['03 / YOUR TEAM, IN SLACK', 'slack-add', 'slack-web'],
    ['04 / APPROVE FROM SLACK', 'appr-ask', 'appr-web'], ['05 / YOU STAY IN CONTROL', 'ctl-token', 'ctl-members']].map(([label, a, z]) => [label, start(a), end(z)]));

  captions(s, tl, { band: BAND, size: 28, chars: 72, lineGap: 32, baseline: 51 });
  return s;
};
