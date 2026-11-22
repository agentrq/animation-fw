// One source of definitions that people and agents both read: Ada writes a
// Glossary doc on the Pano; agents in the api, web and research workspaces
// and her teammate Ben read it. Ada changes a definition, codex tries to
// save on top of the version it read and is refused, reads the new one,
// merges its line and saves, and everyone ends on the same version.
import { sprite, el, g } from '../src/index.js';
import {
  C, PX, GROUND, newScene, sky, ground, intro, frame, mascot, mascotByName, during,
} from '../kit/agentrq.js';

// The app's post-it colours (as in scenes/pano.js).
const YELLOW = { paper: '#fffbeb', tape: '#fef08a', title: '#713f12', body: '#542d0c', muted: '#854d0e', ink: '#b15f00' };
const PINK = { paper: '#fdf2f8', tape: '#fbcfe8', title: '#9d174d', body: '#831843', muted: '#be185d', ink: '#db2777' };
const GREEN = { paper: '#f0fdf4', tape: '#bbf7d0', title: '#166534', body: '#14532d', muted: '#15803d', ink: '#16a34a' };
const DOTS = ['#facc15', '#f472b6', '#86efac', '#93c5fd'];
const RED = '#ef4444';

// A person in pixels, drawn as a mascot so idle, blink, hops and bubbles
// work for people too (the same sprite as scenes/teams.js).
const PERSON = `
  ...hhhh...
  ..hhhhhh..
  ..hffffh..
  ..f#ff#f..
  ..ffffff..
  ...ffff...
  ..ssssss..
  .ssssssss.
  f.ssssss.f
  ..ssssss..
  ..ll..ll..
  ..ll..ll..`;
const person = (name, color, hair, skin) => ({
  name, color, art: PERSON,
  palette: { h: hair, f: skin, '#': '#1c1917', s: color, l: '#3f3f46' },
  eyes: [[3, 3, 1, 1], [6, 3, 1, 1]], skin,
});

// Who reads the Glossary: two people and three agents, each agent in its
// own workspace (shown after the slash).
const ADA = { key: 'ada', m: person('ada', '#f472b6', '#7c2d12', '#fdba74'), x: 486, i: 0 };
const BEN = { key: 'ben', m: person('ben', '#38bdf8', '#1c1917', '#d6a77a'), x: 1124, i: 4 };
const agentOf = (name, ws, x, i) => ({ key: name, m: { ...mascotByName(name), name: `${name}/${ws}` }, x, i });
const CLAUDE = agentOf('claude', 'api', 612, 1);
const CODEX = agentOf('codex', 'web', 772, 2);
const AGY = agentOf('agy', 'research', 952, 3);
// The order the first read reaches them.
const READERS = [CLAUDE, CODEX, AGY, BEN];
// The order the final version reaches everyone but codex.
const SYNCED = [ADA, CLAUDE, AGY, BEN];

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const POST = 1;                                   // ada's Glossary lands
const LINE = (k) => POST + 0.4 + 0.3 * k;         // its definitions appear
const FLY = (j) => 3.4 + 0.45 * j;                // v1 leaves the doc for reader j
const LAND = (j) => FLY(j) + 0.9;
const LOOK = 1;                                   // reading, after landing
const EDIT = 8.2;                                 // ada: 30 days -> 28 days, v2
const SAVE1 = 10.4;                               // codex saves on top of v1
const CONFLICT = SAVE1 + 0.8;                     // refused
const REREAD = 12.4;                              // codex reads v2
const GOT = REREAD + 0.8;
const SAVE2 = 14.6;                               // codex saves on v2
const OK = SAVE2 + 0.8;                           // saved: v3
const SYNC = (j) => OK + 0.5 + 0.3 * j;           // v3 leaves for SYNCED[j]
const SYNCED_AT = (j) => SYNC(j) + 0.9;
const DANCE = 18.8;
const RESET = 22.6;

// ---------------------------------------------------------------- the board
const BX = 440;
const BY = 20;
const BW = 740;
const BH = 272;
const CY = BY + 62;
const CH = 196;

const NEW = { x: BX + 16, w: 112 };
const DOC = { x: NEW.x + NEW.w + 16, w: 276 };
const API = { x: DOC.x + DOC.w + 16, w: 148 };
const HAND = { x: API.x + API.w + 16, w: 140 };

// The definitions, one per line, and the line codex adds.
const DEFS = [
  ['active', 'paid in the last 30 days'],
  ['churned', 'no login in 90 days'],
  ['trial', 'the first 14 days'],
];
const ADDED = ['MRR', 'sum of active plans'];
const defY = (k) => 64 + k * 26;

const EYES = `
  ##..##
  ##..##
  ##..##`;

export default function sharedDefinitions() {
  const s = newScene({
    poster: 18.4,
    description: 'One source of definitions for people and agents, on the AgentRQ Pano: Ada writes a Glossary doc, and claude in the api workspace, codex in web, agy in research and her teammate Ben all read version 1. Ada changes "active" from 30 to 28 days, making version 2; codex, still on version 1, tries to save and is refused, reads version 2, merges its own line and saves version 3, which reaches every person and agent.',
  });

  sky(s);
  ground(s);
  story(s);
  screen(s);
  newNote(s);
  others(s);
  glossary(s);
  flights(s);
  people(s);
  agents(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'one source',
    headline: ['One definition,', 'read by all.'],
    sub: 'People and agents read the same doc.',
    steps: [['write', POST - 0.4, FLY(0)], ['read', FLY(0), EDIT - 0.6], ['change', EDIT - 0.6, OK], ['sync', OK, RESET]],
    log: [
      [0, POST - 0.4, '> ada writing Glossary_'],
      [POST - 0.4, FLY(0), '> ada posted Glossary: v1'],
      [FLY(0), EDIT - 0.6, '> 3 agents and ben read v1'],
      [EDIT - 0.6, SAVE1, '> ada: 30 days -> 28, now v2'],
      [SAVE1, CONFLICT, '> codex saves on top of v1'],
      [CONFLICT, REREAD, '> refused: v1 is out of date', RED],
      [REREAD, OK, '> codex reads v2, adds MRR'],
      [OK, SYNCED_AT(3), '> codex saved v3', C.lit],
      [SYNCED_AT(3), RESET, '> 2 people, 3 agents: all v3', C.lit],
    ],
  });
}

// The Pano window: its title and the colour filter pills.
function screen(s) {
  frame(s, { x: BX, y: BY, w: BW, h: BH, title: 'Pano' });
  const px = BX + 72;
  s.add(
    el('rect', { x: px, y: BY + 12, width: 34, height: 18, fill: '#d97706', class: 'px' }),
    s.text('All', { x: px + 17, y: BY + 25, font: 'semi', size: 11, fill: C.text, anchor: 'middle' }),
    ...DOTS.map((fill, c) => el('rect', { x: px + 44 + c * 18, y: BY + 16, width: 10, height: 10, fill, class: 'px' })),
    el('rect', { x: BX + 2, y: BY + 40, width: BW - 4, height: 1, fill: C.line, class: 'px' }),
  );
}

// The first card on the board: New note, with a dot per colour.
function newNote(s) {
  const { x, w } = NEW;
  const mid = x + w / 2;
  s.add(
    el('rect', { x, y: CY, width: w, height: CH, fill: C.column, stroke: '#3f3f46', 'stroke-width': 1, 'stroke-dasharray': '4 4', class: 'px' }),
    el('rect', { x: mid - 18, y: CY + 50, width: 36, height: 36, fill: '#ffdcb5', class: 'px' }),
    el('rect', { x: mid - 2, y: CY + 58, width: 4, height: 20, fill: '#7a3d06', class: 'px' }),
    el('rect', { x: mid - 10, y: CY + 66, width: 20, height: 4, fill: '#7a3d06', class: 'px' }),
    s.text('New note', { x: mid, y: CY + 112, font: 'bold', size: 14, fill: C.text, anchor: 'middle' }),
    el('rect', { x: mid - 36, y: CY + 143, width: 78, height: 14, fill: '#27272a', class: 'px' }),
    ...DOTS.map((fill, c) => el('rect', { x: mid - 31 + c * 18, y: CY + 145, width: 10, height: 10, fill, class: 'px' })),
  );
}

// A post-it's paper, tape, title and footer, drawn at the origin.
function paper(s, { w, color, title, author, when = 'now' }) {
  return [
    el('rect', { x: 3, y: 3, width: w, height: CH, fill: '#000', opacity: 0.35, class: 'px' }),
    el('rect', { width: w, height: CH, fill: color.paper, class: 'px' }),
    el('rect', { x: w / 2 - 28, y: -6, width: 56, height: 12, fill: color.tape, opacity: 0.9, class: 'px' }),
    s.text(title, { x: 14, y: 32, font: 'bold', size: 16, fill: color.title }),
    el('rect', { x: 0, y: CH - 32, width: w, height: 1, fill: color.title, opacity: 0.15, class: 'px' }),
    el('rect', { x: 14, y: CH - 24, width: 16, height: 16, fill: color.ink, class: 'px' }),
    s.text(author[0].toUpperCase(), { x: 22, y: CH - 12, font: 'bold', size: 10, fill: '#fff', anchor: 'middle' }),
    s.text(`${author} · ${when}`, { x: 38, y: CH - 12, font: 'semi', size: 11, fill: color.muted }),
  ];
}

const bar = (x, y, w, color) => el('rect', { x, y, width: w, height: 4, fill: color.body, opacity: 0.28, class: 'px' });

// Two docs already on the board.
function others(s) {
  s.add(g({ transform: `translate(${API.x} ${CY})` },
    ...paper(s, { w: API.w, color: PINK, title: 'API contract', author: 'api', when: '2h' }),
    bar(14, 46, 110, PINK), bar(14, 58, 84, PINK), bar(14, 78, 116, PINK), bar(14, 90, 70, PINK), bar(14, 110, 96, PINK)));
  s.add(g({ transform: `translate(${HAND.x} ${CY})` },
    ...paper(s, { w: HAND.w, color: GREEN, title: 'Hand-off', author: 'web', when: '1d' }),
    bar(14, 46, 100, GREEN), bar(14, 58, 112, GREEN), bar(14, 78, 64, GREEN), bar(14, 90, 90, GREEN)));
}

// One definition line: the term in bold, its meaning after it.
function def(s, [term, meaning], y, color) {
  return g({},
    s.text(`${term}:`, { x: 14, y, font: 'bold', size: 13, fill: color.title }),
    s.text(meaning, { x: 88, y, font: 'semi', size: 13, fill: color.body }));
}

// The Glossary: ada's three definitions; the first changes from 30 to 28
// days, and codex's line joins once its save goes through. Its border goes
// red when codex's stale save is refused, and green when the good one lands.
function glossary(s) {
  const { x, w } = DOC;
  const c = YELLOW;
  const parts = [...paper(s, { w, color: c, title: 'Glossary', author: 'ada' })];
  // Line 0: 30 days, then 28 days, with a highlight while ada edits.
  parts.push(during(s, el('rect', { x: 8, y: defY(0) - 15, width: w - 16, height: 21, fill: '#fde68a', class: 'px' }), [[EDIT - 0.5, EDIT + 0.7]]));
  parts.push(during(s, def(s, DEFS[0], defY(0), c), [[LINE(0), EDIT]]));
  parts.push(during(s, def(s, ['active', 'paid in the last 28 days'], defY(0), c), [[EDIT, 24]]));
  DEFS.slice(1).forEach((d, k) => parts.push(during(s, def(s, d, defY(k + 1), c), [[LINE(k + 1), 24]])));
  parts.push(during(s, el('rect', { x: 8, y: defY(3) - 15, width: w - 16, height: 21, fill: '#bbf7d0', class: 'px' }), [[OK, OK + 1]]));
  parts.push(during(s, def(s, ADDED, defY(3), c), [[OK, 24]]));

  parts.push(during(s, el('rect', { width: w, height: CH, fill: 'none', stroke: RED, 'stroke-width': 4, class: 'px' }), [[CONFLICT, CONFLICT + 0.9]]));
  parts.push(during(s, el('rect', { width: w, height: CH, fill: 'none', stroke: C.lit, 'stroke-width': 3, class: 'px' }),
    [[FLY(0), LAND(3)], [GOT - 0.8, GOT], [OK, SYNCED_AT(3)]]));

  s.add(s.anim(g({}, parts), [
    [0, { x, y: CY - 16, opacity: 0 }],
    [POST, { opacity: 0 }, 'step'],
    [POST + 0.35, { y: CY, opacity: 1 }, 'back'],
    [RESET, { opacity: 1 }],
    [RESET + 0.5, { opacity: 0 }],
  ]));
}

// Where a reader's bubble sits, as the kit places it.
function bubbleAt({ m, x }) {
  const rows = m.art.split('\n').map((l) => l.trim()).filter(Boolean);
  const width = Math.max(...rows.map((r) => r.length)) * PX;
  const top = GROUND - rows.length * PX - (m.float ? 12 : 0);
  return { x: x + width / 2 - 6, y: top - 34 };
}

// A version tag: v1, v2 or v3 on the doc's tape colour, red when refused.
function vtag(s, label, fill = YELLOW.tape, ink = YELLOW.title) {
  return g({},
    el('rect', { width: 34, height: 20, fill, class: 'px' }),
    s.text(label, { x: 17, y: 14, font: 'mono', size: 12, fill: ink, anchor: 'middle' }));
}

function fly(s, node, start, end, from, to) {
  const lift = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - 24 };
  s.add(s.anim(node, [
    [0, { ...start, opacity: 0 }],
    [from, { opacity: 1 }, 'step'],
    [(from + to) / 2, lift, 'out'],
    [to, end, 'in'],
    [to + 0.05, { opacity: 0 }, 'step'],
  ]));
}

// v1 out to every reader; codex's two saves in and the v2 it re-reads out;
// then v3 out to everyone else.
function flights(s) {
  const doc = { x: DOC.x + DOC.w / 2 - 17, y: CY + CH - 10 };
  READERS.forEach((r, j) => fly(s, vtag(s, 'v1'), doc, bubbleAt(r), FLY(j), LAND(j)));
  fly(s, vtag(s, 'v1', RED, '#fff'), bubbleAt(CODEX), doc, SAVE1, CONFLICT);
  fly(s, vtag(s, 'v2'), doc, bubbleAt(CODEX), REREAD, GOT);
  fly(s, vtag(s, 'v2', C.lit, C.ink), bubbleAt(CODEX), doc, SAVE2, OK);
  SYNCED.forEach((r, j) => fly(s, vtag(s, 'v3'), doc, bubbleAt(r), SYNC(j), SYNCED_AT(j)));
}

const eyes = () => sprite(EYES, { '#': C.ink }, { px: 3, x: 8, y: 7 });
const dance = (i) => [[DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]];

// Ada writes the doc, holds v1, edits it to v2, and ends on v3. Ben reads
// v1 on the board and ends on v3.
function people(s) {
  mascot(s, ADA.m, ADA.i, {
    x: ADA.x,
    hops: [[POST, 14], [EDIT, 12], [SYNCED_AT(0), 14], ...dance(0)],
    work: [[0.2, POST], [EDIT - 0.6, EDIT + 0.4]],
    say: [
      ['v1', [[POST + 0.4, EDIT - 0.6]], YELLOW.tape],
      ['v2', [[EDIT + 0.4, SYNCED_AT(0)]], YELLOW.tape],
      ['v3', [[SYNCED_AT(0), RESET]], C.lit],
    ],
  });
  reader(s, BEN, 3, 3);
}

// A reader that only reads: v1 on arrival, then v3.
function reader(s, r, j, k) {
  mascot(s, r.m, r.i, {
    x: r.x,
    hops: [[LAND(j), 10], [SYNCED_AT(k), 14], ...dance(r.i)],
    say: [
      [eyes(), [[LAND(j), LAND(j) + LOOK]]],
      ['v1', [[LAND(j) + LOOK, SYNCED_AT(k)]], YELLOW.tape],
      ['v3', [[SYNCED_AT(k), RESET]], C.lit],
    ],
  });
}

// claude and agy read and end on v3; codex reads v1, works, is refused,
// reads v2, saves v3.
function agents(s) {
  reader(s, CLAUDE, 0, 1);
  reader(s, AGY, 2, 2);
  mascot(s, CODEX.m, CODEX.i, {
    x: CODEX.x,
    hops: [[LAND(1), 10], [CONFLICT, 18], [GOT, 10], [OK, 22], ...dance(CODEX.i)],
    work: [[LAND(1) + LOOK + 2, SAVE1], [GOT + 0.6, SAVE2]],
    alert: [[CONFLICT, REREAD]],
    say: [
      [eyes(), [[LAND(1), LAND(1) + LOOK], [GOT, GOT + 0.6]]],
      ['v1', [[LAND(1) + LOOK, LAND(1) + LOOK + 2]], YELLOW.tape],
      ['v3', [[OK, RESET]], C.lit],
    ],
  });
}
