// AgentRQ, see what every agent is doing, narrated, about six minutes: each chapter
// opens on a pain in the house style (ground, mascots, pixel art), then shows the
// fix on real screens of the app, captured with src/capture.js from a local
// AgentRQ where Ada runs four projects (storefront, billing, docs, mobile), each in
// its own workspace with its own agent. Every state on screen was played for real,
// in the UI and through each agent's MCP session: billing's agent reports itself as
// codex, the others as claude-code, and each asks for permission the way Claude Code
// with channels does. The captures and their regions are in videos/screens/see-every-agent.
// Build: node bin/video.js videos/see-every-agent.js --size 3840x2160
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { el, g } from '../src/index.js';
import { C, mascotByName, mascot } from '../kit/agentrq.js';
import { loadTimeline, beatsById, videoScene, showDuring, captions, VW } from './lib.js';
import { BAND, LIFT, ARTX, collect, groundStrip, pane, bubbleLine, tagChip, from, addCards, chapterChips } from './house.js';
import { Screen, loadShots } from './screen.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'see-every-agent.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, 'screens/see-every-agent');

// The storefront's, billing's, docs' and mobile's agents.
const NAMES = ['claude', 'codex', 'agy', 'hermes'];
const MX = (i) => 620 + i * 160;
const [SHOP, BILL, DOCS, MOB] = NAMES.map((n) => mascotByName(n).color);
const PROJECTS = [['storefront', SHOP], ['billing', BILL], ['docs', DOCS], ['mobile', MOB]];
const GREEN = '#86efac';

// ---------------------------------------------------------------- the cards' art

// A terminal: a title bar in the project's colour, then lines of mono text.
function term(s, { x, y, w, h, title, color, lines = [] }) {
  return g({},
    pane(s, { x, y, w, h, title, color }),
    ...lines.map(([text, fill = C.text], i) => s.text(text, { x: x + 14, y: y + 50 + i * 22, font: 'mono', size: 13, fill })));
}

// Four agents in four terminals: one done, one waiting on a yes, one stuck, one busy; you see one at a time.
export function artTerminals(s, at) {
  const T = [
    ['STOREFRONT', SHOP, [['$ npm test'], ['212 passed', GREEN]], 'done an hour ago', GREEN, C.ink, at('pain', 0.8)],
    ['BILLING', BILL, [['Run make migrate?'], ['(y/n) _', C.ask]], 'waiting 40 min', C.ask, C.ink, at('pain', 2.5)],
    ['DOCS', DOCS, [['Which API version?'], ['...', C.dim]], 'stuck', C.blocked, C.text, at('pain', 5.0)],
    ['MOBILE', MOB, [['$ gradle build'], ['building...', C.dim]], null],
  ];
  return g({},
    ...T.map(([title, color, lines, tag, fill, ink, t], i) => {
      const x = ARTX + (i % 2) * 300;
      const y = 70 + Math.floor(i / 2) * 140;
      return from(s, g({},
        term(s, { x, y, w: 286, h: 124, title, color, lines }),
        tag ? from(s, tagChip(s, tag, { x: x + 120, y: y + 84, fill, color: ink }), t) : g({})), at('hook', 2.6 + i * 0.5));
    }),
    from(s, tagChip(s, 'check every window', { x: ARTX + 200, y: 352, fill: C.lit }), at('pain', 6.1)));
}

// The promise: one screen, and the four things it answers.
export function artPromise(s, at) {
  const COLS = ['NOT STARTED', 'ONGOING', 'BLOCKED', 'DONE'];
  const SAYS = [['what it is on', 3.4], ['who it is waiting for', 5.0], ['where the time went', 6.6], ['every command it asked', 8.0]];
  return g({},
    pane(s, { x: ARTX, y: 70, w: 590, h: 200, title: 'ONE SCREEN, EVERY AGENT', color: C.lit }),
    ...COLS.map((col, i) => g({},
      s.text(col, { x: ARTX + 16 + i * 144, y: 112, font: 'pixel', size: 10, fill: [C.dim, GREEN, C.blocked, GREEN][i] }),
      ...[0, 1, 2].slice(0, [2, 3, 1, 2][i]).map((k) => from(s, el('rect', { x: ARTX + 16 + i * 144, y: 124 + k * 40, width: 128, height: 32, fill: C.card, stroke: [C.line, GREEN, C.blocked, C.line][i], class: 'px' }), at('promise', 1.0 + k * 0.3 + i * 0.2))))),
    ...SAYS.map(([text, o], i) => from(s, tagChip(s, text, { x: ARTX + (i % 2) * 300, y: 288 + Math.floor(i / 2) * 40, fill: C.lit }), at('promise', o))));
}

// Four terminals, and you can only look at one: the other three keep going.
function artOneAtATime(s, at) {
  return g({},
    ...PROJECTS.map(([name, color], i) => {
      const x = ARTX + i * 150;
      const lit = i === 1;
      return g({},
        el('rect', { x, y: 90, width: 136, height: 170, fill: C.panel, stroke: lit ? C.lit : color, 'stroke-width': lit ? 3 : 2, class: 'px', opacity: lit ? 1 : 0.55 }),
        el('rect', { x, y: 90, width: 136, height: 22, fill: color, class: 'px', opacity: lit ? 1 : 0.55 }),
        s.text(name, { x: x + 10, y: 106, font: 'mono', size: 12, fill: C.ink }),
        ...[0, 1, 2, 3].map((k) => el('rect', { x: x + 12, y: 128 + k * 26, width: [90, 70, 100, 60][(k + i) % 4], height: 8, fill: C.line, class: 'px', opacity: lit ? 1 : 0.55 })),
        lit ? from(s, tagChip(s, 'the one you look at', { x: x - 30, y: 276, fill: C.lit }), at('board-pain', 1.6)) : g({}));
    }),
    from(s, tagChip(s, 'three more, unseen', { x: ARTX + 330, y: 318, fill: C.ask }), at('board-pain', 4.0)));
}

// A question asked forty minutes ago, scrolled past in another window.
function artWaiting(s, at) {
  const t = at('wait-pain', 0.8);
  const clock = (text, a, b) => s.anim(s.text(text, { x: ARTX + 470, y: 196, font: 'pixel', size: 34, fill: C.ask, anchor: 'middle' }),
    [[0, { opacity: 0 }], [a, { opacity: 0 }, 'step'], [a + 0.01, { opacity: 1 }, 'step'], ...(b ? [[b, { opacity: 1 }, 'step'], [b + 0.01, { opacity: 0 }, 'step']] : [])]);
  return g({},
    term(s, { x: ARTX, y: 80, w: 360, h: 200, title: 'BILLING', color: BILL, lines: [['$ make migrate'], ['Allow this command?', C.ask], ['(y/n) _', C.ask]] }),
    clock('00:12', t, t + 0.9), clock('17:40', t + 0.9, t + 1.8), clock('40:00', t + 1.8),
    from(s, s.text('waiting for you', { x: ARTX + 470, y: 230, font: 'body', size: 15, fill: C.dim, anchor: 'middle' }), t),
    from(s, tagChip(s, 'you were in another window', { x: ARTX + 40, y: 300, fill: C.blocked, color: C.text }), at('wait-pain', 3.4)));
}

// Two quiet terminals: one is working, one is stuck, and they look the same.
function artQuiet(s, at) {
  const cursor = (x, y) => s.anim(el('rect', { x, y, width: 10, height: 16, fill: C.text, class: 'px' }),
    Array.from({ length: 40 }, (_, k) => [at('now-pain', 0) + k * 0.5, { opacity: k % 2 ? 0 : 1 }, 'step']));
  return g({},
    ...[0, 1].map((i) => g({},
      term(s, { x: ARTX + i * 304, y: 80, w: 286, h: 180, title: i ? 'DOCS' : 'STOREFRONT', color: i ? DOCS : SHOP, lines: [['$ claude'], ['...', C.dim]] }),
      cursor(ARTX + i * 304 + 14, 160))),
    from(s, tagChip(s, 'working?', { x: ARTX + 80, y: 276, fill: GREEN }), at('now-pain', 1.2)),
    from(s, tagChip(s, 'stuck?', { x: ARTX + 400, y: 276, fill: C.blocked, color: C.text }), at('now-pain', 2.2)),
    from(s, tagChip(s, 'same screen', { x: ARTX + 220, y: 322, fill: C.ask }), at('now-pain', 3.6)));
}

// Two hours on one task, and no way to tell work from waiting.
function artHours(s, at) {
  const t = at('time-pain', 2.9);
  return g({},
    s.text('Refunds: partial amounts', { x: ARTX, y: 100, font: 'semi', size: 18, fill: C.text }),
    el('rect', { x: ARTX, y: 130, width: 590, height: 40, fill: C.card, stroke: C.line, class: 'px' }),
    ...[0, 1, 2, 3, 4].map((k) => from(s, s.text('?', { x: ARTX + 60 + k * 118, y: 160, font: 'pixel', size: 22, fill: C.ask, anchor: 'middle' }), t + k * 0.2)),
    s.text('2 hours', { x: ARTX + 590, y: 200, font: 'mono', size: 15, fill: C.dim, anchor: 'end' }),
    from(s, tagChip(s, 'work?', { x: ARTX, y: 228, fill: GREEN }), t + 0.4),
    from(s, tagChip(s, 'waiting on you?', { x: ARTX + 140, y: 228, fill: C.ask }), t + 1.0),
    from(s, tagChip(s, 'blocked?', { x: ARTX + 360, y: 228, fill: C.blocked, color: C.text }), t + 1.6));
}

// The repo changed overnight, and nothing says who ran what.
function artNoTrail(s, at) {
  const LOG = [['e41c  invoices: store the tax rate per line', C.text], ['9b07  forced update of main', C.blocked], ['33fa  refunds: partial amounts', C.text]];
  return g({},
    pane(s, { x: ARTX, y: 70, w: 590, h: 190, title: 'git log  main', color: C.lit }),
    ...LOG.map(([text, fill], i) => from(s, s.text(text, { x: ARTX + 18, y: 124 + i * 36, font: 'mono', size: 15, fill }), at('trace-pain', 0.8 + i * 0.6))),
    from(s, tagChip(s, 'which agent?', { x: ARTX + 40, y: 280, fill: C.ask }), at('trace-pain', 3.8)),
    from(s, tagChip(s, 'who said yes?', { x: ARTX + 260, y: 280, fill: C.blocked, color: C.text }), at('trace-pain', 4.8)));
}

// A pile of "allow?" prompts: seeing everything should not mean approving everything.
function artPrompts(s, at) {
  const ASKS = ['Allow npm test?', 'Allow npm run build?', 'Allow npm install?', 'Allow npm test?', 'Allow npm run lint?'];
  return g({},
    ...ASKS.map((text, i) => from(s, g({},
      el('rect', { x: ARTX + i * 40, y: 80 + i * 40, width: 300, height: 52, fill: C.panel, stroke: C.ask, 'stroke-width': 2, class: 'px' }),
      s.text(text, { x: ARTX + i * 40 + 16, y: 112 + i * 40, font: 'mono', size: 14, fill: C.text }),
      el('rect', { x: ARTX + i * 40 + 226, y: 92 + i * 40, width: 60, height: 28, fill: C.ask, class: 'px' }),
      s.text('yes', { x: ARTX + i * 40 + 256, y: 111 + i * 40, font: 'semi', size: 13, fill: C.ink, anchor: 'middle' })), at('ctl-pain', 0.6 + i * 0.5))));
}

// The end card: the question to answer, and where to try it.
function artEnd(s) {
  return g({},
    s.text('agentrq.com', { x: 860, y: 200, font: 'bold', size: 64, fill: C.text, anchor: 'middle', spacing: -1.5 }),
    s.text('See what every agent is doing', { x: 860, y: 244, font: 'body', size: 20, fill: C.dim, anchor: 'middle' }),
    el('rect', { x: 580, y: 290, width: 560, height: 54, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
    s.text('What do you check first?', { x: 860, y: 324, font: 'semi', size: 18, fill: C.lit, anchor: 'middle' }));
}

// ---------------------------------------------------------------- the video

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);

  const s = videoScene({
    tl,
    ground: false,
    poster: at('board-kanban', 4),
    thumbnail: at('wait-toast', 1.6),
    description: 'AgentRQ, see what every agent is doing, narrated over real screens of the app: Ada runs four agents in four workspaces; the workspaces page and the Kanban board show every one of them live, billing\'s agent asks to run a migration and Ada allows it from its board card, the docs agent blocks on a question and carries on after her answer, a task shows its agent working and its last tools, the timeline splits two hours into work, blocked time and time waiting on her, the trajectory keeps every tool call with its verdict, and always allowing npm saves a rule that auto-allows the next call.',
  });
  groundStrip(s);

  // ------------------------------------------------ cards
  const CARDS = [
    { span: [0, end('pain')], kicker: 'FOUR AGENTS, FOUR TERMINALS', headline: ['Who is stuck?', 'Who is done?'], sub: 'You find out window by window.', art: artTerminals },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ', headline: ['Every agent.', 'One screen.'], sub: 'What it does, and what it waits for.', art: artPromise },
    { span: [start('board-pain'), end('board-pain')], kicker: '01 / EVERY AGENT ON ONE SCREEN', headline: ['Four terminals.', 'No overview.'], sub: 'You only see the one you look at.', art: artOneAtATime },
    { span: [start('wait-pain'), end('wait-pain')], kicker: '02 / WHO IS WAITING ON YOU', headline: ['Asked at ten.', 'Still waiting.'], sub: 'Its question scrolled past in another window.', art: artWaiting },
    { span: [start('now-pain'), end('now-pain')], kicker: '03 / WHAT IT IS DOING RIGHT NOW', headline: ['Working,', 'or stuck?'], sub: 'A quiet terminal looks the same either way.', art: artQuiet },
    { span: [start('time-pain'), end('time-pain')], kicker: '04 / WHERE THE TIME WENT', headline: ['Two hours.', 'Doing what?'], sub: 'Work and waiting look the same from outside.', art: artHours },
    { span: [start('trace-pain'), end('trace-pain')], kicker: '05 / EVERY CALL ON THE RECORD', headline: ['Main changed.', 'Who ran it?'], sub: 'Overnight, with no trail to follow.', art: artNoTrail },
    { span: [start('ctl-pain'), end('ctl-pain')], kicker: '06 / YOU STAY IN CONTROL', headline: ['See it all.', 'Approve less.'], sub: 'Not one click per npm test.', art: artPrompts },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Every agent.', 'One screen.'], sub: 'See what every agent is doing.', art: artEnd },
  ];
  addCards(s, CARDS, at);

  // The mascots, the four projects' agents, stand under every card and react to its story.
  const cardSpans = CARDS.map((c) => c.span);
  const sp = (id, a = 1, z) => [at(id, a), z === undefined ? end(id) - 0.2 : at(id, z)];
  const BEHAVE = {
    claude: { done: [sp('pain', 0.8, 2.4), sp('promise', 1), sp('cta', 1)], work: [sp('board-pain', 1), sp('now-pain', 1)], ask: [sp('trace-pain', 3.8)] },
    codex: { ask: [sp('pain', 2.5), sp('wait-pain', 0.8)], done: [sp('promise', 1.3), sp('cta', 1.3)], work: [sp('time-pain', 1), sp('ctl-pain', 0.6)] },
    agy: { alert: [sp('pain', 5.0)], ask: [sp('now-pain', 2.2)], done: [sp('promise', 1.6), sp('cta', 1.6)], work: [sp('board-pain', 4.0)] },
    hermes: { work: [sp('hook', 2.6), sp('board-pain', 4.0), sp('trace-pain', 1)], done: [sp('promise', 1.9), sp('cta', 1.9)], say: [['zZ', [sp('time-pain', 3)]]] },
  };
  const hopsAt = (spans) => spans.map(([t0]) => [t0, 16]);
  const crowd = collect(s, () => NAMES.forEach((n, i) => {
    const m = BEHAVE[n];
    mascot(s, { ...mascotByName(n), name: n === 'agy' ? 'antigravity' : n }, i, {
      x: MX(i), hops: hopsAt([...(m.done ?? []), ...(m.alert ?? [])]), ...m, say: m.say ?? [],
    });
  }));
  s.add(showDuring(s, g({ transform: `translate(0 ${LIFT})` }, crowd), cardSpans));

  // ------------------------------------------------ screens
  const shots = loadShots(SHOTS);
  const sc = new Screen(s, shots, { safe: { x: 0, y: 0, w: VW, h: BAND } });
  const CARDS_ROW = [270, 150, 1150, 570]; // the workspace cards on the home page
  const HOME = [280, 170, 740, 220]; // billing, docs and storefront, close
  const BOARD = [270, 120, 1150, 570]; // the four columns of the board
  const COLS2 = [270, 116, 620, 300]; // Not Started and Ongoing
  const TOASTS = [900, 560, 540, 250]; // the corner where toasts come in
  const ASKING = [560, 230, 880, 580]; // a card in Ongoing, and the toast
  const BLOCKS = [560, 120, 880, 470]; // Ongoing, Blocked and Done
  const SIDEBAR = [0, 200, 700, 300]; // the sidebar's workspaces
  const TOTALS = [470, 128, 440, 120]; // a timeline's totals, close
  const WORKING = [481, 283, 190, 22]; // busy: "Agent is working · 2m 17s"
  const ON_CARD = [430, 180, 560, 277]; // one card in the Ongoing column
  const TASK = [470, 90, 930, 460]; // a task: its timeline and thread
  const THREAD_LOW = [470, 250, 1010, 500]; // the thread down to the message box
  const LINE = [470, 100, 930, 460]; // the timeline strip
  const TRACE = [450, 250, 960, 475]; // the trajectory's list and its detail
  // Measured on the shots (CSS px): the timeline's parts.
  const LIVE_DOT = [748, 158, 100, 45]; // timeline-live: the dot for "ongoing"
  const LIVE_SPAN = [886, 159, 44, 18]; // timeline-live: the time on the line after it
  const LIVE_NOW = [1312, 158, 72, 45]; // timeline-live: the current dot
  const RED = [1036, 158, 170, 46]; // timeline-refunds: the blocked stretch
  const YELLOW = [755, 158, 165, 46]; // timeline-refunds: waiting on Ada
  const WORKED = [478, 141, 124, 18];
  const BLOCKED = [612, 141, 76, 18];
  const NEEDS = [695, 141, 88, 18];
  const CLOSE = [792, 141, 96, 18];

  // 01 Every agent on one screen
  sc.show('home-simple', start('board-home'), { fade: 0 }).cut(start('board-home'), 'window');
  sc.look(at('board-home', 1.2), HOME, { dur: 1.0 });
  sc.callout(at('board-home', 4.8), at('board-home', 7.2), 'storefront', { label: 'the agent working in it', side: 'below' });
  sc.callout(at('board-home', 7.4), end('board-home') - 0.3, 'billing', { label: 'green: connected', side: 'above' });
  sc.callout(at('board-chips', 2.4), at('board-chips', 4.8), [470, 262, 180, 32], { label: 'ongoing, to do', side: 'below' });
  sc.show('ask-home', at('board-chips', 5.0), { fade: 0.3 });
  sc.callout(at('board-chips', 5.6), end('board-chips') - 0.3, 'chip', { label: 'yellow: waiting on you', side: 'below' });
  sc.show('home-simple', start('board-detailed'), { fade: 0.25 }).look(start('board-detailed'), 'window', { dur: 0.6 });
  sc.click(at('board-detailed', 1.2), [1188, 46, 72, 28]);
  sc.show('home-detailed', at('board-detailed', 1.6), { fade: 0.25 }).away(at('board-detailed', 1.8));
  sc.look(at('board-detailed', 1.8), CARDS_ROW, { dur: 0.7 });
  sc.callout(at('board-detailed', 3.0), at('board-detailed', 5.2), 'billing', { label: 'its open tasks', side: 'right' });
  sc.callout(at('board-detailed', 5.4), end('board-detailed') - 0.3, 'preview', { label: 'in progress first', side: 'right' });
  sc.show('kanban', start('board-kanban'), { fade: 0.3 }).cut(start('board-kanban'), BOARD);
  sc.callout(at('board-kanban', 2.4), at('board-kanban', 5.8), [568, 113, 267, 420], { label: 'storefront, billing, docs, mobile', side: 'right' });
  sc.callout(at('board-kanban', 6.0), at('board-kanban', 7.0), [289, 113, 267, 420], { label: 'Not Started', side: 'right' });
  sc.callout(at('board-kanban', 7.1), at('board-kanban', 7.9), [568, 113, 267, 420], { label: 'Ongoing', side: 'right' });
  sc.callout(at('board-kanban', 8.0), at('board-kanban', 8.7), [846, 113, 267, 420], { label: 'Blocked', side: 'right' });
  sc.callout(at('board-kanban', 8.8), end('board-kanban') - 0.2, [1125, 113, 267, 420], { label: 'Done', side: 'left' });
  sc.look(start('board-card'), ON_CARD, { dur: 0.8 });
  sc.callout(at('board-card', 1.4), at('board-card', 3.4), 'where', { label: 'its workspace', side: 'above' });
  sc.callout(at('board-card', 3.6), at('board-card', 5.3), 'who', { label: 'the agent that moved it', side: 'below' });
  sc.click(at('board-card', 5.6), 'exports');
  sc.show('exports-thread', at('board-card', 5.9), { fade: 0.25 }).away(at('board-card', 6.0));
  sc.look(at('board-card', 5.9), [640, 90, 800, 400], { dur: 0.6 });
  sc.callout(at('board-card', 6.8), end('board-card') - 0.3, 'title', { label: 'its thread', side: 'below' });
  sc.show('kanban-before', start('board-live'), { fade: 0.3 }).cut(start('board-live'), BOARD);
  sc.callout(at('board-live', 2.8), at('board-live', 4.8), 'exports', { label: 'billing, on the export', side: 'right' });
  sc.show('kanban-done', at('board-live', 5.0), { fade: 0.3 });
  sc.callout(at('board-live', 5.4), at('board-live', 6.8), 'exports', { label: 'Done', side: 'left' });
  sc.look(at('board-live', 6.9), TOASTS, { dur: 0.5 });
  sc.callout(at('board-live', 7.4), end('board-live') - 0.3, 'toast', { label: 'and a toast', side: 'left' });

  // 02 Who is waiting on you
  sc.show('ask-task', start('wait-ask'), { fade: 0 }).cut(start('wait-ask'), TASK);
  sc.callout(at('wait-ask', 1.2), at('wait-ask', 5.9), 'auth', { label: 'billing asks first', side: 'right' });
  sc.callout(at('wait-ask', 6.4), at('wait-ask', 8.4), [488, 368, 896, 48], { label: 'the tool', side: 'above' });
  sc.callout(at('wait-ask', 8.6), end('wait-ask') - 0.3, 'command', { label: 'the exact command', side: 'below' });
  sc.show('ask-board', start('wait-toast'), { fade: 0.3 }).cut(start('wait-toast'), ASKING);
  sc.callout(at('wait-toast', 0.8), at('wait-toast', 3.0), 'toast', { label: 'permission required', side: 'left' });
  sc.show('ask-home', at('wait-toast', 3.2), { fade: 0.3 }).cut(at('wait-toast', 3.2), HOME);
  sc.callout(at('wait-toast', 3.6), at('wait-toast', 5.4), 'chip', { label: 'an action chip', side: 'below' });
  sc.show('ask-pending', at('wait-toast', 5.6), { fade: 0.3 }).cut(at('wait-toast', 5.6), [0, 130, 1010, 500]);
  sc.callout(at('wait-toast', 5.9), at('wait-toast', 7.0), 'menu', { label: 'Pending on Me', side: 'right' });
  sc.callout(at('wait-toast', 7.1), end('wait-toast') - 0.3, 'row', { label: 'the request', side: 'right' });
  sc.show('ask-task', start('wait-allow'), { fade: 0.3 }).cut(start('wait-allow'), [450, 300, 940, 280]);
  sc.callout(at('wait-allow', 0.9), at('wait-allow', 1.9), 'once', { label: 'once', side: 'below' });
  sc.callout(at('wait-allow', 2.0), at('wait-allow', 3.0), 'always', { label: 'always', side: 'below' });
  sc.callout(at('wait-allow', 3.1), at('wait-allow', 3.9), 'deny', { label: 'or deny', side: 'below' });
  sc.show('ask-board2', at('wait-allow', 4.1), { fade: 0.3 }).cut(at('wait-allow', 4.1), ON_CARD);
  sc.callout(at('wait-allow', 4.5), at('wait-allow', 7.0), [588, 305, 128, 36], { label: 'right on its card', side: 'below' });
  sc.click(at('wait-allow', 7.2), 'allow');
  sc.show('allowed-board', at('wait-allow', 7.5), { fade: 0.25 }).away(at('wait-allow', 7.6));
  sc.look(at('wait-allow', 7.5), TOASTS, { dur: 0.6 });
  sc.callout(at('wait-allow', 8.3), end('wait-allow') - 0.3, 'toast', { label: 'allowed', side: 'left' });
  sc.show('blocked-task', start('wait-blocked'), { fade: 0.3 }).cut(start('wait-blocked'), TASK);
  sc.callout(at('wait-blocked', 1.0), at('wait-blocked', 5.2), 'question', { label: 'it needs a decision', side: 'below' });
  sc.show('blocked-board', at('wait-blocked', 5.5), { fade: 0.3 }).cut(at('wait-blocked', 5.5), TOASTS);
  sc.callout(at('wait-blocked', 5.7), at('wait-blocked', 7.0), 'toast', { label: 'needs your input', side: 'left' });
  sc.look(at('wait-blocked', 7.0), BLOCKS, { dur: 0.5 });
  sc.callout(at('wait-blocked', 7.5), at('wait-blocked', 9.4), 'card', { label: 'the red column', side: 'below' });
  sc.look(at('wait-blocked', 9.4), SIDEBAR, { dur: 0.5 });
  sc.callout(at('wait-blocked', 9.9), end('wait-blocked') - 0.3, 'row', { label: 'docs: blocked', side: 'right' });
  sc.show('answer-typed', start('wait-answer'), { fade: 0.3 }).cut(start('wait-answer'), THREAD_LOW);
  sc.callout(at('wait-answer', 1.2), at('wait-answer', 3.6), 'box', { label: 'only the new one', side: 'above' });
  sc.show('answered', at('wait-answer', 3.8), { fade: 0.3 }).cut(at('wait-answer', 3.8), TASK);
  sc.callout(at('wait-answer', 4.4), end('wait-answer') - 0.3, 'reply', { label: 'back to work', side: 'below' });

  // 03 What it is doing right now
  sc.show('busy', start('now-busy'), { fade: 0 }).cut(start('now-busy'), TASK);
  sc.callout(at('now-busy', 3.6), at('now-busy', 6.2), WORKING, { label: 'working, and for how long', side: 'right' });
  sc.callout(at('now-busy', 6.6), end('now-busy') - 0.3, 'tools', { label: 'its last three tools', side: 'below' });
  sc.show('midturn-typed', start('now-queue'), { fade: 0.3 }).cut(start('now-queue'), THREAD_LOW);
  sc.callout(at('now-queue', 1.0), at('now-queue', 3.2), 'box', { label: 'while it works', side: 'above' });
  sc.show('midturn', at('now-queue', 3.4), { fade: 0.3 }).cut(at('now-queue', 3.4), TASK);
  sc.callout(at('now-queue', 3.8), at('now-queue', 6.2), 'said', { label: 'reaches it at once', side: 'left' });
  sc.callout(at('now-queue', 6.4), end('now-queue') - 0.3, 'reply', { label: 'heard, mid-task', side: 'below' });
  sc.show('board-queue', start('now-one'), { fade: 0.3 }).cut(start('now-one'), COLS2);
  sc.callout(at('now-one', 1.2), at('now-one', 3.8), 'ongoing', { label: 'one task at a time', side: 'right' });
  sc.callout(at('now-one', 4.2), at('now-one', 6.6), [297, 151, 251, 137], { label: 'the rest wait, in order', side: 'below' });
  sc.show('kanban-next', at('now-one', 6.8), { fade: 0.3 });
  sc.callout(at('now-one', 7.2), end('now-one') - 0.3, 'next', { label: 'billing takes the next one', side: 'right' });

  // 04 Where the time went
  sc.show('timeline-live', start('time-dots'), { fade: 0 }).cut(start('time-dots'), LINE);
  sc.callout(at('time-dots', 1.2), at('time-dots', 3.2), 'timeline', { label: 'every task keeps one', side: 'below' });
  sc.callout(at('time-dots', 3.6), at('time-dots', 6.0), LIVE_DOT, { label: 'a dot per status', side: 'below' });
  sc.callout(at('time-dots', 6.4), end('time-dots') - 0.3, LIVE_SPAN, { label: 'the time on the line', side: 'below' });
  sc.show('timeline-refunds', start('time-colors'), { fade: 0.3 }).cut(start('time-colors'), LINE);
  sc.callout(at('time-colors', 0.9), at('time-colors', 2.4), RED, { label: 'blocked', side: 'below' });
  sc.callout(at('time-colors', 2.5), at('time-colors', 5.0), YELLOW, { label: 'waiting on you', side: 'below' });
  sc.show('timeline-live', at('time-colors', 5.2), { fade: 0.3 });
  sc.callout(at('time-colors', 5.6), end('time-colors') - 0.3, LIVE_NOW, { label: 'now, still counting', side: 'below' });
  sc.show('timeline-refunds', start('time-totals'), { fade: 0.3 }).cut(start('time-totals'), TOTALS);
  sc.look(start('time-example'), LINE, { dur: 0.8 });
  sc.callout(at('time-totals', 2.8), at('time-totals', 3.8), WORKED, { label: 'worked', side: 'below' });
  sc.callout(at('time-totals', 3.9), at('time-totals', 4.9), BLOCKED, { label: 'blocked', side: 'below' });
  sc.callout(at('time-totals', 5.0), at('time-totals', 6.4), NEEDS, { label: 'waiting on you', side: 'below' });
  sc.callout(at('time-totals', 6.6), end('time-totals') - 0.3, CLOSE, { label: 'start to close', side: 'below' });
  sc.callout(at('time-example', 1.0), at('time-example', 3.4), CLOSE, { label: '2 hours', side: 'below' });
  sc.callout(at('time-example', 3.8), at('time-example', 5.4), WORKED, { label: '1h 14m of work', side: 'below' });
  sc.callout(at('time-example', 5.6), at('time-example', 7.4), RED, { label: '38m blocked', side: 'below' });
  sc.callout(at('time-example', 7.6), end('time-example') - 0.3, YELLOW, { label: '8m waiting on your yes', side: 'below' });

  // 05 Every call on the record
  sc.show('timeline-live', start('trace-tab'), { fade: 0.3 }).cut(start('trace-tab'), [880, 80, 560, 280]);
  sc.callout(at('trace-tab', 0.9), at('trace-tab', 2.4), [1270, 108, 124, 30], { label: 'Trajectory', side: 'below' });
  sc.click(at('trace-tab', 2.6), [1270, 108, 124, 30]);
  sc.show('trace-tab', at('trace-tab', 2.9), { fade: 0.25 }).away(at('trace-tab', 3.0));
  sc.look(at('trace-tab', 2.9), [450, 90, 960, 475], { dur: 0.6 });
  sc.callout(at('trace-tab', 3.8), at('trace-tab', 6.0), 'toggle', { label: 'its tool calls, counted', side: 'below' });
  sc.callout(at('trace-tab', 6.2), end('trace-tab') - 0.3, [478, 205, 200, 72], { label: 'the shape of the run', side: 'right' });
  sc.show('trace-search', start('trace-search'), { fade: 0.25 }).cut(start('trace-search'), TRACE);
  sc.callout(at('trace-search', 1.2), at('trace-search', 3.4), 'search', { label: 'search: migrate', side: 'below' });
  sc.show('trace-lane', at('trace-search', 3.6), { fade: 0.25 });
  sc.callout(at('trace-search', 4.0), at('trace-search', 5.6), 'chip', { label: 'one lane', side: 'above' });
  sc.callout(at('trace-search', 5.8), end('trace-search') - 0.3, 'list', { label: 'one moment, found', side: 'right' });
  sc.show('trace-detail', start('trace-detail'), { fade: 0.25 });
  sc.callout(at('trace-detail', 1.2), at('trace-detail', 3.2), [507, 467, 269, 29], { label: 'click a call', side: 'right' });
  sc.callout(at('trace-detail', 3.4), at('trace-detail', 5.4), 'detail', { label: 'the tool', side: 'above' });
  sc.callout(at('trace-detail', 5.6), at('trace-detail', 7.4), 'status', { label: 'allowed, auto-allowed or denied', side: 'below' });
  sc.show('trace-payload', at('trace-detail', 7.6), { fade: 0.25 });
  sc.callout(at('trace-detail', 8.0), end('trace-detail') - 0.3, 'payload', { label: 'the exact command', side: 'below' });
  sc.show('trace-denied', start('trace-denied'), { fade: 0.25 });
  sc.callout(at('trace-denied', 1.6), at('trace-denied', 4.4), 'row', { label: 'a force push to main', side: 'right' });
  sc.callout(at('trace-denied', 4.6), at('trace-denied', 6.2), 'status', { label: 'denied', side: 'below' });
  sc.callout(at('trace-denied', 6.4), end('trace-denied') - 0.3, 'push', { label: 'then the plain push', side: 'right' });

  // 06 You stay in control
  sc.show('always-ask', start('ctl-always'), { fade: 0 }).cut(start('ctl-always'), [450, 360, 960, 290]);
  sc.callout(at('ctl-always', 0.9), at('ctl-always', 2.6), 'always', { label: 'Always Allow', side: 'below' });
  sc.click(at('ctl-always', 2.8), 'always');
  sc.show('always-done', at('ctl-always', 3.0), { fade: 0.2 }).away(at('ctl-always', 3.1));
  sc.show('auto-list', at('ctl-always', 3.5), { fade: 0.3 }).cut(at('ctl-always', 3.5), [340, 120, 1040, 420]);
  sc.callout(at('ctl-always', 3.9), at('ctl-always', 5.4), 'npm', { label: 'npm, any arguments', side: 'right' });
  sc.show('trace-auto', at('ctl-always', 5.6), { fade: 0.3 }).cut(at('ctl-always', 5.6), TRACE);
  sc.callout(at('ctl-always', 6.0), at('ctl-always', 7.6), 'row', { label: 'the next npm call', side: 'right' });
  sc.callout(at('ctl-always', 7.8), end('ctl-always') - 0.3, 'status', { label: 'auto-allowed', side: 'below' });
  sc.show('auto-list', start('ctl-list'), { fade: 0.25 }).cut(start('ctl-list'), [340, 120, 1040, 420]);
  sc.callout(at('ctl-list', 1.0), at('ctl-list', 5.0), 'list', { label: 'every rule', side: 'below' });
  sc.callout(at('ctl-list', 5.4), end('ctl-list') - 0.3, [1310, 455, 30, 30], { label: 'one click removes it', side: 'left' });
  sc.show('drag-before', start('ctl-drag'), { fade: 0.3 }).cut(start('ctl-drag'), COLS2);
  sc.callout(at('ctl-drag', 1.0), at('ctl-drag', 3.2), [289, 113, 267, 190], { label: 'your board too', side: 'below' });
  sc.callout(at('ctl-drag', 3.6), at('ctl-drag', 5.4), 'a', { label: 'drag it up', side: 'right' });
  sc.click(at('ctl-drag', 5.6), 'a');
  sc.show('drag-after', at('ctl-drag', 5.9), { fade: 0.25 }).away(at('ctl-drag', 6.0));
  sc.callout(at('ctl-drag', 6.4), end('ctl-drag') - 0.3, 'a', { label: 'it goes first', side: 'right' });

  // Recap: one screen for each promise.
  sc.show('kanban', start('recap'), { fade: 0.4 }).cut(start('recap'), BOARD);
  sc.callout(at('recap', 0.9), at('recap', 2.6), [568, 113, 267, 420], { label: 'every agent, one screen', side: 'right' });
  sc.show('ask-board', at('recap', 2.8), { fade: 0.3 }).cut(at('recap', 2.8), ASKING);
  sc.callout(at('recap', 3.0), at('recap', 4.4), 'toast', { label: 'waiting on you', side: 'left' });
  sc.show('busy', at('recap', 4.6), { fade: 0.3 }).cut(at('recap', 4.6), TASK);
  sc.callout(at('recap', 4.8), at('recap', 6.2), WORKING, { label: 'what it is doing now', side: 'right' });
  sc.show('timeline-refunds', at('recap', 6.4), { fade: 0.3 }).cut(at('recap', 6.4), LINE);
  sc.callout(at('recap', 6.6), at('recap', 8.2), 'timeline', { label: 'where the time went', side: 'below' });
  sc.show('trace-denied', at('recap', 8.4), { fade: 0.3 }).cut(at('recap', 8.4), TRACE);
  sc.callout(at('recap', 8.6), end('recap') - 0.3, 'list', { label: 'every call on the record', side: 'right' });

  sc.visible([
    [start('board-home'), end('board-live')],
    [start('wait-ask'), end('wait-answer')],
    [start('now-busy'), end('now-one')],
    [start('time-dots'), end('time-example')],
    [start('trace-tab'), end('trace-denied')],
    [start('ctl-always'), end('recap')],
  ]).build();

  // The chapter, in a corner, while its screens show.
  chapterChips(s, [['01 / EVERY AGENT ON ONE SCREEN', 'board-home', 'board-live'], ['02 / WHO IS WAITING ON YOU', 'wait-ask', 'wait-answer'], ['03 / WHAT IT IS DOING RIGHT NOW', 'now-busy', 'now-one'],
    ['04 / WHERE THE TIME WENT', 'time-dots', 'time-example'], ['05 / EVERY CALL ON THE RECORD', 'trace-tab', 'trace-denied'], ['06 / YOU STAY IN CONTROL', 'ctl-always', 'ctl-drag']].map(([label, a, z]) => [label, start(a), end(z)]));

  captions(s, tl, { band: BAND, size: 28, chars: 72, lineGap: 32, baseline: 51 });
  return s;
};
