// The AI agent task manager loop: a scheduled template spawns a run that
// claude picks up; claude loads its workspace memory and a skill, calls a
// tool through Mesher's callTool, waits on you for one risky command, then
// saves what it learned and fires an event that hands the next workspace its
// task.
import { el, g } from '../src/index.js';
import {
  C, MASCOTS, OFF, newScene, sky, ground, intro, frame, mascot, mascotByName, cursor, press,
} from '../kit/agentrq.js';

// The app draws events in violet.
const EV = { text: '#a78bfa', bg: '#1a1528', line: '#3b2d63', lit: '#c4b5fd' };

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop. Each beat owns a span.
const B = [0.3, 5.6, 11.0, 16.2, 22.4];
const FADE = 0.25;
const NINE = 2.2;           // the clock reaches 09:00 and the run is born
const TAKE = 3.4;           // claude picks it up
const MEMORY = 6.1;         // memory.md loads
const SKILL = 7.2;          // the dep-audit skill loads
const TOOL = 8.3;           // callTool github.tools listAlerts
const RESULT = 9.3;         // the alerts come back
const ASK = 11.6;           // claude asks to run npm audit fix --force
const ALLOW = 14.2;         // you click Allow Once
const AUDIT_DONE = 16.8;    // done: memory saved, event fired
const FIRE = 17.4;          // audit_finished fires
const PUBLISH = 18.2;       // release-notes gets its task
const CODEX = 18.9;         // codex picks it up
const NOTES_DONE = 20.3;
const DANCE = 20.6;
const RESET = 22.6;

// ---------------------------------------------------------------- the stage
const BX = 440;
const BY = 20;
const BW = 740;
const COLS = ['Scheduled', 'Not Started', 'Ongoing', 'Blocked', 'Done'];
const COL_DOT = [C.cron, C.notstarted, C.ongoing, C.blocked, C.done];
const colX = (c) => BX + 10 + c * 99;
const COL_W = 94;
const CARD_W = COL_W - 10;
const CARD_H = 44;
const slotY = (k) => BY + 72 + k * 47;
const PX0 = BX + 504;       // the side panel
const PW = 226;

// moves: [second, column, slot]; column -1 is off the board.
const CARDS = [
  { id: 'tmpl', ws: 'api', agent: 'claude', title: 'Nightly audit', tag: 'Daily 09:00', moves: [[0, 0, 0]] },
  { id: 'triage', ws: 'support', agent: 'hermes', title: 'Triage inbox', moves: [[0, 2, 1], [10.2, 4, 0]] },
  { id: 'audit', ws: 'api', agent: 'claude', title: 'Nightly audit', moves: [[0, -1, 0], [NINE, 1, 0], [TAKE, 2, 0], [ASK, 3, 0], [ALLOW + 0.1, 2, 0], [AUDIT_DONE, 4, 1]] },
  { id: 'notes', ws: 'release-notes', agent: 'codex', title: 'Write notes', moves: [[0, -1, 0], [PUBLISH, 1, 0], [CODEX, 2, 0], [NOTES_DONE, 4, 2]] },
];

// The board's column counts over the loop, from the cards' moves.
function counts() {
  const times = [...new Set(CARDS.flatMap((cd) => cd.moves.map(([t]) => t)))].sort((a, b) => a - b);
  const colAt = (moves, t) => moves.filter(([mt]) => mt <= t).at(-1)[1];
  const st = times.map((t) => [t, ...COLS.map((_, c) => CARDS.filter((cd) => colAt(cd.moves, t) === c).length)]);
  st.push([RESET, 1, 0, 1, 0, 0]);
  return st;
}
const STATES = counts();

// The clock in the board's header.
const CLOCK = [[0, '08:59'], [NINE, '09:00'], [5.0, '09:01'], [10.0, '09:03'], [15.0, '09:06'], [19.0, '09:08'], [RESET, '08:59']];

const ACTS = Object.fromEntries(MASCOTS.map((m) => [m.name, { hops: [], alert: [], work: [], ask: [], done: [], say: [] }]));

const appear = (s, node, t, until) => s.anim(node, until
  ? [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step'], [until, { opacity: 0 }, 'step']]
  : [[0, { opacity: 0 }], [t, { opacity: 1 }, 'step']]);

function beat(s, i, nodes) {
  const [from, to] = [B[i], B[i + 1]];
  s.add(s.anim(g({}, nodes), [[0, { opacity: 0 }], [from, { opacity: 0 }], [from + FADE, { opacity: 1 }], [to - FADE, { opacity: 1 }], [to, { opacity: 0 }]]));
}

const box = (x, y, w, h, fill = C.column, stroke) => el('rect', { x, y, width: w, height: h, fill, stroke, 'stroke-width': stroke ? 2 : undefined, class: 'px' });
const colour = (name) => mascotByName(name).color;

export default function agentTaskManagerLoop() {
  const s = newScene({
    poster: 21.0,
    description: 'The AI agent task manager loop in AgentRQ: at 09:00 the Daily Nightly audit template spawns a run and claude picks it up; it loads the workspace memory index and the dep-audit skill, then calls github.tools listAlerts through one Mesher callTool; it asks to run npm audit fix --force, the card waits in Blocked as Authorization Required until you click Allow Once; claude finishes, saves what it learned to memory and fires audit_finished, which hands the release-notes workspace a task that codex completes as the agents celebrate.',
  });

  sky(s);
  ground(s);
  story(s);
  board(s);
  panel(s);
  plan();
  for (const [i, m] of MASCOTS.entries()) {
    const acts = ACTS[m.name];
    acts.hops.push([DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]);
    mascot(s, m, i, acts);
  }
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'task manager',
    headline: ['The whole', 'agent loop.'],
    sub: 'Schedule, recall, act, ask, hand off.',
    steps: [['run', B[0], B[1]], ['recall', B[1], B[2]], ['ask', B[2], B[3]], ['chain', B[3], B[4]]],
    log: [
      [0, NINE, '> Daily 09:00, waiting_'],
      [NINE, TAKE, '> 09:00: run spawned', C.cron],
      [TAKE, MEMORY, '> claude picked it up'],
      [MEMORY, TOOL, '> memory + skill loaded'],
      [TOOL, ASK, '> callTool github.tools', C.cron],
      [ASK, ALLOW, '> claude waits for you', C.ask],
      [ALLOW, AUDIT_DONE, '> you: Allow Once'],
      [AUDIT_DONE, PUBLISH, '> event: audit_finished', EV.text],
      [PUBLISH, RESET, '> codex: release notes'],
    ],
  });
}

function board(s) {
  frame(s, { x: BX, y: BY, w: BW, h: 272, title: 'All workspaces' });

  CLOCK.forEach(([t, txt], k) => {
    const to = CLOCK[k + 1]?.[0] ?? 24;
    if (to <= t) return;
    const node = s.text(txt, { x: BX + BW - 82, y: BY + 26, font: 'mono', size: 14, fill: t === NINE ? C.cron : C.text, anchor: 'end' });
    s.add(t === 0 ? s.anim(node, [[0, { opacity: 1 }], [to, { opacity: 0 }, 'step']]) : appear(s, node, t, to));
  });
  s.add(s.anim(el('rect', { x: BX + BW - 64, y: BY + 17, width: 8, height: 8, fill: C.ongoing, class: 'px' }),
    [[0, { opacity: 1 }], [0.5, { opacity: 0.3 }, 'step'], [1, { opacity: 1 }, 'step']], { period: 1 }));
  s.add(s.text('LIVE', { x: BX + BW - 50, y: BY + 26, font: 'pixel', size: 16, fill: C.lit }));

  COLS.forEach((title, c) => {
    const x = colX(c);
    s.add(box(x, BY + 44, COL_W, 220));
    s.add(el('rect', { x: x + 7, y: BY + 54, width: 6, height: 6, fill: COL_DOT[c], class: 'px' }));
    s.add(s.text(title, { x: x + 17, y: BY + 61, font: 'semi', size: 10, fill: C.dim }));

    const spans = [];
    STATES.forEach((st) => {
      const n = st[1 + c];
      const prev = spans.at(-1);
      if (prev && prev.n === n) return;
      if (prev) prev.to = st[0];
      spans.push({ n, from: st[0], to: 24 });
    });
    for (const { n, from, to } of spans) {
      if (to <= from) continue;
      s.add(s.anim(s.text(String(n), { x: x + COL_W - 7, y: BY + 61, font: 'mono', size: 10, fill: n ? C.text : C.notstarted, anchor: 'end' }),
        from === 0 ? [[0, { opacity: 1 }], [to, { opacity: 0 }, 'step']]
          : [[0, { opacity: 0 }], [from, { opacity: 1 }, 'step'], [to, { opacity: 0 }, 'step']]));
    }
  });

  for (const cd of CARDS) card(s, cd);

  // The template flashes as its run drops out of it.
  s.add(appear(s, el('rect', { x: colX(0) + 5, y: slotY(0), width: CARD_W, height: CARD_H, fill: 'none', stroke: C.cron, 'stroke-width': 2, class: 'px' }), NINE, NINE + 0.6));
  // The waiting card glows amber while it waits on you.
  s.add(s.anim(el('rect', { x: colX(3) + 5, y: slotY(0), width: CARD_W, height: CARD_H, fill: 'none', stroke: C.ask, 'stroke-width': 2, class: 'px' }),
    [[0, { opacity: 0 }], [ASK + 0.45, { opacity: 1 }, 'step'], [ALLOW + 0.1, { opacity: 0 }, 'step']]));
}

// A card as the app draws it across every workspace: a status bar, the
// workspace with its agent-online dot, the title, then the agent. A
// template shows its schedule in place of the agent.
function card(s, { ws, agent, title, tag, moves }) {
  const bars = COL_DOT.map((fill, c) => {
    const keys = [[0, { opacity: moves[0][1] === c ? 1 : 0 }]];
    moves.forEach(([t, col], k) => {
      if (k === 0) return;
      keys.push([t, { opacity: col === c ? 1 : 0 }, 'step']);
    });
    return s.anim(el('rect', { x: 3, y: 5, width: 3, height: CARD_H - 10, fill, class: 'px' }), keys);
  });
  const body = g({},
    el('rect', { x: 0, y: 0, width: CARD_W, height: CARD_H, fill: C.card, class: 'px' }),
    ...bars,
    el('rect', { x: 11, y: 7, width: 5, height: 5, fill: C.ongoing, class: 'px' }),
    s.text(ws, { x: 20, y: 13, font: 'mono', size: ws.length > 10 ? 8 : 9, fill: C.dim }),
    s.text(title, { x: 11, y: 27, font: 'semi', size: 11, fill: C.text }),
    tag
      ? s.text(tag, { x: 11, y: 39, font: 'mono', size: 9, fill: C.cron })
      : s.text(agent, { x: 11, y: 39, font: 'mono', size: 9, fill: colour(agent) }));

  const keys = [];
  moves.forEach(([t, col, slot], k) => {
    const at = { x: colX(Math.max(col, 0)) + 5, y: slotY(slot) };
    if (col < 0) { keys.push([t, { ...at, opacity: 0 }]); return; }
    if (k === 0) { keys.push([t, { ...at, opacity: 1 }]); return; }
    if (moves[k - 1][1] < 0) {
      // A run is born on its template and slides out of Scheduled; a task an
      // event hands over drops in from above instead.
      const from = CARDS.find((c) => c.tag && c.title === title);
      const start = from ? { x: colX(0) + 5, y: slotY(from.moves.at(-1)[2]) } : { ...at, y: at.y - 20 };
      keys.push([t, { ...start, opacity: from ? 1 : 0 }, 'step'], [t + 0.5, { ...at, opacity: 1 }, 'inOut']);
      return;
    }
    keys.push([t - 0.01, {}], [t + 0.45, at, 'inOut']);
  });
  if (moves.length > 1) {
    if (moves[0][1] >= 0) {
      // A card on the board from the start comes back for the next loop.
      keys.push([RESET, { opacity: 1 }], [RESET + 0.3, { opacity: 0 }], [23.4, { ...{ x: colX(moves[0][1]) + 5, y: slotY(moves[0][2]) }, opacity: 0 }, 'step'], [23.9, { opacity: 1 }]);
    } else keys.push([RESET, { opacity: 1 }], [RESET + 0.3, { opacity: 0 }]);
  }
  s.add(s.anim(body, keys));
}

function panel(s) {
  s.add(box(PX0, BY + 44, PW, 220));
  const head = (t) => s.text(t, { x: PX0 + 12, y: BY + 66, font: 'pixel', size: 16, fill: C.dim });
  const line = (txt, k, fill = C.dim, y0 = BY + 92, size = 12) => s.text(txt, { x: PX0 + 12, y: y0 + k * 20, font: 'mono', size, fill });
  const field = (x, y, w, txt, fill = C.text) => g({}, box(x, y, w, 22, C.card, C.line), s.text(txt, { x: x + 8, y: y + 15, font: 'mono', size: 11, fill }));
  const label = (txt, x, y) => s.text(txt, { x, y, font: 'semi', size: 9, fill: C.notstarted });

  // 01: the template is due at 09:00 and spawns a run.
  const px = PX0 + 12;
  beat(s, 0, [
    head('scheduled'),
    s.text('Nightly dependency audit', { x: px, y: BY + 92, font: 'semi', size: 12, fill: C.text }),
    label('FREQUENCY', px, BY + 114),
    label('TIME', px + 112, BY + 114),
    field(px, BY + 120, 104, 'Daily'),
    field(px + 112, BY + 120, 90, '09:00'),
    field(px, BY + 150, 104, '0 9 * * *', C.cron),
    appear(s, g({}, line('09:00', 4.6, C.cron), s.text('-> new run', { x: PX0 + 62, y: BY + 92 + 4.6 * 20, font: 'mono', size: 12, fill: C.cron })), NINE),
    appear(s, g({}, line('claude', 5.6, colour('claude')), s.text('-> ongoing', { x: PX0 + 70, y: BY + 92 + 5.6 * 20, font: 'mono', size: 12, fill: C.ongoing })), TAKE),
    appear(s, line('template stays for', 6.8, C.notstarted, BY + 92, 11), TAKE + 0.4),
    appear(s, line('tomorrow', 7.6, C.notstarted, BY + 92, 11), TAKE + 0.4),
  ]);

  // 02: claude loads its context, then calls a tool through Mesher.
  beat(s, 1, [
    head('context'),
    appear(s, g({},
      line('memory load', 0, colour('claude')),
      box(PX0 + 12, BY + 98, PW - 24, 40, C.card, C.line),
      s.text('memory.md', { x: PX0 + 20, y: BY + 114, font: 'mono', size: 11, fill: C.text }),
      s.text('- run tests after a fix', { x: PX0 + 20, y: BY + 130, font: 'mono', size: 10, fill: C.dim })), MEMORY),
    appear(s, g({},
      line('skills load', 3.0, colour('claude')),
      s.text('skill://dep-audit/SKILL.md', { x: PX0 + 12, y: BY + 92 + 3.85 * 20, font: 'mono', size: 10, fill: C.lit })), SKILL),
    appear(s, g({},
      box(PX0 + 12, BY + 182, PW - 24, 22, '#0c2a30', '#155e75'),
      s.text('callTool', { x: PX0 + 20, y: BY + 197, font: 'mono', size: 10, fill: C.cron }),
      s.text('github.tools listAlerts', { x: PX0 + 72, y: BY + 197, font: 'mono', size: 10, fill: C.text })), TOOL),
    appear(s, g({},
      s.text('alerts[2]{pkg,sev}:', { x: PX0 + 12, y: BY + 222, font: 'mono', size: 10, fill: C.dim }),
      s.text('lodash,high  axios,low', { x: PX0 + 20, y: BY + 238, font: 'mono', size: 10, fill: C.text })), RESULT),
  ]);

  // 03: claude wants to run a risky command; the request waits for you.
  const bx = PX0 + 8;
  const bw = PW - 16;
  const by = BY + 52;
  beat(s, 2, [
    appear(s, g({},
      box(bx, by, bw, 204, C.panel, C.line),
      el('rect', { x: bx + 10, y: by + 12, width: 8, height: 8, fill: C.ask, class: 'px' }),
      s.text('Authorization Required', { x: bx + 24, y: by + 20, font: 'semi', size: 11, fill: C.text }),
      s.text('Nightly audit - claude', { x: bx + 10, y: by + 42, font: 'mono', size: 10, fill: colour('claude') }),
      s.text('ACTION', { x: bx + 10, y: by + 64, font: 'semi', size: 9, fill: C.notstarted }),
      box(bx + 10, by + 70, bw - 20, 20, C.column),
      s.text('Bash', { x: bx + 16, y: by + 84, font: 'mono', size: 11, fill: C.text }),
      box(bx + 10, by + 96, bw - 20, 38, C.column),
      s.text('npm audit fix --force', { x: bx + 16, y: by + 119, font: 'mono', size: 10, fill: C.dim })), ASK),
    appear(s, g({},
      el('rect', { x: bx + 10, y: by + 146, width: 66, height: 22, fill: C.text, class: 'px' }),
      s.text('Allow Once', { x: bx + 43, y: by + 161, font: 'semi', size: 10, fill: C.ink, anchor: 'middle' }),
      box(bx + 80, by + 146, 72, 22, C.card, C.line),
      s.text('Always Allow', { x: bx + 116, y: by + 161, font: 'semi', size: 10, fill: C.text, anchor: 'middle' }),
      box(bx + 156, by + 146, 44, 22, C.card, C.line),
      s.text('Deny', { x: bx + 178, y: by + 161, font: 'semi', size: 10, fill: C.blocked, anchor: 'middle' })), ASK + 0.3, ALLOW + 0.1),
    appear(s, el('rect', { x: bx + 10, y: by + 146, width: 66, height: 22, fill: C.ongoing, opacity: 0.8, class: 'px' }), ALLOW - 0.15, ALLOW + 0.1),
    appear(s, g({},
      el('rect', { x: bx + 10, y: by + 150, width: 8, height: 8, fill: C.ongoing, class: 'px' }),
      s.text('Bash  allowed once', { x: bx + 24, y: by + 158, font: 'mono', size: 11, fill: C.lit })), ALLOW + 0.1),
    appear(s, s.text('48 tests pass', { x: bx + 10, y: by + 190, font: 'mono', size: 12, fill: C.lit }), ALLOW + 1.2),
  ]);

  // 04: done. claude saves a memory and fires audit_finished, which hands
  // release-notes its task. Event nodes in violet, workspace nodes in grey.
  const node = (x, y, w, txt, event) => g({},
    box(x, y, w, 26, event ? EV.bg : C.card, event ? EV.line : C.line),
    s.text(txt, { x: x + 8, y: y + 17, font: event ? 'mono' : 'semi', size: 11, fill: event ? EV.text : C.text }));
  const edge = (x0, y0, x1, y1) => g({},
    el('rect', { x: x0, y: y0, width: 2, height: (y1 - y0) / 2, fill: C.line, class: 'px' }),
    el('rect', { x: Math.min(x0, x1), y: y0 + (y1 - y0) / 2, width: Math.abs(x1 - x0) + 2, height: 2, fill: C.line, class: 'px' }),
    el('rect', { x: x1, y: y0 + (y1 - y0) / 2, width: 2, height: (y1 - y0) / 2, fill: C.line, class: 'px' }));
  beat(s, 3, [
    head('hand-off'),
    appear(s, g({},
      s.text('memory save', { x: PX0 + 12, y: BY + 90, font: 'mono', size: 11, fill: colour('claude') }),
      s.text('+ lodash: pin 4.17.21', { x: PX0 + 12, y: BY + 106, font: 'mono', size: 10, fill: C.lit })), AUDIT_DONE),
    node(PX0 + 12, BY + 118, 96, 'api', false),
    edge(PX0 + 50, BY + 144, PX0 + 90, BY + 160),
    node(PX0 + 40, BY + 160, 128, 'audit_finished', true),
    edge(PX0 + 90, BY + 186, PX0 + 50, BY + 202),
    node(PX0 + 12, BY + 202, 120, 'release-notes', false),
    appear(s, el('rect', { x: PX0 + 40, y: BY + 160, width: 128, height: 26, fill: 'none', stroke: EV.lit, 'stroke-width': 2, class: 'px' }), FIRE, FIRE + 0.8),
    appear(s, el('rect', { x: PX0 + 12, y: BY + 202, width: 120, height: 26, fill: 'none', stroke: C.ongoing, 'stroke-width': 2, class: 'px' }), PUBLISH, PUBLISH + 0.8),
    appear(s, s.text('codex', { x: PX0 + 140, y: BY + 219, font: 'mono', size: 11, fill: colour('codex') }), CODEX),
    appear(s, s.text('notes done', { x: PX0 + 12, y: BY + 250, font: 'mono', size: 11, fill: C.lit }), NOTES_DONE),
  ]);
}

function plan() {
  const a = ACTS;
  a.claude.alert.push([NINE + 0.3, TAKE]);
  a.claude.hops.push([TAKE, 14]);
  a.claude.work.push([TAKE + 0.2, ASK]);
  a.claude.ask.push([ASK, ALLOW + 0.1]);
  a.claude.hops.push([ALLOW + 0.1, 14]);
  a.claude.work.push([ALLOW + 0.3, AUDIT_DONE]);
  a.claude.done.push([AUDIT_DONE, RESET]);

  a.hermes.work.push([0, 10.2]);
  a.hermes.done.push([10.2, 12.0], [NOTES_DONE, RESET]);

  a.codex.say.push(['zZ', [[0, PUBLISH]]]);
  a.codex.alert.push([PUBLISH + 0.1, CODEX]);
  a.codex.hops.push([CODEX, 14]);
  a.codex.work.push([CODEX + 0.2, NOTES_DONE]);
  a.codex.done.push([NOTES_DONE, RESET]);

  a.agy.say.push(['zZ', [[0, DANCE]]]);
  a.agy.done.push([NOTES_DONE, RESET]);
  a.openclaw.say.push(['zZ', [[0, DANCE]]]);
  a.openclaw.done.push([NOTES_DONE, RESET]);
}

// You: one click on Allow Once.
function pointer(s) {
  const allow = { x: PX0 + 8 + 43, y: BY + 52 + 157 };
  cursor(s, [
    [0, OFF],
    [ALLOW - 1.3, OFF],
    [ALLOW - 0.4, allow, 'inOut'],
    ...press(ALLOW, allow),
    [ALLOW + 0.5, allow],
    [ALLOW + 1.2, OFF, 'inOut'],
  ]);
}
