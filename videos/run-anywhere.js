// AgentRQ, run your agents anywhere, narrated, about five and a half minutes: each
// chapter opens on a pain in the house style (ground, mascots, pixel art), then shows
// the fix on real screens of the app, captured with src/capture.js from a local AgentRQ
// where Ada runs four projects (storefront, billing, docs, mobile), each in its own
// workspace. Everything on screen ran for real: agentrqd enrolled her dev box, the
// browser started Claude Code on it and showed its terminal live, Spin up forked a
// workspace and started a second Claude there, the supervisor started an agent over
// MCP, Always Allow wrote the rule that let the later calls through, and the machine
// was limited, disabled and deleted. Two pieces are drawn rather than captured: the
// Slack message (no Slack workspace was linked) and the daemon refusing to run as root.
// The captures and their regions are in videos/screens/run-anywhere.
// Build: node bin/video.js videos/run-anywhere.js --size 3840x2160
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { el, g } from '../src/index.js';
import { C, mascotByName, mascot } from '../kit/agentrq.js';
import { loadTimeline, beatsById, videoScene, showDuring, captions, VW } from './lib.js';
import { BAND, LIFT, ARTX, collect, fadeSpan, groundStrip, pane, tagChip, from, addCards, chapterChips } from './house.js';
import { Screen, loadShots } from './screen.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'run-anywhere.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, 'screens/run-anywhere');

// The storefront's, billing's, docs' and mobile's agents.
const NAMES = ['claude', 'codex', 'agy', 'hermes'];
const MX = (i) => 620 + i * 160;
const [SHOP, BILL] = NAMES.map((n) => mascotByName(n).color);
const GREEN = '#86efac';

// Shown from t0 to t1 only (t0 = 0: from the very first frame).
const between = (s, node, t0, t1) => s.anim(node, [
  ...(t0 > 0 ? [[0, { opacity: 0 }], [t0, { opacity: 0 }, 'step'], [t0 + 0.05, { opacity: 1 }, 'step']] : [[0, { opacity: 1 }]]),
  [t1, { opacity: 1 }, 'step'], [t1 + 0.05, { opacity: 0 }, 'step']]);

// ---------------------------------------------------------------- the cards' art

// A terminal: a title bar in the project's colour, then lines of mono text.
function term(s, { x, y, w, h, title, color, lines, size = 13, gap = 22 }) {
  return g({},
    pane(s, { x, y, w, h, title, color }),
    ...lines.map(([text, fill], i) => s.text(text, { x: x + 14, y: y + 50 + i * gap, font: 'mono', size, fill })));
}

// One laptop: the work runs until the lid closes; after lunch, a prompt still waits.
function artLaptop(s, at) {
  const lid = at('hook', 3.9);
  const after = at('pain', 0.4);
  const base = el('rect', { x: ARTX + 20, y: 322, width: 500, height: 16, fill: C.line, class: 'px' });
  return g({},
    between(s, g({},
      term(s, { x: ARTX + 60, y: 90, w: 420, h: 230, title: 'STOREFRONT · CLAUDE', color: SHOP, lines: [['> fix the cart bug', C.text], ['editing cart.ts ...', C.dim], ['running the tests ...', GREEN]] }),
      base), 0, lid),
    between(s, g({},
      el('rect', { x: ARTX + 20, y: 306, width: 500, height: 16, fill: '#3f3f46', class: 'px' }), base,
      from(s, tagChip(s, 'the work stops', { x: ARTX + 190, y: 360, fill: C.blocked, color: C.text }), at('hook', 5.0))), lid, after),
    from(s, g({},
      term(s, { x: ARTX + 60, y: 110, w: 420, h: 170, title: 'STOREFRONT · CLAUDE', color: SHOP, size: 15, gap: 28, lines: [['Bash: go test ./...', C.text], ['Allow? (y/n) _', C.ask]] }),
      el('rect', { x: ARTX + 20, y: 282, width: 500, height: 16, fill: C.line, class: 'px' })), at('pain', 2.4)),
    between(s, s.text('12:30', { x: ARTX + 600, y: 96, font: 'pixel', size: 30, fill: C.ask, anchor: 'end' }), at('pain', 1.6), at('pain', 4.9)),
    from(s, s.text('16:45', { x: ARTX + 600, y: 96, font: 'pixel', size: 30, fill: C.blocked, anchor: 'end' }), at('pain', 4.9)),
    from(s, tagChip(s, 'nothing moves', { x: ARTX + 60, y: 320, fill: C.blocked, color: C.text }), at('pain', 5.5)),
    from(s, tagChip(s, 'until you are back', { x: ARTX + 220, y: 320, fill: C.ask }), at('pain', 6.9)));
}

// The promise: four things AgentRQ does for agents that run away from you.
function artPromise(s, at) {
  const W = [['MACHINES', 'any machine you own', 3.0], ['BROWSER', 'start agents in a tab', 4.4], ['ALERTS', 'the moment one needs you', 6.7], ['YOLO', 'the safe work runs itself', 9.3]];
  return g({},
    ...W.map(([kind, line, o], i) => from(s, g({},
      el('rect', { x: ARTX + (i % 2) * 300, y: 80 + Math.floor(i / 2) * 120, width: 280, height: 100, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
      s.text(kind, { x: ARTX + (i % 2) * 300 + 18, y: 116 + Math.floor(i / 2) * 120, font: 'pixel', size: 14, fill: C.lit }),
      s.text(line, { x: ARTX + (i % 2) * 300 + 18, y: 150 + Math.floor(i / 2) * 120, font: 'body', size: 16, fill: C.text })), at('promise', o))));
}

// The laptop sleeps; the desktop under the desk never does, and the agents can't reach it.
function artMachines(s, at) {
  const TX = ARTX + 380;
  return g({},
    term(s, { x: ARTX, y: 160, w: 210, h: 120, title: 'LAPTOP', color: SHOP, lines: [['16 GB', C.dim], ['your agents', C.text]] }),
    el('rect', { x: ARTX - 10, y: 280, width: 230, height: 10, fill: C.line, class: 'px' }),
    from(s, g({},
      el('rect', { x: TX, y: 90, width: 150, height: 240, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
      ...[0, 1, 2, 3].map((i) => el('rect', { x: TX + 20, y: 116 + i * 24, width: 110, height: 8, fill: '#27272a', class: 'px' })),
      el('rect', { x: TX + 118, y: 302, width: 10, height: 10, fill: GREEN, class: 'px' }),
      s.text('DESKTOP', { x: TX + 75, y: 290, font: 'pixel', size: 13, fill: C.dim, anchor: 'middle' })), at('mach-pain', 1.0)),
    from(s, tagChip(s, '128 GB', { x: TX - 50, y: 352, fill: GREEN }), at('mach-pain', 2.9)),
    from(s, tagChip(s, 'never sleeps', { x: TX + 40, y: 352, fill: GREEN }), at('mach-pain', 4.2)),
    from(s, g({}, ...[0, 1, 2, 3, 4, 5].map((i) => el('rect', { x: ARTX + 226 + i * 24, y: 218, width: 12, height: 4, fill: C.dim, class: 'px' }))), at('mach-pain', 4.6)),
    from(s, s.text('X', { x: ARTX + 296, y: 236, font: 'pixel', size: 34, fill: C.blocked, anchor: 'middle' }), at('mach-pain', 5.6)),
    from(s, tagChip(s, 'out of reach', { x: ARTX + 230, y: 260, fill: C.blocked, color: C.text }), at('mach-pain', 5.6)));
}

// Starting an agent by hand: SSH, the folder, the flags.
function artSsh(s, at) {
  const L = [['$ ssh ada@dev-box', 2.8], ['$ cd ~/code/storefront', 3.5], ['$ claude --model opus --effort high \\', 4.3], ['    --dangerously-load-development-ch...', 5.0]];
  return g({},
    pane(s, { x: ARTX, y: 90, w: 590, h: 210, title: 'ADA@LAPTOP · TERMINAL', color: SHOP }),
    ...L.map(([text, o], i) => from(s, s.text(text, { x: ARTX + 16, y: 146 + i * 34, font: 'mono', size: 16, fill: i > 1 ? C.ask : C.text }), at('start-pain', o))),
    from(s, tagChip(s, 'every time', { x: ARTX + 40, y: 330, fill: C.blocked, color: C.text }), at('start-pain', 5.5)));
}

// A question in a terminal under other windows.
function artUnseen(s, at) {
  return g({},
    from(s, term(s, { x: ARTX, y: 150, w: 400, h: 130, title: 'BILLING · CLAUDE', color: BILL, size: 14, gap: 26, lines: [['Bash: go test ./invoices/...', C.text], ['Allow? (y/n) _', C.ask]] }), at('note-pain', 0.9)),
    from(s, term(s, { x: ARTX + 150, y: 90, w: 400, h: 150, title: 'BROWSER', color: C.dim, lines: [['the docs, the mail ...', C.dim]] }), at('note-pain', 2.6)),
    from(s, term(s, { x: ARTX + 210, y: 200, w: 380, h: 130, title: 'A MEETING', color: C.dim, lines: [['you, somewhere else', C.dim]] }), at('note-pain', 3.2)),
    from(s, tagChip(s, 'nobody answers', { x: ARTX + 30, y: 360, fill: C.blocked, color: C.text }), at('note-pain', 4.7)));
}

// The same prompt, approved again and again.
function artReflex(s, at) {
  return g({},
    ...[0, 1, 2, 3, 4, 5].map((i) => from(s, g({},
      el('rect', { x: ARTX + i * 16, y: 80 + i * 32, width: 380, height: 62, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
      s.text('Allow Bash: go test ./...?', { x: ARTX + i * 16 + 14, y: 80 + i * 32 + 26, font: 'mono', size: 13, fill: C.text }),
      s.text('[Allow]', { x: ARTX + i * 16 + 14, y: 80 + i * 32 + 48, font: 'mono', size: 13, fill: GREEN })), at('yolo-pain', 0.9 + i * 0.3))),
    from(s, s.text('x40', { x: ARTX + 590, y: 150, font: 'pixel', size: 40, fill: C.ask, anchor: 'end' }), at('yolo-pain', 2.5)),
    from(s, tagChip(s, 'not oversight', { x: ARTX + 20, y: 340, fill: C.blocked, color: C.text }), at('yolo-pain', 3.8)),
    from(s, tagChip(s, 'a reflex', { x: ARTX + 190, y: 340, fill: C.ask }), at('yolo-pain', 5.0)));
}

// The machine still answers to you.
function artRules(s, at) {
  const row = (label, value, y, fill, t) => from(s, g({},
    el('rect', { x: ARTX + 40, y, width: 500, height: 52, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    s.text(label, { x: ARTX + 60, y: y + 33, font: 'pixel', size: 13, fill: C.dim }),
    tagChip(s, value, { x: ARTX + 330, y: y + 13, fill, color: fill === C.blocked ? C.text : C.ink })), t);
  return g({},
    row('AGENT LIMIT', '2 at once', 90, C.ask, at('ctl-pain', 1.2)),
    row('CONNECTION', 'disable · delete', 156, GREEN, at('ctl-pain', 2.2)),
    row('AS ROOT', 'refused', 222, C.blocked, at('ctl-pain', 3.3)),
    row('YOLO', 'off', 288, C.blocked, at('ctl-pain', 3.7)));
}

// The end card: the question to answer, and where to try it.
function artEnd(s) {
  return g({},
    s.text('agentrq.com', { x: 860, y: 200, font: 'bold', size: 64, fill: C.text, anchor: 'middle', spacing: -1.5 }),
    s.text('Machines, the browser, alerts and YOLO', { x: 860, y: 244, font: 'body', size: 20, fill: C.dim, anchor: 'middle' }),
    el('rect', { x: 580, y: 290, width: 560, height: 54, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
    s.text('Where would you run your agents?', { x: 860, y: 324, font: 'semi', size: 18, fill: C.lit, anchor: 'middle' }));
}

// ---------------------------------------------------------------- drawn over the screens

// A permission request in a Slack channel, answered there. Drawn: no Slack workspace
// was linked for the capture.
function slackMessage(s, at) {
  const X = 240;
  const Y = 60;
  const button = (label, x, stroke) => g({},
    el('rect', { x, y: Y + 214, width: 96, height: 36, rx: 6, fill: C.panel, stroke, 'stroke-width': 2 }),
    s.text(label, { x: x + 48, y: Y + 238, font: 'semi', size: 15, fill: C.text, anchor: 'middle' }));
  const avatar = (letter, x, y, fill) => g({},
    el('rect', { x, y, width: 40, height: 40, rx: 8, fill }),
    s.text(letter, { x: x + 20, y: y + 27, font: 'bold', size: 20, fill: C.ink, anchor: 'middle' }));
  const ring = (x, w, t0, t1) => between(s, el('rect', { x: x - 6, y: Y + 208, width: w + 12, height: 48, rx: 10, fill: 'none', stroke: GREEN, 'stroke-width': 3 }), t0, t1);
  return g({},
    el('rect', { x: 0, y: 0, width: VW, height: BAND, fill: C.bg }),
    pane(s, { x: X, y: Y, w: 720, h: 420, title: 'SLACK · #BILLING-AGENT', color: C.lit }),
    avatar('A', X + 24, Y + 48, C.lit),
    s.text('AgentRQ', { x: X + 80, y: Y + 62, font: 'bold', size: 17, fill: C.text }),
    s.text('billing needs a permission', { x: X + 80, y: Y + 86, font: 'body', size: 16, fill: C.dim }),
    s.text('Invoices: store the tax rate per line', { x: X + 80, y: Y + 124, font: 'semi', size: 16, fill: C.text }),
    el('rect', { x: X + 80, y: Y + 142, width: 600, height: 44, rx: 6, fill: '#0b0b0d', stroke: C.line }),
    s.text('Bash  go test ./invoices/...', { x: X + 96, y: Y + 170, font: 'mono', size: 16, fill: C.text }),
    button('Allow', X + 80, GREEN), button('Deny', X + 192, C.blocked),
    ring(X + 80, 96, at('note-slack', 5.0), at('note-slack', 5.5)),
    ring(X + 192, 96, at('note-slack', 5.6), at('note-slack', 6.3)),
    from(s, g({},
      el('rect', { x: X + 80, y: Y + 214, width: 96, height: 36, rx: 6, fill: GREEN }),
      s.text('Allow', { x: X + 128, y: Y + 238, font: 'semi', size: 15, fill: C.ink, anchor: 'middle' })), at('note-slack', 6.6)),
    from(s, s.text('Allowed by Ada, in Slack', { x: X + 80, y: Y + 290, font: 'semi', size: 16, fill: GREEN }), at('note-slack', 7.4)),
    from(s, g({},
      avatar('b', X + 24, Y + 316, BILL),
      s.text('billing · working', { x: X + 80, y: Y + 332, font: 'bold', size: 16, fill: C.text }),
      s.text('go test ./invoices/...  ok', { x: X + 80, y: Y + 360, font: 'mono', size: 15, fill: GREEN })), at('note-slack', 8.9)));
}

// agentrqd refusing to start as root. Drawn from its real output.
function rootRefusal(s, at) {
  const X = 170;
  const Y = 100;
  const L = [
    ['$ sudo agentrqd serve', C.text, 0.6],
    ['agentrqd: guard: refusing to run with administrative', C.blocked, 1.6],
    ['privilege: started as root (uid 0)', C.blocked, 1.6],
    ['Run agentrqd as the user whose work it should do.', C.dim, 2.4],
  ];
  return g({},
    el('rect', { x: 0, y: 0, width: VW, height: BAND, fill: C.bg }),
    pane(s, { x: X, y: Y, w: 860, h: 260, title: 'ADA@DEV-BOX · TERMINAL', color: C.lit }),
    ...L.map(([text, fill, o], i) => from(s, s.text(text, { x: X + 24, y: Y + 70 + i * 40, font: 'mono', size: 20, fill }), at('ctl-root', o))),
    from(s, tagChip(s, 'not as root', { x: X + 24, y: Y + 290, fill: C.ask }), at('ctl-root', 2.9)));
}

// ---------------------------------------------------------------- the video

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);

  const s = videoScene({
    tl,
    ground: false,
    poster: at('promise', 11.0),
    thumbnail: at('promise', 11.0),
    description: 'AgentRQ, run your agents anywhere, narrated over real screens of the app: Ada enrolls her dev box with agentrqd, starts Claude Code on it from the browser and answers its first-run questions in the live terminal, spins a waiting task off into a fork with its own agent, gets permission requests and questions as toasts, push, email and Slack, turns one answer into an auto-allow rule and a trusted task into YOLO, and keeps the machine under control with an agent limit, disable and delete.',
  });
  groundStrip(s);

  // ------------------------------------------------ cards
  const CARDS = [
    { span: [0, end('pain')], kicker: 'ONE LAPTOP, ONE TERMINAL', headline: ['Close the lid.', 'The work stops.'], sub: 'And a prompt waits all afternoon.', art: artLaptop },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ', headline: ['Run them', 'anywhere.'], sub: 'Your machines, from the browser.', art: artPromise },
    { span: [start('mach-pain'), end('mach-pain')], kicker: '01 / YOUR OWN MACHINES', headline: ['A bigger box.', 'Out of reach.'], sub: 'Your agents stay on the laptop.', art: artMachines },
    { span: [start('start-pain'), end('start-pain')], kicker: '02 / START FROM THE BROWSER', headline: ['SSH in.', 'Find the flags.'], sub: 'Every time you start an agent.', art: artSsh },
    { span: [start('note-pain'), end('note-pain')], kicker: '03 / HEAR WHEN THEY NEED YOU', headline: ['Nobody watching.', 'Nobody answers.'], sub: 'A question waits in a hidden terminal.', art: artUnseen },
    { span: [start('yolo-pain'), end('yolo-pain')], kicker: '04 / LET THE SAFE WORK RUN', headline: ['Allow. Allow.', 'Allow again.'], sub: 'Forty approvals is a reflex.', art: artReflex },
    { span: [start('ctl-pain'), end('ctl-pain')], kicker: '05 / YOU STAY IN CONTROL', headline: ['Your machines.', 'Your rules.'], sub: 'Agents still answer to you.', art: artRules },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Run your agents', 'anywhere.'], sub: 'On machines you own, from the browser.', art: artEnd },
  ];
  addCards(s, CARDS, at);

  // The mascots, the four projects' agents, stand under every card and react to its story.
  const cardSpans = CARDS.map((c) => c.span);
  const sp = (id, a) => [at(id, a), end(id) - 0.2];
  const BEHAVE = {
    claude: { work: [[at('hook', 0.6), at('hook', 3.6)]], ask: [sp('pain', 2.4)], done: [sp('promise', 3.0), sp('cta', 1)], alert: [sp('start-pain', 2.8)], say: [['zZ', [[at('hook', 4.1), end('hook') - 0.2]]]] },
    codex: { work: [[at('hook', 0.6), at('hook', 3.6)]], ask: [sp('note-pain', 1.0)], done: [sp('promise', 4.4), sp('cta', 1.3)], say: [['zZ', [[at('hook', 4.2), end('hook') - 0.2]]]] },
    agy: { ask: [sp('yolo-pain', 0.9)], done: [sp('promise', 6.7), sp('cta', 1.6)], say: [['zZ', [[at('hook', 4.3), end('hook') - 0.2], sp('mach-pain', 4.6)]]] },
    hermes: { work: [sp('start-pain', 0.8)], done: [sp('promise', 9.3), sp('cta', 1.9)], say: [['zZ', [[at('hook', 4.4), end('hook') - 0.2]]], ['!', [sp('ctl-pain', 0.9)]]] },
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
  const ADD_FORM = [97, 118, 720, 345]; // Add a machine: its note, warning and two commands
  const WARN_FRAME = [97, 130, 820, 170];
  const CARD_FRAME = [97, 100, 660, 180]; // a machine's card on the Machines page
  const INFO_FRAME = [90, 40, 600, 280]; // a machine's page: its header and menu
  const TILES = [340, 160, 1040, 140]; // Machine Info's resources
  const ASK_FRAME = [60, 600, 760, 200]; // Pano's chat box
  const REPLY_FRAME = [60, 20, 520, 260]; // the supervisor's chat
  const OFF_FRAME = [481, 330, 910, 260]; // Agent is Offline
  const ACP_FRAME = [727, 323, 419, 330];
  const TERM_FRAME = [90, 110, 800, 400]; // the live terminal, top left
  const TOAST_FRAME = [860, 600, 580, 210]; // the corner where toasts come in
  const TITLE_FRAME = [90, 30, 560, 250]; // a workspace's title and its first tasks
  const SESS_FRAME = [90, 40, 700, 280]; // a machine's sessions
  const FORK_FRAME = [90, 30, 560, 300];
  const MAIN_FRAME = [90, 30, 380, 260];
  const INPUT_FRAME = [860, 470, 580, 330]; // two toasts
  const TASK_FRAME = [460, 200, 940, 240];
  const SET_FRAME = [90, 110, 1300, 440]; // a workspace's settings
  const ASK_CARD_FRAME = [470, 330, 940, 260]; // Authorization Required
  const LIST_FRAME = [340, 130, 1040, 310]; // the auto-allow list
  const AUTO_FRAME = [90, 120, 1290, 500]; // Automations, YOLO included
  const REC_FRAME = [470, 370, 940, 200]; // the trajectory and a call's detail
  const CTL_FRAME = [340, 200, 1060, 300]; // a machine's settings
  const DIALOG_FRAME = [480, 250, 480, 310];
  const SESS2_FRAME = [300, 120, 760, 170];
  // Measured on the shots (CSS px).
  const NOTE = [110, 136, 560, 46]; // mach-add: run these on the machine itself
  const INSTALL = [118, 292, 620, 79];
  const ENROLL = [118, 382, 620, 63];
  const CODE = [518, 410, 122, 26]; // the one-time code
  const WARN = [118, 198, 700, 35];
  const SYS = [110, 160, 62, 24]; // mach-online: linux/arm64
  const VER = [170, 160, 102, 24]; // agentrqd 0.15.2
  const CPU_MEM = [108, 192, 175, 48];
  const INFO_NAV = [97, 222, 192, 32];
  const MEM_T = [599, 205, 251, 86];
  const UP_T = [854, 205, 251, 86];
  const LOAD_T = [1109, 205, 251, 86];
  const ASK_BOX = [96, 686, 680, 94];
  const ASK_TEXT = [104, 700, 400, 26];
  const REPLY = [80, 140, 440, 72];
  const FOLDER = [788, 362, 124, 24]; // start-card: ~/code/storefront
  const DEV = [912, 362, 66, 24]; // on dev-box
  const MODEL_EFFORT = [742, 503, 388, 136];
  const LIVE = [140, 120, 54, 22]; // the terminal's LIVE badge
  const ACCESS = [96, 186, 330, 52]; // Accessing workspace: /home/ada/code/storefront
  const TRUSTING = [96, 406, 770, 26]; // the line naming .mcp.json
  const TRUST = [96, 460, 240, 34]; // No, exit / Yes, I trust this folder
  const CHOICE3 = [96, 372, 330, 40]; // I am using this for local development
  const TOAST4 = [1016, 696, 400, 90]; // Agent connected
  const SESS_HEAD = [340, 160, 340, 100];
  const ROW = [346, 206, 340, 48];
  const OPEN = [604, 216, 32, 30];
  const STOP = [636, 216, 32, 30];
  const FORK_TASK = [97, 245, 345, 55];
  const MACHINE_HDR = [96, 50, 260, 58];
  const REPLY_TOAST = [1012, 652, 408, 136];
  const VIEW_TASK = [1056, 754, 90, 22];
  const VERDICT = [1016, 738, 400, 48];
  const R_ALL = [350, 207, 1008, 220];
  const R_BASH = [350, 359, 1008, 68];
  const LIST_HEAD = [350, 134, 1008, 48];
  const TRASH_BASH = [1311, 378, 28, 28];
  const FORM_TEXT = [370, 225, 760, 70];
  const CALLS = [480, 408, 350, 128];
  const YOLO_CARD = [352, 490, 1008, 110];
  const LIMIT_CARD = [862, 218, 500, 150];
  const DISABLE = [734, 264, 93, 37];
  const BADGE = [194, 138, 64, 22];
  const WARN_TEXT = [431, 540, 262, 13]; // in red: the agent will not ask
  const DIALOG = [502, 282, 440, 258];
  const SESS2 = [340, 200, 690, 66];

  // 01 Your own machines
  sc.show('mach-add', start('mach-add'), { fade: 0 }).cut(start('mach-add'), 'window');
  sc.callout(at('mach-add', 1.5), at('mach-add', 2.7), 'add', { label: 'Add machine', side: 'left' });
  sc.look(at('mach-add', 2.8), ADD_FORM, { dur: 0.7 });
  sc.callout(at('mach-add', 3.6), at('mach-add', 4.7), NOTE, { label: 'two commands, on the machine itself', side: 'right' });
  sc.callout(at('mach-add', 4.8), at('mach-add', 6.2), INSTALL, { label: '1 · install the daemon', side: 'below' });
  sc.callout(at('mach-add', 6.3), at('mach-add', 7.7), ENROLL, { label: '2 · enroll the machine', side: 'below' });
  sc.callout(at('mach-add', 7.8), end('mach-add') - 0.3, CODE, { label: 'works once, expires in ten minutes', side: 'below' });
  sc.look(start('mach-warn'), WARN_FRAME, { dur: 0.6 });
  sc.callout(at('mach-warn', 1.0), at('mach-warn', 5.3), WARN, { label: 'anyone signed in can run commands there', side: 'below' });
  sc.callout(at('mach-warn', 5.5), end('mach-warn') - 0.3, WARN, { label: 'so enroll only machines you trust', side: 'below' });
  sc.show('mach-online', start('mach-online'), { fade: 0.3 }).cut(start('mach-online'), CARD_FRAME);
  sc.callout(at('mach-online', 0.9), at('mach-online', 2.6), 'name', { label: 'her dev box', side: 'right' });
  sc.callout(at('mach-online', 2.7), at('mach-online', 5.3), 'card', { label: 'connected: the dot turns green', side: 'below' });
  sc.callout(at('mach-online', 5.4), at('mach-online', 6.3), SYS, { label: 'the system', side: 'below' });
  sc.callout(at('mach-online', 6.4), at('mach-online', 7.5), VER, { label: 'the daemon\'s version', side: 'below' });
  sc.callout(at('mach-online', 7.6), end('mach-online') - 0.3, CPU_MEM, { label: 'CPU and memory', side: 'below' });
  sc.show('mach-info', start('mach-info'), { fade: 0.3 }).cut(start('mach-info'), INFO_FRAME);
  sc.callout(at('mach-info', 0.8), at('mach-info', 2.4), INFO_NAV, { label: 'Machine Info', side: 'right' });
  sc.look(at('mach-info', 2.4), TILES, { dur: 0.4 });
  sc.callout(at('mach-info', 2.8), at('mach-info', 4.0), MEM_T, { label: 'free memory', side: 'below' });
  sc.callout(at('mach-info', 4.1), at('mach-info', 5.0), LOAD_T, { label: 'the load', side: 'below' });
  sc.callout(at('mach-info', 5.0), end('mach-info') - 0.3, UP_T, { label: 'the uptime', side: 'below' });

  // 02 Start from the browser
  sc.show('ask-typed', start('start-ask'), { fade: 0 }).cut(start('start-ask'), ASK_FRAME);
  sc.callout(at('start-ask', 1.0), at('start-ask', 3.3), ASK_BOX, { label: 'ask the supervisor, in Pano', side: 'above' });
  sc.callout(at('start-ask', 3.4), at('start-ask', 6.0), ASK_TEXT, { label: 'start storefront\'s agent on dev-box', side: 'above' });
  sc.show('start-ask', at('start-ask', 6.1), { fade: 0.3 }).cut(at('start-ask', 6.1), REPLY_FRAME);
  sc.callout(at('start-ask', 6.3), end('start-ask') - 0.3, REPLY, { label: 'done, over MCP', side: 'below' });
  sc.show('start-offline', start('start-card'), { fade: 0.3 }).cut(start('start-card'), OFF_FRAME);
  sc.callout(at('start-card', 2.4), at('start-card', 5.8), 'offline', { label: 'no agent: it offers one', side: 'above' });
  sc.click(at('start-card', 6.0), 'start');
  sc.show('start-card', at('start-card', 6.2), { fade: 0.25 }).away(at('start-card', 6.3));
  sc.look(at('start-card', 6.2), 'panel', { dur: 0.6 });
  sc.callout(at('start-card', 6.9), at('start-card', 7.9), FOLDER, { label: 'in its folder', side: 'above' });
  sc.callout(at('start-card', 8.0), end('start-card') - 0.3, DEV, { label: 'on dev-box', side: 'above' });
  sc.show('start-pick', start('start-pick'), { fade: 0.3 });
  sc.callout(at('start-pick', 1.5), at('start-pick', 2.8), 'kind', { label: 'Claude Code', side: 'above' });
  sc.callout(at('start-pick', 2.9), at('start-pick', 4.3), MODEL_EFFORT, { label: 'Opus, high effort', side: 'left' });
  sc.show('start-acp', at('start-pick', 4.4), { fade: 0.25 });
  sc.look(at('start-pick', 4.4), ACP_FRAME, { dur: 0.4 });
  sc.callout(at('start-pick', 4.9), end('start-pick') - 0.3, 'kind', { label: 'ACP agents, through the gateway', side: 'above' });
  sc.show('start-pick', start('start-term'), { fade: 0.3 }).cut(start('start-term'), { shot: 'start-pick', region: 'panel' });
  sc.click(at('start-term', 0.8), 'go');
  sc.show('term-1', at('start-term', 1.1), { fade: 0.25 }).away(at('start-term', 1.2));
  sc.look(at('start-term', 1.1), TERM_FRAME, { dur: 0.6 });
  sc.callout(at('start-term', 1.8), at('start-term', 3.0), TRUSTING, { label: 'it wrote the MCP config', side: 'below' });
  sc.callout(at('start-term', 3.1), at('start-term', 4.3), ACCESS, { label: 'Claude Code, in ~/code/storefront', side: 'right' });
  sc.callout(at('start-term', 4.4), at('start-term', 6.4), LIVE, { label: 'its terminal, live in the browser', side: 'right' });
  sc.callout(at('start-term', 6.5), at('start-term', 7.8), TRUST, { label: 'yes, she trusts this folder', side: 'right' });
  sc.show('term-3', at('start-term', 7.9), { fade: 0.2 });
  sc.callout(at('start-term', 8.1), end('start-term') - 0.3, CHOICE3, { label: 'local development: yes', side: 'right' });
  sc.show('term-4', start('start-live'), { fade: 0.3 }).cut(start('start-live'), TOAST_FRAME);
  sc.callout(at('start-live', 0.5), at('start-live', 2.4), TOAST4, { label: 'storefront: agent connected', side: 'left' });
  sc.show('start-live', at('start-live', 2.5), { fade: 0.3 }).cut(at('start-live', 2.5), TITLE_FRAME);
  sc.callout(at('start-live', 2.7), at('start-live', 4.5), 'title', { label: 'the dot turns green', side: 'right' });
  sc.callout(at('start-live', 4.6), end('start-live') - 0.3, 'title', { label: 'connected, ready for tasks', side: 'right' });
  sc.show('start-sessions', start('start-sessions'), { fade: 0.3 }).cut(start('start-sessions'), SESS_FRAME);
  sc.callout(at('start-sessions', 0.8), at('start-sessions', 3.5), SESS_HEAD, { label: 'every session it runs', side: 'below' });
  sc.callout(at('start-sessions', 3.6), at('start-sessions', 5.5), ROW, { label: 'its workspace, its status', side: 'below' });
  sc.callout(at('start-sessions', 5.6), at('start-sessions', 7.6), OPEN, { label: 'open its terminal', side: 'below' });
  sc.callout(at('start-sessions', 7.7), end('start-sessions') - 0.3, STOP, { label: 'or stop it', side: 'below' });
  sc.show('spin-row', start('start-spin'), { fade: 0.3 }).cut(start('start-spin'), { shot: 'spin-row', region: 'list' });
  sc.callout(at('start-spin', 0.9), at('start-spin', 4.1), 'row', { label: 'waiting in the queue', side: 'right' });
  sc.click(at('start-spin', 4.3), 'btn');
  sc.show('spin-pop', at('start-spin', 4.5), { fade: 0.25 }).away(at('start-spin', 4.6));
  sc.look(at('start-spin', 4.5), 'pop', { dur: 0.5 });
  sc.callout(at('start-spin', 5.0), at('start-spin', 5.9), 'go', { label: 'Spin up', side: 'right' });
  sc.callout(at('start-spin', 6.0), at('start-spin', 6.8), 'title', { label: 'a fork, the task, an agent', side: 'right' });
  sc.show('spin-fork', at('start-spin', 6.9), { fade: 0.3 }).cut(at('start-spin', 6.9), FORK_FRAME);
  sc.callout(at('start-spin', 7.0), at('start-spin', 7.9), FORK_TASK, { label: 'the task, in the fork', side: 'right' });
  sc.show('spin-term-2', at('start-spin', 8.0), { fade: 0.3 }).cut(at('start-spin', 8.0), TOAST_FRAME);
  sc.callout(at('start-spin', 8.1), at('start-spin', 8.9), TOAST4, { label: 'its own agent, connected', side: 'left' });
  sc.show('spin-main', at('start-spin', 9.0), { fade: 0.3 }).cut(at('start-spin', 9.0), MAIN_FRAME);
  sc.callout(at('start-spin', 9.1), end('start-spin') - 0.3, 'ongoing', { label: 'the main agent keeps working', side: 'right' });

  // 03 Hear when they need you
  sc.show('note-toast', start('note-toast'), { fade: 0 }).cut(start('note-toast'), 'window');
  sc.callout(at('note-toast', 1.2), at('note-toast', 3.2), 'toast', { label: 'billing asks to run a command', side: 'left' });
  sc.callout(at('note-toast', 3.4), at('note-toast', 4.9), MACHINE_HDR, { label: 'Ada: on another page', side: 'right' });
  sc.look(at('note-toast', 5.0), TOAST_FRAME, { dur: 0.5 });
  sc.callout(at('note-toast', 5.6), end('note-toast') - 0.3, 'toast', { label: 'permission required: Bash', side: 'left' });
  sc.show('note-input', start('note-input'), { fade: 0.3 }).cut(start('note-input'), INPUT_FRAME);
  sc.callout(at('note-input', 1.8), at('note-input', 3.6), 'toast', { label: 'blocked: it needs your input', side: 'left' });
  sc.callout(at('note-input', 3.7), at('note-input', 5.1), REPLY_TOAST, { label: 'the question itself', side: 'left' });
  sc.click(at('note-input', 5.3), VIEW_TASK);
  sc.show('note-task', at('note-input', 5.5), { fade: 0.25 }).away(at('note-input', 5.6));
  sc.look(at('note-input', 5.5), TASK_FRAME, { dur: 0.5 });
  sc.callout(at('note-input', 6.0), end('note-input') - 0.3, 'question', { label: 'the task, open on its question', side: 'below' });
  sc.show('note-settings', start('note-settings'), { fade: 0.3 }).cut(start('note-settings'), SET_FRAME);
  sc.callout(at('note-settings', 1.2), at('note-settings', 2.7), 'nav', { label: 'Notifications', side: 'right' });
  sc.callout(at('note-settings', 2.8), at('note-settings', 3.9), 'channels', { label: 'its channels', side: 'below' });
  sc.callout(at('note-settings', 4.0), end('note-settings') - 0.3, 'triggers', { label: 'and the events that send', side: 'below' });
  sc.callout(at('note-push', 1.2), at('note-push', 4.9), 'push', { label: 'push: even with the tab closed', side: 'below' });
  sc.callout(at('note-push', 5.0), end('note-push') - 0.3, 'triggers', { label: 'a new task, a status change, a reply', side: 'below' });
  sc.show('note-email', start('note-email'), { fade: 0.3 });
  sc.callout(at('note-email', 0.8), at('note-email', 2.6), 'email', { label: 'Email', side: 'below' });
  sc.callout(at('note-email', 2.7), end('note-email') - 0.3, 'triggers', { label: 'switched on: tasks, status, messages', side: 'below' });
  sc.show('note-slack', start('note-slack'), { fade: 0.3 });
  sc.callout(at('note-slack', 0.8), at('note-slack', 2.0), 'nav', { label: 'Slack', side: 'right' });
  sc.callout(at('note-slack', 2.1), at('note-slack', 4.4), 'add', { label: 'link it: Add to Slack', side: 'below' });

  // 04 Let the safe work run
  sc.show('yolo-ask', start('yolo-always'), { fade: 0 }).cut(start('yolo-always'), ASK_CARD_FRAME);
  sc.callout(at('yolo-always', 0.8), at('yolo-always', 2.3), 'always', { label: 'Always Allow', side: 'below' });
  sc.click(at('yolo-always', 2.5), 'always');
  sc.show('yolo-always', at('yolo-always', 2.7), { fade: 0.25 }).away(at('yolo-always', 2.8));
  sc.look(at('yolo-always', 2.7), TOAST_FRAME, { dur: 0.5 });
  sc.callout(at('yolo-always', 3.3), at('yolo-always', 4.1), VERDICT, { label: 'one answer, now a rule', side: 'above' });
  sc.show('yolo-list', at('yolo-always', 4.2), { fade: 0.3 }).cut(at('yolo-always', 4.2), LIST_FRAME);
  sc.callout(at('yolo-always', 4.3), end('yolo-always') - 0.3, R_BASH, { label: 'Bash: go, with any arguments', side: 'below' });
  sc.callout(at('yolo-list', 0.9), at('yolo-list', 3.3), R_ALL, { label: 'the workspace keeps its rules', side: 'above' });
  sc.callout(at('yolo-list', 3.4), at('yolo-list', 5.2), LIST_HEAD, { label: 'the auto-allow list', side: 'below' });
  sc.callout(at('yolo-list', 5.3), end('yolo-list') - 0.3, TRASH_BASH, { label: 'remove any', side: 'left' });
  sc.show('yolo-off', start('yolo-task'), { fade: 0.3 }).cut(start('yolo-task'), { shot: 'yolo-off', region: 'form' });
  sc.callout(at('yolo-task', 0.9), at('yolo-task', 3.3), FORM_TEXT, { label: 'a task you trust, end to end', side: 'above' });
  sc.click(at('yolo-task', 3.6), 'chip');
  sc.show('yolo-task', at('yolo-task', 3.8), { fade: 0.2 }).away(at('yolo-task', 3.9));
  sc.callout(at('yolo-task', 4.0), end('yolo-task') - 0.3, 'chip', { label: 'YOLO: every command, no asking', side: 'below' });
  sc.show('yolo-record', start('yolo-record'), { fade: 0.3 }).cut(start('yolo-record'), REC_FRAME);
  sc.callout(at('yolo-record', 1.0), at('yolo-record', 2.9), CALLS, { label: 'every call, on the record', side: 'below' });
  sc.callout(at('yolo-record', 3.0), at('yolo-record', 5.6), 'row', { label: 'go vet: no prompt', side: 'below' });
  sc.callout(at('yolo-record', 5.7), end('yolo-record') - 0.3, 'auto', { label: 'auto-allowed', side: 'right' });
  sc.show('yolo-list', start('yolo-default'), { fade: 0.3 }).cut(start('yolo-default'), AUTO_FRAME);
  sc.callout(at('yolo-default', 1.0), at('yolo-default', 3.0), 'nav', { label: 'Automations', side: 'right' });
  sc.callout(at('yolo-default', 3.1), at('yolo-default', 6.3), YOLO_CARD, { label: 'YOLO: the default for new tasks', side: 'above' });
  sc.callout(at('yolo-default', 6.4), end('yolo-default') - 0.3, WARN_TEXT, { label: 'in red: the agent will not ask', side: 'below' });

  // 05 You stay in control
  sc.show('ctl-settings', start('ctl-limit'), { fade: 0 }).cut(start('ctl-limit'), CTL_FRAME);
  sc.callout(at('ctl-limit', 0.9), at('ctl-limit', 2.9), LIMIT_CARD, { label: 'an agent limit, per machine', side: 'below' });
  sc.show('ctl-limit', at('ctl-limit', 3.0), { fade: 0.3 });
  sc.callout(at('ctl-limit', 3.2), end('ctl-limit') - 0.3, 'limit', { label: 'two at once, at most', side: 'below' });
  sc.callout(at('ctl-disable', 0.8), at('ctl-disable', 2.0), DISABLE, { label: 'Disable', side: 'below' });
  sc.click(at('ctl-disable', 2.2), DISABLE);
  sc.show('ctl-disabled', at('ctl-disable', 2.4), { fade: 0.25 }).away(at('ctl-disable', 2.5));
  sc.callout(at('ctl-disable', 2.6), at('ctl-disable', 3.6), 'avail', { label: 'its connection closes at once', side: 'below' });
  sc.show('ctl-offline', at('ctl-disable', 3.7), { fade: 0.3 }).cut(at('ctl-disable', 3.7), CARD_FRAME);
  sc.callout(at('ctl-disable', 3.8), at('ctl-disable', 4.6), BADGE, { label: 'disabled', side: 'right' });
  sc.show('ctl-delete', at('ctl-disable', 4.7), { fade: 0.3 }).cut(at('ctl-disable', 4.7), DIALOG_FRAME);
  sc.callout(at('ctl-disable', 4.9), end('ctl-disable') - 0.3, DIALOG, { label: 'Delete: gone from the account', side: 'below' });
  sc.show('yolo-off', at('ctl-root', 3.3), { fade: 0 }).cut(at('ctl-root', 3.3), { shot: 'yolo-off', region: 'form' });
  sc.callout(at('ctl-root', 3.7), end('ctl-root') - 0.3, 'chip', { label: 'YOLO: off until you turn it on', side: 'below' });

  // Recap: one screen for each.
  sc.show('mach-online', start('recap'), { fade: 0.4 }).cut(start('recap'), CARD_FRAME);
  sc.callout(at('recap', 0.6), at('recap', 2.2), 'card', { label: 'your own machines', side: 'below' });
  sc.show('spin-sessions', at('recap', 2.3), { fade: 0.3 }).cut(at('recap', 2.3), SESS2_FRAME);
  sc.callout(at('recap', 2.5), at('recap', 4.5), SESS2, { label: 'agents started from the browser', side: 'below' });
  sc.show('note-input', at('recap', 4.6), { fade: 0.3 }).cut(at('recap', 4.6), INPUT_FRAME);
  sc.callout(at('recap', 4.8), at('recap', 6.7), 'toast', { label: 'alerts, wherever you are', side: 'left' });
  sc.show('yolo-task', at('recap', 6.8), { fade: 0.3 }).cut(at('recap', 6.8), { shot: 'yolo-task', region: 'form' });
  sc.callout(at('recap', 7.0), end('recap') - 0.3, 'chip', { label: 'YOLO, for the work you trust', side: 'below' });

  sc.visible([
    [start('mach-add'), end('mach-info')],
    [start('start-ask'), end('start-spin')],
    [start('note-toast'), at('note-slack', 4.6)],
    [start('yolo-always'), end('yolo-default')],
    [start('ctl-limit'), end('ctl-disable')],
    [at('ctl-root', 3.3), end('recap')],
  ]).build();

  // Drawn where no screen shows it: the Slack message and the daemon refusing root.
  s.add(fadeSpan(s, slackMessage(s, at), [at('note-slack', 4.4), end('note-slack')]));
  s.add(fadeSpan(s, rootRefusal(s, at), [start('ctl-root'), at('ctl-root', 3.6)]));

  // The chapter, in a corner, while its screens show.
  chapterChips(s, [['01 / YOUR OWN MACHINES', 'mach-add', 'mach-info'], ['02 / START FROM THE BROWSER', 'start-ask', 'start-spin'], ['03 / HEAR WHEN THEY NEED YOU', 'note-toast', 'note-slack'],
    ['04 / LET THE SAFE WORK RUN', 'yolo-always', 'yolo-default'], ['05 / YOU STAY IN CONTROL', 'ctl-limit', 'ctl-root']].map(([label, a, z]) => [label, start(a), end(z)]));

  captions(s, tl, { band: BAND, size: 28, chars: 72, lineGap: 32, baseline: 51 });
  return s;
};
