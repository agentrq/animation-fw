// AgentRQ's tool call history: every message, agent reply and tool call of a
// run, on one timeline you can search and open.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, OFF, LOOP, newScene, sky, ground, intro, frame, mascot, cursor, press, during,
} from '../kit/agentrq.js';

// The trajectory's lane colours, as the app draws them in the dark theme.
const LANE = {
  input: { line: '#38bdf8', bg: '#0b2230', text: '#7dd3fc' },
  agent: { line: '#8b5cf6', bg: '#1e1736', text: '#c4b5fd' },
};
const TOOL = {
  allowed: { line: '#10b981', bg: '#062a1e', text: '#34d399' },
  pending: { line: '#fbbf24', bg: '#2a2006', text: '#fbbf24' },
  denied: { line: '#ef4444', bg: '#2a0d0d', text: '#f87171' },
};

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const IN = 0.8;                            // your message lands
const ASK = 5.6;                           // claude asks to run a Bash command
const DENY = 7.6;                          // you click Deny
const RETRY = 9.1;                         // claude runs another Bash command
const PASS = 9.9;                          // and it passes
const DONE = 10.6;                         // claude's last reply
const INSPECT = 12.2;                      // you open the passing Bash call
const SEARCH = 14.6;                       // you click the search box
const TYPE = 15;                           // and type "bash", a key at a time
const HIT = 16;                            // the rest of the run dims
const DANCE = 17.6;
const RESET = 22.6;

// Every entry of the run, oldest first. lane: 0 input, 1 agent, 2 tools.
const ENTRIES = [
  { t: IN, lane: 0, label: 'fix the flaky test' },
  { t: 1.8, lane: 1, label: 'looking' },
  { t: 2.5, lane: 2, label: 'Read' },
  { t: 3.2, lane: 2, label: 'Grep' },
  { t: 3.9, lane: 1, label: 'found the race' },
  { t: 4.6, lane: 2, label: 'Edit' },
  { t: ASK, lane: 2, label: 'Bash', denied: DENY },
  { t: 8.4, lane: 1, label: 'another way' },
  { t: RETRY, lane: 2, label: 'Bash', allowed: PASS },
  { t: DONE, lane: 1, label: 'fixed, 42 pass' },
];
const QUERY = 'bash';
const match = (e) => e.label.toLowerCase().includes(QUERY);

// ---------------------------------------------------------------- the window
const BX = 440;
const BY = 20;
const BW = 740;
const BH = 272;
const LANES = ['INPUT', 'AGENT', 'TOOLS'];
const LANE_DOT = [LANE.input.line, LANE.agent.line, TOOL.allowed.line];
const laneY = (l) => BY + 46 + l * 40;
const LX = BX + 96;                        // where the time axis starts
const VW = BW - 108;                       // and how much of it shows
const ENTRY_H = 24;

// Each entry's place on the time axis: one after another, as they happened.
let cursorX = 8;
for (const e of ENTRIES) {
  e.w = e.lane === 2 ? e.label.length * 7 + (e.denied ? 34 : 22) : Math.round(e.label.length * 6.4 + 22);
  e.x = cursorX;
  cursorX += e.w + 10;
}

// The axis scrolls left whenever the newest entry would run off its end.
const SCROLL = [];
let shown = 0;
for (const e of ENTRIES) {
  const need = Math.max(0, e.x + e.w + 16 - VW);
  if (need > shown) { SCROLL.push([e.t, shown, need]); shown = need; }
}
const scrollAt = (t) => SCROLL.filter(([at]) => at <= t).at(-1)?.[2] ?? 0;
const onStage = (e, t) => ({ x: LX + e.x - scrollAt(t), y: laneY(e.lane) });

// The bottom row: the search box and lane chips on the left, the detail on
// the right.
const SB = { x: BX + 16, y: BY + 178, w: 300, h: 28 };
const CARD = { x: BX + 332, y: BY + 176, w: BW - 344, h: 88 };

export default function toolCallHistory() {
  const s = newScene({
    poster: 13.8,
    description: 'AgentRQ tool call history: a task\'s Trajectory view lays out the run on three lanes, Input, Agent and Tools. claude reads, greps and edits; a Bash call waits for you and you deny it, so it turns red; claude tries another way and npm test passes. You open that call to see what ran and what it returned, then search for bash and only the two Bash calls stay lit, while the agents celebrate.',
  });

  sky(s);
  ground(s);
  story(s);
  screen(s);
  timeline(s);
  chips(s);
  search(s);
  detail(s);
  permission(s);
  MASCOTS.forEach((m, i) => agent(s, m, i));
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'history',
    headline: ['Every step,', 'on the record.'],
    sub: 'What ran, what came back, what you allowed.',
    steps: [['run', IN, ASK], ['ask', ASK, DENY + 0.5], ['record', DENY + 0.5, INSPECT], ['inspect', INSPECT, RESET]],
    log: [
      [0, IN, '> waiting for work_'],
      [IN, 2.5, '> you: fix the flaky test'],
      [2.5, 4.6, '> claude: Read, Grep'],
      [4.6, ASK, '> claude: Edit app.test.js'],
      [ASK, DENY, '> claude: rm -rf node_modules?', C.ask],
      [DENY, 8.4, '> Bash denied', TOOL.denied.text],
      [8.4, PASS, '> claude: npm test'],
      [PASS, INSPECT, '> 42 passed', C.lit],
      [INSPECT, HIT, '> Bash · allowed · 42 passed'],
      [HIT, RESET, `> 2 entries match "${QUERY}"`],
    ],
  });
}

// The task's window, with the Chat | Trajectory toggle on Trajectory.
function screen(s) {
  frame(s, { x: BX, y: BY, w: BW, h: BH, title: 'Fix flaky test' });
  const tx = BX + BW - 196;
  s.add(
    el('rect', { x: tx, y: BY + 8, width: 184, height: 26, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    el('rect', { x: tx + 88, y: BY + 11, width: 93, height: 20, fill: '#3f3f46', class: 'px' }),
    s.text('Chat', { x: tx + 44, y: BY + 25, font: 'semi', size: 12, fill: C.dim, anchor: 'middle' }),
    s.text('Trajectory', { x: tx + 134, y: BY + 25, font: 'semi', size: 12, fill: C.text, anchor: 'middle' }),
  );

  LANES.forEach((label, l) => {
    const y = laneY(l);
    s.add(
      el('rect', { x: BX + 16, y: y + 9, width: 6, height: 6, fill: LANE_DOT[l], class: 'px' }),
      s.text(label, { x: BX + 28, y: y + 17, font: 'pixel', size: 12, fill: C.dim }),
      el('rect', { x: LX, y: y - 4, width: VW, height: ENTRY_H + 8, fill: C.column, class: 'px' }),
    );
  });
}

const X_MARK = `
  #...#
  .#.#.
  ..#..
  .#.#.
  #...#`;

// A tool call's chip, in one status.
function toolChip(s, e, st) {
  const parts = [
    el('rect', { width: e.w, height: ENTRY_H, fill: st.bg, stroke: st.line, 'stroke-width': 2, class: 'px' }),
    s.text(e.label, { x: 10, y: 16, font: 'mono', size: 11, fill: st.text }),
  ];
  if (st === TOOL.denied) parts.push(sprite(X_MARK, { '#': st.text }, { px: 2, x: e.w - 18, y: 7 }));
  return g({}, parts);
}

function entry(s, e) {
  if (e.lane < 2) {
    const st = e.lane === 0 ? LANE.input : LANE.agent;
    return g({},
      el('rect', { width: e.w, height: ENTRY_H, fill: st.bg, stroke: st.line, 'stroke-width': 2, class: 'px' }),
      s.text(e.label, { x: 10, y: 16, font: 'semi', size: 11, fill: st.text }));
  }
  if (e.denied) {
    return g({},
      during(s, toolChip(s, e, TOOL.pending), [[0, e.denied]]),
      during(s, toolChip(s, e, TOOL.denied), [[e.denied, LOOP]]));
  }
  if (e.allowed) {
    return g({},
      during(s, toolChip(s, e, TOOL.pending), [[0, e.allowed]]),
      during(s, toolChip(s, e, TOOL.allowed), [[e.allowed, LOOP]]),
      // Selected: the ring the app draws round the open entry.
      during(s, el('rect', { x: -4, y: -4, width: e.w + 8, height: ENTRY_H + 8, fill: 'none', stroke: C.text, 'stroke-width': 2, class: 'px' }), [[INSPECT, RESET + 0.5]]));
  }
  return toolChip(s, e, TOOL.allowed);
}

// The lanes' contents: each entry drops in as it happens, the axis slides
// left to keep the newest in view, and a search dims what does not match.
function timeline(s) {
  s.def(el('clipPath', { id: 'axis' }, el('rect', { x: LX, y: BY + 38, width: VW, height: 132 })));

  const ticks = [];
  for (let x = 0; x < cursorX + VW; x += 40) {
    ticks.push(el('rect', { x, y: BY + 166, width: 2, height: 4, fill: '#3f3f46', class: 'px' }));
  }
  const items = ENTRIES.map((e) => {
    const keys = [
      [0, { x: e.x, y: laneY(e.lane) - 10, opacity: 0 }],
      [e.t, { opacity: 0 }, 'step'],
      [e.t + 0.35, { y: laneY(e.lane), opacity: 1 }, 'back'],
    ];
    if (!match(e)) keys.push([HIT, { opacity: 1 }], [HIT + 0.3, { opacity: 0.2 }]);
    keys.push([RESET + 0.5, { opacity: 0 }, 'step']);
    return s.anim(entry(s, e), keys);
  });

  const slide = [[0, { x: LX }]];
  for (const [t, from, to] of SCROLL) slide.push([t, { x: LX - from }], [t + 0.4, { x: LX - to }, 'inOut']);
  slide.push([RESET + 0.6, { x: LX }, 'step']);
  const track = s.anim(g({}, ticks, items), slide);
  s.add(g({ 'clip-path': 'url(#axis)' },
    s.anim(track, [[0, { opacity: 1 }], [RESET, { opacity: 1 }], [RESET + 0.5, { opacity: 0 }], [RESET + 0.6, { opacity: 1 }, 'step']])));
}

// ALL and one chip per lane, each with its live count.
function chips(s) {
  const counts = [['ALL', () => true], ...LANES.map((label, l) => [label, (e) => e.lane === l])];
  let x = SB.x;
  for (const [label, has] of counts) {
    const mine = ENTRIES.filter(has);
    const w = label.length * 9 + 30;
    const all = label === 'ALL';
    s.add(el('rect', { x, y: SB.y + 38, width: w, height: 22, fill: all ? C.text : C.panel, stroke: all ? C.text : '#3f3f46', 'stroke-width': 1, class: 'px' }));
    s.add(s.text(label, { x: x + 8, y: SB.y + 54, font: 'pixel', size: 11, fill: all ? C.ink : C.dim }));
    const n = (k, spans) => during(s, s.text(String(k), { x: x + w - 8, y: SB.y + 54, font: 'pixel', size: 11, fill: all ? '#52525b' : '#71717a', anchor: 'end' }), spans);
    s.add(n(0, [[0, mine[0].t + 0.3], [RESET + 0.5, LOOP]]));
    mine.forEach((e, k) => s.add(n(k + 1, [[e.t + 0.3, mine[k + 1] ? mine[k + 1].t + 0.3 : RESET + 0.5]])));
    x += w + 6;
  }
}

const GLASS = `
  .###.
  #...#
  #...#
  #...#
  .###.
  ....##`;

// The search box: its placeholder until you click it, then "bash" typed in.
function search(s) {
  const { x, y, w, h } = SB;
  const keys = QUERY.length;
  const typed = (k) => +(TYPE + (k - 1) * 0.25).toFixed(2);
  s.add(
    el('rect', { x, y, width: w, height: h, fill: '#27272a', stroke: '#3f3f46', 'stroke-width': 1, class: 'px' }),
    during(s, el('rect', { x, y, width: w, height: h, fill: 'none', stroke: '#71717a', 'stroke-width': 2, class: 'px' }), [[SEARCH, RESET + 0.3]]),
    sprite(GLASS, { '#': '#71717a' }, { px: 2, x: x + 10, y: y + 8 }),
    during(s, s.text('Search tool calls and messages...', { x: x + 28, y: y + 18, font: 'body', size: 12, fill: '#71717a' }), [[0, SEARCH], [RESET + 0.3, LOOP]]),
  );
  for (let k = 1; k <= keys; k++) {
    s.add(during(s, s.text(QUERY.slice(0, k), { x: x + 28, y: y + 19, font: 'mono', size: 12, fill: C.text }), [[typed(k), k === keys ? RESET + 0.3 : typed(k + 1)]]));
  }
  // The caret, blinking where the next key goes.
  for (let k = 0; k <= keys; k++) {
    const from = k === 0 ? SEARCH : typed(k);
    const to = k === keys ? RESET + 0.3 : typed(k + 1);
    const caret = s.anim(el('rect', { x: x + 29 + k * 7.2, y: y + 7, width: 2, height: 14, fill: C.text, class: 'px' }),
      [[0, { opacity: 1 }], [0.5, { opacity: 0 }, 'step']], { period: 1 });
    s.add(during(s, caret, [[from, to]]));
  }
}

// The detail of the open entry: what ran, what came back, and whether it was
// allowed.
function detail(s) {
  const { x, y, w, h } = CARD;
  s.add(el('rect', { x, y, width: w, height: h, fill: C.bg, stroke: C.line, 'stroke-width': 1, class: 'px' }));
  s.add(during(s, s.text('Select an entry to view details.', { x: x + w / 2, y: y + h / 2 + 4, font: 'body', size: 12, fill: '#71717a', anchor: 'middle' }), [[0, INSPECT + 0.1], [RESET + 0.5, LOOP]]));
  const card = g({},
    el('rect', { x: 14, y: 10, width: 38, height: 18, fill: TOOL.pending.bg, class: 'px' }),
    s.text('TOOL', { x: 33, y: 23, font: 'pixel', size: 10, fill: TOOL.pending.text, anchor: 'middle' }),
    s.text('Bash', { x: 62, y: 24, font: 'bold', size: 15, fill: C.text }),
    el('rect', { x: 112, y: 10, width: 72, height: 18, fill: '#27272a', class: 'px' }),
    s.text('ALLOWED', { x: 148, y: 23, font: 'pixel', size: 10, fill: '#d4d4d8', anchor: 'middle' }),
    s.text('SUMMARY', { x: 18, y: 44, font: 'pixel', size: 10, fill: C.text }),
    s.text('PAYLOAD', { x: 100, y: 44, font: 'pixel', size: 10, fill: '#71717a' }),
    el('rect', { x: 14, y: 50, width: w - 28, height: 1, fill: C.line, class: 'px' }),
    el('rect', { x: 14, y: 49, width: 72, height: 2, fill: C.text, class: 'px' }),
    s.text('$ npm test', { x: 18, y: 67, font: 'mono', size: 12, fill: C.text }),
    s.text('→ 42 passed, 0 failed', { x: 18, y: 82, font: 'mono', size: 12, fill: C.lit }),
  );
  s.add(s.anim(card, [
    [0, { x, y: y + 6, opacity: 0 }],
    [INSPECT + 0.1, { opacity: 0 }, 'step'],
    [INSPECT + 0.4, { y, opacity: 1 }, 'out'],
    [RESET, { opacity: 1 }],
    [RESET + 0.5, { opacity: 0 }],
  ]));
}

// The Bash call that needs you: Allow or Deny, under its chip.
const ASKED = ENTRIES.find((e) => e.denied);
const ASKED_X = onStage(ASKED, ASK).x + ASKED.w / 2;
const POP = { x: Math.min(ASKED_X - 68, BX + BW - 12 - 220), y: laneY(2) + ENTRY_H + 10, w: 220, h: 66 };
const DENY_AT = { x: POP.x + 12, y: POP.y + 34, w: 92 };
const ALLOW_AT = { x: POP.x + 116, y: POP.y + 34, w: 92 };

function permission(s) {
  const { x, y, w, h } = POP;
  const pop = g({},
    el('rect', { x, y, width: w, height: h, fill: C.bg, stroke: C.ask, 'stroke-width': 2, class: 'px' }),
    el('rect', { x: ASKED_X - 4, y: y - 6, width: 8, height: 6, fill: C.ask, class: 'px' }),
    s.text('Bash', { x: x + 12, y: y + 22, font: 'semi', size: 12, fill: C.ask }),
    s.text('rm -rf node_modules', { x: x + 52, y: y + 22, font: 'mono', size: 11, fill: C.text }),
    el('rect', { x: DENY_AT.x, y: DENY_AT.y, width: DENY_AT.w, height: 22, fill: C.panel, stroke: TOOL.denied.line, 'stroke-width': 1, class: 'px' }),
    s.anim(el('rect', { x: DENY_AT.x, y: DENY_AT.y, width: DENY_AT.w, height: 22, fill: TOOL.denied.line, class: 'px' }),
      [[0, { opacity: 0 }], [DENY - 0.15, { opacity: 0.8 }, 'step'], [DENY, { opacity: 0 }, 'step']]),
    s.text('Deny', { x: DENY_AT.x + DENY_AT.w / 2, y: DENY_AT.y + 16, font: 'semi', size: 12, fill: TOOL.denied.text, anchor: 'middle' }),
    el('rect', { x: ALLOW_AT.x, y: ALLOW_AT.y, width: ALLOW_AT.w, height: 22, fill: C.text, class: 'px' }),
    s.text('Allow', { x: ALLOW_AT.x + ALLOW_AT.w / 2, y: ALLOW_AT.y + 16, font: 'semi', size: 12, fill: C.ink, anchor: 'middle' }),
  );
  s.add(during(s, pop, [[ASK + 0.4, DENY + 0.2]]));
}

// claude does the work; the others watch, and everyone celebrates at the end.
function agent(s, m, i) {
  const dance = [[DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]];
  if (m.name !== 'claude') {
    mascot(s, m, i, { hops: dance, done: [[DANCE, RESET]] });
    return;
  }
  mascot(s, m, i, {
    hops: [[IN + 0.1, 10], [DENY + 0.3, 8], [DONE, 22], ...dance],
    alert: [[IN + 0.1, 1.6]],
    work: [[1.6, ASK + 0.2], [DENY + 0.6, DONE]],
    ask: [[ASK + 0.2, DENY]],
    done: [[DONE, RESET]],
  });
}

// You: Deny on the risky call, then open the passing one, then search.
function pointer(s) {
  const deny = { x: DENY_AT.x + 46, y: DENY_AT.y + 12 };
  const passed = ENTRIES.find((e) => e.allowed);
  const chip = { x: onStage(passed, INSPECT).x + passed.w / 2, y: laneY(2) + 14 };
  const box = { x: SB.x + 150, y: SB.y + 15 };
  cursor(s, [
    [0, OFF],
    [DENY - 1.1, OFF],
    [DENY - 0.3, deny, 'inOut'],
    ...press(DENY, deny),
    [DENY + 0.4, deny],
    [DENY + 1.1, OFF, 'inOut'],
    [INSPECT - 1.1, OFF],
    [INSPECT - 0.3, chip, 'inOut'],
    ...press(INSPECT, chip),
    [SEARCH - 1, chip],
    [SEARCH - 0.3, box, 'inOut'],
    ...press(SEARCH, box),
    [HIT + 0.4, box],
    [HIT + 1.1, OFF, 'inOut'],
  ]);
}
