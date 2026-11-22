// AgentRQ workspace memory: claude loads MEMORY.md at the start of a task,
// reads the memory it links to, learns something new and saves it. The next
// day codex, in a fork of the workspace that shares its memory, reads the
// note and gets it right first time. Then both save tests.md at once: the
// second save is refused because the version changed, and codex loads it
// again, merges its line and saves version 3.
import { el, g } from '../src/index.js';
import {
  C, newScene, sky, ground, intro, frame, mascot, mascotByName, during,
} from '../kit/agentrq.js';

const CLAUDE = mascotByName('claude');
const CODEX = mascotByName('codex');
const RED = '#ef4444';
const LINK = '#93c5fd';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const B = [[0.2, 5.4], [5.6, 11.0], [11.2, 16.0], [16.2, 22.6]]; // the four beats
const LOAD = 1.4;          // claude: memory load
const READ = 3.0;          // claude opens build.md
const FAIL = 5.9;          // tests fail
const FIX = 7.2;           // TZ=UTC fixes them
const SAVE = 8.6;          // claude saves tests.md
const INDEX = 9.6;         // and links it from MEMORY.md
const DONE1 = 10.4;
const NEXT = 11.4;         // next day: codex in the fork
const CLOAD = 12.6;        // codex: memory load
const CREAD = 13.6;        // codex reads tests.md
const CPASS = 14.6;        // first try
const SAVE_A = 16.6;       // claude saves tests.md on v1: v2
const SAVE_B = 17.3;       // codex saves on v1: refused
const RELOAD = 18.4;       // codex loads v2
const MERGE = 19.4;        // codex saves on v2: v3
const DANCE = 20.4;
const RESET = 22.6;

// ---------------------------------------------------------------- the stage
const MX = 440;            // Workspace Memory panel
const MW = 356;
const TX = MX + MW + 16;   // the task's tool calls
const TW = 1180 - TX;
const Y = 20;
const PH = 272;
const ROW_Y = Y + 66;
const ROW_H = 28;

export default function agentMemory() {
  const s = newScene({
    poster: 20.0,
    description: "AgentRQ workspace memory: claude starts a task in storefront-api by loading MEMORY.md, reads the build note it links to, then learns tests need TZ=UTC and saves that as a memory the index now links. The next day codex, in a fork that shares the workspace's memory, loads the index, reads the note and passes the tests first time. When both agents save tests.md at once, codex's save is refused because the version changed, so it loads it again, merges its line and saves version 3, and the agents celebrate.",
  });
  sky(s);
  ground(s);
  story(s);
  memoryPanel(s);
  callsPanel(s);
  agents(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'memory',
    headline: ['Learned once.', 'Known by all.'],
    sub: 'MEMORY.md is read first, by every agent.',
    steps: [['load', B[0][0], B[1][0]], ['save', B[1][0], B[2][0]], ['reuse', B[2][0], B[3][0]], ['merge', B[3][0], DANCE]],
    log: [
      [0, LOAD, '> new task in storefront-api'],
      [LOAD, READ, '> claude: memory load MEMORY.md'],
      [READ, FAIL, '> build.md: --legacy-peer-deps'],
      [FAIL, FIX, '> npm test: 3 failed', RED],
      [FIX, SAVE, '> TZ=UTC fixes the tests'],
      [SAVE, NEXT, '> claude saved tests.md', C.lit],
      [NEXT, CREAD, '> next day: codex, in the fork'],
      [CREAD, B[3][0], '> codex reads tests.md first', C.lit],
      [B[3][0], SAVE_B, '> both save tests.md on v1'],
      [SAVE_B, RELOAD, '> refused: changed since v1', RED],
      [RELOAD, MERGE, '> codex loads v2, merges'],
      [MERGE, RESET, '> saved v3: nothing lost', C.lit],
    ],
  });
}

// A memory line as the app renders MEMORY.md: a link, then what it says.
function indexLine(s, y, name, note, fill = C.dim) {
  const w = name.length * 7.2;
  return g({},
    s.text('•', { x: MX + 18, y, font: 'mono', size: 12, fill: C.dim }),
    s.text(name, { x: MX + 30, y, font: 'mono', size: 12, fill: LINK }),
    el('rect', { x: MX + 30, y: y + 3, width: w, height: 1, fill: LINK, opacity: 0.6 }),
    s.text(note, { x: MX + 136, y, font: 'mono', size: 12, fill }));
}

// The Workspace Memory tab: MEMORY.md for three beats, tests.md in the last.
function memoryPanel(s) {
  s.add(el('rect', { x: MX, y: Y, width: MW, height: PH, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }));
  s.add(s.text('WORKSPACE MEMORY', { x: MX + 16, y: Y + 24, font: 'semi', size: 11, fill: '#71717a', spacing: 1.5 }));

  // Which workspace is reading: storefront-api, then its fork.
  const ws = { x: MX + MW - 16, y: Y + 24, font: 'mono', size: 11, anchor: 'end' };
  s.add(during(s, s.text('storefront-api', { ...ws, fill: C.dim }), [[0, NEXT], [B[3][0], 24]]));
  s.add(during(s, s.text('storefront-api-fork', { ...ws, fill: C.cron }), [[NEXT, B[3][0]]]));
  s.add(during(s, g({},
    el('rect', { x: MX + 16, y: Y + 238, width: MW - 32, height: 22, fill: C.column, stroke: '#3f3f46', 'stroke-width': 1, class: 'px' }),
    s.text("shares storefront-api's memory", { x: MX + 26, y: Y + 253, font: 'mono', size: 11, fill: C.cron }),
  ), [[NEXT, B[3][0]]]));

  // MEMORY.md, the index.
  const idx = [];
  idx.push(s.text('MEMORY.md', { x: MX + 16, y: Y + 54, font: 'mono', size: 12, fill: C.text }));
  idx.push(s.text('Raw', { x: MX + MW - 16, y: Y + 54, font: 'semi', size: 10, fill: '#71717a', anchor: 'end' }));
  idx.push(el('rect', { x: MX + 16, y: Y + 64, width: MW - 32, height: 1, fill: C.line }));
  idx.push(s.text('# storefront-api', { x: MX + 16, y: Y + 88, font: 'mono', size: 12, fill: C.text }));
  const L = (k) => Y + 114 + k * 26;
  const lines = [
    ['build.md', 'needs --legacy-peer-deps'],
    ['db.md', 'migrate with make migrate'],
    ['api-style.md', 'errors as RFC 7807'],
  ];
  lines.forEach(([n, t], k) => idx.push(indexLine(s, L(k), n, t)));
  // The line claude adds, flashing green as it lands.
  idx.push(during(s, indexLine(s, L(3), 'tests.md', 'run with TZ=UTC', C.lit), [[INDEX, INDEX + 1.2]]));
  idx.push(during(s, indexLine(s, L(3), 'tests.md', 'run with TZ=UTC'), [[INDEX + 1.2, B[3][0]]]));
  // Highlights: the memory each agent opens.
  const hi = (k) => el('rect', { x: MX + 12, y: L(k) - 15, width: MW - 24, height: 22, fill: 'none', stroke: C.lit, 'stroke-width': 2, class: 'px' });
  idx.push(during(s, hi(0), [[READ, READ + 1.4]]));
  idx.push(during(s, hi(3), [[CREAD, CREAD + 1.4]]));
  idx.push(during(s, el('rect', { x: MX + 12, y: L(3) - 15, width: MW - 24, height: 22, fill: C.ongoing, opacity: 0.12, class: 'px' }), [[INDEX, INDEX + 1.2]]));
  // Version chip.
  const ver = { x: MX + 92, y: Y + 54, font: 'mono', size: 11 };
  idx.push(during(s, s.text('v1', { ...ver, fill: '#71717a' }), [[0, INDEX]]));
  idx.push(during(s, s.text('v2', { ...ver, fill: C.lit }), [[INDEX, B[3][0]]]));
  s.add(during(s, g({}, idx), [[0, B[3][0]]]));

  // tests.md, opened from the index, in the last beat.
  const tm = [];
  tm.push(s.text('← BACK', { x: MX + 16, y: Y + 54, font: 'semi', size: 10, fill: '#71717a' }));
  tm.push(s.text('tests.md', { x: MX + 70, y: Y + 54, font: 'mono', size: 12, fill: C.text }));
  tm.push(s.text('Raw', { x: MX + MW - 16, y: Y + 54, font: 'semi', size: 10, fill: '#71717a', anchor: 'end' }));
  tm.push(el('rect', { x: MX + 16, y: Y + 64, width: MW - 32, height: 1, fill: C.line }));
  const tv = { x: MX + 140, y: Y + 54, font: 'mono', size: 11 };
  tm.push(during(s, s.text('v1', { ...tv, fill: '#71717a' }), [[B[3][0], SAVE_A + 0.4]]));
  tm.push(during(s, s.text('v2', { ...tv, fill: C.lit }), [[SAVE_A + 0.4, MERGE + 0.4]]));
  tm.push(during(s, s.text('v3', { ...tv, fill: C.lit }), [[MERGE + 0.4, RESET]]));
  tm.push(s.text('# Tests', { x: MX + 16, y: Y + 88, font: 'mono', size: 12, fill: C.text }));
  const T = (k) => Y + 114 + k * 26;
  const tline = (k, text, spans, fill = C.dim) => tm.push(during(s, s.text(text, { x: MX + 18, y: T(k), font: 'mono', size: 12, fill }), spans));
  tline(0, '- run with TZ=UTC npm test', [[B[3][0], RESET]]);
  tline(1, '- seed first: make seed', [[SAVE_A + 0.4, SAVE_A + 1.4]], C.lit);
  tline(1, '- seed first: make seed', [[SAVE_A + 1.4, RESET]]);
  tline(2, '- mock Stripe with stripe-mock', [[MERGE + 0.4, MERGE + 1.4]], C.lit);
  tline(2, '- mock Stripe with stripe-mock', [[MERGE + 1.4, RESET]]);
  tm.push(during(s, s.text('claude', { x: MX + MW - 16, y: T(1), font: 'mono', size: 10, fill: CLAUDE.color, anchor: 'end' }), [[SAVE_A + 0.4, RESET]]));
  tm.push(during(s, s.text('codex', { x: MX + MW - 16, y: T(2), font: 'mono', size: 10, fill: CODEX.color, anchor: 'end' }), [[MERGE + 0.4, RESET]]));
  s.add(during(s, g({}, tm), [[B[3][0], RESET]]));
}

// The task's tool calls, a row each, cleared at every beat.
const BEATS = [
  {
    span: B[0], title: 'Add coupon endpoint', who: CLAUDE, rows: [
      [0.6, null, 'task assigned to claude', C.dim],
      [LOAD, CLAUDE, 'memory load', C.text, 'MEMORY.md v1'],
      [READ, CLAUDE, 'memory load build.md', C.text, 'ok'],
      [READ + 1.2, CLAUDE, 'npm ci --legacy-peer-deps', C.text, '✓', C.lit],
    ],
  },
  {
    span: B[1], title: 'Add coupon endpoint', who: CLAUDE, rows: [
      [FAIL, CLAUDE, 'npm test', C.text, '3 failed', RED],
      [FIX, CLAUDE, 'TZ=UTC npm test', C.text, '✓ passed', C.lit],
      [SAVE, CLAUDE, 'memory save tests.md', C.text, 'saved v1', C.lit],
      [INDEX, CLAUDE, 'memory save memory.md', C.text, 'saved v2', C.lit],
      [DONE1, null, 'status: completed', C.lit],
    ],
  },
  {
    span: B[2], title: 'Add gift cards', who: CODEX, day: true, rows: [
      [NEXT + 0.4, null, 'task assigned to codex', C.dim],
      [CLOAD, CODEX, 'memory load', C.text, 'MEMORY.md v2'],
      [CREAD, CODEX, 'memory load tests.md', C.text, 'ok'],
      [CPASS, CODEX, 'TZ=UTC npm test', C.text, '✓ first try', C.lit],
    ],
  },
  {
    span: B[3], title: 'Both save tests.md', rows: [
      [SAVE_A, CLAUDE, 'memory save tests.md version 1', C.text],
      [SAVE_A + 0.4, null, 'saved v2', C.lit],
      [SAVE_B, CODEX, 'memory save tests.md version 1', C.text],
      [SAVE_B + 0.4, null, 'has changed since version 1', RED],
      [RELOAD, CODEX, 'memory load tests.md', C.text, 'v2'],
      [MERGE, CODEX, 'memory save tests.md version 2', C.text],
      [MERGE + 0.4, null, 'saved v3', C.lit],
    ],
  },
];

function callsPanel(s) {
  s.add(el('rect', { x: TX, y: Y, width: TW, height: PH, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }));
  s.add(s.text('HISTORY', { x: TX + 16, y: Y + 24, font: 'semi', size: 11, fill: '#71717a', spacing: 1.5 }));
  for (const beat of BEATS) {
    const [from, to] = beat.span;
    s.add(during(s, s.text(beat.title, { x: TX + 16, y: Y + 50, font: 'semi', size: 14, fill: C.text }), [[from, to]]));
    if (beat.day) {
      s.add(during(s, g({},
        el('rect', { x: TX + TW - 92, y: Y + 10, width: 76, height: 20, fill: C.column, stroke: C.cron, 'stroke-width': 1, class: 'px' }),
        s.text('next day', { x: TX + TW - 54, y: Y + 24, font: 'mono', size: 11, fill: C.cron, anchor: 'middle' })), [[from, to]]));
      // The time codex did not spend rediscovering TZ=UTC.
      s.add(s.anim(g({},
        el('rect', { x: 0, y: 0, width: 112, height: 24, fill: C.ongoing, opacity: 0.18, class: 'px' }),
        el('rect', { x: 0, y: 0, width: 112, height: 24, fill: 'none', stroke: C.lit, 'stroke-width': 2, class: 'px' }),
        s.text('saved 20 min', { x: 56, y: 17, font: 'mono', size: 12, fill: C.lit, anchor: 'middle' })), [
        [0, { x: TX + TW - 128, y: ROW_Y + 4 * ROW_H + 10, opacity: 0, scale: 0.6 }],
        [CPASS + 0.4, { opacity: 0, scale: 0.6 }, 'step'],
        [CPASS + 0.7, { opacity: 1, scale: 1 }, 'back'],
        [to - 0.1, { opacity: 1, scale: 1 }],
        [to, { opacity: 0 }, 'step'],
      ]));
    }
    beat.rows.forEach(([t, who, text, fill, result, rfill = C.dim], k) => {
      const y = ROW_Y + k * ROW_H;
      const parts = [];
      if (who) parts.push(el('rect', { x: TX + 16, y: y - 9, width: 8, height: 8, fill: who.color, class: 'px' }));
      parts.push(s.text(text, { x: TX + (who ? 32 : 16), y, font: 'mono', size: 12, fill }));
      if (result) parts.push(s.text(result, { x: TX + TW - 16, y, font: 'mono', size: 12, fill: rfill, anchor: 'end' }));
      const node = g({}, parts);
      s.add(s.anim(node, [
        [0, { opacity: 0 }],
        [t, { opacity: 0 }, 'step'],
        [t + 0.25, { opacity: 1 }],
        [to - 0.05, { opacity: 1 }],
        [to, { opacity: 0 }, 'step'],
      ]));
    });
  }
}

function agents(s) {
  mascot(s, CLAUDE, 0, {
    x: 620,
    hops: [[0.6, 14], [INDEX, 18], [SAVE_A + 0.4, 14], [DANCE, 16], [DANCE + 0.9, 16]],
    alert: [[0.6, LOAD]],
    work: [[LOAD + 0.2, FAIL], [FIX, SAVE], [SAVE_A - 0.4, SAVE_A + 0.4]],
    ask: [[FAIL + 0.2, FIX]],
    done: [[DONE1, NEXT], [DANCE, RESET]],
    say: [['zZ', [[NEXT, B[3][0] - 0.2]]]],
    sleep: [[NEXT, B[3][0] - 0.2]],
  });
  mascot(s, CODEX, 1, {
    x: 1000,
    hops: [[NEXT + 0.4, 14], [CPASS + 0.3, 20], [MERGE + 0.4, 18], [DANCE + 0.15, 16], [DANCE + 1.05, 16]],
    alert: [[NEXT + 0.4, CLOAD], [SAVE_B + 0.4, RELOAD]],
    work: [[CLOAD + 0.2, CPASS], [RELOAD, MERGE + 0.4]],
    done: [[CPASS + 0.3, B[2][1]], [DANCE, RESET]],
    say: [['zZ', [[0, NEXT]]]],
    sleep: [[0, NEXT]],
  });
}
