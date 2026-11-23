// AgentRQ, end to end, narrated, about seven minutes: the overview of the feature series.
// Each chapter opens on a pain in the house style (ground, mascots, pixel art), then shows
// the fix on real screens of the app. The screens are the captures made for the series'
// own videos (workspaces, hand-off-fast, pano-collaboration, see-every-agent, teams,
// automate-work, run-anywhere), copied with their regions into videos/screens/end-to-end,
// so every state on screen ran for real on a local AgentRQ. Nothing here is drawn but the
// cards. Build: node bin/video.js videos/end-to-end.js --size 3840x2160
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { el, g } from '../src/index.js';
import { C, mascotByName, mascot } from '../kit/agentrq.js';
import { loadTimeline, beatsById, videoScene, showDuring, captions, VW } from './lib.js';
import { BAND, LIFT, ARTX, collect, groundStrip, pane, bubbleLine, tagChip, from, addCards, chapterChips } from './house.js';
import { Screen, loadShots } from './screen.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'end-to-end.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, 'screens/end-to-end');

// Four agents, one per project, under every card.
const NAMES = ['claude', 'codex', 'agy', 'hermes'];
const MX = (i) => 620 + i * 160;
const [SHOP, BILL, DOCS, MOBI] = NAMES.map((n) => mascotByName(n).color);

// A box with a pixel kind and a line under it, stepping in at t.
const tile = (s, x, y, w, h, kind, line, t, color = C.lit) => from(s, g({},
  el('rect', { x, y, width: w, height: h, fill: C.panel, stroke: color, 'stroke-width': 2, class: 'px' }),
  s.text(kind, { x: x + 16, y: y + 28, font: 'pixel', size: 13, fill: color }),
  s.text(line, { x: x + 16, y: y + 54, font: 'body', size: 15, fill: C.text })), t);
// A terminal pane with one line in it, stepping in at t.
const term = (s, x, y, title, color, line, t) => from(s, g({},
  pane(s, { x, y, w: 270, h: 110, title, color }),
  s.text(line, { x: x + 16, y: y + 70, font: 'mono', size: 14, fill: C.text })), t);

// ---------------------------------------------------------------- the cards' art

// Four terminals, four projects; then the prompts pile up.
function artTerminals(s, at) {
  const T = [['STOREFRONT', SHOP, '> fixing checkout...', 2.2], ['BILLING', BILL, '> Allow? (y/n)', 2.6], ['DOCS', DOCS, '> waiting for you', 3.0], ['MOBILE', MOBI, '> done, 1h ago', 3.4]];
  return g({},
    ...T.map(([title, color, line, o], i) => term(s, ARTX + (i % 2) * 290, 50 + Math.floor(i / 2) * 130, title, color, line, at('hook', o))),
    from(s, tagChip(s, 'copy, paste, repeat', { x: ARTX, y: 316, fill: C.ask }), at('pain', 1.5)),
    from(s, tagChip(s, 'who is stuck?', { x: ARTX + 215, y: 316, fill: C.ask }), at('pain', 6.7)),
    from(s, tagChip(s, 'everything waits', { x: ARTX + 375, y: 316, fill: C.blocked, color: C.text }), at('pain', 8.6)));
}

// The promise: five things, one place.
function artPromise(s, at) {
  const W = [['WORKSPACES', 'one per project', 3.5], ['ONE BOARD', 'every agent on it', 5.1], ['MEMORY', 'what they learn, kept', 6.4],
    ['AUTOMATION', 'work that starts itself', 8.0], ['ANYWHERE', 'your yes, wherever', 9.4]];
  return g({}, ...W.map(([kind, line, o], i) => tile(s, ARTX + (i % 2) * 300, 60 + Math.floor(i / 2) * 84, 280, 70, kind, line, at('promise', o))));
}

// One chat, three repos: which one?
function artWhichRepo(s, at) {
  const X = ARTX + 20;
  return g({},
    pane(s, { x: X, y: 70, w: 520, h: 150, title: 'ONE CHAT · EVERY PROJECT', color: C.dim }),
    from(s, bubbleLine(s, { x: X + 18, y: 116, w: 360, text: 'fix the invoice rounding', you: true }), at('ws-pain', 1.0)),
    ...['storefront', 'billing', 'docs'].map((name, i) => from(s, tagChip(s, name, { x: X + 18 + i * 150, y: 250, fill: C.panel, color: C.text }), at('ws-pain', 3.4 + i * 0.3))),
    from(s, tagChip(s, 'which repo?', { x: X + 18, y: 300, fill: C.ask }), at('ws-pain', 4.4)));
}

// A title, a paragraph, yesterday's steps: typed again.
function artTyping(s, at) {
  const X = ARTX + 20;
  return g({},
    pane(s, { x: X, y: 70, w: 520, h: 230, title: 'STOREFRONT · NEW TASK', color: C.dim }),
    from(s, g({},
      el('rect', { x: X + 20, y: 112, width: 300, height: 28, fill: C.bg, stroke: C.line, 'stroke-width': 2, class: 'px' }),
      s.text('Title ...', { x: X + 32, y: 131, font: 'mono', size: 14, fill: C.dim })), at('fast-pain', 3.3)),
    ...[470, 450, 480, 300].map((w, i) => from(s, el('rect', { x: X + 20, y: 162 + i * 26, width: w, height: 10, fill: C.line, class: 'px' }), at('fast-pain', 3.7 + i * 0.2))),
    from(s, tagChip(s, 'the same steps as yesterday', { x: X + 20, y: 326, fill: C.ask }), at('fast-pain', 4.7)));
}

// You in the middle, relaying between agents.
function artGlue(s, at) {
  const X = ARTX + 20;
  const A = [['WEB', SHOP, 0.9], ['API', BILL, 1.3], ['DOCS', DOCS, 1.7], ['QA', MOBI, 2.1]];
  return g({},
    ...A.map(([title, color, o], i) => from(s, pane(s, { x: X + (i % 2) * 380, y: 60 + Math.floor(i / 2) * 170, w: 160, h: 100, title, color }), at('crew-pain', o))),
    from(s, g({},
      el('rect', { x: X + 200, y: 150, width: 140, height: 70, fill: C.panel, stroke: C.ask, 'stroke-width': 2, class: 'px' }),
      s.text('YOU', { x: X + 270, y: 192, font: 'pixel', size: 16, fill: C.ask, anchor: 'middle' })), at('crew-pain', 2.7)),
    from(s, tagChip(s, 'copy the plan, relay the question', { x: X + 110, y: 350, fill: C.ask }), at('crew-pain', 4.0)));
}

// Four agents, and you can't tell which is which.
function artQuiet(s, at) {
  const T = [['STOREFRONT', SHOP, 'done, an hour ago', 0.8], ['BILLING', BILL, 'waiting 40 min for you', 2.4], ['DOCS', DOCS, '...', 4.4], ['MOBILE', MOBI, '...', 4.6]];
  return g({},
    ...T.map(([title, color, line, o], i) => term(s, ARTX + (i % 2) * 290, 50 + Math.floor(i / 2) * 130, title, color, line, at('see-pain', o))),
    from(s, tagChip(s, 'go and look', { x: ARTX, y: 316, fill: C.ask }), at('see-pain', 6.1)));
}

// Monday it learns the port; Tuesday it learns it again.
function artForget(s, at) {
  const X = ARTX + 20;
  return g({},
    from(s, g({},
      pane(s, { x: X, y: 70, w: 250, h: 130, title: 'MONDAY', color: BILL }),
      s.text('postgres: 5432? no', { x: X + 16, y: 130, font: 'mono', size: 14, fill: C.text }),
      s.text('postgres: 5433. yes', { x: X + 16, y: 156, font: 'mono', size: 14, fill: C.lit })), at('mem-pain', 1.2)),
    from(s, g({},
      pane(s, { x: X + 270, y: 70, w: 250, h: 130, title: 'TUESDAY', color: C.dim }),
      s.text('postgres: 5432? no', { x: X + 286, y: 130, font: 'mono', size: 14, fill: C.text })), at('mem-pain', 5.6)),
    from(s, tagChip(s, 'an hour, again', { x: X, y: 236, fill: C.blocked, color: C.text }), at('mem-pain', 6.8)));
}

// The same three prompts, every morning.
function artPrompts(s, at) {
  const X = ARTX + 20;
  const P = [["check last night's errors", 0.8], ['fix the build that broke at two', 1.4], ['tell docs what billing changed', 3.4]];
  return g({},
    ...P.map(([text, o], i) => from(s, bubbleLine(s, { x: X, y: 80 + i * 70, w: 380, text, you: true }), at('auto-pain', o))),
    from(s, tagChip(s, 'by hand, every day', { x: X, y: 300, fill: C.ask }), at('auto-pain', 6.2)));
}

// The lid closes, and a prompt waits.
function artLid(s, at) {
  const X = ARTX + 40;
  return g({},
    pane(s, { x: X, y: 70, w: 480, h: 180, title: 'LAPTOP · STOREFRONT', color: C.dim }),
    from(s, s.text('> Allow npm test? (y/n)', { x: X + 20, y: 140, font: 'mono', size: 16, fill: C.text }), at('any-pain', 4.2)),
    from(s, tagChip(s, 'lid closed', { x: X + 20, y: 280, fill: C.blocked, color: C.text }), at('any-pain', 1.7)),
    from(s, tagChip(s, 'waiting since lunch', { x: X + 150, y: 280, fill: C.ask }), at('any-pain', 5.9)));
}

// The end card: the question to answer, and where to try it.
function artEnd(s) {
  return g({},
    s.text('agentrq.com', { x: 860, y: 200, font: 'bold', size: 64, fill: C.text, anchor: 'middle', spacing: -1.5 }),
    s.text('Open source. Each chapter has its own video.', { x: 860, y: 244, font: 'body', size: 20, fill: C.dim, anchor: 'middle' }),
    el('rect', { x: 560, y: 290, width: 600, height: 54, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
    s.text('What would you hand off first?', { x: 860, y: 324, font: 'semi', size: 18, fill: C.lit, anchor: 'middle' }));
}

// ---------------------------------------------------------------- the video

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);

  const s = videoScene({
    tl,
    ground: false,
    poster: at('promise', 10.6),
    thumbnail: at('promise', 10.6),
    description: 'AgentRQ, end to end, narrated over real screens of the app: a workspace per project with its own agent and token, tasks handed off in seconds, agents splitting a feature on the Pano with the supervisor, every agent and every request on one screen, memory and skills they keep, schedules, events, webhooks and workflows, and agents started on your own machines that reach you wherever you are.',
  });
  groundStrip(s);

  // ------------------------------------------------ cards
  const CARDS = [
    { span: [0, end('pain')], kicker: 'MONDAY MORNING', headline: ['Four agents,', 'one of you.'], sub: 'Four terminals, four projects.', art: artTerminals },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ', headline: ['One place', 'for all of them.'], sub: 'Workspaces, one board, memory, automation.', art: artPromise },
    { span: [start('ws-pain'), end('ws-pain')], kicker: '01 / A WORKSPACE PER PROJECT', headline: ['One chat,', 'every project.'], sub: 'The agent guesses the repo.', art: artWhichRepo },
    { span: [start('fast-pain'), end('fast-pain')], kicker: '02 / HAND OFF IN SECONDS', headline: ['Writing it down', 'takes longer.'], sub: 'A title, a paragraph, again.', art: artTyping },
    { span: [start('crew-pain'), end('crew-pain')], kicker: '03 / A TEAM OF AGENTS', headline: ['You are', 'the glue.'], sub: 'Every plan and question, relayed.', art: artGlue },
    { span: [start('see-pain'), end('see-pain')], kicker: '04 / SEE EVERY AGENT', headline: ['Who is', 'stuck?'], sub: 'A terminal says nothing until you look.', art: artQuiet },
    { span: [start('mem-pain'), end('mem-pain')], kicker: '05 / THEY REMEMBER', headline: ['Learned today,', 'gone tomorrow.'], sub: 'Port 5433, found again.', art: artForget },
    { span: [start('auto-pain'), end('auto-pain')], kicker: '06 / WORK THAT STARTS ITSELF', headline: ['The same prompts,', 'every morning.'], sub: 'And every change, carried by hand.', art: artPrompts },
    { span: [start('any-pain'), end('any-pain')], kicker: '07 / ANY MACHINE, ANYWHERE', headline: ['Lid closed,', 'work stopped.'], sub: 'A prompt waits all afternoon.', art: artLid },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Your agents,', 'one place.'], sub: 'Real screens, real agents, real work.', art: artEnd },
  ];
  addCards(s, CARDS, at);

  // The mascots stand under every card and react to its story.
  const cardSpans = CARDS.map((c) => c.span);
  const sp = (id, a) => [at(id, a), end(id) - 0.2];
  const BEHAVE = {
    claude: { work: [[at('hook', 2.2), end('hook') - 0.2], sp('crew-pain', 0.9)], done: [sp('promise', 3.5), sp('cta', 1)], say: [['?', [sp('ws-pain', 4.4)]]] },
    codex: { ask: [sp('pain', 3.2), sp('see-pain', 2.4)], done: [sp('promise', 5.1), sp('cta', 1.3)], say: [['zZ', [sp('auto-pain', 6.2)]]] },
    agy: { work: [sp('fast-pain', 3.3)], done: [sp('promise', 6.4), sp('cta', 1.6)], alert: [sp('any-pain', 5.9)], say: [['?', [sp('mem-pain', 5.6)]]] },
    hermes: { done: [[at('hook', 3.4), end('hook') - 0.2], sp('promise', 8.0), sp('cta', 1.9)], alert: [sp('pain', 8.6)], say: [['zZ', [sp('see-pain', 4.4)]]] },
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
  // Frames for the camera (CSS px), most of them from the chapter's own video.
  const CHAT = [470, 90, 960, 330]; // a task's thread, top
  const FORM_FRAME = [340, 170, 900, 310]; // the new task form
  const FORM_BOX = [355, 218, 778, 244];
  const BOARD_FRAME = [90, 160, 520, 200]; // the task list's first rows
  const COMPOSER_FRAME = [466, 560, 540, 240]; // the reply box's left half
  const LOWER_FRAME = [470, 520, 960, 280]; // the last message and the reply box
  const DELAY_FRAME = [470, 400, 960, 400]; // the pending reply and the box under it
  const TEXT = [490, 704, 520, 26]; // the reply box's text line
  const ROW1 = [90, 104, 1316, 368]; // the Pano's first row of cards
  const LIST = (shot) => ({ region: 'body', shot, x: -0.03, y: -0.02, w: 0.62, h: 0.75 }); // a note's checklist
  const HOME = [280, 170, 740, 220]; // billing, docs and storefront, close
  const BOARD = [270, 120, 1150, 570]; // the Kanban board
  const ASKING = [560, 230, 880, 580]; // a board card asking, with its toast
  const LINE = [470, 100, 930, 460]; // a task's timeline
  const TOTALS = [470, 128, 440, 120]; // its totals line
  const WORKED = [478, 141, 124, 18];
  const BLOCKED = [612, 141, 76, 18];
  const NEEDS = [695, 141, 88, 18];
  const TRACE = [450, 300, 960, 480]; // the trajectory's calls, under its lanes
  const TEAM_CHAT = [470, 100, 950, 300]; // a teammate's task thread
  const FORM = [340, 248, 800, 280]; // the new task form, automation
  const MENU = [560, 120, 520, 360]; // the schedule menu
  const RUNS = [470, 100, 930, 240]; // a schedule's runs
  const RUN_ROW = [481, 288, 910, 28];
  const GRAPH_A = [320, 215, 770, 200]; // the workflow graph, left
  const GRAPH_B = [760, 180, 640, 220]; // and right
  const CARD_FRAME = [97, 190, 660, 174]; // a machine's card, under the page title
  const CPU_MEM = [108, 192, 175, 48];
  const TERM_FRAME = [40, 30, 800, 420]; // the session header and its live terminal
  const LIVE = [140, 120, 54, 22]; // its LIVE badge
  const SET_FRAME = [330, 130, 1050, 440]; // a workspace's notification settings
  const LIST_FRAME = [340, 130, 1040, 310]; // the auto-allow list
  const R_BASH = [350, 359, 1008, 68];
  const AUTO_FRAME = [90, 120, 1290, 500]; // Automations, with the YOLO default
  const YOLO_CARD = [352, 490, 1008, 110];
  const REC_FRAME = [470, 390, 940, 200]; // trajectory rows, auto-allowed
  const TOAST_FRAME = [620, 360, 800, 450]; // the toast, bottom right of the page

  // 01 A workspace per project
  sc.show('new-typed', start('ws-create'), { fade: 0 }).cut(start('ws-create'), { region: 'form', by: 20 });
  sc.callout(at('ws-create', 3.9), at('ws-create', 5.4), 'name', { label: 'billing: one project', side: 'below' });
  sc.callout(at('ws-create', 5.5), at('ws-create', 7.1), 'dir', { label: "its repo's folder", side: 'below' });
  sc.callout(at('ws-create', 7.2), end('ws-create') - 0.3, 'picker', {});
  sc.show('setup-codex', start('ws-connect'), { fade: 0.3 }).look(start('ws-connect'), [330, 125, 1080, 500], { dur: 0.7 });
  sc.callout(at('ws-connect', 3.4), at('ws-connect', 6.4), 'tabs', { label: 'Claude Code, Codex, Antigravity, ACP', side: 'below' });
  sc.callout(at('ws-connect', 6.6), end('ws-connect') - 0.3, 'config', { label: 'one MCP config, its own token', side: 'below' });
  sc.show('home-online', start('ws-online'), { fade: 0.3 }).cut(start('ws-online'), [0, 0, 1060, 330]);
  sc.callout(at('ws-online', 2.2), at('ws-online', 3.9), 'billing', { label: 'billing: online', side: 'below' });
  sc.callout(at('ws-online', 4.0), at('ws-online', 5.9), 'billing', { label: 'codex, named on its card', side: 'below' });
  sc.callout(at('ws-online', 6.0), end('ws-online') - 0.3, 'docs', { label: 'claude-code in docs', side: 'below' });
  sc.show('task-billing', start('ws-tasks'), { fade: 0.3 }).cut(start('ws-tasks'), CHAT);
  sc.callout(at('ws-tasks', 2.7), at('ws-tasks', 4.6), 'reply', { label: "billing's agent, on it", side: 'below' });
  sc.look(at('ws-tasks', 4.8), 'window', { dur: 0.8 });
  sc.callout(at('ws-tasks', 5.8), end('ws-tasks') - 0.3, 'row', { label: 'only billing', side: 'right' });

  // 02 Hand off in seconds
  sc.show('t-typed', start('fast-title'), { fade: 0 }).cut(start('fast-title'), FORM_FRAME);
  sc.callout(at('fast-title', 1.0), at('fast-title', 3.4), FORM_BOX, { label: 'N: a new task', side: 'below' });
  sc.callout(at('fast-title', 3.6), at('fast-title', 4.6), 'title', { label: 'the title: optional', side: 'above' });
  sc.show('t-untitled', at('fast-title', 4.8), { fade: 0.25 }).cut(at('fast-title', 4.8), BOARD_FRAME);
  sc.callout(at('fast-title', 5.0), at('fast-title', 6.6), 'untitled', { label: 'Untitled, for a moment', side: 'right' });
  sc.show('t-named', at('fast-title', 6.8), { fade: 0.3 });
  sc.callout(at('fast-title', 7.2), end('fast-title') - 0.3, 'row', { label: 'named in the browser', side: 'right' });
  sc.show('v-rec', start('fast-voice'), { fade: 0.3 }).cut(start('fast-voice'), COMPOSER_FRAME);
  sc.callout(at('fast-voice', 1.6), at('fast-voice', 3.8), 'mic', { label: 'the mic: just say it', side: 'below' });
  sc.show('v-text', at('fast-voice', 4.0), { fade: 0.2 }).cut(at('fast-voice', 4.0), LOWER_FRAME);
  sc.callout(at('fast-voice', 4.6), end('fast-voice') - 0.3, TEXT, { label: 'Whisper, in the browser', side: 'above' });
  sc.show('pr-menu', start('fast-preset'), { fade: 0.3 }).cut(start('fast-preset'), LOWER_FRAME);
  sc.callout(at('fast-preset', 1.0), at('fast-preset', 2.2), 'box', { label: 'a hash', side: 'below' });
  sc.callout(at('fast-preset', 2.3), at('fast-preset', 3.4), 'menu', { label: 'the preset, from the menu', side: 'above' });
  sc.show('pr-inserted', at('fast-preset', 3.5), { fade: 0.25 });
  sc.callout(at('fast-preset', 3.7), end('fast-preset') - 0.3, 'box', { label: 'the whole message', side: 'above' });
  sc.show('d-sending', start('fast-delay'), { fade: 0.3 }).cut(start('fast-delay'), DELAY_FRAME);
  sc.callout(at('fast-delay', 2.3), at('fast-delay', 5.6), 'pending', { label: 'Sending in 5s...', side: 'left' });
  sc.callout(at('fast-delay', 5.7), at('fast-delay', 6.4), 'cancel', { label: 'Cancel', side: 'below' });
  sc.click(at('fast-delay', 6.5), 'cancel');
  sc.show('d-cancelled', at('fast-delay', 6.8), { fade: 0.15 }).away(at('fast-delay', 6.9));
  sc.callout(at('fast-delay', 7.1), end('fast-delay') - 0.3, 'box', { label: 'back in the box, unsent', side: 'above' });

  // 03 A team of agents
  sc.show('chat-typed', start('crew-board'), { fade: 0 }).cut(start('crew-board'), 'window').look(at('crew-board', 0.8), ROW1, { dur: 1.2 });
  sc.callout(at('crew-board', 2.2), at('crew-board', 4.7), 'card1', { label: 'a doc, shared by every workspace', side: 'below' });
  sc.show('note-posted', at('crew-board', 4.8), { fade: 0.3 }).look(at('crew-board', 4.8), { region: 'paper', shot: 'note-posted', h: 0.62 }, { dur: 0.6 });
  sc.callout(at('crew-board', 5.6), at('crew-board', 6.7), 'title', { label: 'the kickoff note', side: 'above' });
  sc.callout(at('crew-board', 6.8), end('crew-board') - 0.3, 'progress', { label: 'a box per action item', side: 'right' });
  sc.show('chat-typed', start('crew-split'), { fade: 0.3 }).cut(start('crew-split'), [81, 470, 1326, 310]);
  sc.callout(at('crew-split', 2.0), at('crew-split', 4.9), 'chip', { label: 'the supervisor, and the tagged note', side: 'right' });
  sc.callout(at('crew-split', 5.0), end('crew-split') - 0.3, [98, 690, 660, 46], { label: 'split it, run in parallel', side: 'right' });
  sc.show('kanban-parallel', start('crew-assign'), { fade: 0.3 }).cut(start('crew-assign'), 'window');
  sc.callout(at('crew-assign', 3.1), at('crew-assign', 4.8), [430, 120, 304, 494], { label: 'all at once', side: 'right' });
  sc.show('kickoff-assigned', at('crew-assign', 4.9), { fade: 0.3 }).look(at('crew-assign', 4.9), LIST('kickoff-assigned'), { dur: 0.8 });
  sc.callout(at('crew-assign', 6.2), end('crew-assign') - 0.3, [407, 372, 101, 21], { label: 'owner and live status', side: 'right' });
  sc.show('contract', start('crew-contract'), { fade: 0.3 }).look(start('crew-contract'), { region: 'paper', shot: 'contract', by: 10 }, { dur: 1.0 });
  sc.callout(at('crew-contract', 3.0), at('crew-contract', 6.3), [138, 154, 450, 37], { label: 'the API contract, on the Pano', side: 'right' });
  sc.show('contract-question', at('crew-contract', 6.5), { fade: 0.3 }).look(at('crew-contract', 6.5), [1060, 250, 340, 300], { dur: 0.6 });
  sc.callout(at('crew-contract', 7.3), end('crew-contract') - 0.3, 'list', { label: 'its question, on the doc', side: 'left' });
  sc.show('tick-5', start('crew-done'), { fade: 0.3 }).cut(start('crew-done'), { region: 'paper', h: 0.98 });
  sc.callout(at('crew-done', 2.4), at('crew-done', 5.0), 'progress', { label: '5 of 5, ticked by the agents', side: 'right' });
  sc.show('board-done', at('crew-done', 5.1), { fade: 0.3 }).cut(at('crew-done', 5.1), ROW1);
  sc.callout(at('crew-done', 5.6), end('crew-done') - 0.3, 'card0', {});

  // 04 See every agent
  sc.show('home-simple', start('see-home'), { fade: 0 }).cut(start('see-home'), HOME);
  sc.callout(at('see-home', 2.6), at('see-home', 3.9), 'storefront', { label: 'the agent in it', side: 'below' });
  sc.callout(at('see-home', 4.0), at('see-home', 5.8), 'billing', { label: 'green: connected', side: 'above' });
  sc.show('ask-home', at('see-home', 5.9), { fade: 0.3 });
  sc.callout(at('see-home', 6.3), end('see-home') - 0.3, 'chip', { label: 'yellow: waiting on you', side: 'below' });
  sc.show('kanban', start('see-kanban'), { fade: 0.3 }).cut(start('see-kanban'), BOARD);
  sc.callout(at('see-kanban', 2.4), at('see-kanban', 4.9), [568, 113, 267, 420], { label: "every workspace's tasks", side: 'right' });
  sc.callout(at('see-kanban', 5.0), end('see-kanban') - 0.3, [1125, 113, 267, 420], { label: 'live, no refresh', side: 'left' });
  sc.show('ask-board', start('see-ask'), { fade: 0.3 }).cut(start('see-ask'), ASKING);
  sc.callout(at('see-ask', 3.5), at('see-ask', 6.6), 'toast', { label: 'the request, with its command', side: 'left' });
  sc.callout(at('see-ask', 6.7), end('see-ask') - 0.3, [591, 309, 120, 28], { label: 'Allow and Deny, on the card', side: 'right' });
  sc.show('timeline-refunds', start('see-time'), { fade: 0.3 }).cut(start('see-time'), LINE);
  sc.callout(at('see-time', 1.0), at('see-time', 3.4), 'timeline', {});
  sc.look(at('see-time', 3.5), TOTALS, { dur: 0.6 });
  sc.callout(at('see-time', 4.2), at('see-time', 5.7), WORKED, { label: 'worked', side: 'below' });
  sc.callout(at('see-time', 5.8), at('see-time', 7.3), BLOCKED, { label: 'blocked', side: 'below' });
  sc.callout(at('see-time', 7.4), end('see-time') - 0.3, NEEDS, { label: 'waiting on you', side: 'below' });
  sc.show('trace-tab', start('see-trace'), { fade: 0.3 }).look(start('see-trace'), [450, 90, 960, 475], { dur: 0.6 });
  sc.callout(at('see-trace', 1.6), at('see-trace', 4.0), 'toggle', { label: 'the trajectory', side: 'below' });
  sc.show('trace-denied', at('see-trace', 4.2), { fade: 0.25 }).cut(at('see-trace', 4.2), TRACE);
  sc.callout(at('see-trace', 4.4), at('see-trace', 5.7), 'row', { label: 'what ran', side: 'right' });
  sc.callout(at('see-trace', 5.8), end('see-trace') - 0.3, 'status', { label: 'and who decided', side: 'below' });

  // 05 They remember
  sc.show('mem-saved', start('mem-save'), { fade: 0 }).cut(start('mem-save'), CHAT);
  sc.callout(at('mem-save', 1.2), at('mem-save', 3.8), 'found', { label: 'what it learned', side: 'below' });
  sc.callout(at('mem-save', 4.0), end('mem-save') - 0.3, 'loop', { label: 'one short note, saved', side: 'above' });
  sc.show('mem-next', start('mem-next'), { fade: 0.3 }).cut(start('mem-next'), CHAT);
  sc.callout(at('mem-next', 2.6), end('mem-next') - 0.3, 'reply', { label: 'memory first: the right port', side: 'below' });
  sc.show('skill-v2', start('mem-skill'), { fade: 0.3 }).cut(start('mem-skill'), [520, 200, 880, 430]);
  sc.callout(at('mem-skill', 2.3), at('mem-skill', 5.3), [546, 331, 420, 46], { label: 'one skill, on per workspace', side: 'right' });
  sc.look(at('mem-skill', 5.4), [620, 460, 760, 236], { dur: 0.6 });
  sc.callout(at('mem-skill', 6.4), end('mem-skill') - 0.3, 'step', { label: 'the new step, everywhere', side: 'left' });
  sc.show('ws-sharing', start('mem-team'), { fade: 0.3 }).cut(start('mem-team'), [340, 200, 1030, 330]);
  sc.callout(at('mem-team', 1.2), at('mem-team', 3.9), [354, 225, 230, 24], { label: 'tasks and memory, shared', side: 'right' });
  sc.show('ben-saved', at('mem-team', 4.0), { fade: 0.3 }).cut(at('mem-team', 4.0), TEAM_CHAT);
  sc.callout(at('mem-team', 4.4), end('mem-team') - 0.3, 'msg2', { label: "Ben's agent's lesson, for the team", side: 'below' });

  // 06 Work that starts itself
  sc.show('sched-form', start('auto-sched'), { fade: 0 }).cut(start('auto-sched'), FORM);
  sc.callout(at('auto-sched', 1.0), at('auto-sched', 2.5), [361, 258, 766, 48], { label: "read last night's errors", side: 'below' });
  sc.click(at('auto-sched', 2.6), 'schedule');
  sc.show('sched-daily', at('auto-sched', 2.8), { fade: 0.25 }).away(at('auto-sched', 2.9));
  sc.look(at('auto-sched', 2.8), MENU, { dur: 0.5 });
  sc.callout(at('auto-sched', 3.4), at('auto-sched', 4.4), 'preset', { label: 'Daily', side: 'below' });
  sc.callout(at('auto-sched', 4.5), at('auto-sched', 5.6), 'time', { label: 'at nine', side: 'below' });
  sc.show('sched-runs', at('auto-sched', 5.7), { fade: 0.25 }).look(at('auto-sched', 5.7), RUNS, { dur: 0.5 });
  sc.callout(at('auto-sched', 6.4), end('auto-sched') - 0.3, RUN_ROW, { label: 'each run, a normal task', side: 'above' });
  sc.show('ev-tasks', start('auto-event'), { fade: 0.3 }).cut(start('auto-event'), 'window').look(at('auto-event', 2.6), [90, 400, 760, 220], { dur: 0.8 });
  sc.callout(at('auto-event', 5.8), end('auto-event') - 0.3, [97, 352, 660, 200], { label: 'docs and mobile: their tasks', side: 'right' });
  sc.show('hook-task', start('auto-hook'), { fade: 0.3 }).cut(start('auto-hook'), [470, 95, 930, 220]);
  sc.callout(at('auto-hook', 1.0), at('auto-hook', 3.6), 'title', { label: 'opened by GitHub', side: 'right' });
  sc.callout(at('auto-hook', 3.7), at('auto-hook', 6.0), 'payload', { label: 'the failed build on main', side: 'below' });
  sc.callout(at('auto-hook', 6.1), end('auto-hook') - 0.3, 'reply', { label: 'and the agent is on it', side: 'below' });
  sc.show('wf-graph', start('auto-wf'), { fade: 0.3 }).cut(start('auto-wf'), GRAPH_A);
  sc.callout(at('auto-wf', 1.4), at('auto-wf', 2.6), 'start', { label: 'release_ready', side: 'below' });
  sc.callout(at('auto-wf', 2.7), at('auto-wf', 3.9), 'billing', { label: 'billing deploys', side: 'below' });
  sc.look(at('auto-wf', 4.0), GRAPH_B, { dur: 0.5 });
  sc.callout(at('auto-wf', 4.6), at('auto-wf', 5.9), 'docs', { label: 'docs: the release notes', side: 'below' });
  sc.callout(at('auto-wf', 6.0), end('auto-wf') - 0.3, 'mobile', { label: 'mobile: the new API', side: 'below' });

  // 07 Any machine, anywhere
  sc.show('mach-online', start('any-mach'), { fade: 0 }).cut(start('any-mach'), CARD_FRAME);
  sc.callout(at('any-mach', 1.0), at('any-mach', 4.5), 'name', { label: 'her dev box, enrolled', side: 'right' });
  sc.callout(at('any-mach', 4.6), at('any-mach', 6.5), 'card', { label: 'connected: green', side: 'below' });
  sc.callout(at('any-mach', 6.6), end('any-mach') - 0.3, CPU_MEM, { label: 'CPU and memory', side: 'below' });
  sc.show('start-pick', start('any-start'), { fade: 0.3 }).cut(start('any-start'), { shot: 'start-pick', region: 'panel' });
  sc.callout(at('any-start', 1.2), at('any-start', 3.2), [740, 430, 400, 40], { label: 'Claude Code, from the browser', side: 'right' });
  sc.callout(at('any-start', 3.3), at('any-start', 5.9), [740, 340, 392, 60], { label: 'its folder, on the dev box', side: 'right' });
  sc.click(at('any-start', 6.0), 'go');
  sc.show('term-1', at('any-start', 6.3), { fade: 0.25 }).away(at('any-start', 6.4));
  sc.look(at('any-start', 6.3), TERM_FRAME, { dur: 0.6 });
  sc.callout(at('any-start', 7.1), end('any-start') - 0.3, LIVE, { label: 'its terminal, live in the page', side: 'right' });
  sc.show('note-toast', start('any-note'), { fade: 0.3 }).cut(start('any-note'), 'window');
  sc.look(at('any-note', 1.6), TOAST_FRAME, { dur: 0.8 });
  sc.callout(at('any-note', 2.6), at('any-note', 4.6), 'toast', { label: 'permission required', side: 'left' });
  sc.show('note-settings', at('any-note', 4.7), { fade: 0.3 }).cut(at('any-note', 4.7), SET_FRAME);
  sc.callout(at('any-note', 5.0), end('any-note') - 0.3, 'channels', { label: 'push, email and Slack', side: 'above' });
  sc.show('yolo-list', start('any-trust'), { fade: 0.3 }).cut(start('any-trust'), LIST_FRAME);
  sc.callout(at('any-trust', 2.4), at('any-trust', 4.2), R_BASH, { label: 'Always Allow: a rule', side: 'below' });
  sc.look(at('any-trust', 4.3), AUTO_FRAME, { dur: 0.4 });
  sc.callout(at('any-trust', 4.8), at('any-trust', 6.4), YOLO_CARD, { label: 'Yolo: no asking', side: 'above' });
  sc.show('yolo-record', at('any-trust', 6.6), { fade: 0.3 }).cut(at('any-trust', 6.6), REC_FRAME);
  sc.callout(at('any-trust', 7.2), end('any-trust') - 0.3, 'auto', { label: 'auto-allowed, on the record', side: 'right' });

  // Recap: one screen per chapter.
  sc.show('home-online', start('recap'), { fade: 0.3 }).cut(start('recap'), [0, 0, 1060, 330]);
  sc.callout(at('recap', 0.8), at('recap', 2.1), 'billing', { label: 'a workspace per project', side: 'below' });
  sc.show('t-named', at('recap', 2.2), { fade: 0.2 }).cut(at('recap', 2.2), BOARD_FRAME);
  sc.callout(at('recap', 2.3), at('recap', 3.6), 'row', { label: 'handoffs in seconds', side: 'right' });
  sc.show('kickoff-assigned', at('recap', 3.7), { fade: 0.2 }).cut(at('recap', 3.7), LIST('kickoff-assigned'));
  sc.callout(at('recap', 3.8), at('recap', 5.2), [407, 372, 101, 21], { label: 'agents that work together', side: 'right' });
  sc.show('kanban', at('recap', 5.3), { fade: 0.2 }).cut(at('recap', 5.3), BOARD);
  sc.callout(at('recap', 5.4), at('recap', 6.7), [568, 113, 267, 420], { label: 'every agent, one screen', side: 'right' });
  sc.show('mem-next', at('recap', 6.8), { fade: 0.2 }).cut(at('recap', 6.8), CHAT);
  sc.callout(at('recap', 6.9), at('recap', 7.7), 'reply', { label: 'memory they keep', side: 'below' });
  sc.show('wf-graph', at('recap', 7.8), { fade: 0.2 }).cut(at('recap', 7.8), GRAPH_A);
  sc.callout(at('recap', 7.9), at('recap', 9.2), 'billing', { label: 'work that starts itself', side: 'below' });
  sc.show('mach-online', at('recap', 9.3), { fade: 0.2 }).cut(at('recap', 9.3), CARD_FRAME);
  sc.callout(at('recap', 9.4), end('recap') - 0.3, 'card', { label: 'any machine you own', side: 'below' });

  sc.visible([
    [start('ws-create'), end('ws-tasks')],
    [start('fast-title'), end('fast-delay')],
    [start('crew-board'), end('crew-done')],
    [start('see-home'), end('see-trace')],
    [start('mem-save'), end('mem-team')],
    [start('auto-sched'), end('auto-wf')],
    [start('any-mach'), end('recap')],
  ]).build();

  // The chapter, in a corner, while its screens show.
  chapterChips(s, [['01 / A WORKSPACE PER PROJECT', 'ws-create', 'ws-tasks'], ['02 / HAND OFF IN SECONDS', 'fast-title', 'fast-delay'], ['03 / A TEAM OF AGENTS', 'crew-board', 'crew-done'],
    ['04 / SEE EVERY AGENT', 'see-home', 'see-trace'], ['05 / THEY REMEMBER', 'mem-save', 'mem-team'], ['06 / WORK THAT STARTS ITSELF', 'auto-sched', 'auto-wf'],
    ['07 / ANY MACHINE, ANYWHERE', 'any-mach', 'any-trust']].map(([label, a, z]) => [label, start(a), end(z)]));

  captions(s, tl, { band: BAND, size: 28, chars: 72, lineGap: 32, baseline: 51 });
  return s;
};
