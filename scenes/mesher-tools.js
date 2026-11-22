// Mesher (mesher.sh), the AgentRQ project that gives agents their tools: every
// connector sits behind one MCP tool, callTool, which takes a command line.
// Four beats: the call, the host's guard (allowlist and credentials), TOON
// results, and the built-in cron and workflows on the live Trajectory.
import { sprite, el, g } from '../src/index.js';
import {
  C, OFF, newScene, sky, ground, intro, mascot, mascotByName, cursor, press, MASCOTS,
} from '../kit/agentrq.js';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop. Each beat owns a span.
const B = [0.3, 5.6, 10.9, 16.2, 22.4];
const FADE = 0.25;
const DANCE = 20.6;

// ---------------------------------------------------------------- the stage
const BX = 440;
const BY = 20;
const BW = 740;
const BH = 272;

const RED = { line: '#ef4444', bg: '#2a0d0d', text: '#f87171' };
const AMBER = { bg: '#2a2006', text: '#fbbf24' };
const WIRE = '#52525b';

const box = (x, y, w, h, fill = C.column, stroke) => el('rect', { x, y, width: w, height: h, fill, stroke, 'stroke-width': stroke ? 2 : undefined, class: 'px' });
const hline = (x0, x1, y, fill = WIRE) => el('rect', { x: Math.min(x0, x1), y: y - 1, width: Math.abs(x1 - x0), height: 2, fill, class: 'px' });
const dot = (x, y, fill, size = 6) => el('rect', { x, y, width: size, height: size, fill, class: 'px' });

const appear = (s, node, t, until) => s.anim(node, until
  ? [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step'], [until, { opacity: 0 }, 'step']]
  : [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step']]);

function beat(s, i, nodes) {
  const [from, to] = [B[i], B[i + 1]];
  s.add(s.anim(g({}, nodes), [[0, { opacity: 0 }], [from, { opacity: 0 }], [from + FADE, { opacity: 1 }], [to - FADE, { opacity: 1 }], [to, { opacity: 0 }]]));
}

// A small square that runs from one point to another, once.
const pulse = (s, t, [x0, y0], [x1, y1], { fill = C.lit, dur = 0.45 } = {}) => s.anim(
  el('rect', { x: -4, y: -4, width: 8, height: 8, fill, class: 'px' }),
  [[0, { x: x0, y: y0, opacity: 0 }], [t, { x: x0, y: y0, opacity: 1 }, 'step'], [t + dur, { x: x1, y: y1 }, 'inOut'], [t + dur + 0.05, { opacity: 0 }, 'step']]);

const LOCK = `
  .###.
  #...#
  #...#
  #####
  ##.##
  ##.##
  #####`;
const X_MARK = `
  #...#
  .#.#.
  ..#..
  .#.#.
  #...#`;
const TICK = `
  .....#
  ....##
  #..##.
  ####..
  .##...`;

// What every mascot does, filled in beat by beat.
const ACTS = Object.fromEntries(MASCOTS.map((m) => [m.name, { hops: [], alert: [], work: [], ask: [], done: [] }]));

export default function mesherTools() {
  const s = newScene({
    poster: 20.4,
    description: 'Mesher tools for AgentRQ agents: claude has one MCP tool, callTool, and runs gmail.searchTools then gmail@work.tools searchEmails through the Mesher host. The host checks each request against the connector\'s allowlist and adds the work profile\'s token itself, so the agent never sees it, and a request to a host off the allowlist is refused with HTTP-request-denied. Switching the profile from JSON to TOON returns the same emails in fewer characters, and on the live Trajectory a cron schedule, the digest workflow run it starts and that run\'s own Gmail call each show who made them, while the agents celebrate.',
  });

  sky(s);
  ground(s);
  story(s);
  s.add(box(BX, BY, BW, BH, C.panel, C.line));
  call(s);
  guard(s);
  toon(s);
  trajectory(s);
  MASCOTS.forEach((m, i) => {
    const acts = ACTS[m.name];
    acts.hops.push([DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]);
    acts.done.push([DANCE, B[4]]);
    mascot(s, m, i, acts);
  });
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'mesher tools',
    headline: ['Every tool,', 'one callTool.'],
    sub: 'Keys stay on the host, never the agent.',
    steps: [['call', B[0], B[1]], ['guard', B[1], B[2]], ['toon', B[2], B[3]], ['cron', B[3], B[4]]],
    log: [
      [0, B[0], '> mesher serve_'],
      [B[0], 3.0, '> callTool gmail.searchTools'],
      [3.0, 5.0, '> callTool gmail@work.tools'],
      [5.0, B[1], '> gmail@work: 5 unread', C.lit],
      [B[1], 7.4, '> allowlist: www.googleapis.com'],
      [7.4, 8.8, '> token added by the host', C.lit],
      [8.8, B[2], '> HTTP-request-denied', RED.text],
      [B[2], 13.0, '> profile work: JSON'],
      [13.0, B[3], `> TOON: ${saving()}% fewer chars`, C.lit],
      [B[3], 18.0, '> cron: 0 9 * * mon-fri'],
      [18.0, 19.6, '> digest run started'],
      [19.6, B[4], '> every call, with its caller', C.lit],
    ],
  });
}

// The callTool command bar along the top of the stage.
function commandBar(s, lines, size = 11) {
  const x = BX + 16;
  const y = BY + 14;
  return [
    box(x, y, BW - 32, 30, C.bg, C.line),
    box(x + 6, y + 6, 70, 18, '#14532d'),
    s.text('callTool', { x: x + 41, y: y + 19, font: 'mono', size: 11, fill: C.lit, anchor: 'middle' }),
    ...lines.map(([from, to, text]) => appear(s, s.text(text, { x: x + 88, y: y + 20, font: 'mono', size, fill: C.text }), from, to)),
  ];
}

// The three columns: the agent's MCP client, the Mesher host, the services.
const A = { x: BX + 16, y: BY + 58, w: 196, h: 198 };
const H = { x: BX + 252, y: BY + 58, w: 228, h: 198 };
const S = { x: BX + 520, y: BY + 58, w: 204, h: 198 };
const GOOGLE = { x: S.x + 12, y: S.y + 46, w: S.w - 24, h: 46 };
const EVIL = { x: S.x + 12, y: S.y + 126, w: S.w - 24, h: 46 };

function columns(s) {
  const claude = mascotByName('claude');
  return [
    box(A.x, A.y, A.w, A.h, C.column, C.line),
    dot(A.x + 14, A.y + 14, claude.color),
    s.text('claude', { x: A.x + 26, y: A.y + 21, font: 'mono', size: 12, fill: C.text }),
    s.text('MCP tools: 1', { x: A.x + A.w - 12, y: A.y + 21, font: 'mono', size: 11, fill: C.dim, anchor: 'end' }),
    box(A.x + 12, A.y + 34, A.w - 24, 24, C.card, C.line),
    s.text('callTool', { x: A.x + 22, y: A.y + 50, font: 'mono', size: 12, fill: C.text }),
    s.text('command: string', { x: A.x + A.w - 20, y: A.y + 50, font: 'mono', size: 10, fill: C.dim, anchor: 'end' }),

    box(H.x, H.y, H.w, H.h, C.column, C.line),
    s.text('MESHER HOST', { x: H.x + 14, y: H.y + 21, font: 'pixel', size: 12, fill: C.dim }),
    s.text('mesher.sh', { x: H.x + H.w - 12, y: H.y + 21, font: 'mono', size: 11, fill: C.dim, anchor: 'end' }),

    box(S.x, S.y, S.w, S.h, C.column, C.line),
    s.text('THE INTERNET', { x: S.x + 14, y: S.y + 21, font: 'pixel', size: 12, fill: C.dim }),
    box(GOOGLE.x, GOOGLE.y, GOOGLE.w, GOOGLE.h, C.card, C.line),
    s.text('www.googleapis.com', { x: GOOGLE.x + 10, y: GOOGLE.y + 20, font: 'mono', size: 11, fill: C.text }),
    s.text('Gmail API', { x: GOOGLE.x + 10, y: GOOGLE.y + 37, font: 'body', size: 11, fill: C.dim }),

    hline(A.x + A.w, H.x, A.y + 99),
    hline(H.x + H.w, S.x, GOOGLE.y + 23),
  ];
}

// A host row: a label and a value, mono.
const hostRow = (s, y, label, value, fill = C.text, vx = 86) => g({},
  box(H.x + 12, y, H.w - 24, 24, C.card),
  s.text(label, { x: H.x + 20, y: y + 16, font: 'pixel', size: 10, fill: C.dim }),
  s.text(value, { x: H.x + vx, y: y + 16, font: 'mono', size: 11, fill }));

// 01: one tool, a command line in it. A search, then a real call as the
// work profile.
function call(s) {
  const t = B[0];
  const c1 = 0.7;
  const c2 = 3.0;
  const parts = [
    ...commandBar(s, [
      [c1, c2, "gmail.searchTools 'unread' 5"],
      [c2, B[1], 'gmail@work.tools searchEmails -b \'{"query":"is:unread","maxResults":5}\''],
    ]),
    ...columns(s),
    // The host's connectors; gmail@work lights when the call is its.
    hostRow(s, H.y + 34, 'gmail', 'searchEmails, …'),
    hostRow(s, H.y + 64, 'cron', 'schedule, …'),
    hostRow(s, H.y + 94, 'workflows', 'startRun, …'),
    appear(s, box(H.x + 12, H.y + 34, H.w - 24, 24, 'none', C.lit), c1 + 0.8, c1 + 1.6),
    appear(s, g({},
      box(H.x + 12, H.y + 130, H.w - 24, 24, '#14532d'),
      s.text('profile', { x: H.x + 20, y: H.y + 146, font: 'pixel', size: 10, fill: C.lit }),
      s.text('work', { x: H.x + 86, y: H.y + 146, font: 'mono', size: 11, fill: C.lit })), c2 + 0.6),
    appear(s, s.text('searchTools runs on the host', { x: H.x + 14, y: H.y + 184, font: 'body', size: 11, fill: C.dim }), c1 + 0.9, c2),
    appear(s, s.text('signed in as the work account', { x: H.x + 14, y: H.y + 184, font: 'body', size: 11, fill: C.dim }), c2 + 0.6),

    // The callTool row lights each time it is used.
    appear(s, box(A.x + 12, A.y + 34, A.w - 24, 24, 'none', C.lit), c1 + 0.3, c1 + 1.0),
    appear(s, box(A.x + 12, A.y + 34, A.w - 24, 24, 'none', C.lit), c2 + 0.3, c2 + 1.0),

    // What came back to the agent.
    appear(s, g({},
      s.text('2 tools match', { x: A.x + 14, y: A.y + 84, font: 'pixel', size: 10, fill: C.dim }),
      s.text('searchEmails', { x: A.x + 14, y: A.y + 104, font: 'mono', size: 12, fill: C.text }),
      s.text('readThread', { x: A.x + 14, y: A.y + 124, font: 'mono', size: 12, fill: C.text })), c1 + 1.5, c2 + 0.2),
    appear(s, g({},
      s.text('result', { x: A.x + 14, y: A.y + 84, font: 'pixel', size: 10, fill: C.dim }),
      s.text('5 unread emails', { x: A.x + 14, y: A.y + 104, font: 'mono', size: 12, fill: C.lit }),
      s.text('Invoice due · ada', { x: A.x + 14, y: A.y + 124, font: 'mono', size: 11, fill: C.dim }),
      s.text('Standup notes · bob', { x: A.x + 14, y: A.y + 142, font: 'mono', size: 11, fill: C.dim }),
      s.text('Q3 report · eve', { x: A.x + 14, y: A.y + 160, font: 'mono', size: 11, fill: C.dim })), c2 + 2.0),

    pulse(s, c1 + 0.4, [A.x + A.w, A.y + 99], [H.x, A.y + 99]),
    pulse(s, c1 + 1.0, [H.x, A.y + 99], [A.x + A.w, A.y + 99]),
    pulse(s, c2 + 0.4, [A.x + A.w, A.y + 99], [H.x, A.y + 99]),
    pulse(s, c2 + 0.9, [H.x + H.w, GOOGLE.y + 23], [S.x + 12, GOOGLE.y + 23]),
    pulse(s, c2 + 1.4, [S.x + 12, GOOGLE.y + 23], [H.x + H.w, GOOGLE.y + 23]),
    pulse(s, c2 + 1.6, [H.x, A.y + 99], [A.x + A.w, A.y + 99]),
  ];
  beat(s, 0, parts);
  ACTS.claude.alert.push([t + 0.1, c1]);
  ACTS.claude.work.push([c1, c2 + 2.0]);
  ACTS.claude.hops.push([c2 + 2.0, 14]);
  ACTS.claude.done.push([c2 + 2.0, B[1]]);
}

// 02: what the host does with the request: the allowlist, then the work
// profile's token, which never goes back to the agent. A request to a host
// that is not on the list never leaves.
function guard(s) {
  const t = B[1];
  const build = t + 0.4;
  const allow = t + 1.1;
  const token = t + 1.8;
  const send = t + 2.3;
  const bad = t + 3.3;
  const deny = t + 3.9;
  const parts = [
    ...commandBar(s, [[t, B[2], 'gmail@work.tools searchEmails -b \'{"query":"is:unread","maxResults":5}\'']]),
    ...columns(s),
    box(EVIL.x, EVIL.y, EVIL.w, EVIL.h, C.card, C.line),
    s.text('evil.example.net', { x: EVIL.x + 10, y: EVIL.y + 20, font: 'mono', size: 11, fill: C.text }),
    s.text('not on the allowlist', { x: EVIL.x + 10, y: EVIL.y + 37, font: 'body', size: 11, fill: C.dim }),
    appear(s, box(EVIL.x, EVIL.y, EVIL.w, EVIL.h, 'none', RED.line), deny),
    hline(H.x + H.w, H.x + H.w + 18, EVIL.y + 23),

    appear(s, hostRow(s, H.y + 34, 'gmail', 'GET /gmail/v1/…'), build),
    appear(s, g({},
      hostRow(s, H.y + 64, 'allow', 'www.googleapis.com', C.text, 66),
      sprite(TICK, { '#': C.lit }, { px: 2, x: H.x + H.w - 28, y: H.y + 71 })), allow),
    appear(s, g({},
      box(H.x + 12, H.y + 94, H.w - 24, 24, AMBER.bg),
      sprite(LOCK, { '#': AMBER.text }, { px: 2, x: H.x + 20, y: H.y + 99 }),
      s.text('Bearer ***', { x: H.x + 40, y: H.y + 110, font: 'mono', size: 11, fill: AMBER.text }),
      s.text('work', { x: H.x + H.w - 20, y: H.y + 110, font: 'mono', size: 10, fill: AMBER.text, anchor: 'end' })), token),
    appear(s, s.text('the host adds the token', { x: H.x + 14, y: H.y + 136, font: 'body', size: 11, fill: C.dim }), token),

    appear(s, g({},
      hostRow(s, H.y + 148, 'gmail', 'evil.example.net', RED.text)), bad),
    appear(s, g({},
      box(H.x + 12, H.y + 148, H.w - 24, 24, 'none', RED.line),
      s.text('HTTP-request-denied', { x: H.x + 14, y: H.y + 190, font: 'mono', size: 11, fill: RED.text })), deny),
    appear(s, sprite(X_MARK, { '#': RED.text }, { px: 3, x: H.x + H.w + 4, y: EVIL.y + 16 }), deny),

    // The agent side: the result, and no token.
    s.text('what claude sees', { x: A.x + 14, y: A.y + 84, font: 'pixel', size: 10, fill: C.dim }),
    appear(s, s.text('5 unread emails', { x: A.x + 14, y: A.y + 104, font: 'mono', size: 12, fill: C.lit }), send + 0.9),
    appear(s, g({},
      s.text('token: never sent', { x: A.x + 14, y: A.y + 128, font: 'mono', size: 11, fill: C.dim }),
      s.text('to the agent', { x: A.x + 14, y: A.y + 144, font: 'mono', size: 11, fill: C.dim })), token + 0.2),

    pulse(s, t + 0.2, [A.x + A.w, A.y + 99], [H.x, A.y + 99]),
    pulse(s, send, [H.x + H.w, GOOGLE.y + 23], [S.x + 12, GOOGLE.y + 23]),
    pulse(s, send + 0.5, [S.x + 12, GOOGLE.y + 23], [H.x + H.w, GOOGLE.y + 23]),
    pulse(s, send + 0.7, [H.x, A.y + 99], [A.x + A.w, A.y + 99]),
    pulse(s, bad + 0.2, [H.x + H.w - 30, EVIL.y + 23], [H.x + H.w + 10, EVIL.y + 23], { fill: RED.line, dur: 0.35 }),
  ];
  beat(s, 1, parts);
  ACTS.claude.work.push([t + 0.2, send + 0.9]);
  ACTS.claude.done.push([send + 0.9, B[2]]);
}

// 03: the same emails as JSON and as TOON, with honest character counts.
const EMAILS = [['18c1', 'ada', 'Invoice due'], ['18c2', 'bob', 'Standup notes'], ['18c3', 'eve', 'Q3 report']];
const JSON_TEXT = JSON.stringify({ emails: EMAILS.map(([id, from, subject]) => ({ id, from, subject })) });
const TOON_LINES = ['emails[3]{id,from,subject}:', ...EMAILS.map((r) => `  ${r.join(',')}`)];
const TOON_TEXT = TOON_LINES.join('\n');
function saving() {
  return Math.round((1 - TOON_TEXT.length / JSON_TEXT.length) * 100);
}
// Hand-wrapped at 44 characters, the way it would flow in a narrow panel.
function wrap(text, n) {
  const out = [];
  for (let i = 0; i < text.length; i += n) out.push(text.slice(i, i + n));
  return out;
}

const SEG = { x: BX + BW - 16 - 132, y: BY + 54, w: 132, h: 26 };
const TOON_BTN = { x: SEG.x + 66, y: SEG.y + 3, w: 63, h: 20 };

function toon(s) {
  const t = B[2];
  const pick = t + 2.1;
  const L = { x: BX + 16, y: BY + 96, w: 344, h: 160 };
  const R = { x: BX + 380, y: BY + 96, w: 344, h: 160 };
  const jsonLines = wrap(JSON_TEXT, 44);
  const panel = (p, title, n, fill) => [
    box(p.x, p.y, p.w, p.h, C.bg, C.line),
    s.text(title, { x: p.x + 12, y: p.y + 22, font: 'pixel', size: 12, fill: C.dim }),
    s.text(`${n} chars`, { x: p.x + p.w - 12, y: p.y + 22, font: 'mono', size: 11, fill, anchor: 'end' }),
  ];
  const parts = [
    s.text('Profiles', { x: BX + 16, y: BY + 30, font: 'semi', size: 13, fill: C.dim }),
    s.text('›', { x: BX + 80, y: BY + 30, font: 'semi', size: 13, fill: C.dim }),
    s.text('work', { x: BX + 94, y: BY + 30, font: 'semi', size: 15, fill: C.text }),
    s.text('gmail, cron, workflows', { x: BX + BW - 16, y: BY + 30, font: 'mono', size: 11, fill: C.dim, anchor: 'end' }),
    s.text('Results as', { x: SEG.x - 12, y: SEG.y + 18, font: 'body', size: 13, fill: C.dim, anchor: 'end' }),
    box(SEG.x, SEG.y, SEG.w, SEG.h, C.column, C.line),
    s.anim(box(0, 0, 63, 20, '#3f3f46'), [[0, { x: SEG.x + 3, y: SEG.y + 3 }], [pick, { x: TOON_BTN.x }, 'step']]),
    s.text('JSON', { x: SEG.x + 34, y: SEG.y + 18, font: 'semi', size: 12, fill: C.text, anchor: 'middle' }),
    s.text('TOON', { x: TOON_BTN.x + 31, y: SEG.y + 18, font: 'semi', size: 12, fill: C.text, anchor: 'middle' }),

    ...panel(L, 'JSON', JSON_TEXT.length, C.dim),
    ...jsonLines.map((line, k) => s.text(line, { x: L.x + 12, y: L.y + 48 + k * 18, font: 'mono', size: 11, fill: C.text })),

    appear(s, g({},
      ...panel(R, 'TOON', TOON_TEXT.length, C.lit),
      // SVG collapses leading spaces, so the rows' indent is an x offset.
      ...TOON_LINES.map((line, k) => {
        const lead = line.length - line.trimStart().length;
        return s.text(line.trimStart(), { x: R.x + 12 + lead * 6.6, y: R.y + 48 + k * 20, font: 'mono', size: 11, fill: k ? C.text : C.lit });
      }),
      s.text('same data, read the same', { x: R.x + 12, y: R.y + 146, font: 'body', size: 11, fill: C.dim })), pick + 0.3),
    appear(s, g({},
      box(R.x + R.w - 120, R.y + 128, 108, 24, '#14532d'),
      s.text(`${saving()}% fewer`, { x: R.x + R.w - 66, y: R.y + 144, font: 'mono', size: 12, fill: C.lit, anchor: 'middle' })), pick + 1.0),
    appear(s, g({},
      box(R.x, R.y, R.w, R.h, C.bg, C.line),
      s.text('TOON', { x: R.x + 12, y: R.y + 22, font: 'pixel', size: 12, fill: C.dim }),
      s.text('off for this profile', { x: R.x + R.w / 2, y: R.y + 88, font: 'body', size: 12, fill: '#71717a', anchor: 'middle' })), 0, pick + 0.3),
  ];
  beat(s, 2, parts);
  ACTS.claude.work.push([t + 0.3, pick + 0.3]);
  ACTS.claude.hops.push([pick + 1.0, 14]);
  ACTS.claude.done.push([pick + 1.0, B[3]]);
}

// 04: the built-ins: claude schedules the digest workflow with cron, it fires
// at 09:00, and its run calls Gmail. The Trajectory shows each call live,
// with who made it.
const CALLS = [
  { t: 16.9, conn: 'cron', name: 'schedule', caller: 'Claude Code', via: 'MCP', dur: '38 ms' },
  { t: 18.2, conn: 'digest', name: 'startRun', caller: 'digest.startRun', via: 'Schedule', dur: '12 ms' },
  { t: 18.8, conn: 'gmail', name: 'searchEmails', caller: 'digest · run 0k6832IujQX', via: 'Workflow', dur: '412 ms' },
];
const LIST = { x: BX + 16, y: BY + 94, w: 330, h: 162 };
const DETAIL = { x: BX + 358, y: BY + 94, w: 366, h: 162 };
const ROW_H = 46;
const PICK = 19.9;                       // you open the digest.startRun row
const PICKED = 1;

function row(s, c) {
  return g({},
    box(0, 0, LIST.w - 2, ROW_H - 2, C.column),
    box(10, 10, 32, 14, AMBER.bg),
    s.text('TOOL', { x: 26, y: 21, font: 'pixel', size: 8, fill: AMBER.text, anchor: 'middle' }),
    dot(50, 14, C.ongoing),
    s.text(`${c.conn} · ${c.name}`, { x: 62, y: 21, font: 'mono', size: 11, fill: C.text }),
    s.text(c.caller, { x: 62, y: 37, font: 'body', size: 10, fill: '#71717a' }),
    s.text(c.dur, { x: LIST.w - 12, y: 21, font: 'mono', size: 10, fill: '#71717a', anchor: 'end' }),
    s.text('just now', { x: LIST.w - 12, y: 37, font: 'body', size: 10, fill: '#71717a', anchor: 'end' }));
}

function detailCard(s, c) {
  const rows = [['Kind', 'Tool'], ['Caller', c.caller], ['Via', c.via], ['Profile', 'work'], ['Duration', c.dur], ['Status', 'OK']];
  return g({},
    box(12, 12, 32, 14, AMBER.bg),
    s.text('TOOL', { x: 28, y: 23, font: 'pixel', size: 8, fill: AMBER.text, anchor: 'middle' }),
    s.text(`${c.conn}.${c.name}`, { x: 52, y: 24, font: 'mono', size: 12, fill: C.text }),
    box(DETAIL.w - 46, 10, 34, 18, '#062a1e'),
    s.text('OK', { x: DETAIL.w - 29, y: 23, font: 'pixel', size: 10, fill: '#34d399', anchor: 'middle' }),
    ...rows.map(([k, v], i) => g({},
      s.text(k, { x: 14, y: 52 + i * 18, font: 'body', size: 11, fill: '#71717a' }),
      s.text(v, { x: 96, y: 52 + i * 18, font: i === 1 ? 'mono' : 'body', size: 11, fill: i === 2 ? C.lit : C.text }))));
}

function trajectory(s) {
  const t = B[3];
  const fire = 17.8;
  const parts = [
    ...commandBar(s, [[t + 0.2, B[4], 'cron.tools schedule -b \'{"connector":"digest","tool":"startRun","schedule":"0 9 * * mon-fri"}\'']], 10),
    // The header: Live, how many calls, the clock, Pause and Clear.
    dot(BX + 18, BY + 66, C.ongoing, 8),
    s.text('LIVE', { x: BX + 32, y: BY + 74, font: 'pixel', size: 11, fill: C.lit }),
    s.text('Trajectory · work', { x: BX + 76, y: BY + 74, font: 'semi', size: 13, fill: C.text }),
    ...CALLS.map((c, k) => appear(s, s.text(`${k + 1} call${k ? 's' : ''}`, { x: BX + 206, y: BY + 74, font: 'body', size: 11, fill: C.dim }), c.t, CALLS[k + 1]?.t)),
    box(BX + BW - 196, BY + 58, 76, 24, C.card, C.line),
    s.anim(s.text('Mon 08:59', { x: BX + BW - 158, y: BY + 74, font: 'mono', size: 11, fill: C.dim, anchor: 'middle' }), [[0, { opacity: 1 }], [fire, { opacity: 0 }, 'step']]),
    appear(s, s.text('Mon 09:00', { x: BX + BW - 158, y: BY + 74, font: 'mono', size: 11, fill: C.cron, anchor: 'middle' }), fire),
    box(BX + BW - 112, BY + 58, 46, 24, C.card, C.line),
    s.text('Pause', { x: BX + BW - 89, y: BY + 74, font: 'semi', size: 11, fill: C.text, anchor: 'middle' }),
    box(BX + BW - 60, BY + 58, 44, 24, C.card, C.line),
    s.text('Clear', { x: BX + BW - 38, y: BY + 74, font: 'semi', size: 11, fill: C.text, anchor: 'middle' }),
    box(LIST.x, LIST.y, LIST.w, LIST.h, C.bg, C.line),
    box(DETAIL.x, DETAIL.y, DETAIL.w, DETAIL.h, C.bg, C.line),
    appear(s, s.text('Waiting for calls.', { x: LIST.x + LIST.w / 2, y: LIST.y + 84, font: 'body', size: 12, fill: '#71717a', anchor: 'middle' }), 0, CALLS[0].t),
  ];

  // Newest first: each new call slides in on top and pushes the rest down.
  CALLS.forEach((c, k) => {
    const keys = [[0, { x: LIST.x + 1, y: LIST.y + 1 - 10, opacity: 0 }], [c.t, { opacity: 0 }, 'step'], [c.t + 0.3, { y: LIST.y + 1, opacity: 1 }, 'out']];
    CALLS.slice(k + 1).forEach((later, j) => {
      keys.push([later.t, { y: LIST.y + 1 + j * ROW_H }], [later.t + 0.3, { y: LIST.y + 1 + (j + 1) * ROW_H }, 'out']);
    });
    parts.push(s.anim(row(s, c), keys));
  });
  // The picked row's highlight, on digest.startRun once you click it.
  const pickedY = LIST.y + 1 + (CALLS.length - 1 - PICKED) * ROW_H;
  parts.push(appear(s, box(LIST.x + 1, pickedY, LIST.w - 2, ROW_H - 2, 'none', C.text), PICK));

  // The detail shows the newest call until you pick one.
  CALLS.forEach((c, k) => {
    const until = k === CALLS.length - 1 ? PICK : CALLS[k + 1].t;
    parts.push(s.anim(detailCard(s, c), [[0, { x: DETAIL.x, y: DETAIL.y, opacity: 0 }], [c.t, { opacity: 1 }, 'step'], [until, { opacity: 0 }, 'step']]));
  });
  parts.push(s.anim(detailCard(s, CALLS[PICKED]), [[0, { x: DETAIL.x, y: DETAIL.y, opacity: 0 }], [PICK, { opacity: 1 }, 'step']]));

  beat(s, 3, parts);
  ACTS.claude.work.push([t + 0.2, CALLS[0].t]);
  ACTS.claude.hops.push([CALLS[0].t, 12]);
  ACTS.claude.done.push([CALLS[2].t + 0.4, DANCE]);
}

// You: TOON on the profile, then the digest.startRun row.
function pointer(s) {
  const toonAt = { x: TOON_BTN.x + 30, y: TOON_BTN.y + 10 };
  const rowAt = { x: LIST.x + 160, y: LIST.y + 1 + (CALLS.length - 1 - PICKED) * ROW_H + 20 };
  const pick = B[2] + 2.1;
  cursor(s, [
    [0, OFF],
    [pick - 1.1, OFF],
    [pick - 0.3, toonAt, 'inOut'],
    ...press(pick, toonAt),
    [pick + 0.5, toonAt],
    [pick + 1.2, OFF, 'inOut'],
    [PICK - 1.1, OFF],
    [PICK - 0.3, rowAt, 'inOut'],
    ...press(PICK, rowAt),
    [PICK + 0.6, rowAt],
    [PICK + 1.3, OFF, 'inOut'],
  ]);
}

