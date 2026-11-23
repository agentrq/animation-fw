// AgentRQ, hand off fast, narrated, about five and a half minutes: each chapter opens
// on a pain in the house style (ground, mascots, pixel art), then shows the fix on real
// screens of the app, captured with src/capture.js from a local AgentRQ where Ada runs
// storefront with Claude Code, started from the browser on her machine. Everything on
// screen ran for real: the task created with no title and named by the model in the
// browser, the sparkle, a reply spoken into the mic and transcribed by Whisper in the
// browser, the pull-n-push preset, the send delay with Cancel and Send Now, the
// shortcuts, and /clear typed into Claude Code's live terminal before the next task.
// Only two panes are drawn: the clear-context sequence and the MCP field agents use.
// The captures and their regions are in videos/screens/hand-off-fast.
// Build: node bin/video.js videos/hand-off-fast.js --size 3840x2160
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { el, g } from '../src/index.js';
import { C, mascotByName, mascot } from '../kit/agentrq.js';
import { loadTimeline, beatsById, videoScene, showDuring, captions, VW } from './lib.js';
import { BAND, LIFT, ARTX, collect, fadeSpan, groundStrip, pane, bubbleLine, tagChip, from, addCards, chapterChips } from './house.js';
import { Screen, loadShots } from './screen.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'hand-off-fast.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, 'screens/hand-off-fast');

// Storefront's agent and two friends, under every card.
const NAMES = ['claude', 'codex', 'agy'];
const MX = (i) => 700 + i * 170;
const [SHOP] = NAMES.map((n) => mascotByName(n).color);

// A box with a pixel kind and a line under it, stepping in at t.
const tile = (s, x, y, w, h, kind, line, t, color = C.lit) => from(s, g({},
  el('rect', { x, y, width: w, height: h, fill: C.panel, stroke: color, 'stroke-width': 2, class: 'px' }),
  s.text(kind, { x: x + 16, y: y + 28, font: 'pixel', size: 13, fill: color }),
  s.text(line, { x: x + 16, y: y + 54, font: 'body', size: 15, fill: C.text })), t);
// A red line through text, drawn at t.
const strike = (s, x, y, w, t) => from(s, el('rect', { x, y, width: w, height: 3, fill: C.blocked, class: 'px' }), t);

// ---------------------------------------------------------------- the cards' art

// The handoff: a title, a paragraph, yesterday's words; then a send with a typo in it.
function artHandoff(s, at) {
  const X = ARTX;
  const Y = 70;
  return g({},
    pane(s, { x: X, y: Y, w: 560, h: 200, title: 'STOREFRONT · NEW TASK', color: C.lit }),
    from(s, g({},
      el('rect', { x: X + 18, y: Y + 40, width: 300, height: 28, fill: C.bg, stroke: C.line, 'stroke-width': 2, class: 'px' }),
      s.text('Title ...', { x: X + 30, y: Y + 59, font: 'mono', size: 14, fill: C.dim })), at('hook', 5.5)),
    ...[500, 470, 510, 280].map((w, i) => from(s, el('rect', { x: X + 18, y: Y + 88 + i * 20, width: w, height: 9, fill: C.line, class: 'px' }), at('hook', 6.0 + i * 0.15))),
    from(s, tagChip(s, 'the same words as yesterday', { x: X + 18, y: Y + 166, fill: C.ask }), at('hook', 7.1)),
    from(s, bubbleLine(s, { x: X, y: Y + 224, w: 400, text: 'commit it on a branch named copuon-fix', you: true }), at('pain', 1.7)),
    strike(s, X + 186, Y + 244, 40, at('pain', 2.6)),
    from(s, tagChip(s, 'already read', { x: X + 412, y: Y + 223, fill: C.blocked, color: C.text }), at('pain', 5.6)),
    from(s, tagChip(s, 'with the last task in its head', { x: X, y: Y + 266, fill: C.ask }), at('pain', 6.9)));
}

// The promise: five ways to hand off faster.
function artPromise(s, at) {
  const W = [['TALK', 'say it, don\'t type it', 3.2], ['NO TITLE', 'it gets named for you', 4.5], ['PRESETS', 'reuse what you always say', 5.4],
    ['TAKE IT BACK', 'cancel before it goes', 6.9], ['CLEAN SLATE', 'every task starts fresh', 8.3]];
  return g({}, ...W.map(([kind, line, o], i) => tile(s, ARTX + (i % 2) * 300, 60 + Math.floor(i / 2) * 84, 280, 70, kind, line, at('promise', o))));
}

// Naming a task: three tries, each crossed out.
function artNaming(s, at) {
  const X = ARTX + 20;
  const tries = [['Coupon bug', 2.0], ['Fix removeCoupon total', 2.9], ['Checkout: coupon remov', 3.8]];
  return g({},
    pane(s, { x: X, y: 80, w: 520, h: 210, title: 'TASK TITLE', color: C.dim }),
    ...tries.map(([text, o], i) => g({},
      from(s, s.text(text, { x: X + 24, y: 136 + i * 50, font: 'mono', size: 18, fill: C.text }), at('title-pain', o - 0.8)),
      strike(s, X + 20, 130 + i * 50, text.length * 11 + 8, at('title-pain', o)))),
    from(s, tagChip(s, 'longer than the task', { x: X + 24, y: 316, fill: C.ask }), at('title-pain', 4.4)));
}

// A paragraph, typed line by line.
function artParagraph(s, at) {
  const X = ARTX + 20;
  return g({},
    pane(s, { x: X, y: 80, w: 520, h: 230, title: 'STOREFRONT · REPLY', color: C.dim }),
    ...[470, 450, 480, 430, 470, 220].map((w, i) => from(s, el('rect', { x: X + 22, y: 120 + i * 28, width: w, height: 10, fill: C.line, class: 'px' }), at('voice-pain', 0.9 + i * 0.4))),
    from(s, el('rect', { x: X + 248, y: 256, width: 4, height: 18, fill: C.lit, class: 'px' }), at('voice-pain', 3.0)),
    from(s, tagChip(s, 'still typing', { x: X + 22, y: 336, fill: C.ask }), at('voice-pain', 5.0)));
}

// Monday, Tuesday, Wednesday: the same message, typed again.
function artSameWords(s, at) {
  const days = [['MON', 3.5], ['TUE', 4.6], ['WED', 5.6]];
  return g({},
    ...days.map(([day, o], i) => from(s, g({},
      pane(s, { x: ARTX + i * 200, y: 80 + i * 34, w: 190, h: 130, title: day, color: [SHOP, C.ask, C.dim][i] }),
      ...['pull main,', 'run the tests,', 'tag and push'].map((line, j) => s.text(line, { x: ARTX + i * 200 + 14, y: 80 + i * 34 + 56 + j * 24, font: 'mono', size: 13, fill: C.text }))), at('preset-pain', o))),
    from(s, tagChip(s, 'again', { x: ARTX + 380, y: 300, fill: C.blocked, color: C.text }), at('preset-pain', 6.3)));
}

// Sent, then the typo: the agent is already on it.
function artTypo(s, at) {
  const X = ARTX + 20;
  return g({},
    from(s, bubbleLine(s, { x: X, y: 96, w: 420, text: 'commit it on a branch named copuon-fix', you: true }), at('delay-pain', 1.0)),
    strike(s, X + 186, 116, 40, at('delay-pain', 2.4)),
    from(s, g({},
      pane(s, { x: X, y: 150, w: 520, h: 120, title: 'STOREFRONT · CLAUDE', color: SHOP }),
      s.text('> git switch -c copuon-fix', { x: X + 18, y: 210, font: 'mono', size: 16, fill: C.text })), at('delay-pain', 4.5)),
    from(s, tagChip(s, 'too late', { x: X, y: 296, fill: C.blocked, color: C.text }), at('delay-pain', 3.8)));
}

// Four workspaces of tasks, and one to find.
function artHunt(s, at) {
  const WS = ['storefront', 'billing', 'docs', 'mobile'];
  return g({},
    ...WS.map((name, i) => from(s, g({},
      pane(s, { x: ARTX + i * 145, y: 70, w: 135, h: 250, title: name.toUpperCase(), color: C.dim }),
      ...[0, 1, 2, 3, 4].map((j) => el('rect', { x: ARTX + i * 145 + 12, y: 110 + j * 40, width: 111, height: 28, fill: C.card, stroke: C.line, class: 'px' }))), at('key-pain', 1.1 + i * 0.3))),
    from(s, tagChip(s, 'where was it?', { x: ARTX + 200, y: 340, fill: C.ask }), at('key-pain', 3.4)));
}

// The context of an agent that runs all day: three tasks deep.
function artContext(s, at) {
  const X = ARTX + 20;
  const T = [['TASK 1 · orders export', C.dim, 1.6], ['TASK 2 · cart merge', C.dim, 2.4], ['TASK 3 · coupons', C.lit, 2.8]];
  return g({},
    pane(s, { x: X, y: 70, w: 520, h: 250, title: 'CLAUDE CODE · CONTEXT', color: SHOP }),
    ...T.map(([text, color, o], i) => from(s, g({},
      el('rect', { x: X + 20, y: 110 + i * 60, width: 480, height: 46, fill: C.card, stroke: color, 'stroke-width': 2, class: 'px' }),
      s.text(text, { x: X + 36, y: 139 + i * 60, font: 'pixel', size: 13, fill: color })), at('clear-pain', o))),
    from(s, tagChip(s, 'read again, every turn', { x: X + 20, y: 340, fill: C.ask }), at('clear-pain', 5.2)));
}

// The end card: the question to answer, and where to try it.
function artEnd(s) {
  return g({},
    s.text('agentrq.com', { x: 860, y: 200, font: 'bold', size: 64, fill: C.text, anchor: 'middle', spacing: -1.5 }),
    s.text('Talk, skip the title, take it back', { x: 860, y: 244, font: 'body', size: 20, fill: C.dim, anchor: 'middle' }),
    el('rect', { x: 560, y: 290, width: 600, height: 54, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
    s.text('What slows down your handoffs?', { x: 860, y: 324, font: 'semi', size: 18, fill: C.lit, anchor: 'middle' }));
}

// ---------------------------------------------------------------- drawn where no screen shows it

// What AgentRQ does with a clear-context task, step by step (backend: /clear, 2 s, push).
function clearSteps(s, at) {
  const X = 150;
  const Y = 70;
  const steps = [['NEXT TASK', 'search ignores accents', 0.9], ['/clear', 'typed into its terminal', 4.4], ['WAIT 2 s', 'the context clears', 6.6], ['THE TASK', 'handed over, clean', 8.2]];
  return g({},
    el('rect', { x: 0, y: 0, width: VW, height: BAND, fill: C.bg }),
    pane(s, { x: X, y: Y, w: 900, h: 330, title: 'STOREFRONT · BEFORE CLAUDE CODE PICKS IT UP', color: C.lit }),
    ...steps.map(([kind, line, o], i) => g({},
      tile(s, X + 24 + i * 218, Y + 110, 196, 90, kind, line, at('clear-how', o), i ? C.lit : C.dim),
      ...(i ? [from(s, s.text('>', { x: X + 18 + i * 218 - 14, y: Y + 162, font: 'pixel', size: 16, fill: C.lit }), at('clear-how', o))] : []))),
    from(s, tagChip(s, 'only when Claude Code runs on a machine', { x: X + 24, y: Y + 250, fill: C.ask }), at('clear-how', 2.6)));
}

// The field an agent sets when it creates a task (the workspace MCP's task create).
function mcpField(s) {
  const X = 150;
  const Y = 80;
  return g({},
    el('rect', { x: 0, y: 0, width: VW, height: BAND, fill: C.bg }),
    pane(s, { x: X, y: Y, w: 900, h: 280, title: 'AN AGENT CREATING A TASK · WORKSPACE MCP', color: SHOP }),
    s.text('task create', { x: X + 24, y: Y + 70, font: 'mono', size: 20, fill: C.lit }),
    s.text('clearContext', { x: X + 24, y: Y + 120, font: 'mono', size: 18, fill: C.text }),
    s.text('true', { x: X + 220, y: Y + 120, font: 'mono', size: 18, fill: C.ask }),
    s.text('Ask for a clean slate: /clear is sent to the agent\'s terminal before', { x: X + 24, y: Y + 166, font: 'body', size: 18, fill: C.dim }),
    s.text('this task is handed over, so it starts without the previous task\'s', { x: X + 24, y: Y + 194, font: 'body', size: 18, fill: C.dim }),
    s.text('context. Defaults to the workspace\'s own setting.', { x: X + 24, y: Y + 222, font: 'body', size: 18, fill: C.dim }));
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
    description: 'AgentRQ, hand off fast, narrated over real screens of the app: Ada creates a task with no title and a model in her browser names it, speaks a reply that Whisper turns into text on her machine, saves a preset and inserts it with #, takes back a reply with a typo during the send delay, finds a task with Command K and moves around with single keys, and watches /clear reach Claude Code\'s live terminal before the next task.',
  });
  groundStrip(s);

  // ------------------------------------------------ cards
  const CARDS = [
    { span: [0, end('pain')], kicker: 'THE SLOW PART', headline: ['The handoff is', 'the slow part.'], sub: 'A title, a paragraph, the same words again.', art: artHandoff },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ', headline: ['Hand off', 'in seconds.'], sub: 'Talk, skip the title, take it back.', art: artPromise },
    { span: [start('title-pain'), end('title-pain')], kicker: '01 / SKIP THE TITLE', headline: ['Naming it', 'takes longer.'], sub: 'Longer than writing the task.', art: artNaming },
    { span: [start('voice-pain'), end('voice-pain')], kicker: '02 / SAY IT OUT LOUD', headline: ['A paragraph', 'to type.'], sub: 'Some tasks need the whole story.', art: artParagraph },
    { span: [start('preset-pain'), end('preset-pain')], kicker: '03 / SAY IT ONCE', headline: ['The same words,', 'every day.'], sub: 'Pull, test, tag, push.', art: artSameWords },
    { span: [start('delay-pain'), end('delay-pain')], kicker: '04 / TAKE IT BACK', headline: ['Sent. Then', 'the typo.'], sub: 'One second too late.', art: artTypo },
    { span: [start('key-pain'), end('key-pain')], kicker: '05 / KEYS, NOT CLICKS', headline: ['Where was', 'that task?'], sub: 'Four workspaces, dozens of tasks.', art: artHunt },
    { span: [start('clear-pain'), end('clear-pain')], kicker: '06 / A CLEAN SLATE', headline: ['Old tasks,', 'still in context.'], sub: 'Read again on every turn.', art: artContext },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Hand off', 'in seconds.'], sub: 'Real screens, a real agent, real work.', art: artEnd },
  ];
  addCards(s, CARDS, at);

  // The mascots stand under every card and react to its story.
  const cardSpans = CARDS.map((c) => c.span);
  const sp = (id, a) => [at(id, a), end(id) - 0.2];
  const BEHAVE = {
    claude: { work: [[at('hook', 0.6), end('hook') - 0.2]], ask: [sp('pain', 5.6)], done: [sp('promise', 1.5), sp('cta', 1)], say: [['?', [sp('key-pain', 3.4)]]] },
    codex: { work: [[at('voice-pain', 0.9), end('voice-pain') - 0.2]], done: [sp('promise', 3.2), sp('cta', 1.3)], alert: [sp('delay-pain', 3.8)], say: [['zZ', [sp('preset-pain', 6.3)]]] },
    agy: { done: [sp('promise', 6.9), sp('cta', 1.6)], say: [['?', [sp('title-pain', 2.0)]], ['zZ', [sp('clear-pain', 5.2)]]] },
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
  // Frames for the camera (CSS px). Each keeps the chapter chip (top left) off text.
  const FORM_FRAME = [340, 170, 900, 310]; // the new task form, its tooltips included
  const BOARD_FRAME = [90, 160, 520, 200]; // the board's first rows, under ONGOING
  const DETAIL_FRAME = [470, 95, 700, 200]; // a task's title and description
  const COMPOSER_FRAME = [466, 560, 540, 240]; // the reply box's left half: a toast sits on the right
  const LOWER_FRAME = [470, 520, 960, 280]; // the last message and the reply box
  const DELAY_FRAME = [470, 400, 960, 400]; // the pending reply and the box under it
  const SETTINGS_FRAME = [330, 113, 1060, 470]; // Settings > Input
  const PRESET_FORM = [330, 420, 760, 320]; // Settings > Presets: Add a preset
  const PRESET_LIST = [330, 200, 760, 200]; // Settings > Presets: the saved list
  const FIND_FRAME = [410, 80, 620, 280]; // the finder, and the W and M pickers in its place
  const HELP_FRAME = [430, 115, 580, 560]; // the ? sheet
  const HELP_TOP = [470, 110, 500, 360]; // its Anywhere half
  const TASK_TOP = [470, 95, 920, 330]; // a task, its title and its view toggle
  const CALLS_FRAME = [470, 300, 760, 340]; // the trajectory's tool calls
  const HEAD_FRAME = [40, 30, 730, 300]; // the session page: machine, workspace, agent
  const TERM_FRAME = [40, 190, 730, 280]; // the live terminal's top
  const CSET_FRAME = [330, 380, 1060, 260]; // Settings > Automations: clear context
  // Measured on the shots (CSS px).
  const DESC = [355, 252, 778, 60]; // s-hover: the words typed so far
  const FORM_BOX = [355, 218, 778, 244]; // the whole form
  const TASK_TEXT = [362, 270, 764, 40]; // t-typed: the description
  const SAVED = [362, 220, 420, 46]; // pr-saved: #pull-n-push and its message
  const TITLE = [478, 106, 420, 32]; // t-detail: the task's title
  const LOADING = [474, 703, 150, 30]; // v-load-b / v-transcribing: the state in the box
  const TEXT = [490, 704, 520, 26]; // v-text: the words, in the box
  const SENT = [760, 544, 624, 50]; // v-sent: her reply
  const SENT_D = [944, 438, 440, 50]; // d-sent: the reply with the right branch name
  const FIVE = [470, 420, 62, 30]; // d-settings: 5s
  const FIND_INPUT = [440, 106, 560, 32];
  const FIND_ROW = [436, 152, 568, 46];
  const W_LIST = [436, 152, 568, 186]; // billing, docs, mobile, storefront
  const M_LIST = [436, 152, 568, 66]; // dev-box
  const HELP_HEAD = [510, 128, 420, 22];
  const NEW_ROW = [510, 250, 420, 40];
  const PANO_ROW = [510, 389, 420, 40];
  const NOTE = [510, 628, 420, 22]; // single keys pause while you type in a field
  const VIEW = [1270, 112, 120, 22]; // CHAT | TRAJECTORY
  const CALLS = [474, 395, 390, 200]; // k-t: the tool calls
  const HEAD = [92, 40, 110, 62]; // DEV-BOX, storefront, claude-code
  const TIP = [378, 384, 436, 30]; // c-form: the eraser's tooltip
  const LANG = [348, 161, 332, 41]; // d-settings: the language select, clear of its label
  const OLD = [44, 150, 712, 180]; // c-term-0: the coupon task's summary, still on screen
  const CLEAR_ROW = [44, 290, 712, 20];
  const TASK_ROW = [86, 322, 672, 22];
  const WORK_ROW = [86, 357, 600, 38];

  // 01 Skip the title
  sc.show('pr-empty', start('title-new'), { fade: 0.3 }).cut(start('title-new'), 'window');
  sc.show('t-form', at('title-new', 1.9), { fade: 0.25 });
  sc.look(at('title-new', 3.4), FORM_FRAME, { dur: 0.8 });
  sc.callout(at('title-new', 4.4), end('title-new') - 0.3, FORM_BOX, { label: 'N: a new task, for storefront', side: 'below' });
  sc.show('t-typed', at('title-write', 0.6), { fade: 0.3 });
  sc.callout(at('title-write', 1.0), at('title-write', 3.4), 'title', { label: 'the title: optional', side: 'above' });
  sc.callout(at('title-write', 3.6), end('title-write') - 0.3, TASK_TEXT, { label: 'only the task', side: 'below' });
  sc.callout(at('title-create', 0.8), at('title-create', 2.8), 'hint', { label: 'Command Enter creates it', side: 'below' });
  sc.show('t-untitled', at('title-create', 3.0), { fade: 0.25 }).cut(at('title-create', 3.0), BOARD_FRAME);
  sc.callout(at('title-create', 3.4), end('title-create') - 0.3, 'untitled', { label: 'Untitled, for a moment', side: 'right' });
  sc.show('t-named', at('title-named', 0.8), { fade: 0.3 });
  sc.callout(at('title-named', 1.2), at('title-named', 6.8), 'row', { label: 'named by a model in her browser', side: 'right' });
  sc.show('t-detail', at('title-named', 7.0), { fade: 0.3 }).cut(at('title-named', 7.0), DETAIL_FRAME);
  sc.callout(at('title-named', 7.2), end('title-named') - 0.3, TITLE, { label: 'written on her machine', side: 'right' });
  sc.show('s-hover', start('title-sparkle'), { fade: 0.3 }).cut(start('title-sparkle'), FORM_FRAME);
  sc.callout(at('title-sparkle', 3.3), at('title-sparkle', 4.4), DESC, { label: 'a few words', side: 'below' });
  sc.callout(at('title-sparkle', 4.6), at('title-sparkle', 5.9), 'sparkle', { label: 'the sparkle', side: 'below' });
  sc.click(at('title-sparkle', 6.0), 'sparkle');
  sc.show('s-generating', at('title-sparkle', 6.2), { fade: 0.15 }).away(at('title-sparkle', 6.3));
  sc.show('s-done', at('title-sparkle', 6.6), { fade: 0.2 });
  sc.callout(at('title-sparkle', 6.8), end('title-sparkle') - 0.3, 'title', { label: 'titled before it\'s created', side: 'above' });

  // 02 Say it out loud
  sc.show('v-box', start('voice-mic'), { fade: 0.3 }).cut(start('voice-mic'), 'window');
  sc.look(at('voice-mic', 1.0), COMPOSER_FRAME, { dur: 0.9 });
  sc.callout(at('voice-mic', 2.2), at('voice-mic', 3.8), 'mic', { label: 'the mic', side: 'below' });
  sc.click(at('voice-mic', 3.9), 'mic');
  sc.show('v-rec', at('voice-mic', 4.1), { fade: 0.15 }).away(at('voice-mic', 4.2));
  sc.callout(at('voice-mic', 4.4), end('voice-mic') - 0.3, 'mic', { label: 'recording: she just says it', side: 'below' });
  sc.show('v-load-b', start('voice-model'), { fade: 0.2 });
  sc.callout(at('voice-model', 0.9), at('voice-model', 5.3), LOADING, { label: 'Whisper, into her browser', side: 'above' });
  sc.show('v-transcribing', at('voice-model', 5.5), { fade: 0.2 });
  sc.callout(at('voice-model', 5.7), end('voice-model') - 0.3, LOADING, { label: 'then it\'s ready', side: 'above' });
  sc.show('v-text', start('voice-text'), { fade: 0.2 });
  sc.callout(at('voice-text', 1.4), at('voice-text', 4.2), TEXT, { label: 'the text, where her cursor was', side: 'above' });
  sc.show('v-sent', at('voice-text', 4.4), { fade: 0.3 }).cut(at('voice-text', 4.4), LOWER_FRAME);
  sc.callout(at('voice-text', 4.6), end('voice-text') - 0.3, SENT, { label: 'only the text is sent', side: 'below' });
  sc.show('d-settings', start('voice-lang'), { fade: 0.3 }).cut(start('voice-lang'), SETTINGS_FRAME);
  sc.callout(at('voice-lang', 1.0), at('voice-lang', 4.8), LANG, { label: 'Settings > Input: her language', side: 'right' });
  sc.callout(at('voice-lang', 5.0), end('voice-lang') - 0.3, LANG, { label: 'phones: their own dictation', side: 'right' });

  // 03 Say it once
  sc.show('pr-empty', start('preset-save'), { fade: 0.3 }).cut(start('preset-save'), 'window');
  sc.look(at('preset-save', 2.6), PRESET_FORM, { dur: 0.8 });
  sc.callout(at('preset-save', 3.6), at('preset-save', 5.0), 'name', { label: 'Settings > Presets', side: 'above' });
  sc.show('pr-typed', at('preset-save', 5.2), { fade: 0.2 });
  sc.callout(at('preset-save', 5.5), at('preset-save', 6.5), 'name', { label: 'a short name', side: 'above' });
  sc.callout(at('preset-save', 6.6), at('preset-save', 7.5), 'msg', { label: 'the message', side: 'above' });
  sc.click(at('preset-save', 7.7), 'add');
  sc.show('pr-saved', at('preset-save', 8.0), { fade: 0.2 }).away(at('preset-save', 8.0)).cut(at('preset-save', 8.0), PRESET_LIST);
  sc.callout(at('preset-save', 8.2), at('preset-use', 1.5), SAVED, { label: 'saved: #pull-n-push', side: 'below' });
  sc.show('pr-menu', at('preset-use', 1.7), { fade: 0.3 }).cut(at('preset-use', 1.7), LOWER_FRAME);
  sc.callout(at('preset-use', 3.2), at('preset-use', 5.6), 'box', { label: 'a hash and the first letters', side: 'below' });
  sc.callout(at('preset-use', 5.8), end('preset-use') - 0.3, 'menu', { label: 'picked from the menu', side: 'above' });
  sc.show('pr-inserted', start('preset-done'), { fade: 0.25 });
  sc.callout(at('preset-done', 0.8), at('preset-done', 4.2), 'box', { label: 'the whole message, right there', side: 'above' });
  sc.callout(at('preset-done', 4.4), end('preset-done') - 0.3, 'box', { label: 'the agent just reads it', side: 'above' });

  // 04 Take it back
  sc.show('d-typed', start('delay-send'), { fade: 0.3 }).cut(start('delay-send'), DELAY_FRAME);
  sc.callout(at('delay-send', 0.6), at('delay-send', 2.2), 'box', { label: 'a reply, with a typo', side: 'above' });
  sc.show('d-sending', at('delay-send', 2.4), { fade: 0.15 });
  sc.callout(at('delay-send', 2.6), at('delay-send', 6.8), 'pending', { label: 'Sending in 5s...', side: 'left' });
  sc.callout(at('delay-send', 7.0), at('delay-send', 7.8), 'cancel', { label: 'Cancel', side: 'below' });
  sc.callout(at('delay-send', 7.9), end('delay-send') - 0.3, 'now', { label: 'Send Now', side: 'below' });
  sc.click(at('delay-cancel', 0.9), 'cancel');
  sc.show('d-cancelled', at('delay-cancel', 1.1), { fade: 0.15 }).away(at('delay-cancel', 1.2));
  sc.callout(at('delay-cancel', 1.3), at('delay-cancel', 5.3), 'box', { label: 'back in the box, unsent', side: 'above' });
  sc.show('d-fixed', at('delay-cancel', 5.5), { fade: 0.2 });
  sc.callout(at('delay-cancel', 5.8), end('delay-cancel') - 0.3, 'box', { label: 'fixed: coupon-fix', side: 'above' });
  sc.show('d-sending-2', at('delay-now', 0.4), { fade: 0.15 });
  sc.callout(at('delay-now', 0.7), at('delay-now', 2.3), 'now', { label: 'Send Now', side: 'below' });
  sc.click(at('delay-now', 2.4), 'now');
  sc.show('d-sent', at('delay-now', 2.6), { fade: 0.2 }).away(at('delay-now', 2.7));
  sc.callout(at('delay-now', 2.9), at('delay-now', 4.9), SENT_D, { label: 'delivered at once', side: 'below' });
  sc.callout(at('delay-now', 5.0), end('delay-now') - 0.3, SENT_D, { label: 'or by itself, at zero', side: 'below' });
  sc.show('d-settings', start('delay-setting'), { fade: 0.3 }).cut(start('delay-setting'), SETTINGS_FRAME);
  sc.callout(at('delay-setting', 1.0), at('delay-setting', 5.6), 'delay', { label: 'per workspace: off to 60 s', side: 'above' });
  sc.callout(at('delay-setting', 5.9), end('delay-setting') - 0.3, FIVE, { label: 'new workspaces: 5 s', side: 'below' });

  // 05 Keys, not clicks
  sc.show('k-find', start('key-find'), { fade: 0.3 }).cut(start('key-find'), 'window');
  sc.look(at('key-find', 0.3), FIND_FRAME, { dur: 0.6 });
  sc.callout(at('key-find', 1.1), at('key-find', 2.6), FIND_INPUT, { label: 'Command K: the task finder', side: 'above' });
  sc.show('k-find-typed', at('key-find', 2.8), { fade: 0.15 });
  sc.callout(at('key-find', 3.0), at('key-find', 4.7), FIND_INPUT, { label: 'coupon: from the description', side: 'above' });
  sc.callout(at('key-find', 4.9), at('key-find', 7.8), FIND_ROW, { label: 'any task this device has opened', side: 'below' });
  sc.show('k-opened', at('key-find', 8.0), { fade: 0.2 }).cut(at('key-find', 8.0), TASK_TOP);
  sc.show('k-help', start('key-letters'), { fade: 0.3 }).cut(start('key-letters'), HELP_TOP);
  sc.callout(at('key-letters', 0.6), at('key-letters', 2.8), HELP_HEAD, { label: 'single keys', side: 'right' });
  sc.callout(at('key-letters', 3.0), at('key-letters', 4.1), NEW_ROW, { label: 'N: a new task', side: 'right' });
  sc.show('k-w', at('key-letters', 4.3), { fade: 0.15 }).cut(at('key-letters', 4.3), FIND_FRAME);
  sc.callout(at('key-letters', 4.5), at('key-letters', 5.7), W_LIST, { label: 'W: switch workspace', side: 'right' });
  sc.show('k-m', at('key-letters', 5.9), { fade: 0.15 });
  sc.callout(at('key-letters', 6.0), at('key-letters', 7.2), M_LIST, { label: 'M: a machine', side: 'below' });
  sc.show('k-help', at('key-letters', 7.4), { fade: 0.15 }).cut(at('key-letters', 7.4), HELP_TOP);
  sc.callout(at('key-letters', 7.6), end('key-letters') - 0.3, PANO_ROW, { label: 'P: the Pano', side: 'right' });
  sc.show('k-c', start('key-task'), { fade: 0.3 }).cut(start('key-task'), TASK_TOP);
  sc.callout(at('key-task', 2.3), at('key-task', 4.0), VIEW, { label: 'C: the chat', side: 'below' });
  sc.show('k-t', at('key-task', 4.1), { fade: 0.2 });
  sc.callout(at('key-task', 4.3), at('key-task', 5.6), VIEW, { label: 'T: the trajectory', side: 'below' });
  sc.look(at('key-task', 5.7), CALLS_FRAME, { dur: 0.5 });
  sc.callout(at('key-task', 6.3), end('key-task') - 0.3, CALLS, { label: 'its tool calls', side: 'right' });
  sc.show('k-help', start('key-help'), { fade: 0.3 }).cut(start('key-help'), HELP_FRAME);
  sc.callout(at('key-help', 0.8), at('key-help', 3.0), HELP_HEAD, { label: '?: every shortcut', side: 'right' });
  sc.callout(at('key-help', 3.2), end('key-help') - 0.3, NOTE, { label: 'paused while you type', side: 'below' });

  // 06 A clean slate
  sc.show('c-term-0', start('clear-eraser'), { fade: 0.3 }).cut(start('clear-eraser'), HEAD_FRAME);
  sc.callout(at('clear-eraser', 0.8), at('clear-eraser', 3.9), HEAD, { label: 'Claude Code, on dev-box', side: 'right' });
  sc.show('c-form', at('clear-eraser', 4.1), { fade: 0.3 }).cut(at('clear-eraser', 4.1), FORM_FRAME);
  sc.callout(at('clear-eraser', 6.0), at('clear-eraser', 7.0), 'eraser', { label: 'the eraser', side: 'below' });
  sc.callout(at('clear-eraser', 7.2), end('clear-eraser') - 0.3, TIP, { label: 'clear context', side: 'above' });
  sc.show('c-term-0', start('clear-term'), { fade: 0 }).cut(start('clear-term'), HEAD_FRAME);
  sc.callout(at('clear-term', 1.0), at('clear-term', 4.7), OLD, { label: 'the last task, still on screen', side: 'above' });
  sc.show('c-term-1', at('clear-term', 4.9), { fade: 0.15 }).cut(at('clear-term', 4.9), TERM_FRAME);
  sc.callout(at('clear-term', 5.0), at('clear-term', 6.3), CLEAR_ROW, { label: '/clear', side: 'below' });
  sc.show('c-term-3', at('clear-term', 6.4), { fade: 0.15 });
  sc.callout(at('clear-term', 6.5), at('clear-term', 7.6), TASK_ROW, { label: 'the new task', side: 'below' });
  sc.show('c-term-end', at('clear-term', 7.7), { fade: 0.15 });
  sc.callout(at('clear-term', 7.8), end('clear-term') - 0.3, WORK_ROW, { label: 'on a clean slate', side: 'below' });
  sc.show('c-setting', start('clear-default'), { fade: 0.3 }).cut(start('clear-default'), CSET_FRAME);
  sc.callout(at('clear-default', 0.9), at('clear-default', 4.9), 'row', { label: 'on by default', side: 'above' });

  // Recap: one screen for each.
  sc.show('t-named', start('recap'), { fade: 0.3 }).cut(start('recap'), BOARD_FRAME);
  sc.callout(at('recap', 0.6), at('recap', 1.5), 'row', { label: 'no title to write', side: 'right' });
  sc.show('v-text', at('recap', 1.6), { fade: 0.2 }).cut(at('recap', 1.6), COMPOSER_FRAME);
  sc.callout(at('recap', 1.8), at('recap', 2.6), TEXT, { label: 'said, not typed', side: 'above' });
  sc.show('pr-inserted', at('recap', 2.7), { fade: 0.2 }).cut(at('recap', 2.7), LOWER_FRAME);
  sc.callout(at('recap', 2.9), at('recap', 4.2), 'box', { label: '#pull-n-push', side: 'above' });
  sc.show('d-sending', at('recap', 4.3), { fade: 0.2 }).cut(at('recap', 4.3), DELAY_FRAME);
  sc.callout(at('recap', 4.5), at('recap', 5.4), 'pending', { label: 'take it back', side: 'left' });
  sc.show('k-find-typed', at('recap', 5.5), { fade: 0.2 }).cut(at('recap', 5.5), FIND_FRAME);
  sc.callout(at('recap', 5.7), at('recap', 7.0), FIND_ROW, { label: 'Command K', side: 'below' });
  sc.show('c-term-1', at('recap', 7.1), { fade: 0.2 }).cut(at('recap', 7.1), TERM_FRAME);
  sc.callout(at('recap', 7.3), end('recap') - 0.3, CLEAR_ROW, { label: 'a clean slate', side: 'below' });

  sc.visible([
    [start('title-new'), end('title-sparkle')],
    [start('voice-mic'), end('voice-lang')],
    [start('preset-save'), end('preset-done')],
    [start('delay-send'), end('delay-setting')],
    [start('key-find'), end('key-help')],
    [start('clear-eraser'), end('recap')],
  ]).build();

  // Drawn where no screen shows it: what AgentRQ does before the hand-over, and the
  // field an agent sets to ask for it.
  s.add(fadeSpan(s, clearSteps(s, at), [start('clear-how'), end('clear-how')]));
  s.add(fadeSpan(s, mcpField(s), [at('clear-default', 5.0), end('clear-default')]));

  // The chapter, in a corner, while its screens show.
  chapterChips(s, [['01 / SKIP THE TITLE', 'title-new', 'title-sparkle'], ['02 / SAY IT OUT LOUD', 'voice-mic', 'voice-lang'], ['03 / SAY IT ONCE', 'preset-save', 'preset-done'],
    ['04 / TAKE IT BACK', 'delay-send', 'delay-setting'], ['05 / KEYS, NOT CLICKS', 'key-find', 'key-help'], ['06 / A CLEAN SLATE', 'clear-eraser', 'clear-default']].map(([label, a, z]) => [label, start(a), end(z)]));

  captions(s, tl, { band: BAND, size: 28, chars: 72, lineGap: 32, baseline: 51 });
  return s;
};
