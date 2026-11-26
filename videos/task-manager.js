// How a task board for AI agents should work, narrated, about nine minutes. It follows
// the /guidelines/task-manager-for-ai-agents page: the loop every agent task goes
// through (the work arrives, the agent gets its context, acts, asks, and finishes so
// the next piece of work starts), then scale and the human team around it. Each chapter
// opens on a pain card in the house style, then shows the fix on real screens of the
// app, copied with their regions from the series' own videos (end-to-end, see-every-agent,
// workspaces-memory-skills, run-anywhere, agent-cards, teams-collaboration) into
// videos/screens/task-manager, so every state on screen ran for real on a local AgentRQ.
// The one drawn chapter is the tools layer, mesher.sh: its panes use the commands and
// the allowlist from the mesher README and the gmail connector's manifest.
// Build: node bin/video.js videos/task-manager.js --size 3840x2160
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { el, g } from '../src/index.js';
import { C, mascotByName, mascot } from '../kit/agentrq.js';
import { loadTimeline, beatsById, videoScene, showDuring, captions, VW } from './lib.js';
import { BAND, LIFT, ARTX, collect, groundStrip, pane, bubbleLine, tagChip, from, fadeSpan, addCards, chapterChips } from './house.js';
import { Screen, loadShots } from './screen.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'task-manager.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, 'screens/task-manager');

// Four agents under every card.
const NAMES = ['claude', 'codex', 'agy', 'hermes'];
const MX = (i) => 620 + i * 160;
const [CL, CX, AG, HE] = NAMES.map((n) => mascotByName(n).color);

// A box with a pixel kind and a line under it, stepping in at t.
const tile = (s, x, y, w, h, kind, line, t, color = C.lit) => from(s, g({},
  el('rect', { x, y, width: w, height: h, fill: C.panel, stroke: color, 'stroke-width': 2, class: 'px' }),
  s.text(kind, { x: x + 14, y: y + 26, font: 'pixel', size: 13, fill: color }),
  s.text(line, { x: x + 14, y: y + 50, font: 'body', size: 15, fill: C.text })), t);
// A terminal pane with one line in it, stepping in at t.
const term = (s, x, y, w, title, color, line, t) => from(s, g({},
  pane(s, { x, y, w, h: 110, title, color }),
  s.text(line, { x: x + 16, y: y + 70, font: 'mono', size: 14, fill: C.text })), t);
// A plain bar, standing in for a line of text.
const bar = (x, y, w, fill = C.line) => el('rect', { x, y, width: w, height: 10, fill, class: 'px' });

// ---------------------------------------------------------------- the cards' art

// A board made for people, handed to an agent.
function artPeopleBoard(s, at) {
  const X = ARTX + 20;
  return g({},
    pane(s, { x: X, y: 60, w: 520, h: 170, title: 'TO DO · A BOARD FOR PEOPLE', color: C.dim }),
    ...['Fix checkout on mobile', 'Update the refunds guide', 'Nightly dependency audit'].map((t, i) => g({},
      el('rect', { x: X + 20, y: 98 + i * 40, width: 16, height: 16, fill: 'none', stroke: C.dim, 'stroke-width': 2, class: 'px' }),
      s.text(t, { x: X + 50, y: 112 + i * 40, font: 'semi', size: 15, fill: C.text }))),
    from(s, tagChip(s, 'forgets at session end', { x: X, y: 252, fill: C.ask }), at('pain', 3.5)),
    from(s, tagChip(s, 'runs what it may', { x: X + 250, y: 252, fill: C.ask }), at('pain', 5.0)),
    from(s, tagChip(s, '3 AM, nobody watching', { x: X, y: 292, fill: C.blocked, color: C.text }), at('pain', 8.5)));
}

// Two readers: the agent over MCP, the people on a board.
function artReaders(s, at) {
  return g({},
    tile(s, ARTX, 70, 290, 70, 'THE AGENT', 'reads it over MCP', at('promise', 4.0)),
    tile(s, ARTX + 310, 70, 290, 70, 'THE PEOPLE', 'read it on a board', at('promise', 5.6)),
    from(s, tagChip(s, 'worked example: AgentRQ', { x: ARTX, y: 170, fill: C.lit }), at('promise', 9.7)));
}

// The loop: five steps, and a team around them.
function artLoop(s, at) {
  const STEPS = [['1', 'ARRIVES', 4.0], ['2', 'CONTEXT', 5.8], ['3', 'ACTS', 6.6], ['4', 'ASKS', 7.1], ['5', 'FINISHES', 7.8]];
  return g({},
    ...STEPS.map(([n, kind, o], i) => from(s, g({},
      el('rect', { x: ARTX + i * 122, y: 70, width: 110, height: 70, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
      s.text(n, { x: ARTX + i * 122 + 12, y: 96, font: 'pixel', size: 16, fill: C.lit }),
      s.text(kind, { x: ARTX + i * 122 + 12, y: 126, font: 'pixel', size: 11, fill: C.text })), at('loop', o))),
    from(s, tagChip(s, 'then the next task starts', { x: ARTX, y: 160, fill: C.lit }), at('loop', 9.0)),
    from(s, g({},
      el('rect', { x: ARTX, y: 206, width: 598, height: 50, fill: 'none', stroke: C.ask, 'stroke-width': 2, 'stroke-dasharray': '6 6', class: 'px' }),
      s.text('AROUND ALL OF IT: A HUMAN TEAM', { x: ARTX + 299, y: 237, font: 'pixel', size: 13, fill: C.ask, anchor: 'middle' })), at('loop', 10.8)));
}

// One agent, every project; and an agent nobody wakes.
function artWrongRepo(s, at) {
  const X = ARTX + 20;
  return g({},
    pane(s, { x: X, y: 60, w: 520, h: 150, title: 'ONE AGENT · EVERY PROJECT', color: C.dim }),
    from(s, bubbleLine(s, { x: X + 18, y: 104, w: 300, text: 'fix the invoice rounding', you: true }), at('arrive-pain', 2.4)),
    ...['storefront', 'billing', 'docs'].map((name, i) => from(s, tagChip(s, name, { x: X + 18 + i * 150, y: 150, fill: C.panel, color: C.text }), at('arrive-pain', 3.3 + i * 0.3))),
    from(s, tagChip(s, 'wrong repo', { x: X, y: 236, fill: C.blocked, color: C.text }), at('arrive-pain', 4.8)),
    from(s, tagChip(s, 'nobody woke it: zZ', { x: X + 170, y: 236, fill: C.ask }), at('arrive-pain', 6.4)));
}

// Monday it learns the port; Tuesday it learns it again.
function artForget(s, at) {
  const X = ARTX + 20;
  return g({},
    from(s, g({},
      pane(s, { x: X, y: 70, w: 250, h: 130, title: 'MONDAY', color: CX }),
      s.text('postgres: 5432? no', { x: X + 16, y: 130, font: 'mono', size: 14, fill: C.text }),
      s.text('postgres: 5433. yes', { x: X + 16, y: 156, font: 'mono', size: 14, fill: C.lit })), at('ctx-pain', 3.0)),
    from(s, g({},
      pane(s, { x: X + 270, y: 70, w: 250, h: 130, title: 'TUESDAY', color: C.dim }),
      s.text('postgres: 5432? no', { x: X + 286, y: 130, font: 'mono', size: 14, fill: C.text })), at('ctx-pain', 6.6)),
    from(s, tagChip(s, 'an hour, again', { x: X, y: 236, fill: C.blocked, color: C.text }), at('ctx-pain', 7.8)));
}

// A context window full of tool definitions, and a key in the logs.
function artToolFlood(s, at) {
  const X = ARTX + 20;
  const rows = [0, 1, 2, 3, 4, 5, 6, 7];
  return g({},
    pane(s, { x: X, y: 50, w: 520, h: 200, title: 'CONTEXT WINDOW · BEFORE THE TASK', color: C.dim }),
    ...rows.map((i) => from(s, g({},
      bar(X + 20, 90 + i * 18, 90 + (i * 37) % 120, C.cron),
      bar(X + 130 + (i * 37) % 120, 90 + i * 18, 200 + (i * 53) % 150)), at('tool-pain', 3.4 + i * 0.2))),
    from(s, tagChip(s, 'hundreds of tool definitions', { x: X, y: 268, fill: C.ask }), at('tool-pain', 4.7)),
    from(s, g({},
      el('rect', { x: X, y: 306, width: 330, height: 30, fill: C.panel, stroke: C.blocked, 'stroke-width': 2, class: 'px' }),
      s.text('log: API_KEY=sk-live-...', { x: X + 12, y: 326, font: 'mono', size: 14, fill: C.blocked })), at('tool-pain', 6.8)));
}

// Two bad options.
function artTwoBad(s, at) {
  return g({},
    term(s, ARTX, 70, 290, 'LET IT DO ANYTHING', C.blocked, '> git push --force', at('ask-pain', 5.2)),
    term(s, ARTX + 310, 70, 290, 'WATCH EVERY TERMINAL', C.ask, '> Allow? (y/n)', at('ask-pain', 6.9)),
    from(s, tagChip(s, 'neither one scales', { x: ARTX, y: 206, fill: C.ask }), at('ask-pain', 8.1)));
}

// You in the middle, relaying between agents.
function artGlue(s, at) {
  const X = ARTX + 20;
  const A = [['QA', CL, 2.2], ['DEPLOY', CX, 2.4], ['DOCS', AG, 2.6], ['MOBILE', HE, 2.8]];
  return g({},
    ...A.map(([title, color, o], i) => from(s, pane(s, { x: X + (i % 2) * 380, y: 50 + Math.floor(i / 2) * 150, w: 160, h: 100, title, color }), at('next-pain', o))),
    from(s, g({},
      el('rect', { x: X + 200, y: 130, width: 140, height: 70, fill: C.panel, stroke: C.ask, 'stroke-width': 2, class: 'px' }),
      s.text('YOU', { x: X + 270, y: 172, font: 'pixel', size: 16, fill: C.ask, anchor: 'middle' })), at('next-pain', 3.1)),
    from(s, tagChip(s, 'type the next task, by hand', { x: X, y: 320, fill: C.ask }), at('next-pain', 4.8)),
    from(s, tagChip(s, 'you sleep: it stops', { x: X + 330, y: 320, fill: C.blocked, color: C.text }), at('next-pain', 6.4)));
}

// One agent, six tasks in a line.
function artQueue(s, at) {
  const X = ARTX + 20;
  return g({},
    pane(s, { x: X, y: 50, w: 520, h: 240, title: 'BILLING · ONE AGENT', color: CX }),
    ...[0, 1, 2, 3, 4, 5].map((i) => from(s, g({},
      el('rect', { x: X + 20, y: 86 + i * 32, width: 480, height: 24, fill: i === 0 ? '#14532d' : C.card, stroke: C.line, class: 'px' }),
      s.text(i === 0 ? 'ONGOING' : `QUEUED ${i}`, { x: X + 32, y: 103 + i * 32, font: 'pixel', size: 11, fill: i === 0 ? C.lit : C.dim })), at('team-pain', 3.3 + i * 0.15))),
    from(s, tagChip(s, 'a line', { x: X, y: 310, fill: C.ask }), at('team-pain', 5.1)));
}

// Five people, five agents, one lesson learned five times.
function artAlone(s, at) {
  const X = ARTX + 20;
  const P = [['ADA', CL], ['BEN', CX], ['CHEN', AG], ['DEV', HE], ['EVA', C.cron]];
  return g({},
    ...P.map(([who, color], i) => from(s, g({},
      el('rect', { x: X, y: 50 + i * 46, width: 520, height: 36, fill: C.panel, stroke: C.line, class: 'px' }),
      s.text(who, { x: X + 14, y: 73 + i * 46, font: 'pixel', size: 12, fill: color }),
      s.text('learned: clear the build cache', { x: X + 90, y: 73 + i * 46, font: 'mono', size: 13, fill: C.text })), at('people-pain', 3.5 + i * 0.3))),
    from(s, tagChip(s, 'one lesson, five times', { x: X, y: 290, fill: C.ask }), at('people-pain', 6.0)));
}

// The checklist, one row per characteristic, ticked as the voice names it.
function artChecklist(s, at) {
  const R = [['pushed to agents', 3.8], ['one status per task', 4.8], ['memory and skills', 5.9], ['few, safe tools', 7.1],
    ['approvals, anywhere', 8.0], ['every step on record', 9.3], ['hands itself on', 10.6], ['a team that learns', 12.2]];
  return g({}, ...R.map(([line, o], i) => {
    const x = ARTX + (i % 2) * 305;
    const y = 40 + Math.floor(i / 2) * 64;
    return from(s, g({},
      el('rect', { x, y, width: 290, height: 52, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
      el('rect', { x: x + 14, y: y + 16, width: 20, height: 20, fill: C.lit, class: 'px' }),
      s.text('✓', { x: x + 24, y: y + 32, font: 'semi', size: 15, fill: C.ink, anchor: 'middle' }),
      s.text(line, { x: x + 46, y: y + 32, font: 'semi', size: 16, fill: C.text })), at('recap', o));
  }));
}

// The end card: the question to answer, and where to try it.
function artEnd(s) {
  return g({},
    s.text('agentrq.com', { x: 860, y: 200, font: 'bold', size: 64, fill: C.text, anchor: 'middle', spacing: -1.5 }),
    s.text('The open source task manager for AI agents.', { x: 860, y: 244, font: 'body', size: 20, fill: C.dim, anchor: 'middle' }),
    el('rect', { x: 540, y: 290, width: 640, height: 54, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
    s.text('What does your agent task board still make you do by hand?', { x: 860, y: 324, font: 'semi', size: 18, fill: C.lit, anchor: 'middle' }));
}

// ---------------------------------------------------------------- the drawn tools chapter
// mesher.sh has no screen in the series, so its three beats are drawn from the mesher
// README (callTool and its commands) and the gmail connector's manifest (its allowlist).

const mono = (s, text, x, y, fill = C.text, size = 15) => s.text(text, { x, y, font: 'mono', size, fill });
const box = (x, y, w, h, stroke = C.line) => el('rect', { x, y, width: w, height: h, fill: C.panel, stroke, 'stroke-width': 2, class: 'px' });
const link = (x, y, w, fill = C.dim) => el('rect', { x, y, width: w, height: 4, fill, class: 'px' });
const heading = (s, text) => s.text(text, { x: 60, y: 100, font: 'bold', size: 34, fill: C.text, spacing: -0.5 });

// One tool for every service: the agent sees callTool alone, and drives it like a shell.
function drawOneTool(s, at) {
  return g({},
    heading(s, 'One tool for every service'),
    pane(s, { x: 60, y: 140, w: 360, h: 190, title: 'CLAUDE · ITS MCP TOOLS', color: CL }),
    from(s, g({},
      el('rect', { x: 80, y: 182, width: 320, height: 34, fill: '#14532d', stroke: C.lit, class: 'px' }),
      mono(s, 'callTool', 96, 205, C.lit, 16),
      s.text('mesher.sh', { x: 388, y: 205, font: 'pixel', size: 11, fill: C.lit, anchor: 'end' })), at('tool-one', 6.6)),
    from(s, s.text('one tool, whatever is installed', { x: 80, y: 246, font: 'body', size: 15, fill: C.dim }), at('tool-one', 6.9)),
    ...[['gmail', 4.9], ['github', 5.2], ['a remote MCP server', 5.5]].map(([name, o], i) => from(s, tagChip(s, name, { x: 80 + [0, 84, 180][i], y: 278, fill: C.card, color: C.text }), at('tool-one', o))),
    pane(s, { x: 450, y: 140, w: 690, h: 190, title: 'CALLTOOL · A COMMAND LINE', color: C.lit }),
    from(s, mono(s, "> gmail.searchTools 'unread' 10", 470, 192), at('tool-one', 8.1)),
    from(s, mono(s, '> gmail.tools sendEmail help', 470, 232), at('tool-one', 8.8)),
    from(s, mono(s, `> gmail.tools sendEmail -b '{"to":"ada@example.com",...}'`, 470, 272), at('tool-one', 9.8)),
    from(s, s.text('the same commands run in a shell: mesher gmail tools sendEmail', { x: 470, y: 312, font: 'body', size: 14, fill: C.dim }), at('tool-one', 10.0)),
    from(s, tagChip(s, 'search, read its help, call it', { x: 450, y: 360, fill: C.lit }), at('tool-one', 8.1)));
}

// The host checks the allowlist and adds the credential; the agent never holds it.
function drawHost(s, at) {
  const Y = 170;
  return g({},
    heading(s, 'Credentials stay on the host'),
    box(60, Y, 220, 120, CL),
    s.text('CLAUDE', { x: 80, y: Y + 30, font: 'pixel', size: 13, fill: CL }),
    mono(s, 'callTool gmail.tools', 80, Y + 64, C.text, 13),
    mono(s, 'searchEmails', 80, Y + 86, C.text, 13),
    link(280, Y + 58, 60),
    box(340, Y - 20, 420, 200, C.lit),
    s.text('MESHER.SH HOST', { x: 360, y: Y + 10, font: 'pixel', size: 13, fill: C.lit }),
    from(s, g({}, mono(s, '✓ allowlist: https://gmail.googleapis.com', 360, Y + 50, C.lit, 14)), at('tool-host', 3.6)),
    from(s, g({}, mono(s, '+ adds the OAuth token itself', 360, Y + 86, C.text, 14)), at('tool-host', 5.0)),
    from(s, g({}, mono(s, '✗ evil.example.net: denied', 360, Y + 150, C.blocked, 14)), at('tool-host', 9.0)),
    link(760, Y + 58, 60, C.lit),
    from(s, g({}, box(820, Y, 320, 120), mono(s, 'gmail.googleapis.com', 840, Y + 50, C.text, 14), mono(s, 'Authorization: ****', 840, Y + 82, C.dim, 13)), at('tool-host', 5.4)),
    from(s, tagChip(s, 'the agent never sees it', { x: 60, y: Y + 140, fill: C.lit }), at('tool-host', 6.5)),
    from(s, tagChip(s, 'sandboxed connector', { x: 820, y: Y + 140, fill: C.card, color: C.text }), at('tool-host', 2.9)));
}

// Profiles, TOON and the circuit breaker.
const EMAILS = [['18c1', 'ada', 'Invoice due'], ['18c2', 'bob', 'Standup notes'], ['18c3', 'eve', 'Q3 report']];
const JSON_ROWS = ['{"emails":[', ...EMAILS.map(([id, f, sub], i) => `  {"id":"${id}","from":"${f}","subject":"${sub}"}${i < 2 ? ',' : ''}`), ']}'];
const TOON_ROWS = ['emails[3]{id,from,subject}:', ...EMAILS.map((r) => `  ${r.join(',')}`)];
const chars = (rows) => rows.join('\n').length;

function drawToon(s, at) {
  return g({},
    heading(s, 'Fewer tokens, kept apart'),
    pane(s, { x: 60, y: 130, w: 300, h: 110, title: 'PROFILES', color: C.cron }),
    from(s, tagChip(s, 'gmail@work', { x: 80, y: 168, fill: C.cron }), at('tool-toon', 0.8)),
    from(s, tagChip(s, 'gmail@personal', { x: 80, y: 202, fill: C.card, color: C.text }), at('tool-toon', 1.6)),
    from(s, g({},
      pane(s, { x: 390, y: 130, w: 470, h: 160, title: `JSON · ${chars(JSON_ROWS)} CHARACTERS`, color: C.dim }),
      ...JSON_ROWS.map((r, i) => mono(s, r, 404, 164 + i * 22, C.dim, 12))), at('tool-toon', 3.0)),
    from(s, g({},
      pane(s, { x: 880, y: 130, w: 260, h: 160, title: `TOON · ${chars(TOON_ROWS)}`, color: C.lit }),
      ...TOON_ROWS.map((r, i) => mono(s, r, 894, 164 + i * 22, C.lit, 12))), at('tool-toon', 3.6)),
    from(s, tagChip(s, 'same emails, fewer tokens', { x: 880, y: 304, fill: C.lit }), at('tool-toon', 4.5)),
    from(s, g({},
      box(390, 370, 750, 70, C.ask),
      s.text('CIRCUIT BREAKER', { x: 410, y: 398, font: 'pixel', size: 13, fill: C.ask }),
      s.text('half of the recent calls failed: calls to it pause for a while', { x: 410, y: 424, font: 'body', size: 15, fill: C.text })), at('tool-toon', 6.2)));
}

// ---------------------------------------------------------------- the video

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);

  const s = videoScene({
    tl,
    ground: false,
    poster: at('loop', 12.6),
    thumbnail: at('loop', 12.6),
    description: 'How a task board for AI agents should work, narrated over real screens of AgentRQ: isolated workspaces, tasks and replies pushed to agents in real time, one status per task on a live Kanban, shared memory with versioned writes, distributed skills and Pano docs, few safe tools through mesher.sh callTool, approvals and A2UI cards, Yolo per task, the trajectory and timeline, events, workflows, hooks and schedules, machines, forks and the supervisor, and teams that share tasks, memory and skills.',
  });
  groundStrip(s);

  // ------------------------------------------------ cards
  const CARDS = [
    { span: [0, end('pain')], kicker: 'A BOARD FOR PEOPLE', headline: ['Hand it', 'to an agent.'], sub: 'And it breaks.', art: artPeopleBoard },
    { span: [start('promise'), end('promise')], kicker: 'TASK MANAGER FOR AI AGENTS', headline: ['Agents and', 'people.'], sub: 'One agent task manager for both.', art: artReaders },
    { span: [start('loop'), end('loop')], kicker: 'THE AGENT TASK LOOP', headline: ['Every task,', 'the same loop.'], sub: 'Each step is where weak tools break.', art: artLoop },
    { span: [start('arrive-pain'), end('arrive-pain')], kicker: '01 / THE WORK ARRIVES', headline: ['Wrong project,', 'or no wake-up.'], sub: 'Work has to reach the right agent.', art: artWrongRepo },
    { span: [start('ctx-pain'), end('ctx-pain')], kicker: '02 / CONTEXT', headline: ['Learned today,', 'gone tomorrow.'], sub: 'Every session starts empty.', art: artForget },
    { span: [start('tool-pain'), end('tool-pain')], kicker: '03 / FEW, SAFE TOOLS', headline: ['Too many tools,', 'keys in the logs.'], sub: 'Context spent before the task.', art: artToolFlood },
    { span: [start('ask-pain'), end('ask-pain')], kicker: '04 / ASK AND ANSWER', headline: ['Anything goes,', 'or you watch.'], sub: 'Two bad options.', art: artTwoBad },
    { span: [start('next-pain'), end('next-pain')], kicker: '05 / WORK HANDS ITSELF ON', headline: ['You are', 'the relay.'], sub: 'Between every two agents.', art: artGlue },
    { span: [start('team-pain'), end('team-pain')], kicker: '06 / ONE AGENT TO MANY', headline: ['Six tasks,', 'one agent.'], sub: 'The work waits in line.', art: artQueue },
    { span: [start('people-pain'), end('people-pain')], kicker: '07 / A HUMAN TEAM', headline: ['Five agents,', 'one lesson.'], sub: 'Every agent learns alone.', art: artAlone },
    { span: [start('recap'), end('recap')], kicker: 'THE CHECKLIST', headline: ['What an agent', 'task board needs.'], sub: 'Judge any task manager for agents by it.', art: artChecklist },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Your agents,', 'one board.'], sub: 'Real screens, real agents, real work.', art: artEnd },
  ];
  addCards(s, CARDS, at);

  // The mascots stand under every card and react to its story.
  const cardSpans = CARDS.map((c) => c.span);
  const sp = (id, a) => [at(id, a), end(id) - 0.2];
  const BEHAVE = {
    claude: { work: [[at('hook', 2.2), end('hook') - 0.2], sp('loop', 6.1)], done: [sp('promise', 3.9), sp('recap', 3.0), sp('cta', 1)], say: [['zZ', [sp('pain', 8.7)]], ['?', [sp('arrive-pain', 4.8)]]] },
    codex: { ask: [sp('ask-pain', 6.9), sp('next-pain', 4.3)], done: [sp('loop', 8.0), sp('recap', 5.4), sp('cta', 1.3)], say: [['?', [sp('ctx-pain', 6.6)]]] },
    agy: { work: [sp('team-pain', 3.3)], done: [sp('promise', 5.5), sp('recap', 7.3), sp('cta', 1.6)], alert: [sp('tool-pain', 7.5)], say: [['...', [sp('people-pain', 6.2)]]] },
    hermes: { done: [[at('hook', 3.4), end('hook') - 0.2], sp('recap', 10.6), sp('cta', 1.9)], alert: [sp('ask-pain', 5.2)], say: [['zZ', [sp('next-pain', 7.4)]]] },
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
  // Frames for the camera (CSS px), most of them from the screens' own videos.
  const CHAT = [470, 90, 960, 330]; // a task's thread, top
  const LOWER = [470, 590, 960, 210]; // the reply box
  const MID = [470, 285, 940, 230]; // a mid-turn message, the answer and the working line
  const BOARD = [270, 120, 1150, 570]; // the Kanban board
  const ASKING = [560, 230, 880, 580]; // a board card asking, with its toast
  const HOME = [0, 0, 1060, 330]; // the workspaces page, top
  const CARD = [660, 190, 750, 270]; // an agent's A2UI card in its thread
  const FORM_CARD = [660, 200, 750, 440]; // the A2UI form
  const TALL_CARD = [660, 190, 750, 470]; // the live card
  const YOLO_FORM = [340, 170, 820, 340]; // the new task form with Yolo on
  const REC_FRAME = [470, 390, 940, 200]; // trajectory rows, auto-allowed
  const TRACE = [450, 300, 960, 480]; // the trajectory's calls
  const TOTALS = [470, 128, 440, 120]; // the timeline's totals line
  const WORKED = [478, 141, 124, 18];
  const BLOCKED = [612, 141, 76, 18];
  const NEEDS = [695, 141, 88, 18];
  const TOAST_FRAME = [620, 360, 800, 450]; // the toast, bottom right of the page
  const SET_FRAME = [330, 130, 1050, 440]; // a workspace's notification settings
  const FORM = [340, 248, 800, 280]; // the new task form, automation
  const MENU = [560, 120, 520, 360]; // the schedule menu
  const RUNS = [470, 100, 930, 240]; // a schedule's runs
  const RUN_ROW = [481, 288, 910, 28];
  const GRAPH_A = [320, 215, 770, 200]; // the workflow graph, left
  const GRAPH_B = [760, 180, 640, 220]; // and right
  const CARD_FRAME = [97, 190, 660, 174]; // a machine's card
  const CPU_MEM = [108, 192, 175, 48];
  const TERM_FRAME = [40, 30, 800, 420]; // the session header and its live terminal
  const LIVE = [140, 120, 54, 22];
  const FORK = [480, 235, 480, 345]; // the Fork workspace dialog
  const FORK_SET = [530, 120, 860, 280]; // the fork's settings: inherited memory
  const MERGED = [270, 380, 640, 250]; // billing's done tasks after the merge
  const TEAM_LIST = [70, 108, 560, 560]; // the team's active tasks
  const RO_BAR = [30, 600, 760, 210]; // the read-only bar under them
  const TEAM_CHAT = [470, 100, 950, 300]; // a teammate's task thread
  const SKILL_ED = [80, 330, 820, 230]; // the team skill's editor
  const TEAM_SET = [340, 100, 1040, 240]; // team settings panels

  // 01 The work arrives
  sc.show('home-online', start('arrive-ws'), { fade: 0 }).cut(start('arrive-ws'), HOME);
  sc.callout(at('arrive-ws', 2.4), at('arrive-ws', 5.4), [289, 170, 730, 67], { label: 'a workspace per project', side: 'below' });
  sc.callout(at('arrive-ws', 5.5), at('arrive-ws', 7.8), 'billing', { label: 'the agent, named on its card', side: 'below' });
  sc.callout(at('arrive-ws', 7.9), end('arrive-ws') - 0.3, 'docs', { label: 'green: connected', side: 'below' });
  sc.show('task-billing', start('arrive-push'), { fade: 0.3 }).cut(start('arrive-push'), CHAT);
  sc.callout(at('arrive-push', 2.8), at('arrive-push', 5.0), 'reply', { label: "pushed to billing's agent", side: 'below' });
  sc.look(at('arrive-push', 5.1), 'window', { dur: 0.8 });
  sc.callout(at('arrive-push', 6.0), end('arrive-push') - 0.3, 'row', { label: 'task latency: seconds', side: 'right' });
  sc.show('midturn-typed', start('arrive-live'), { fade: 0.3 }).cut(start('arrive-live'), LOWER);
  sc.callout(at('arrive-live', 3.2), at('arrive-live', 5.1), 'box', { label: 'typed while it works', side: 'above' });
  sc.show('midturn', at('arrive-live', 5.2), { fade: 0.25 }).cut(at('arrive-live', 5.2), MID);
  sc.callout(at('arrive-live', 5.5), at('arrive-live', 6.9), 'said', { label: 'reaches it at once', side: 'left' });
  sc.callout(at('arrive-live', 7.0), at('arrive-live', 8.1), 'reply', { label: 'answered mid-task', side: 'below' });
  sc.callout(at('arrive-live', 8.2), end('arrive-live') - 0.3, 'working', { label: 'still working: no restart', side: 'above' });
  sc.show('kanban', start('arrive-status'), { fade: 0.3 }).cut(start('arrive-status'), BOARD);
  sc.callout(at('arrive-status', 2.5), at('arrive-status', 3.2), 'notstarted', {});
  sc.callout(at('arrive-status', 3.3), at('arrive-status', 3.7), 'ongoing', {});
  sc.callout(at('arrive-status', 3.8), at('arrive-status', 4.3), 'blocked', {});
  sc.callout(at('arrive-status', 4.4), at('arrive-status', 5.1), 'done', {});
  sc.callout(at('arrive-status', 5.2), at('arrive-status', 8.5), [568, 113, 267, 420], { label: 'every workspace, in sync', side: 'right' });
  sc.callout(at('arrive-status', 8.6), end('arrive-status') - 0.3, [1125, 113, 267, 420], { label: 'one Kanban, live', side: 'left' });
  sc.show('c-form', start('arrive-clear'), { fade: 0.3 }).cut(start('arrive-clear'), [340, 190, 820, 320]);
  sc.callout(at('arrive-clear', 1.7), at('arrive-clear', 3.9), 'eraser', { label: 'start fresh', side: 'below' });
  sc.callout(at('arrive-clear', 4.0), at('arrive-clear', 6.9), [376, 394, 440, 24], { label: 'cleared before it picks the task up', side: 'above' });
  sc.show('c-term-1', at('arrive-clear', 7.0), { fade: 0.25 }).cut(at('arrive-clear', 7.0), TERM_FRAME);
  sc.callout(at('arrive-clear', 7.8), at('arrive-clear', 8.8), [86, 290, 74, 20], { label: '/clear, typed for it', side: 'right' });
  sc.show('c-term-3', at('arrive-clear', 8.9), { fade: 0.2 });
  sc.callout(at('arrive-clear', 9.1), end('arrive-clear') - 0.3, [86, 324, 720, 20], { label: 'then the task, on a clean slate', side: 'below' });
  sc.show('k-help', start('arrive-keys'), { fade: 0.3 }).cut(start('arrive-keys'), [480, 105, 480, 560]);
  sc.callout(at('arrive-keys', 2.7), at('arrive-keys', 3.7), [508, 250, 420, 26], { label: 'N: a new task', side: 'right' });
  sc.callout(at('arrive-keys', 3.8), at('arrive-keys', 5.3), [508, 203, 420, 26], { label: 'Cmd K: find a task', side: 'right' });
  sc.callout(at('arrive-keys', 5.4), end('arrive-keys') - 0.3, [508, 434, 420, 26], { label: '?: every shortcut', side: 'right' });

  // 02 Context
  sc.show('mem-saved', start('ctx-save'), { fade: 0 }).cut(start('ctx-save'), CHAT);
  sc.callout(at('ctx-save', 1.6), at('ctx-save', 3.5), 'found', { label: 'what it learned', side: 'below' });
  sc.callout(at('ctx-save', 3.6), end('ctx-save') - 0.3, 'loop', { label: 'one short note, saved', side: 'above' });
  sc.show('mem-next', start('ctx-next'), { fade: 0.3 }).cut(start('ctx-next'), CHAT);
  sc.callout(at('ctx-next', 1.6), end('ctx-next') - 0.3, 'reply', { label: 'memory first: the right port', side: 'below' });
  sc.show('mem-conflict', start('ctx-version'), { fade: 0.3 }).cut(start('ctx-version'), CHAT);
  sc.callout(at('ctx-version', 5.5), end('ctx-version') - 0.3, 'refused', { label: 'refused, reloaded, merged: version 3', side: 'below' });
  sc.show('skill-v2', start('ctx-skill'), { fade: 0.3 }).cut(start('ctx-skill'), [520, 215, 880, 420]);
  sc.callout(at('ctx-skill', 2.5), at('ctx-skill', 5.4), 'workspaces', { label: 'one skill, on per workspace', side: 'right' });
  sc.look(at('ctx-skill', 5.5), [620, 460, 760, 236], { dur: 0.6 });
  sc.callout(at('ctx-skill', 8.3), end('ctx-skill') - 0.3, 'step', { label: 'the fix, everywhere', side: 'left' });
  sc.show('tick-5', start('ctx-pano'), { fade: 0.3 }).cut(start('ctx-pano'), { region: 'paper', h: 0.98 });
  sc.callout(at('ctx-pano', 2.4), at('ctx-pano', 6.7), 'title', { label: 'a plan on the Pano', side: 'right' });
  sc.callout(at('ctx-pano', 6.8), end('ctx-pano') - 0.3, 'progress', { label: 'ticked as the tasks finish', side: 'right' });

  // 04 Ask and answer
  sc.show('ask-board', start('ask-req'), { fade: 0 }).cut(start('ask-req'), ASKING);
  sc.callout(at('ask-req', 1.9), at('ask-req', 6.2), 'toast', { label: 'the exact command', side: 'left' });
  sc.callout(at('ask-req', 6.3), end('ask-req') - 0.3, [591, 309, 120, 28], { label: 'Allow and Deny, on the card', side: 'right' });
  sc.show('ask-buttons', start('ask-card'), { fade: 0.3 }).cut(start('ask-card'), CARD);
  sc.callout(at('ask-card', 2.2), at('ask-card', 6.2), 'card', { label: 'an A2UI card, from the agent', side: 'above' });
  sc.callout(at('ask-card', 6.5), at('ask-card', 7.9), 'sched', { label: 'a choice: a button', side: 'above' });
  sc.show('ask-form', at('ask-card', 8.0), { fade: 0.25 }).cut(at('ask-card', 8.0), FORM_CARD);
  sc.callout(at('ask-card', 8.1), at('ask-card', 9.1), 'card', { label: 'the details: a form', side: 'left' });
  sc.show('ask-clicked', at('ask-card', 9.2), { fade: 0.25 }).cut(at('ask-card', 9.2), CARD);
  sc.callout(at('ask-card', 9.3), end('ask-card') - 0.3, 'card', { label: 'one click answers it', side: 'above' });
  sc.show('chart-heat', start('ask-show'), { fade: 0.3 }).cut(start('ask-show'), [660, 190, 750, 360]);
  sc.callout(at('ask-show', 2.9), at('ask-show', 3.7), 'card', { label: 'a chart, at a glance', side: 'left' });
  sc.show('live-running', at('ask-show', 3.8), { fade: 0.25 }).cut(at('ask-show', 3.8), TALL_CARD);
  sc.callout(at('ask-show', 3.9), at('ask-show', 4.9), { region: 'card', y: 0.18, h: 0.36 }, { label: 'the checks', side: 'left' });
  sc.callout(at('ask-show', 5.0), end('ask-show') - 0.3, 'card', { label: 'one live card, updating', side: 'left' });
  sc.show('note-toast', start('ask-reach'), { fade: 0.3 }).cut(start('ask-reach'), TOAST_FRAME);
  sc.callout(at('ask-reach', 1.0), at('ask-reach', 2.6), 'toast', { label: 'on any page', side: 'left' });
  sc.show('note-settings', at('ask-reach', 2.7), { fade: 0.3 }).cut(at('ask-reach', 2.7), SET_FRAME);
  sc.callout(at('ask-reach', 2.9), at('ask-reach', 5.9), 'channels', { label: 'push, email and Slack', side: 'above' });
  sc.show('ask-home', at('ask-reach', 6.0), { fade: 0.3 }).cut(at('ask-reach', 6.0), HOME);
  sc.callout(at('ask-reach', 6.3), end('ask-reach') - 0.3, 'chip', { label: 'yellow: waiting on you', side: 'below' });
  sc.show('yolo-task', start('ask-yolo'), { fade: 0.3 }).cut(start('ask-yolo'), YOLO_FORM);
  sc.callout(at('ask-yolo', 1.1), at('ask-yolo', 3.4), 'form', { label: 'one task you trust', side: 'below' });
  sc.callout(at('ask-yolo', 3.5), at('ask-yolo', 5.6), 'chip', { label: 'Yolo: autonomous task execution', side: 'below' });
  sc.show('yolo-record', at('ask-yolo', 5.7), { fade: 0.3 }).cut(at('ask-yolo', 5.7), REC_FRAME);
  sc.callout(at('ask-yolo', 6.2), end('ask-yolo') - 0.3, 'auto', { label: 'auto-allowed, on the record', side: 'right' });
  sc.show('trace-denied', start('ask-trace'), { fade: 0.3 }).cut(start('ask-trace'), TRACE);
  sc.callout(at('ask-trace', 3.1), at('ask-trace', 4.0), 'row', { label: 'every tool call', side: 'right' });
  sc.callout(at('ask-trace', 4.1), at('ask-trace', 5.3), 'status', { label: 'and who said no', side: 'below' });
  sc.show('timeline-refunds', at('ask-trace', 5.4), { fade: 0.3 }).cut(at('ask-trace', 5.4), TOTALS);
  sc.callout(at('ask-trace', 7.5), at('ask-trace', 8.0), WORKED, { label: 'worked', side: 'below' });
  sc.callout(at('ask-trace', 8.1), at('ask-trace', 8.6), BLOCKED, { label: 'blocked', side: 'below' });
  sc.callout(at('ask-trace', 8.7), end('ask-trace') - 0.3, NEEDS, { label: 'waiting on you', side: 'below' });

  // 05 Work hands itself on
  sc.show('ev-tasks', start('next-event'), { fade: 0 }).cut(start('next-event'), 'window').look(at('next-event', 2.6), [90, 400, 760, 220], { dur: 0.8 });
  sc.callout(at('next-event', 5.8), end('next-event') - 0.3, [97, 352, 660, 200], { label: 'docs and mobile: their tasks', side: 'right' });
  sc.show('wf-graph', start('next-wf'), { fade: 0.3 }).cut(start('next-wf'), GRAPH_A);
  sc.callout(at('next-wf', 1.8), at('next-wf', 3.2), 'start', { label: 'an event', side: 'below' });
  sc.callout(at('next-wf', 3.3), at('next-wf', 4.5), 'billing', { label: 'a workspace', side: 'below' });
  sc.look(at('next-wf', 4.6), GRAPH_B, { dur: 0.5 });
  sc.callout(at('next-wf', 5.2), at('next-wf', 6.6), 'docs', { label: 'then the next', side: 'below' });
  sc.callout(at('next-wf', 6.7), end('next-wf') - 0.3, 'mobile', { label: 'a picture anyone can change', side: 'below' });
  sc.show('hook-task', start('next-hook'), { fade: 0.3 }).cut(start('next-hook'), [470, 95, 930, 220]);
  sc.callout(at('next-hook', 1.0), at('next-hook', 4.1), 'title', { label: 'opened by GitHub', side: 'right' });
  sc.callout(at('next-hook', 4.2), at('next-hook', 6.4), 'payload', { label: 'the failed build on main', side: 'below' });
  sc.callout(at('next-hook', 6.5), end('next-hook') - 0.3, 'reply', { label: 'and the agent is on it', side: 'below' });
  sc.show('sched-form', start('next-sched'), { fade: 0.3 }).cut(start('next-sched'), FORM);
  sc.callout(at('next-sched', 1.0), at('next-sched', 3.4), [361, 258, 766, 48], { label: "read last night's errors", side: 'below' });
  sc.click(at('next-sched', 3.5), 'schedule');
  sc.show('sched-daily', at('next-sched', 3.7), { fade: 0.25 }).away(at('next-sched', 3.8));
  sc.look(at('next-sched', 3.7), MENU, { dur: 0.5 });
  sc.callout(at('next-sched', 4.3), at('next-sched', 6.5), 'tabs', { label: 'one time, or repeated', side: 'above' });
  sc.callout(at('next-sched', 6.6), at('next-sched', 7.1), 'preset', { label: 'Daily', side: 'below' });
  sc.callout(at('next-sched', 7.2), at('next-sched', 8.4), 'time', { label: 'at nine', side: 'below' });
  sc.show('sched-runs', at('next-sched', 8.5), { fade: 0.25 }).look(at('next-sched', 8.5), RUNS, { dur: 0.4 });
  sc.callout(at('next-sched', 9.0), end('next-sched') - 0.3, RUN_ROW, { label: 'each run, its own task', side: 'above' });

  // 06 One agent to many
  sc.show('mach-online', start('team-mach'), { fade: 0 }).cut(start('team-mach'), CARD_FRAME);
  sc.callout(at('team-mach', 1.0), at('team-mach', 4.2), CPU_MEM, { label: 'working in the background', side: 'below' });
  sc.callout(at('team-mach', 4.3), at('team-mach', 6.2), 'name', { label: 'a machine you own', side: 'right' });
  sc.show('term-1', at('team-mach', 6.3), { fade: 0.25 }).look(at('team-mach', 6.3), TERM_FRAME, { dur: 0.6 });
  sc.callout(at('team-mach', 7.2), end('team-mach') - 0.3, LIVE, { label: 'its terminal, live in the page', side: 'right' });
  sc.show('fork-modal', start('team-fork'), { fade: 0.3 }).cut(start('team-fork'), FORK);
  sc.callout(at('team-fork', 1.0), at('team-fork', 2.6), 'name', { label: 'billing-refunds', side: 'below' });
  sc.callout(at('team-fork', 2.7), at('team-fork', 4.3), 'text', { label: 'its own queue and agent', side: 'right' });
  sc.show('fork-memory', at('team-fork', 4.4), { fade: 0.3 }).cut(at('team-fork', 4.4), FORK_SET);
  sc.callout(at('team-fork', 4.8), at('team-fork', 6.3), 'banner', { label: 'same memory and skills', side: 'below' });
  sc.show('merged', at('team-fork', 6.4), { fade: 0.3 }).cut(at('team-fork', 6.4), MERGED);
  sc.callout(at('team-fork', 7.0), end('team-fork') - 0.3, 'refunds', { label: 'merged back: its tasks return', side: 'right' });
  sc.show('chat-typed', start('team-sup'), { fade: 0.3 }).cut(start('team-sup'), [81, 470, 1326, 310]);
  sc.callout(at('team-sup', 1.0), at('team-sup', 3.3), 'chip', { label: 'the supervisor', side: 'right' });
  sc.callout(at('team-sup', 3.4), at('team-sup', 5.5), [98, 690, 660, 46], { label: 'split it, run in parallel', side: 'right' });
  sc.show('kanban-parallel', at('team-sup', 5.6), { fade: 0.3 }).cut(at('team-sup', 5.6), 'window');
  sc.callout(at('team-sup', 6.2), end('team-sup') - 0.3, [430, 120, 304, 494], { label: 'a task per workspace, at once', side: 'right' });

  // 07 A human team
  sc.show('ws-sharing', start('people-share'), { fade: 0 }).cut(start('people-share'), [340, 200, 1030, 330]);
  sc.callout(at('people-share', 1.0), at('people-share', 4.8), 'sharing', { label: 'shared with the team', side: 'below' });
  sc.callout(at('people-share', 4.9), end('people-share') - 0.3, [354, 225, 230, 24], { label: 'tasks, memory, skills', side: 'right' });
  sc.show('team-tasks', start('people-see'), { fade: 0.3 }).cut(start('people-see'), TEAM_LIST);
  sc.callout(at('people-see', 1.0), at('people-see', 3.7), 'list', { label: 'every task, live', side: 'right' });
  sc.callout(at('people-see', 3.8), at('people-see', 5.1), 'owner0', { label: "the owner's name", side: 'right' });
  sc.cut(at('people-see', 5.2), RO_BAR);
  sc.callout(at('people-see', 5.4), end('people-see') - 0.3, 'bar', { label: 'read-only', side: 'above' });
  sc.show('ben-saved', start('people-mem'), { fade: 0.3 }).cut(start('people-mem'), TEAM_CHAT);
  sc.callout(at('people-mem', 1.0), at('people-mem', 2.8), 'msg2', { label: "Ben's agent saves it", side: 'below' });
  sc.show('ada-fixed', at('people-mem', 2.9), { fade: 0.3 }).cut(at('people-mem', 2.9), TEAM_CHAT);
  sc.callout(at('people-mem', 3.4), at('people-mem', 7.1), 'msg', { label: "Ada's agent reads it first", side: 'below' });
  sc.callout(at('people-mem', 7.2), end('people-mem') - 0.3, 'msg', { label: 'it writes only its own memory', side: 'below' });
  sc.show('team-skill', start('people-skill'), { fade: 0.3 }).cut(start('people-skill'), SKILL_ED);
  sc.callout(at('people-skill', 1.0), at('people-skill', 3.8), 'editor', { label: 'the team owns its skills', side: 'below' });
  sc.callout(at('people-skill', 3.9), end('people-skill') - 0.3, [104, 486, 464, 18], { label: 'the missing step, for everyone', side: 'right' });
  sc.show('members', start('people-ctl'), { fade: 0.3 }).cut(start('people-ctl'), TEAM_SET);
  sc.callout(at('people-ctl', 1.4), at('people-ctl', 3.1), [354, 154, 1004, 114], { label: 'no owners, no admins', side: 'below' });
  sc.show('activity', at('people-ctl', 3.2), { fade: 0.25 }).cut(at('people-ctl', 3.2), TEAM_SET);
  sc.callout(at('people-ctl', 3.4), at('people-ctl', 5.8), 'list', { label: 'who did what', side: 'below' });
  sc.show('share-on', at('people-ctl', 5.9), { fade: 0.25 }).cut(at('people-ctl', 5.9), TEAM_SET);
  sc.callout(at('people-ctl', 6.1), end('people-ctl') - 0.3, 'list', { label: 'one switch per workspace', side: 'below' });

  sc.visible([
    [start('arrive-ws'), end('arrive-keys')],
    [start('ctx-save'), end('ctx-pano')],
    [start('ask-req'), end('ask-trace')],
    [start('next-event'), end('next-sched')],
    [start('team-mach'), end('team-sup')],
    [start('people-share'), end('people-ctl')],
  ]).build();

  // 03 Few, safe tools: drawn panes over a plain band, one per line.
  s.add(fadeSpan(s, el('rect', { x: 0, y: 0, width: VW, height: BAND, fill: C.bg }), [start('tool-one'), end('tool-toon')]));
  s.add(fadeSpan(s, drawOneTool(s, at), [start('tool-one'), end('tool-one')], 0.3));
  s.add(fadeSpan(s, drawHost(s, at), [start('tool-host'), end('tool-host')], 0.3));
  s.add(fadeSpan(s, drawToon(s, at), [start('tool-toon'), end('tool-toon')], 0.3));

  // The chapter, in a corner, while its screens show.
  chapterChips(s, [['01 / THE WORK ARRIVES', 'arrive-ws', 'arrive-keys'], ['02 / CONTEXT', 'ctx-save', 'ctx-pano'], ['03 / FEW, SAFE TOOLS', 'tool-one', 'tool-toon'],
    ['04 / ASK AND ANSWER', 'ask-req', 'ask-trace'], ['05 / WORK HANDS ITSELF ON', 'next-event', 'next-sched'], ['06 / ONE AGENT TO MANY', 'team-mach', 'team-sup'],
    ['07 / A HUMAN TEAM', 'people-share', 'people-ctl']].map(([label, a, z]) => [label, start(a), end(z)]));

  captions(s, tl, { band: BAND, size: 28, chars: 72, lineGap: 32, baseline: 51 });
  return s;
};
