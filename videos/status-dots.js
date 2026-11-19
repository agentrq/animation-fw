// A day in the life of the sidebar dots, narrated: what yellow, red, green,
// red-pulsing and grey mean beside each workspace, and which one wins.
// Build: VIDEO_TIMELINE=<timeline.json> node bin/video.js videos/status-dots.js out.mp4 --audio voice.wav
import { el, g, sprite } from '../src/index.js';
import {
  C, CHECK, OFF, mascotByName, mascot, cursor, press,
} from '../kit/agentrq.js';
import {
  loadTimeline, videoScene, beatSpan, showDuring, story, tag, captions,
} from './lib.js';

const tl = loadTimeline();
const { T, S } = tl;
const END = tl.end;

// ---------------------------------------------------------------- the dots
const STATE = {
  yellow: { c: C.ask, pulse: false, glow: true },
  red: { c: C.blocked, pulse: false, glow: true },
  greenPulse: { c: C.ongoing, pulse: true, glow: true },
  redPulse: { c: C.blocked, pulse: true, glow: true },
  greenIdle: { c: C.ongoing, pulse: false, glow: true },
  grey: { c: '#52525b', pulse: false, glow: false },
};

// Six workspaces, as in the guide. Each row: name, mascot, and the dot's
// states over the story as [state, from, to].
const ROWS = [
  { name: 'billing-worker', spans: [['red', 0, T(2, 0.1)], ['greenPulse', T(2, 0.1), T(2, 1.6)], ['red', T(2, 1.6), END]] },
  { name: 'docs-site', spans: [['greenIdle', 0, END]] },
  { name: 'infra-scripts', spans: [['grey', 0, END]] },
  { name: 'mobile-app', spans: [['redPulse', 0, T(4, 0.1)], ['greenPulse', T(4, 0.1), T(4, 2.4)], ['redPulse', T(4, 2.4), END]] },
  { name: 'search-indexer', spans: [['greenPulse', 0, END]] },
  { name: 'storefront-api', spans: [['yellow', 0, T(1, 0.2)], ['greenPulse', T(1, 0.2), T(1, 1.9)], ['yellow', T(1, 1.9), T(1, 4.7)],
    ['greenPulse', T(1, 4.7), T(6, 1.2)], ['yellow', T(6, 1.2), END]] },
];
const FOCUS = [[], [5], [0], [4], [3], [1, 2], [], [5], []];

const PXL = 440;
const PYL = 20;
const PWL = 740;
const rowY = (i) => 56 + i * 30;

const panel = (s, { x, y, w, h, title }) => g({},
  el('rect', { x, y, width: w, height: h, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
  s.text(title, { x: x + 16, y: y + 26, font: 'semi', size: 15, fill: C.text }));

// One dot drawn at the origin: a faint halo and the dot, pulsing when the state does.
function dot(s, key, x = 0, y = 0) {
  const st = STATE[key];
  const body = g({ transform: `translate(${x} ${y})` },
    st.glow ? el('rect', { x: -4, y: -4, width: 20, height: 20, fill: st.c, opacity: 0.22, class: 'px' }) : null,
    el('rect', { width: 12, height: 12, fill: st.c, class: 'px' }));
  return st.pulse ? s.anim(body, [[0, { opacity: 1 }], [1, { opacity: 0.35 }, 'inOut'], [2, { opacity: 1 }, 'inOut']], { period: 2 }) : body;
}

function sidebar(s) {
  const parts = [panel(s, { x: PXL, y: PYL, w: PWL, h: 272, title: 'Workspaces' })];
  ROWS.forEach((row, i) => {
    const y = PYL + rowY(i);
    // The focused row gets a lighter bar behind it.
    const focus = S.map((_, b) => b).filter((b) => FOCUS[b].includes(i)).map((b) => beatSpan(tl, b));
    if (focus.length) parts.push(showDuring(s, el('rect', { x: PXL + 8, y: y - 4, width: PWL - 16, height: 28, fill: C.card, class: 'px' }), focus));
    parts.push(s.text(row.name, { x: PXL + 52, y: y + 15, font: 'semi', size: 15, fill: C.text }));
    for (const [key, from, to] of row.spans) parts.push(showDuring(s, dot(s, key, PXL + 26, y + 4), [[from, to]]));
  });
  // The queued badge on storefront-api
  parts.push(g({},
    el('rect', { x: PXL + PWL - 52, y: PYL + rowY(5) - 1, width: 26, height: 22, fill: C.line, class: 'px' }),
    s.text('2', { x: PXL + PWL - 39, y: PYL + rowY(5) + 15, font: 'mono', size: 13, fill: C.dim, anchor: 'middle' })));
  // Rows not being talked about step back.
  ROWS.forEach((_, i) => {
    const dim = S.map((_, b) => b).filter((b) => FOCUS[b].length && !FOCUS[b].includes(i)).map((b) => beatSpan(tl, b));
    if (dim.length) parts.push(showDuring(s, el('rect', { x: PXL + 4, y: PYL + rowY(i) - 6, width: PWL - 8, height: 32, fill: C.panel, opacity: 0.8, class: 'px' }), dim));
  });
  s.add(showDuring(s, g({}, ...parts), [[0, S[8]]]));
}

// Notes on a row, what the dot is saying in words.
function notes(s) {
  const note = (i, label, fill, color, from, to) => s.add(showDuring(s,
    tag(s, label, { x: PXL + PWL - 250, y: PYL + rowY(i) + 1, fill, color, stroke: fill, font: 'semi', size: 11 }), [[from, to]]));
  note(0, 'needs a credential', '#7f1d1d', '#fecaca', T(2, 1.9), tl.beatEnd(2));
  note(3, 'agent went offline', '#7f1d1d', '#fecaca', T(4, 2.7), tl.beatEnd(4));
  note(5, 'approval waiting', '#713f12', '#fef08a', T(1, 2.2), T(1, 4.7));
}

// The approval that arrives for storefront-api in beat 1.
const ALLOW = { x: 826, y: 196 };
function approval(s) {
  const t0 = T(1, 2.2);
  const click = T(1, 4.05);
  const card = g({},
    el('rect', { x: 760, y: 118, width: 400, height: 112, fill: C.card, stroke: C.ask, 'stroke-width': 2, class: 'px' }),
    s.text('NEEDS INPUT', { x: 776, y: 140, font: 'pixel', size: 11, fill: C.ask }),
    el('rect', { x: 776, y: 150, width: 368, height: 24, fill: '#000', class: 'px' }),
    s.text('Bash  git push origin main', { x: 786, y: 167, font: 'mono', size: 12, fill: C.lit }),
    el('rect', { x: 776, y: 184, width: 100, height: 26, fill: C.text, class: 'px' }),
    s.anim(el('rect', { x: 776, y: 184, width: 100, height: 26, fill: C.ongoing, class: 'px' }), [[0, { opacity: 0 }], [click - 0.15, { opacity: 0.85 }, 'step'], [click, { opacity: 0 }, 'step']]),
    s.text('Allow Once', { x: 826, y: 202, font: 'semi', size: 12, fill: C.ink, anchor: 'middle' }),
    el('rect', { x: 886, y: 184, width: 60, height: 26, fill: C.line, class: 'px' }),
    s.text('Deny', { x: 916, y: 202, font: 'semi', size: 12, fill: C.blocked, anchor: 'middle' }));
  s.add(showDuring(s, s.anim(card, [[0, { opacity: 1, y: 0 }], [t0, { y: 14 }, 'step'], [t0 + 0.3, { y: 0 }, 'back']]), [[t0, T(1, 4.7)]]));
}

// ---------------------------------------------------------------- the legend strip
function legend(s) {
  const strip = (from, to, ...parts) => s.add(showDuring(s, g({}, ...parts), [[from, to]]));
  const say = (text, x = PXL + 56) => s.text(text, { x, y: PYL + 263, font: 'semi', size: 15, fill: C.text });
  const sample = (key, x = PXL + 26) => dot(s, key, x, PYL + 252);
  s.add(showDuring(s, g({}, el('rect', { x: PXL + 8, y: PYL + 246, width: PWL - 16, height: 24, fill: C.column, class: 'px' }),
    el('rect', { x: PXL + 8, y: PYL + 246, width: PWL - 16, height: 2, fill: C.line, class: 'px' })), [[0, S[8]]]));

  strip(0, S[1], say('Six workspaces, six dots.'));
  strip(S[1], T(1, 1.9), sample('greenPulse'), say('green pulse: a task is running'));
  strip(T(1, 1.9), T(1, 4.7), sample('yellow'), say('yellow: waiting on you, an approval to give'));
  strip(T(1, 4.7), tl.beatEnd(1), sample('greenPulse'), say('approved: the agent carries on'));
  strip(S[2], T(2, 1.6), sample('greenPulse'), say('green pulse: a task is running'));
  strip(T(2, 1.6), tl.beatEnd(2), sample('red'), say('red: blocked, it needs something from you'));
  strip(S[3], tl.beatEnd(3), sample('greenPulse'), say('green pulse: the agent is working right now'));
  strip(S[4], T(4, 2.4), sample('greenPulse'), say('green pulse: a task is running'));
  strip(T(4, 2.4), tl.beatEnd(4), sample('redPulse'), say('red pulse: a task is running, the agent is offline'));
  strip(S[5], tl.beatEnd(5), sample('greenIdle'), say('steady green: online, idle'), sample('grey', PXL + 400), say('grey: offline, idle', PXL + 430));
  strip(S[7], tl.beatEnd(7), g({}, el('rect', { x: PXL + 18, y: PYL + 251, width: 26, height: 14, fill: C.line, class: 'px' }),
    s.text('2', { x: PXL + 31, y: PYL + 262, font: 'mono', size: 11, fill: C.dim, anchor: 'middle' })), say('tasks queued for the agent to pick up'));

  // Beat 6: the order, one rung lit at a time.
  const ORDER = [['yellow', 'yellow'], ['red', 'red'], ['greenPulse', 'green pulse'], ['greenIdle', 'green'], ['grey', 'grey']];
  ORDER.forEach(([key, label], i) => {
    const x = PXL + 26 + i * 142;
    s.add(s.anim(g({}, dot(s, key, x, PYL + 252), s.text(label, { x: x + 22, y: PYL + 263, font: 'semi', size: 14, fill: C.text }),
      i < ORDER.length - 1 ? s.text('>', { x: x + 110, y: PYL + 263, font: 'bold', size: 16, fill: C.dim }) : null),
    [[0, { opacity: 0 }], [T(6, 1.4 + i * 0.7), { opacity: 1 }, 'step'], [tl.beatEnd(6), { opacity: 0 }, 'step']]));
  });
}

// ---------------------------------------------------------------- the agents
function agentsOnGround(s) {
  const named = (m, name) => ({ ...m, name });
  const hops = (...ts) => ts.map((t) => [t, 16]);
  // billing-worker: codex
  mascot(s, named(mascotByName('codex'), 'billing'), 0, {
    hops: hops(T(2, 0.1), T(2, 1.6), T(7, 0.6)),
    work: [[T(2, 0.1), T(2, 1.6)]],
    alert: [[1.0, S[1]], [T(2, 1.6), END]],
    say: [['cred?', [[T(2, 2.4), tl.beatEnd(2)]], C.ask]],
  });
  // docs-site: openclaw, finished and waiting
  mascot(s, named(mascotByName('openclaw'), 'docs'), 1, {
    hops: hops(T(5, 0.4), T(8, 0.8)),
    done: [[1.0, END]],
  });
  // mobile-app: hermes, whose laptop goes to sleep
  mascot(s, named(mascotByName('hermes'), 'mobile'), 2, {
    hops: hops(T(4, 0.1), T(8, 1.0)),
    work: [[T(4, 0.1), T(4, 2.4)]],
    say: [['zZ', [[1.0, S[1]], [T(4, 2.4), END]], C.blocked]],
    sleep: [[1.0, S[1]], [T(4, 2.4), END]],
  });
  // search-indexer: antigravity, happily grinding
  mascot(s, named(mascotByName('agy'), 'search'), 3, {
    hops: hops(T(3, 0.5), T(3, 2.0), T(8, 1.2)),
    work: [[0.8, END]],
  });
  // storefront-api: claude, asks and is answered
  mascot(s, named(mascotByName('claude'), 'storefront'), 4, {
    hops: hops(T(1, 0.2), T(1, 4.7), T(6, 1.2), T(8, 1.4)),
    work: [[T(1, 0.2), T(1, 1.9)], [T(1, 4.7), T(6, 1.2)]],
    ask: [[1.0, S[1]], [T(1, 1.9), T(1, 4.7)], [T(6, 1.2), END]],
  });
}

// ---------------------------------------------------------------- the pointer
function pointer(s) {
  const badge = { x: PXL + PWL - 40, y: PYL + rowY(5) + 10 };
  cursor(s, [
    [0, OFF], [T(1, 2.6), OFF],
    [T(1, 3.3), ALLOW, 'inOut'], ...press(T(1, 4.05) + 0.2, ALLOW), [T(1, 4.5), ALLOW], [T(1, 5.0), OFF, 'inOut'],
    [T(7, 0.4), OFF], [T(7, 1.0), badge, 'inOut'], ...press(T(7, 1.6), badge), [T(7, 2.4), badge], [T(7, 3.0), OFF, 'inOut'],
  ]);
}

function close(s) {
  const t0 = S[8];
  s.add(showDuring(s, s.anim(g({},
    s.text('YOUR TEAM', { x: 810, y: 124, font: 'pixel', size: 54, fill: C.lit, anchor: 'middle' }),
    s.text('at a glance', { x: 810, y: 196, font: 'bold', size: 56, fill: C.text, anchor: 'middle', spacing: -1 }),
    s.text('agentrq.com', { x: 810, y: 250, font: 'body', size: 22, fill: C.dim, anchor: 'middle' }),
    ...['yellow', 'red', 'greenPulse', 'redPulse', 'greenIdle', 'grey'].map((k, i) => dot(s, k, 698 + i * 32, 262))),
  [[0, { opacity: 0, y: 20 }], [t0 + 0.2, { opacity: 0, y: 20 }, 'step'], [t0 + 0.6, { opacity: 1, y: 0 }, 'back']]), [beatSpan(tl, 8)]));
}

export default function statusDots() {
  const s = videoScene({
    tl,
    poster: T(6, 3),
    description: 'A day in the life of the sidebar dots in AgentRQ: a workspace dot turns yellow when an approval waits on you, red when blocked, pulses green while an agent works, pulses red when a running task loses its agent, stays steady green or grey when idle, and the most urgent state wins when a workspace has several.',
  });

  story(s, tl, {
    kicker: 'the dots',
    steps: [['yellow', S[1], S[2]], ['red', S[2], S[3]], ['green', S[3], S[5]], ['idle', S[5], S[6]]],
    beats: [
      { at: [0], headline: ['What do these', 'dots mean?'], sub: 'A day in the life of the dots.', log: '> 6 workspaces, 6 dots' },
      { at: [1], headline: ['Yellow:', 'needs you.'], sub: 'An approval is waiting.',
        logs: [['> storefront: running', S[1], T(1, 1.9)], ['> storefront: push to main?', T(1, 1.9), T(1, 4.05), C.ask], ['> you: allow', T(1, 4.05), tl.beatEnd(1)]] },
      { at: [2], headline: ['Red:', 'blocked.'], sub: 'The agent needs something.',
        logs: [['> billing: running', S[2], T(2, 1.6)], ['> billing: needs a credential', T(2, 1.6), tl.beatEnd(2), C.blocked]] },
      { at: [3], headline: ['Green pulse:', 'working now.'], sub: 'Nothing for you to do.', log: '> search: indexing_' },
      { at: [4], headline: ['Red pulse:', 'agent offline.'], sub: 'The task is running. The agent is not.',
        logs: [['> mobile: running', S[4], T(4, 2.4)], ['> mobile: agent went offline', T(4, 2.4), tl.beatEnd(4), C.blocked]] },
      { at: [5], headline: ['Steady dots:', 'idle.'], sub: 'Online is green. Offline is grey.', log: '> docs idle, infra offline' },
      { at: [6], headline: ['Most urgent', 'wins.'], sub: 'Yellow, red, then green.', log: '> yellow > red > green' },
      { at: [7], headline: ['Queued for', 'the agent.'], sub: 'The little number.', log: '> storefront: 2 queued' },
      { at: [8], headline: ['Your team,', 'at a glance.'], sub: 'Find it at agentrq.com.', log: '> agentrq.com' },
    ],
  });

  sidebar(s);
  notes(s);
  approval(s);
  legend(s);
  close(s);
  agentsOnGround(s);
  pointer(s);
  captions(s, tl);
  return s;
}
