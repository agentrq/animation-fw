// AgentRQ's YOLO mode: flip one toggle on a task and every tool call the
// agent makes is approved for you, while the Trajectory view still records
// each one.
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
};

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const IN = 0.8;                            // your message lands
const ASK = 3.0;                           // claude asks to run go test
const YOLO = 5.2;                          // you flip YOLO on instead of answering
const PASS = 9.2;                          // the last go test passes
const DONE = 9.9;                          // claude's last reply
const INSPECT = 12;                        // you open the passing Bash call
const UNYOLO = 14.8;                       // and flip YOLO off again
const DANCE = 16.4;
const RESET = 22.6;

// Every entry of the run, oldest first. lane: 0 input, 1 agent, 2 tools.
// auto: the second the call is approved for you.
const ENTRIES = [
  { t: IN, lane: 0, label: 'fix 48 failing tests' },
  { t: 1.6, lane: 1, label: 'on it' },
  { t: 2.3, lane: 2, label: 'Read', allowed: true },
  { t: ASK, lane: 2, label: 'Bash', auto: YOLO },
  { t: 5.9, lane: 2, label: 'Edit' },
  { t: 6.5, lane: 2, label: 'Bash' },
  { t: 7.1, lane: 2, label: 'Edit' },
  { t: 7.7, lane: 2, label: 'Bash' },
  { t: 8.3, lane: 2, label: 'Edit' },
  { t: 8.9, lane: 2, label: 'Bash', last: true },
  { t: DONE, lane: 1, label: '48 pass' },
];
for (const e of ENTRIES) if (e.lane === 2 && !e.allowed && !e.auto) e.auto = e.t;
const AUTO = ENTRIES.filter((e) => e.auto).map((e) => e.auto);

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
  e.w = e.lane === 2 ? e.label.length * 7 + (e.auto ? 38 : 22) : Math.round(e.label.length * 6.4 + 22);
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

// The bottom row: the auto-allowed count and lane chips on the left, the
// detail on the right.
const SB = { x: BX + 16, y: BY + 178, w: 300, h: 28 };
const CARD = { x: BX + 332, y: BY + 176, w: BW - 344, h: 88 };

// The YOLO toggle, left of Chat | Trajectory in the task's header.
const TOGGLE = { x: BX + BW - 196 - 84, y: BY + 8, w: 72, h: 26 };

export default function yoloMode() {
  const s = newScene({
    poster: 13.4,
    description: 'AgentRQ YOLO mode: claude asks to run go test and waits, so you flip the task\'s YOLO toggle instead of answering. That call and every one after it is auto-allowed, edits and test runs land in the Trajectory view without a single wait, and 48 tests pass. You open the last call to see it was auto-allowed, turn YOLO off again, and the agents celebrate.',
  });

  sky(s);
  ground(s);
  story(s);
  screen(s);
  toggle(s);
  timeline(s);
  counter(s);
  chips(s);
  detail(s);
  permission(s);
  MASCOTS.forEach((m, i) => agent(s, m, i));
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'yolo mode',
    headline: ['Flip YOLO,', 'stop waiting.'],
    sub: 'Every call approved, every call recorded.',
    steps: [['run', IN, ASK], ['ask', ASK, YOLO], ['yolo', YOLO, INSPECT], ['record', INSPECT, RESET]],
    log: [
      [0, IN, '> waiting for work_'],
      [IN, 2.3, '> you: fix 48 failing tests'],
      [2.3, ASK, '> claude: Read user_test.go'],
      [ASK, YOLO, '> claude: go test ./...?', C.ask],
      [YOLO, 5.9, '> YOLO on · Bash auto-allowed', C.lit],
      [5.9, PASS, '> claude: Edit, Bash, Edit...'],
      [PASS, INSPECT, `> 48 passed · ${AUTO.length} auto-allowed`, C.lit],
      [INSPECT, UNYOLO, '> Bash · auto-allowed · 48 passed'],
      [UNYOLO, RESET, '> YOLO off · next call asks'],
    ],
  });
}

// The task's window, with the Chat | Trajectory toggle on Trajectory.
function screen(s) {
  frame(s, { x: BX, y: BY, w: BW, h: BH, title: 'Fix 48 failing tests' });
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

const FLAME = `
  ..#..
  .##..
  .###.
  ##.##
  #...#
  .###.`;

// The YOLO toggle: grey while off, lit while on, as the app draws it.
function toggle(s) {
  const { x, y, w, h } = TOGGLE;
  const face = (bg, ink, stroke) => g({},
    el('rect', { x, y, width: w, height: h, fill: bg, stroke, 'stroke-width': 1, class: 'px' }),
    sprite(FLAME, { '#': ink }, { px: 2, x: x + 12, y: y + 7 }),
    s.text('YOLO', { x: x + 26, y: y + 18, font: 'pixel', size: 12, fill: ink }));
  s.add(face('#27272a', '#71717a', C.line));
  s.add(during(s, face('#52525b', C.text, '#a1a1aa'), [[YOLO, UNYOLO]]));
  s.add(during(s, el('rect', { x: x - 3, y: y - 3, width: w + 6, height: h + 6, fill: 'none', stroke: C.lit, 'stroke-width': 2, class: 'px' }), [[YOLO, YOLO + 0.6]]));
}

const BOLT = `
  .##
  ##.
  ###
  .##
  ##.`;

// A tool call's chip. Auto-allowed calls carry a bolt.
function toolChip(s, e, st, bolt) {
  return g({},
    el('rect', { width: e.w, height: ENTRY_H, fill: st.bg, stroke: st.line, 'stroke-width': 2, class: 'px' }),
    s.text(e.label, { x: 10, y: 16, font: 'mono', size: 11, fill: st.text }),
    bolt ? sprite(BOLT, { '#': C.ask }, { px: 2, x: e.w - 18, y: 7 }) : null);
}

function entry(s, e) {
  if (e.lane < 2) {
    const st = e.lane === 0 ? LANE.input : LANE.agent;
    return g({},
      el('rect', { width: e.w, height: ENTRY_H, fill: st.bg, stroke: st.line, 'stroke-width': 2, class: 'px' }),
      s.text(e.label, { x: 10, y: 16, font: 'semi', size: 11, fill: st.text }));
  }
  if (e.auto > e.t) {
    return g({},
      during(s, toolChip(s, e, TOOL.pending), [[0, e.auto]]),
      during(s, toolChip(s, e, TOOL.allowed, true), [[e.auto, LOOP]]));
  }
  const chip = toolChip(s, e, TOOL.allowed, !!e.auto);
  if (!e.last) return chip;
  return g({}, chip,
    // Selected: the ring the app draws round the open entry.
    during(s, el('rect', { x: -4, y: -4, width: e.w + 8, height: ENTRY_H + 8, fill: 'none', stroke: C.text, 'stroke-width': 2, class: 'px' }), [[INSPECT, RESET + 0.5]]));
}

// The lanes' contents: each entry drops in as it happens, and the axis slides
// left to keep the newest in view.
function timeline(s) {
  s.def(el('clipPath', { id: 'axis' }, el('rect', { x: LX, y: BY + 38, width: VW, height: 132 })));

  const ticks = [];
  for (let x = 0; x < cursorX + VW; x += 40) {
    ticks.push(el('rect', { x, y: BY + 166, width: 2, height: 4, fill: '#3f3f46', class: 'px' }));
  }
  const items = ENTRIES.map((e) => s.anim(entry(s, e), [
    [0, { x: e.x, y: laneY(e.lane) - 10, opacity: 0 }],
    [e.t, { opacity: 0 }, 'step'],
    [e.t + 0.35, { y: laneY(e.lane), opacity: 1 }, 'back'],
    [RESET + 0.5, { opacity: 0 }, 'step'],
  ]));

  const slide = [[0, { x: LX }]];
  for (const [t, from, to] of SCROLL) slide.push([t, { x: LX - from }], [t + 0.4, { x: LX - to }, 'inOut']);
  slide.push([RESET + 0.6, { x: LX }, 'step']);
  const track = s.anim(g({}, ticks, items), slide);
  s.add(g({ 'clip-path': 'url(#axis)' },
    s.anim(track, [[0, { opacity: 1 }], [RESET, { opacity: 1 }], [RESET + 0.5, { opacity: 0 }], [RESET + 0.6, { opacity: 1 }, 'step']])));
}

// How many calls YOLO approved for you, counting up as they land.
function counter(s) {
  const { x, y, w, h } = SB;
  s.add(
    el('rect', { x, y, width: w, height: h, fill: '#27272a', stroke: '#3f3f46', 'stroke-width': 1, class: 'px' }),
    sprite(BOLT, { '#': C.ask }, { px: 2, x: x + 10, y: y + 9 }),
    s.text('Auto-allowed tool calls', { x: x + 26, y: y + 18, font: 'body', size: 12, fill: C.dim }),
  );
  const n = (k, spans) => during(s, s.text(String(k), { x: x + w - 12, y: y + 19, font: 'mono', size: 13, fill: k ? C.lit : '#71717a', anchor: 'end' }), spans);
  s.add(n(0, [[0, AUTO[0]], [RESET + 0.5, LOOP]]));
  AUTO.forEach((t, k) => s.add(n(k + 1, [[t, AUTO[k + 1] ?? RESET + 0.5]])));
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

// The detail of the open entry: what ran, what came back, and that YOLO
// approved it.
function detail(s) {
  const { x, y, w, h } = CARD;
  s.add(el('rect', { x, y, width: w, height: h, fill: C.bg, stroke: C.line, 'stroke-width': 1, class: 'px' }));
  s.add(during(s, s.text('Select an entry to view details.', { x: x + w / 2, y: y + h / 2 + 4, font: 'body', size: 12, fill: '#71717a', anchor: 'middle' }), [[0, INSPECT + 0.1], [RESET + 0.5, LOOP]]));
  const card = g({},
    el('rect', { x: 14, y: 10, width: 38, height: 18, fill: TOOL.pending.bg, class: 'px' }),
    s.text('TOOL', { x: 33, y: 23, font: 'pixel', size: 10, fill: TOOL.pending.text, anchor: 'middle' }),
    s.text('Bash', { x: 62, y: 24, font: 'bold', size: 15, fill: C.text }),
    el('rect', { x: 112, y: 10, width: 108, height: 18, fill: '#27272a', class: 'px' }),
    s.text('AUTO-ALLOWED', { x: 166, y: 23, font: 'pixel', size: 10, fill: '#d4d4d8', anchor: 'middle' }),
    s.text('SUMMARY', { x: 18, y: 44, font: 'pixel', size: 10, fill: C.text }),
    s.text('PAYLOAD', { x: 100, y: 44, font: 'pixel', size: 10, fill: '#71717a' }),
    el('rect', { x: 14, y: 50, width: w - 28, height: 1, fill: C.line, class: 'px' }),
    el('rect', { x: 14, y: 49, width: 72, height: 2, fill: C.text, class: 'px' }),
    s.text('$ go test ./...', { x: 18, y: 67, font: 'mono', size: 12, fill: C.text }),
    s.text('→ ok · 48 passed, 0 failed', { x: 18, y: 82, font: 'mono', size: 12, fill: C.lit }),
  );
  s.add(s.anim(card, [
    [0, { x, y: y + 6, opacity: 0 }],
    [INSPECT + 0.1, { opacity: 0 }, 'step'],
    [INSPECT + 0.4, { y, opacity: 1 }, 'out'],
    [RESET, { opacity: 1 }],
    [RESET + 0.5, { opacity: 0 }],
  ]));
}

// The go test call that waits for you: Allow or Deny, under its chip. You
// never answer it, because YOLO does.
const ASKED = ENTRIES.find((e) => e.auto > e.t);
const ASKED_X = onStage(ASKED, ASK).x + ASKED.w / 2;
const POP = { x: Math.min(ASKED_X - 68, BX + BW - 12 - 220), y: laneY(2) + ENTRY_H + 10, w: 220, h: 66 };

function permission(s) {
  const { x, y, w, h } = POP;
  const deny = { x: x + 12, y: y + 34, w: 92 };
  const allow = { x: x + 116, y: y + 34, w: 92 };
  const pop = g({},
    el('rect', { x, y, width: w, height: h, fill: C.bg, stroke: C.ask, 'stroke-width': 2, class: 'px' }),
    el('rect', { x: ASKED_X - 4, y: y - 6, width: 8, height: 6, fill: C.ask, class: 'px' }),
    s.text('Bash', { x: x + 12, y: y + 22, font: 'semi', size: 12, fill: C.ask }),
    s.text('go test ./...', { x: x + 52, y: y + 22, font: 'mono', size: 11, fill: C.text }),
    el('rect', { x: deny.x, y: deny.y, width: deny.w, height: 22, fill: C.panel, stroke: '#ef4444', 'stroke-width': 1, class: 'px' }),
    s.text('Deny', { x: deny.x + deny.w / 2, y: deny.y + 16, font: 'semi', size: 12, fill: '#f87171', anchor: 'middle' }),
    el('rect', { x: allow.x, y: allow.y, width: allow.w, height: 22, fill: C.text, class: 'px' }),
    s.text('Allow', { x: allow.x + allow.w / 2, y: allow.y + 16, font: 'semi', size: 12, fill: C.ink, anchor: 'middle' }),
  );
  s.add(during(s, pop, [[ASK + 0.4, YOLO + 0.2]]));
}

// claude does the work; the others watch, and everyone celebrates at the end.
function agent(s, m, i) {
  const dance = [[DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]];
  if (m.name !== 'claude') {
    mascot(s, m, i, { hops: dance, done: [[DANCE, RESET]] });
    return;
  }
  mascot(s, m, i, {
    hops: [[IN + 0.1, 10], [YOLO + 0.3, 18], [DONE, 22], ...dance],
    alert: [[IN + 0.1, 1.6]],
    work: [[1.6, ASK + 0.2], [YOLO + 0.6, DONE]],
    ask: [[ASK + 0.2, YOLO]],
    done: [[DONE, RESET]],
  });
}

// You: YOLO on instead of Allow, then open the last call, then YOLO off.
function pointer(s) {
  const flip = { x: TOGGLE.x + TOGGLE.w / 2, y: TOGGLE.y + 14 };
  const last = ENTRIES.find((e) => e.last);
  const chip = { x: onStage(last, INSPECT).x + last.w / 2, y: laneY(2) + 14 };
  cursor(s, [
    [0, OFF],
    [YOLO - 1.2, OFF],
    [YOLO - 0.3, flip, 'inOut'],
    ...press(YOLO, flip),
    [YOLO + 0.4, flip],
    [YOLO + 1.1, OFF, 'inOut'],
    [INSPECT - 1.1, OFF],
    [INSPECT - 0.3, chip, 'inOut'],
    ...press(INSPECT, chip),
    [UNYOLO - 1, chip],
    [UNYOLO - 0.3, flip, 'inOut'],
    ...press(UNYOLO, flip),
    [UNYOLO + 0.4, flip],
    [UNYOLO + 1.1, OFF, 'inOut'],
  ]);
}
