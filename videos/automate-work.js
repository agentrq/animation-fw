// AgentRQ, automate the work, narrated, about six minutes: each chapter opens on a
// pain in the house style (ground, mascots, pixel art), then shows the fix on real
// screens of the app, captured with src/capture.js from a local AgentRQ where Ada
// runs four projects (storefront, billing, docs, mobile), each in its own workspace
// with its own agent. Everything on screen ran for real: the scheduler fired the
// morning triage, billing's agent published the event that opened tasks for docs
// and mobile, a signed GitHub request fired ci_failed through the built-in hook, and
// the release pipeline handed one workspace's finished task to the next. Only the
// history is backdated. The captures and their regions are in videos/screens/automate-work.
// Build: node bin/video.js videos/automate-work.js --size 3840x2160
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { el, g } from '../src/index.js';
import { C, mascotByName, mascot } from '../kit/agentrq.js';
import { loadTimeline, beatsById, videoScene, showDuring, captions, VW } from './lib.js';
import { BAND, LIFT, ARTX, collect, groundStrip, pane, doc, tagChip, from, addCards, chapterChips } from './house.js';
import { Screen, loadShots } from './screen.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'automate-work.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, 'screens/automate-work');

// The storefront's, billing's, docs' and mobile's agents.
const NAMES = ['claude', 'codex', 'agy', 'hermes'];
const MX = (i) => 620 + i * 160;
const [SHOP, BILL, DOCS, MOB] = NAMES.map((n) => mascotByName(n).color);
const GREEN = '#86efac';

// ---------------------------------------------------------------- the cards' art

// A terminal: a title bar in the project's colour, then lines of mono text.
function term(s, { x, y, w, h, title, color, lines }) {
  return g({},
    pane(s, { x, y, w, h, title, color }),
    ...lines.map(([text, fill], i) => s.text(text, { x: x + 14, y: y + 50 + i * 22, font: 'mono', size: 13, fill })));
}

// Nine o'clock: the same three prompts, typed by hand into three agents.
function artMorning(s, at) {
  const T = [
    ['STOREFRONT', SHOP, '> check last night\'s errors', at('hook', 2.2)],
    ['STOREFRONT', SHOP, '> fix the build that broke', at('pain', 2.2)],
    ['DOCS · MOBILE', DOCS, '> billing changed the API...', at('pain', 4.2)],
  ];
  return g({},
    s.text('09:00', { x: ARTX + 590, y: 96, font: 'pixel', size: 30, fill: C.ask, anchor: 'end' }),
    ...T.map(([title, color, line, t], i) => from(s, term(s, { x: ARTX + i * 40, y: 120 + i * 62, w: 430, h: 92, title, color, lines: [[line, C.text]] }), t)),
    from(s, tagChip(s, 'the scheduler', { x: ARTX + 40, y: 340, fill: C.ask }), at('pain', 6.6)),
    from(s, tagChip(s, 'and the messenger', { x: ARTX + 240, y: 340, fill: C.blocked, color: C.text }), at('pain', 7.4)));
}

// The promise: four ways the work starts itself.
function artPromise(s, at) {
  const W = [['SCHEDULE', 'every day at 9', 1.4], ['EVENT', 'one agent to the next', 3.0], ['WEBHOOK', 'GitHub starts it', 5.6], ['WORKFLOW', 'the whole chain', 7.6]];
  return g({},
    ...W.map(([kind, line, o], i) => from(s, g({},
      el('rect', { x: ARTX + (i % 2) * 300, y: 80 + Math.floor(i / 2) * 120, width: 280, height: 100, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
      s.text(kind, { x: ARTX + (i % 2) * 300 + 18, y: 116 + Math.floor(i / 2) * 120, font: 'pixel', size: 14, fill: C.lit }),
      s.text(line, { x: ARTX + (i % 2) * 300 + 18, y: 150 + Math.floor(i / 2) * 120, font: 'body', size: 16, fill: C.text })), at('promise', o))));
}

// A week of mornings: Thursday was busy, and nobody read the errors.
function artWeek(s, at) {
  const D = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  return g({},
    ...D.map((d, i) => {
      const x = ARTX + i * 118;
      const miss = i === 3;
      return from(s, g({},
        el('rect', { x, y: 110, width: 104, height: 120, fill: C.panel, stroke: miss ? C.blocked : C.line, 'stroke-width': 2, class: 'px' }),
        s.text(d, { x: x + 52, y: 140, font: 'pixel', size: 13, fill: miss ? C.blocked : C.dim, anchor: 'middle' }),
        s.text(miss ? '—' : '9:00', { x: x + 52, y: 196, font: 'mono', size: 20, fill: miss ? C.blocked : GREEN, anchor: 'middle' })), at('sched-pain', 0.6 + i * 0.4));
    }),
    from(s, tagChip(s, 'a busy morning', { x: ARTX + 300, y: 250, fill: C.blocked, color: C.text }), at('sched-pain', 3.0)),
    from(s, tagChip(s, 'nobody read the errors', { x: ARTX + 200, y: 300, fill: C.ask }), at('sched-pain', 5.0)));
}

// You, carrying the news from billing to docs, then to mobile.
function artMessenger(s, at) {
  const X = [ARTX, ARTX + 220, ARTX + 440];
  const W = [['BILLING', BILL], ['DOCS', DOCS], ['MOBILE', MOB]];
  const note = (x0, x1, t0) => s.anim(doc(s, 'API changed', { w: 110 }), [[0, { x: x0, y: 230, opacity: 0 }], [t0, { x: x0, y: 230, opacity: 1 }, 'step'], [t0 + 1.2, { x: x1, y: 230, opacity: 1 }, 'inOut'], [t0 + 1.6, { x: x1, y: 230, opacity: 0 }, 'step']]);
  return g({},
    ...W.map(([t, c], i) => term(s, { x: X[i], y: 90, w: 190, h: 120, title: t, color: c, lines: [[i ? 'waiting...' : 'API changed', i ? C.dim : C.text]] })),
    note(X[0] + 40, X[1] + 40, at('ev-pain', 2.2)), note(X[1] + 40, X[2] + 40, at('ev-pain', 3.8)),
    from(s, tagChip(s, 'by hand, every change', { x: ARTX + 160, y: 300, fill: C.ask }), at('ev-pain', 5.4)));
}

// The build went red at two, and sat there until nine.
function artRed(s, at) {
  const t = at('hook-pain', 0.8);
  return g({},
    term(s, { x: ARTX, y: 80, w: 380, h: 170, title: 'ada/storefront · test', color: C.blocked, lines: [['x cart keeps items after sign-in', C.blocked], ['  expected 2, got 1', C.dim], ['main @ a41f9c2', C.dim]] }),
    s.anim(s.text('02:07', { x: ARTX + 500, y: 170, font: 'pixel', size: 34, fill: C.blocked, anchor: 'middle' }), [[0, { opacity: 0 }], [t, { opacity: 0 }, 'step'], [t + 0.05, { opacity: 1 }, 'step'], [t + 2.2, { opacity: 1 }, 'step'], [t + 2.25, { opacity: 0 }, 'step']]),
    from(s, s.text('09:00', { x: ARTX + 500, y: 170, font: 'pixel', size: 34, fill: C.ask, anchor: 'middle' }), t + 2.25),
    from(s, tagChip(s, 'seen seven hours later', { x: ARTX + 60, y: 280, fill: C.ask }), at('hook-pain', 3.4)),
    from(s, tagChip(s, 'then someone reads the log', { x: ARTX + 120, y: 326, fill: C.blocked, color: C.text }), at('hook-pain', 5.2)));
}

// Events, one hop at a time: no single place shows the release.
function artHops(s, at) {
  const N = [['release_ready', 30, 90], ['billing', 250, 60], ['deployed', 420, 140], ['docs', 210, 230], ['mobile', 470, 260]];
  return g({},
    ...N.map(([name, dx, dy], i) => from(s, tagChip(s, name, { x: ARTX + dx, y: dy, fill: i % 2 ? C.card : C.panel, color: C.text }), at('wf-pain', 0.6 + i * 0.4))),
    from(s, s.text('?', { x: ARTX + 330, y: 230, font: 'pixel', size: 48, fill: C.ask, anchor: 'middle' }), at('wf-pain', 4.4)),
    from(s, tagChip(s, 'where is the whole chain?', { x: ARTX + 120, y: 320, fill: C.ask }), at('wf-pain', 5.4)));
}

// Work that starts itself, still on your terms.
function artTerms(s, at) {
  const row = (label, value, y, fill, t) => from(s, g({},
    el('rect', { x: ARTX + 60, y, width: 470, height: 52, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    s.text(label, { x: ARTX + 80, y: y + 33, font: 'pixel', size: 13, fill: C.dim }),
    tagChip(s, value, { x: ARTX + 360, y: y + 13, fill, color: fill === C.blocked ? C.text : C.ink })), t);
  return g({},
    row('RESPONSIBILITY', 'human', 110, C.ask, at('ctl-pain', 0.6)),
    row('YOLO', 'off', 180, C.blocked, at('ctl-pain', 1.6)),
    row('SCHEDULE', 'edit · delete', 250, GREEN, at('ctl-pain', 2.6)));
}

// The end card: the question to answer, and where to try it.
function artEnd(s) {
  return g({},
    s.text('agentrq.com', { x: 860, y: 200, font: 'bold', size: 64, fill: C.text, anchor: 'middle', spacing: -1.5 }),
    s.text('Schedules, events, webhooks and workflows', { x: 860, y: 244, font: 'body', size: 20, fill: C.dim, anchor: 'middle' }),
    el('rect', { x: 580, y: 290, width: 560, height: 54, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
    s.text('What would you automate first?', { x: 860, y: 324, font: 'semi', size: 18, fill: C.lit, anchor: 'middle' }));
}

// ---------------------------------------------------------------- the video

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);

  const s = videoScene({
    tl,
    ground: false,
    poster: at('wf-graph', 4),
    thumbnail: at('wf-graph', 4),
    description: 'AgentRQ, automate the work, narrated over real screens of the app: Ada schedules a morning error triage and the scheduler runs it every day, billing\'s agent publishes an api_changed event that opens tasks for docs and mobile, a failed GitHub build fires ci_failed through the built-in hook and the storefront agent picks it up, and a release_pipeline workflow deploys billing and then hands the release notes and the mobile client to their agents.',
  });
  groundStrip(s);

  // ------------------------------------------------ cards
  const CARDS = [
    { span: [0, end('pain')], kicker: 'EVERY MORNING, BY HAND', headline: ['Same prompts.', 'Every morning.'], sub: 'You are the scheduler, and the messenger.', art: artMorning },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ', headline: ['Set it up once.', 'It runs itself.'], sub: 'Schedules, events, webhooks, workflows.', art: artPromise },
    { span: [start('sched-pain'), end('sched-pain')], kicker: '01 / ON A SCHEDULE', headline: ['Every morning.', 'Unless you forget.'], sub: 'A busy day, and nobody reads the errors.', art: artWeek },
    { span: [start('ev-pain'), end('ev-pain')], kicker: '02 / ONE AGENT HANDS OFF', headline: ['You carry', 'the news.'], sub: 'Billing changed. Tell docs. Tell mobile.', art: artMessenger },
    { span: [start('hook-pain'), end('hook-pain')], kicker: '03 / LET GITHUB START IT', headline: ['Red at two.', 'Seen at nine.'], sub: 'And then someone still reads the log.', art: artRed },
    { span: [start('wf-pain'), end('wf-pain')], kicker: '04 / THE WHOLE PIPELINE', headline: ['One hop', 'at a time.'], sub: 'Where do you see the whole release?', art: artHops },
    { span: [start('ctl-pain'), end('ctl-pain')], kicker: '05 / YOU STAY IN CONTROL', headline: ['It starts itself.', 'You still decide.'], sub: 'Who does it, and what it may run.', art: artTerms },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Set it up once.', 'It runs itself.'], sub: 'Automate the work your agents repeat.', art: artEnd },
  ];
  addCards(s, CARDS, at);

  // The mascots, the four projects' agents, stand under every card and react to its story.
  const cardSpans = CARDS.map((c) => c.span);
  const sp = (id, a) => [at(id, a), end(id) - 0.2];
  const BEHAVE = {
    claude: { ask: [sp('hook', 2.2), sp('sched-pain', 3.0)], done: [sp('promise', 1.4), sp('cta', 1)], alert: [sp('hook-pain', 0.8)], work: [sp('ctl-pain', 0.6)] },
    codex: { work: [sp('pain', 1), sp('wf-pain', 0.6)], done: [sp('promise', 3.0), sp('cta', 1.3)], say: [['!', [sp('ev-pain', 1)]]] },
    agy: { ask: [sp('pain', 4.2), sp('ev-pain', 2.2)], done: [sp('promise', 5.6), sp('cta', 1.6)], say: [['zZ', [sp('hook-pain', 2)]]] },
    hermes: { ask: [sp('ev-pain', 3.8)], done: [sp('promise', 7.6), sp('cta', 1.9)], work: [sp('wf-pain', 2.0)], say: [['zZ', [sp('sched-pain', 3)]]] },
  };
  const hopsAt = (spans) => spans.map(([t0]) => [t0, 16]);
  const crowd = collect(s, () => NAMES.forEach((n, i) => {
    const m = BEHAVE[n];
    mascot(s, { ...mascotByName(n), name: n === 'agy' ? 'antigravity' : n }, i, {
      x: MX(i), hops: hopsAt([...m.done, ...(m.alert ?? [])]), ...m, say: m.say ?? [],
    });
  }));
  s.add(showDuring(s, g({ transform: `translate(0 ${LIFT})` }, crowd), cardSpans));

  // ------------------------------------------------ screens
  const shots = loadShots(SHOTS);
  const sc = new Screen(s, shots, { safe: { x: 0, y: 0, w: VW, h: BAND } });
  const FORM = [340, 200, 800, 280]; // the New Task form
  const MENU = [560, 120, 520, 360]; // the form's schedule or completion menu
  const FOOTER = [600, 240, 480, 230]; // the schedule menu's lower half: frequency, time, footer
  const LIST = [20, 120, 640, 370]; // the sidebar and the Scheduled list
  const RUNS = [470, 100, 930, 240]; // a schedule's page and its runs
  const TASK = [470, 95, 930, 300]; // a task: its title, timeline and thread
  const LEFT = [96, 80, 760, 400]; // a full-width form's left side
  const TOASTS = [900, 380, 540, 420]; // the corner where toasts come in
  const GRAPH = [300, 110, 1100, 280]; // the workflow canvas
  const STEP = [520, 10, 470, 330]; // the step editor's title and instructions
  const WHO = [520, 240, 480, 260]; // the step editor's assignee and commands
  const TRIG_WHO = [96, 420, 480, 260]; // a trigger's responsibility and YOLO
  // Measured on the shots (CSS px).
  const CRON = [682, 384, 64, 20]; // sched-daily: "0 9 * * *"
  const NEXT = [912, 384, 60, 20]; // sched-daily: "In 5h 56m"
  const NEXT_TRIAGE = [302, 314, 64, 20]; // sched-list: the triage's next run
  const NEXT_MONTHLY = [302, 422, 64, 20]; // sched-list: the monthly check's next run
  const RUN_ROW = [481, 288, 910, 28]; // sched-runs: the four runs
  const RUN1 = [481, 288, 215, 28]; // sched-runs: the latest run
  const NAME = [118, 241, 640, 38]; // ev-form
  const GUIDE = [118, 338, 640, 58];
  const TRIG_WS = [118, 230, 640, 37]; // ev-trigger, ev-chain
  const TRIG_TITLE = [118, 304, 640, 38];
  const TRIG_BODY = [118, 378, 640, 78];
  const TRIG_EMIT = [118, 556, 640, 66];
  const PAYLOAD_TOKEN = [288, 388, 140, 20];
  const FAQ_TOKEN = [128, 408, 110, 20];
  const PAYLOAD = [490, 183, 890, 40]; // ev-docs-task: what changed
  const FAQ = [490, 227, 492, 42]; // ev-docs-task: the FAQ
  const EV_CLIENT = [97, 410, 1294, 60]; // ev-tasks: the two tasks it started
  const EV_REF = [97, 483, 1294, 60];
  const DONE_TOAST = [1012, 396, 408, 142]; // wf-board, as on ev-board
  const MOB_TOAST = [1012, 542, 408, 122];
  const HOOK_NAME = [118, 171, 694, 38];
  const REPLAY_NOTE = [110, 538, 494, 18]; // hook-deliveries: "Only failed ones can be replayed"
  const PAL_WS = [97, 124, 192, 170]; // the palette's workspaces
  const PAL_EV = [97, 300, 192, 270]; // and its events
  const WF_NAME = [118, 162, 640, 38];
  const WF_DESC = [118, 258, 640, 58];
  const WF_START = [118, 358, 640, 37];
  const TEXT_BTN = [1320, 45, 68, 31];
  const OUTLINE = [104, 178, 200, 120]; // wf-text
  const GRAPH_A = [320, 140, 770, 200]; // wf-graph: release_ready, billing, deployed
  const GRAPH_B = [760, 120, 640, 220]; // wf-graph: deployed, docs, mobile
  const WARN_TEXT = [97, 626, 700, 64]; // wf-warn: Dead ends
  const WF_MOBILE = [97, 562, 640, 38]; // wf-tasks: the tasks, each in its workspace
const WF_DOCS = [97, 608, 640, 38];
const WF_DEPLOY = [97, 654, 640, 38];
const WF_TASKS = [97, 516, 690, 222];
  const INSTANCES = [673, 172, 718, 26]; // ctl-list: the runs it made

  // 01 On a schedule
  sc.show('sched-form', start('sched-new'), { fade: 0 }).cut(start('sched-new'), 'window');
  sc.look(at('sched-new', 0.8), FORM, { dur: 0.9 });
  sc.callout(at('sched-new', 2.0), at('sched-new', 4.4), 'title', { label: 'a new task in storefront', side: 'above' });
  sc.callout(at('sched-new', 4.6), end('sched-new') - 0.3, [361, 258, 766, 48], { label: 'read the log, a task per new error', side: 'below' });
  sc.callout(at('sched-pick', 0.4), at('sched-pick', 1.6), 'schedule', { label: 'the calendar', side: 'below' });
  sc.click(at('sched-pick', 1.7), 'schedule');
  sc.show('sched-daily', at('sched-pick', 2.0), { fade: 0.25 }).away(at('sched-pick', 2.1));
  sc.look(at('sched-pick', 2.0), MENU, { dur: 0.6 });
  sc.callout(at('sched-pick', 2.7), at('sched-pick', 3.8), 'tabs', { label: 'once, or repeated', side: 'above' });
  sc.callout(at('sched-pick', 3.9), at('sched-pick', 4.9), 'preset', { label: 'Daily', side: 'left' });
  sc.callout(at('sched-pick', 4.9), at('sched-pick', 5.7), 'time', { label: 'at nine', side: 'right' });
  sc.show('sched-custom', at('sched-pick', 5.9), { fade: 0.25 });
  sc.callout(at('sched-pick', 6.2), end('sched-pick') - 0.3, 'days', { label: 'weekdays only', side: 'left' });
  sc.show('sched-daily', start('sched-cron'), { fade: 0.25 }).cut(start('sched-cron'), FOOTER);
  sc.callout(at('sched-cron', 1.4), at('sched-cron', 4.0), CRON, { label: 'a cron line', side: 'above' });
  sc.callout(at('sched-cron', 4.2), end('sched-cron') - 0.3, NEXT, { label: 'until the next run', side: 'above' });
  sc.show('sched-list', start('sched-list'), { fade: 0.3 }).cut(start('sched-list'), LIST);
  sc.callout(at('sched-list', 0.6), at('sched-list', 1.9), 'menu', { label: 'Scheduled', side: 'right' });
  sc.callout(at('sched-list', 2.0), at('sched-list', 2.9), 'links', { label: 'docs', side: 'right' });
  sc.callout(at('sched-list', 2.9), at('sched-list', 3.8), 'triage', { label: 'storefront', side: 'right' });
  sc.callout(at('sched-list', 3.8), at('sched-list', 4.7), 'monthly', { label: 'billing', side: 'right' });
  sc.callout(at('sched-list', 4.8), end('sched-list') - 0.3, NEXT_TRIAGE, { label: 'its next run', side: 'right' });
  sc.click(at('sched-runs', 0.5), 'triage');
  sc.show('sched-runs', at('sched-runs', 0.8), { fade: 0.25 }).away(at('sched-runs', 0.9));
  sc.look(at('sched-runs', 0.8), RUNS, { dur: 0.6 });
  sc.callout(at('sched-runs', 1.6), at('sched-runs', 2.8), 'chip', { label: 'runs daily at 09:00', side: 'below' });
  sc.callout(at('sched-runs', 2.9), at('sched-runs', 4.3), RUN_ROW, { label: 'a run a day', side: 'above' });
  sc.click(at('sched-runs', 4.5), RUN1);
  sc.show('sched-run', at('sched-runs', 4.8), { fade: 0.25 }).away(at('sched-runs', 4.9));
  sc.look(at('sched-runs', 4.8), TASK, { dur: 0.6 });
  sc.callout(at('sched-runs', 5.6), at('sched-runs', 6.9), 'timeline', { label: 'its own timeline', side: 'below' });
  sc.callout(at('sched-runs', 7.0), end('sched-runs') - 0.3, 'reply', { label: 'and thread: what it found', side: 'below' });
  sc.show('sched-runs', start('sched-skip'), { fade: 0.3 }).cut(start('sched-skip'), RUNS);
  sc.callout(at('sched-skip', 1.0), at('sched-skip', 3.2), RUN_ROW, { label: 'one at a time', side: 'above' });
  sc.callout(at('sched-skip', 3.4), end('sched-skip') - 0.3, 'next', { label: 'skipped while the last is open', side: 'below' });
  sc.show('sched-list', start('sched-agent'), { fade: 0.3 }).cut(start('sched-agent'), LIST);
  sc.callout(at('sched-agent', 0.9), at('sched-agent', 3.2), 'monthly', { label: 'set by billing\'s agent', side: 'right' });
  sc.callout(at('sched-agent', 3.4), at('sched-agent', 6.0), NEXT_MONTHLY, { label: 'the 1st of each month', side: 'right' });
  sc.callout(at('sched-agent', 6.2), end('sched-agent') - 0.3, 'monthly', { label: 'over MCP', side: 'right' });

  // 02 One agent hands off to the next
  sc.show('ev-form', start('ev-new'), { fade: 0 }).cut(start('ev-new'), LEFT);
  sc.callout(at('ev-new', 0.9), at('ev-new', 2.9), NAME, { label: 'a named signal', side: 'below' });
  sc.callout(at('ev-new', 3.0), at('ev-new', 5.0), NAME, { label: 'api_changed', side: 'below' });
  sc.callout(at('ev-new', 5.2), end('ev-new') - 0.3, GUIDE, { label: 'what its payload says', side: 'below' });
  sc.show('ev-trigger', start('ev-trigger'), { fade: 0.3 }).cut(start('ev-trigger'), [96, 200, 760, 300]);
  sc.callout(at('ev-trigger', 0.9), at('ev-trigger', 3.7), TRIG_WS, { label: 'docs subscribes', side: 'below' });
  sc.callout(at('ev-trigger', 3.9), at('ev-trigger', 6.4), TRIG_TITLE, { label: 'the task it gets', side: 'below' });
  sc.show('ev-triggers', at('ev-trigger', 6.6), { fade: 0.3 }).cut(at('ev-trigger', 6.6), [140, 70, 780, 270]);
  sc.callout(at('ev-trigger', 6.9), at('ev-trigger', 8.6), 'docs', { label: 'docs: the API reference', side: 'below' });
  sc.callout(at('ev-trigger', 8.7), end('ev-trigger') - 0.3, 'mobile', { label: 'mobile: its client', side: 'above' });
  sc.show('ev-trigger', start('ev-template'), { fade: 0.3 }).cut(start('ev-template'), [96, 330, 640, 160]);
  sc.callout(at('ev-template', 0.8), at('ev-template', 2.6), PAYLOAD_TOKEN, { label: 'the payload goes here', side: 'above' });
  sc.callout(at('ev-template', 2.7), at('ev-template', 3.9), FAQ_TOKEN, { label: 'and its FAQ', side: 'below' });
  sc.callout(at('ev-template', 4.0), end('ev-template') - 0.3, TRIG_BODY, { label: 'so it says what changed', side: 'below' });
  sc.show('ev-task-form', start('ev-publish'), { fade: 0.3 }).cut(start('ev-publish'), FORM);
  sc.callout(at('ev-publish', 1.0), at('ev-publish', 2.4), 'title', { label: 'billing\'s task', side: 'above' });
  sc.callout(at('ev-publish', 2.5), at('ev-publish', 4.0), 'event', { label: 'ends with api_changed', side: 'right' });
  sc.show('ev-docs-task', at('ev-publish', 4.2), { fade: 0.3 }).cut(at('ev-publish', 4.2), [470, 95, 930, 220]);
  sc.callout(at('ev-publish', 4.5), at('ev-publish', 6.8), PAYLOAD, { label: 'what changed', side: 'above' });
  sc.callout(at('ev-publish', 7.0), end('ev-publish') - 0.3, FAQ, { label: 'and a short FAQ', side: 'right' });
  sc.show('ev-board', start('ev-tasks'), { fade: 0.3 }).cut(start('ev-tasks'), TOASTS);
  sc.callout(at('ev-tasks', 0.6), at('ev-tasks', 1.8), 'done', { label: 'billing: done', side: 'left' });
  sc.callout(at('ev-tasks', 1.9), at('ev-tasks', 3.0), 'toast2', { label: 'mobile: a new task', side: 'left' });
  sc.callout(at('ev-tasks', 3.0), at('ev-tasks', 3.9), 'toast', { label: 'docs: a new task', side: 'left' });
  sc.show('ev-tasks', at('ev-tasks', 4.1), { fade: 0.3 }).cut(at('ev-tasks', 4.1), [90, 330, 760, 230]);
  sc.callout(at('ev-tasks', 4.4), end('ev-tasks') - 0.3, [97, 352, 660, 200], { label: 'every task it started', side: 'right' });
  sc.show('ev-chain', start('ev-chain'), { fade: 0.3 }).cut(start('ev-chain'), [96, 200, 760, 500]);
  sc.callout(at('ev-chain', 1.0), at('ev-chain', 4.6), TRIG_EMIT, { label: 'when done, fire client_updated', side: 'above' });
  sc.callout(at('ev-chain', 4.8), end('ev-chain') - 0.3, TRIG_WS, { label: 'api_changed → mobile → client_updated', side: 'below' });

  // 03 Let GitHub start the work
  sc.show('hook-empty', start('hook-reg'), { fade: 0 }).cut(start('hook-reg'), [90, 20, 1320, 300]);
  sc.callout(at('hook-reg', 0.7), at('hook-reg', 2.0), 'tab', { label: 'Hooks', side: 'below' });
  sc.callout(at('hook-reg', 2.1), at('hook-reg', 3.4), 'empty', { label: 'requests in, events out', side: 'below' });
  sc.click(at('hook-reg', 3.5), 'add');
  sc.show('hook-form', at('hook-reg', 3.8), { fade: 0.25 }).away(at('hook-reg', 3.9));
  sc.look(at('hook-reg', 3.8), [96, 150, 740, 320], { dur: 0.5 });
  sc.callout(at('hook-reg', 4.4), at('hook-reg', 5.2), HOOK_NAME, { label: 'ada/storefront CI', side: 'below' });
  sc.callout(at('hook-reg', 5.3), at('hook-reg', 6.1), 'hook', { label: 'GitHub, built in', side: 'right' });
  sc.show('hook-reg', at('hook-reg', 6.3), { fade: 0.25 }).cut(at('hook-reg', 6.3), [96, 140, 870, 240]);
  sc.callout(at('hook-reg', 6.6), end('hook-reg') - 0.3, 'url', { label: 'into GitHub\'s webhook settings', side: 'above' });
  sc.show('hook-form', start('hook-route'), { fade: 0.3 }).cut(start('hook-route'), [96, 360, 740, 260]);
  sc.callout(at('hook-route', 0.9), at('hook-route', 3.4), 'route', { label: 'GitHub\'s signal → her event', side: 'below' });
  sc.callout(at('hook-route', 3.6), at('hook-route', 5.4), 'branches', { label: 'the main branch', side: 'above' });
  sc.callout(at('hook-route', 5.6), end('hook-route') - 0.3, 'route', { label: 'a failed build fires ci_failed', side: 'below' });
  sc.show('hook-task', start('hook-task'), { fade: 0.3 }).cut(start('hook-task'), [470, 95, 930, 220]);
  sc.callout(at('hook-task', 1.0), at('hook-task', 3.4), 'title', { label: 'opened by the hook', side: 'below' });
  sc.callout(at('hook-task', 3.6), at('hook-task', 5.8), 'payload', { label: 'the failure: run, commit, branch', side: 'below' });
  sc.callout(at('hook-task', 6.0), end('hook-task') - 0.3, 'reply', { label: 'and the agent is on it', side: 'below' });
  sc.show('hook-deliveries', start('hook-log'), { fade: 0.3 }).cut(start('hook-log'), [96, 370, 870, 220]);
  sc.callout(at('hook-log', 0.8), at('hook-log', 3.2), 'deliveries', { label: 'every request', side: 'above' });
  sc.callout(at('hook-log', 3.3), at('hook-log', 4.9), 'first', { label: 'a bad signature: rejected', side: 'above' });
  sc.callout(at('hook-log', 5.0), end('hook-log') - 0.3, REPLAY_NOTE, { label: 'failed ones: retried, or replayed', side: 'below' });

  // 04 The whole pipeline
  sc.show('wf-form', start('wf-new'), { fade: 0 }).cut(start('wf-new'), [96, 110, 760, 400]);
  sc.callout(at('wf-new', 0.7), at('wf-new', 2.6), WF_NAME, { label: 'release_pipeline', side: 'below' });
  sc.callout(at('wf-new', 2.7), at('wf-new', 3.8), WF_DESC, { label: 'what it does', side: 'below' });
  sc.callout(at('wf-new', 3.9), end('wf-new') - 0.3, WF_START, { label: 'it starts on release_ready', side: 'below' });
  sc.show('wf-start', start('wf-graph'), { fade: 0.3 }).cut(start('wf-graph'), [90, 110, 1000, 480]);
  sc.callout(at('wf-graph', 1.0), at('wf-graph', 2.4), 'start', { label: 'the start event', side: 'right' });
  sc.callout(at('wf-graph', 2.5), at('wf-graph', 4.3), PAL_WS, { label: 'drag a workspace onto it', side: 'right' });
  sc.show('wf-step', at('wf-graph', 4.5), { fade: 0.25 }).cut(at('wf-graph', 4.5), STEP);
  sc.callout(at('wf-graph', 4.8), at('wf-graph', 6.7), 'title', { label: 'the task it gets', side: 'left' });
  sc.show('wf-warn', at('wf-graph', 6.9), { fade: 0.25 }).cut(at('wf-graph', 6.9), [90, 110, 1000, 480]);
  sc.callout(at('wf-graph', 7.1), at('wf-graph', 8.4), PAL_EV, { label: 'drag an event onto it', side: 'right' });
  sc.callout(at('wf-graph', 8.5), end('wf-graph') - 0.3, 'billing', { label: 'fired when its task is done', side: 'below' });
  sc.show('wf-graph', start('wf-steps'), { fade: 0.3 }).cut(start('wf-steps'), GRAPH_A);
  sc.callout(at('wf-steps', 0.6), at('wf-steps', 1.7), 'start', { label: 'release_ready', side: 'below' });
  sc.callout(at('wf-steps', 1.8), at('wf-steps', 3.0), 'billing', { label: 'billing deploys', side: 'below' });
  sc.callout(at('wf-steps', 3.0), at('wf-steps', 4.2), 'deployed', { label: 'and fires deployed', side: 'below' });
  sc.look(at('wf-steps', 4.2), GRAPH_B, { dur: 0.5 });
  sc.callout(at('wf-steps', 4.9), at('wf-steps', 7.4), 'docs', { label: 'docs: the release notes', side: 'below' });
  sc.callout(at('wf-steps', 7.6), end('wf-steps') - 0.3, 'mobile', { label: 'mobile: the new API', side: 'below' });
  sc.show('wf-graph', start('wf-text'), { fade: 0.3 }).cut(start('wf-text'), [300, 30, 1100, 340]);
  sc.callout(at('wf-text', 0.3), at('wf-text', 1.2), TEXT_BTN, { label: 'Text', side: 'below' });
  sc.click(at('wf-text', 1.3), TEXT_BTN);
  sc.show('wf-text', at('wf-text', 1.6), { fade: 0.25 }).away(at('wf-text', 1.7));
  sc.look(at('wf-text', 1.6), [90, 110, 760, 300], { dur: 0.6 });
  sc.callout(at('wf-text', 2.4), end('wf-text') - 0.3, OUTLINE, { label: 'an indented outline', side: 'right' });
  sc.show('wf-warn', start('wf-warn'), { fade: 0.3 }).cut(start('wf-warn'), [90, 130, 1000, 570]);
  sc.callout(at('wf-warn', 0.9), at('wf-warn', 3.2), WARN_TEXT, { label: 'warnings, under the graph', side: 'above' });
  sc.callout(at('wf-warn', 3.3), end('wf-warn') - 0.3, 'deployed', { label: 'a dead end: nothing takes it', side: 'below' });
  sc.show('wf-run-form', start('wf-run'), { fade: 0.3 }).cut(start('wf-run'), FORM);
  sc.callout(at('wf-run', 1.0), at('wf-run', 2.6), 'title', { label: 'billing\'s final checks', side: 'above' });
  sc.callout(at('wf-run', 2.7), at('wf-run', 4.0), 'workflow', { label: 'On Completion: release_pipeline', side: 'right' });
  sc.callout(at('wf-run', 4.1), at('wf-run', 5.4), 'hint', { label: 'the whole pipeline', side: 'right' });
  sc.show('wf-board', at('wf-run', 5.6), { fade: 0.3 }).cut(at('wf-run', 5.6), TOASTS);
  sc.callout(at('wf-run', 5.9), at('wf-run', 7.6), DONE_TOAST, { label: 'billing deployed', side: 'left' });
  sc.callout(at('wf-run', 7.7), at('wf-run', 9.0), MOB_TOAST, { label: 'then mobile', side: 'left' });
  sc.callout(at('wf-run', 9.1), end('wf-run') - 0.3, 'toast', { label: 'and docs', side: 'left' });
  sc.show('wf-tasks', start('wf-tasks'), { fade: 0.3 }).cut(start('wf-tasks'), [90, 500, 700, 250]);
  sc.callout(at('wf-tasks', 0.9), at('wf-tasks', 2.0), WF_MOBILE, { label: 'in mobile', side: 'right' });
  sc.callout(at('wf-tasks', 2.0), at('wf-tasks', 3.1), WF_DOCS, { label: 'in docs', side: 'right' });
  sc.callout(at('wf-tasks', 3.1), at('wf-tasks', 4.2), WF_DEPLOY, { label: 'in billing', side: 'right' });
  sc.callout(at('wf-tasks', 4.4), end('wf-tasks') - 0.3, WF_TASKS, { label: 'every task it started', side: 'above' });
  sc.show('wf-weekly', start('wf-weekly'), { fade: 0.3 }).cut(start('wf-weekly'), MENU);
  sc.callout(at('wf-weekly', 0.8), at('wf-weekly', 2.8), 'days', { label: 'Friday only', side: 'left' });
  sc.callout(at('wf-weekly', 2.9), at('wf-weekly', 4.2), 'footer', { label: 'every Friday at four', side: 'below' });
  sc.callout(at('wf-weekly', 4.3), end('wf-weekly') - 0.3, 'completion', { label: 'then the whole pipeline', side: 'below' });

  // 05 You stay in control
  sc.show('wf-step', start('ctl-human'), { fade: 0 }).cut(start('ctl-human'), WHO);
  sc.callout(at('ctl-human', 0.9), at('ctl-human', 3.4), 'assignee', { label: 'agent, or human', side: 'below' });
  sc.show('ev-chain', at('ctl-human', 3.6), { fade: 0.3 }).cut(at('ctl-human', 3.6), TRIG_WHO);
  sc.callout(at('ctl-human', 3.9), end('ctl-human') - 0.3, 'resp', { label: 'on every trigger too', side: 'below' });
  sc.callout(at('ctl-yolo', 0.9), at('ctl-yolo', 3.6), 'yolo', { label: 'YOLO: off by default', side: 'below' });
  sc.show('wf-step', at('ctl-yolo', 3.8), { fade: 0.3 }).cut(at('ctl-yolo', 3.8), WHO);
  sc.callout(at('ctl-yolo', 4.1), end('ctl-yolo') - 0.3, 'allow', { label: 'Allow all commands: off', side: 'below' });
  sc.show('ctl-list', start('ctl-edit'), { fade: 0.3 }).cut(start('ctl-edit'), [250, 150, 600, 280]);
  sc.callout(at('ctl-edit', 1.0), at('ctl-edit', 2.6), 'edit', { label: 'edit', side: 'above' });
  sc.callout(at('ctl-edit', 2.7), at('ctl-edit', 4.2), 'del', { label: 'delete', side: 'above' });
  sc.look(at('ctl-edit', 4.2), [660, 100, 740, 140], { dur: 0.5 });
  sc.callout(at('ctl-edit', 4.8), end('ctl-edit') - 0.3, INSTANCES, { label: 'its runs stay', side: 'below' });

  // Recap: one screen for each.
  sc.show('sched-runs', start('recap'), { fade: 0.4 }).cut(start('recap'), RUNS);
  sc.callout(at('recap', 0.6), at('recap', 1.9), 'chip', { label: 'on a schedule', side: 'below' });
  sc.show('ev-board', at('recap', 2.0), { fade: 0.3 }).cut(at('recap', 2.0), TOASTS);
  sc.callout(at('recap', 2.2), at('recap', 3.5), 'toast2', { label: 'events between agents', side: 'left' });
  sc.show('hook-task', at('recap', 3.6), { fade: 0.3 }).cut(at('recap', 3.6), [470, 95, 930, 220]);
  sc.callout(at('recap', 3.8), at('recap', 5.1), 'title', { label: 'webhooks from GitHub', side: 'below' });
  sc.show('wf-graph', at('recap', 5.2), { fade: 0.3 }).cut(at('recap', 5.2), GRAPH);
  sc.callout(at('recap', 5.4), end('recap') - 0.3, 'canvas', { label: 'the whole release', side: 'below' });

  sc.visible([
    [start('sched-new'), end('sched-agent')],
    [start('ev-new'), end('ev-chain')],
    [start('hook-reg'), end('hook-log')],
    [start('wf-new'), end('wf-weekly')],
    [start('ctl-human'), end('recap')],
  ]).build();

  // The chapter, in a corner, while its screens show.
  chapterChips(s, [['01 / ON A SCHEDULE', 'sched-new', 'sched-agent'], ['02 / ONE AGENT HANDS OFF', 'ev-new', 'ev-chain'], ['03 / LET GITHUB START IT', 'hook-reg', 'hook-log'],
    ['04 / THE WHOLE PIPELINE', 'wf-new', 'wf-weekly'], ['05 / YOU STAY IN CONTROL', 'ctl-human', 'ctl-edit']].map(([label, a, z]) => [label, start(a), end(z)]));

  captions(s, tl, { band: BAND, size: 28, chars: 72, lineGap: 32, baseline: 51 });
  return s;
};
