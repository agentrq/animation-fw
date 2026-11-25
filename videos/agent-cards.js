// AgentRQ agent cards (A2UI), narrated, about six and three quarter minutes: what a
// card is, why it matters, then every kind on real screens of the app, captured with
// src/capture.js from a local AgentRQ where Ada works with the docs agent of
// agentrq.com. Every card on screen was sent for real over the workspace's MCP and
// drawn by the app, and every number in them is real: the blog's posts per month,
// the agentrq repo's commits, the site's own build, tests and lint, and this video's
// own voice in the audio player. Ada's clicks were real too: the Per month tab, the
// Schedule button, the form's chips, slider and Schedule. Drawn panes: the card's
// JSON, the server's real refusal of a bad card, and how Slack shows a card.
// The captures and their regions are in videos/screens/agent-cards.
// Build: node bin/video.js videos/agent-cards.js --size 3840x2160
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { el, g } from '../src/index.js';
import { C, mascotByName, mascot } from '../kit/agentrq.js';
import { loadTimeline, beatsById, videoScene, showDuring, captions, VW } from './lib.js';
import { BAND, LIFT, ARTX, collect, fadeSpan, groundStrip, pane, bubbleLine, tagChip, from, addCards, chapterChips } from './house.js';
import { Screen, loadShots } from './screen.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'agent-cards.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, 'screens/agent-cards');

// The docs agent and two friends, under every card.
const NAMES = ['claude', 'codex', 'agy'];
const MX = (i) => 700 + i * 170;
const [DOCS] = NAMES.map((n) => mascotByName(n).color);

// A box with a pixel kind and a line under it, stepping in at t.
const tile = (s, x, y, w, h, kind, line, t, color = C.lit) => from(s, g({},
  el('rect', { x, y, width: w, height: h, fill: C.panel, stroke: color, 'stroke-width': 2, class: 'px' }),
  s.text(kind, { x: x + 16, y: y + 28, font: 'pixel', size: 13, fill: color }),
  s.text(line, { x: x + 16, y: y + 54, font: 'body', size: 15, fill: C.text })), t);
// Grey text lines, the width of each in px, stepping in one by one.
const lines = (s, x, y, widths, t0, step = 0.12, gap = 20, fill = C.line) => widths.map((w, i) => from(s, el('rect', { x, y: y + i * gap, width: w, height: 9, fill, class: 'px' }), t0 + i * step));
// A small bar chart, bars stepping in.
const bars = (s, x, y, vals, t0, color = C.lit, h = 90, w = 18, gap = 8) => {
  const max = Math.max(...vals);
  return vals.map((v, i) => from(s, el('rect', { x: x + i * (w + gap), y: y + h - Math.round((v / max) * h), width: w, height: Math.max(2, Math.round((v / max) * h)), fill: color, class: 'px' }), t0 + i * 0.08));
};

// ---------------------------------------------------------------- the cards' art

// The report: a wall of text, the failure in the middle of it.
function artWall(s, at) {
  const X = ARTX;
  const Y = 64;
  return g({},
    pane(s, { x: X, y: Y, w: 560, h: 250, title: 'DOCS · AGENT REPLY', color: DOCS }),
    ...lines(s, X + 20, Y + 44, [500, 470, 510, 480, 300], at('hook', 1.0)),
    from(s, s.text('7, 12, 4, 0, 0, 11, 12, 5, 14 posts ...', { x: X + 20, y: Y + 168, font: 'mono', size: 14, fill: C.dim }), at('hook', 3.2)),
    ...lines(s, X + 20, Y + 184, [490, 420], at('hook', 3.6)),
    from(s, el('rect', { x: X + 20, y: Y + 224, width: 260, height: 9, fill: C.blocked, class: 'px' }), at('hook', 6.2)),
    from(s, tagChip(s, 'the one that failed', { x: X + 296, y: Y + 216, fill: C.blocked, color: C.text }), at('hook', 6.6)),
    from(s, bubbleLine(s, { x: X, y: Y + 270, w: 300, text: 'Reply with A, B or C.' }), at('pain', 0.8)),
    from(s, tagChip(s, 'read it twice', { x: X + 316, y: Y + 269, fill: C.ask }), at('pain', 3.0)));
}

// The promise: five kinds of card.
export function artPromise(s, at) {
  const W = [['CHART', 'numbers at a glance', 4.4], ['CHECKLIST', 'problems marked', 5.0], ['BUTTONS', 'one click to answer', 5.7],
    ['FORM', 'every detail at once', 6.4], ['LIVE', 'updates while you watch', 7.1]];
  return g({}, ...W.map(([kind, line, o], i) => tile(s, ARTX + (i % 2) * 300, 50 + Math.floor(i / 2) * 84, 280, 70, kind, line, at('promise', o))));
}

// JSON in, a card out.
function artWhat(s, at) {
  const X = ARTX;
  const J = ['{ "id": "root", "Card" }', '{ "id": "title", "Text" }', '{ "id": "chart", "Chart",', '  "data": [7, 12, 4 ...] }'];
  return g({},
    from(s, pane(s, { x: X, y: 80, w: 270, h: 200, title: 'WHAT THE AGENT SENDS', color: C.dim }), at('what-pain', 0.6)),
    ...J.map((l, i) => from(s, s.text(l, { x: X + 14, y: 136 + i * 30, font: 'mono', size: 12, fill: C.text }), at('what-pain', 1.0 + i * 0.25))),
    from(s, s.text('>', { x: X + 285, y: 190, font: 'pixel', size: 22, fill: C.lit }), at('what-pain', 2.4)),
    from(s, pane(s, { x: X + 310, y: 80, w: 250, h: 200, title: 'WHAT YOU SEE', color: C.lit }), at('what-pain', 2.6)),
    from(s, s.text('Blog posts per month', { x: X + 326, y: 132, font: 'semi', size: 14, fill: C.text }), at('what-pain', 2.8)),
    ...bars(s, X + 330, 156, [7, 12, 4, 1, 1, 11, 12, 5, 14], at('what-pain', 3.0), C.lit, 100, 18, 6));
}

// The agent knows which line matters: the text hides it.
function artWhy(s, at) {
  const X = ARTX + 20;
  return g({},
    pane(s, { x: X, y: 70, w: 520, h: 230, title: 'WHAT THE AGENT KNOWS', color: DOCS }),
    ...lines(s, X + 22, 116, [470, 440, 460, 470, 430, 300], 0.0001 + at('why-pain', 0.3), 0.1, 26),
    from(s, el('rect', { x: X + 18, y: 164, width: 478, height: 18, fill: 'none', stroke: C.ask, 'stroke-width': 3, class: 'px' }), at('why-pain', 3.2)),
    from(s, tagChip(s, 'this part', { x: X + 22, y: 320, fill: C.ask }), at('why-pain', 3.6)));
}

// Nine numbers in a sentence.
export function artNumbers(s, at) {
  const X = ARTX + 20;
  return g({},
    pane(s, { x: X, y: 90, w: 520, h: 160, title: 'DOCS · AGENT REPLY', color: DOCS }),
    from(s, s.text('Mar 7, Apr 12, May 4, Jun 0, Jul 0,', { x: X + 22, y: 150, font: 'mono', size: 18, fill: C.text }), at('chart-pain', 0.8)),
    from(s, s.text('Aug 11, Sep 12, Oct 5, Nov 14.', { x: X + 22, y: 182, font: 'mono', size: 18, fill: C.text }), at('chart-pain', 1.6)),
    from(s, tagChip(s, 'which month was busiest?', { x: X + 22, y: 276, fill: C.ask }), at('chart-pain', 3.4)));
}

// Checks in a list: the warning in the middle.
function artChecks(s, at) {
  const X = ARTX + 20;
  const R = [['build: ok', C.dim], ['tests: ok', C.dim], ['lint: 304 warnings', C.text], ['links: ok', C.dim], ['images: ok', C.dim]];
  return g({},
    pane(s, { x: X, y: 70, w: 520, h: 230, title: 'DOCS · STATUS', color: DOCS }),
    ...R.map(([t, c], i) => from(s, s.text(`- ${t}`, { x: X + 22, y: 120 + i * 34, font: 'mono', size: 16, fill: c }), at('stat-pain', 0.6 + i * 0.25))),
    from(s, tagChip(s, 'which one failed?', { x: X + 22, y: 320, fill: C.ask }), at('stat-pain', 3.4)));
}

// The back and forth: five rounds for one plan.
export function artRounds(s, at) {
  const X = ARTX + 20;
  const Q = [['Which title?', false], ['"Cards are here"', true], ['Which channels?', false], ['YouTube and LinkedIn', true], ['What time?', false]];
  return g({},
    ...Q.map(([t, you], i) => from(s, bubbleLine(s, { x: you ? X + 200 : X, y: 70 + i * 44, w: 280, text: t, you }), at('ask-pain', 0.4 + i * 0.45))),
    from(s, tagChip(s, 'five rounds', { x: X, y: 300, fill: C.ask }), at('ask-pain', 3.0)));
}

// Updates, one message each.
export function artSpam(s, at) {
  const X = ARTX + 20;
  const M = ['step 1 done', 'step 2 done', 'step 3 running', 'step 3 done', 'step 4 running', 'step 4 done'];
  return g({},
    ...M.map((t, i) => from(s, bubbleLine(s, { x: X + (i % 2) * 40, y: 60 + i * 40, w: 260, text: `Agent: ${t}` }), at('live-pain', 0.3 + i * 0.35))),
    from(s, tagChip(s, 'six pings', { x: X + 340, y: 150, fill: C.blocked, color: C.text }), at('live-pain', 2.8)));
}

// Code, struck out: only the catalog's parts.
function artSafe(s, at) {
  const X = ARTX + 20;
  return g({},
    pane(s, { x: X, y: 70, w: 520, h: 220, title: 'WHAT A CARD CANNOT DO', color: C.blocked }),
    ...[['<script> ... </script>', 1.4], ['<img src="https://...">', 2.2], ['fetch("https://...")', 3.0]].map(([t, o], i) => g({},
      from(s, s.text(t, { x: X + 24, y: 128 + i * 50, font: 'mono', size: 18, fill: C.text }), at('ctl-pain', o - 0.6)),
      from(s, el('rect', { x: X + 20, y: 122 + i * 50, width: t.length * 11 + 8, height: 3, fill: C.blocked, class: 'px' }), at('ctl-pain', o)))),
    from(s, tagChip(s, 'only the catalog', { x: X + 24, y: 310, fill: C.lit }), at('ctl-pain', 4.2)));
}

// The end card.
function artEnd(s) {
  return g({},
    s.text('agentrq.com', { x: 860, y: 200, font: 'bold', size: 64, fill: C.text, anchor: 'middle', spacing: -1.5 }),
    s.text('Charts, buttons, forms and live cards', { x: 860, y: 244, font: 'body', size: 20, fill: C.dim, anchor: 'middle' }),
    el('rect', { x: 540, y: 290, width: 640, height: 54, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
    s.text('What should your agent show as a card?', { x: 860, y: 324, font: 'semi', size: 18, fill: C.lit, anchor: 'middle' }));
}

// ---------------------------------------------------------------- drawn where no screen shows it

// Mono text with its leading spaces turned into an x offset (SVG collapses them).
const mono = (s, t, { x, y, size, fill }) => {
  const n = t.length - t.trimStart().length;
  return s.text(t.trimStart(), { x: x + n * size * 0.6, y, font: 'mono', size, fill });
};

// The card the agent sent, as JSON (abridged from the real reply).
function jsonPane(s, at) {
  const X = 150;
  const Y = 40;
  const L = [
    ['task reply', C.lit, 0],
    ['text: "65 blog posts so far in 2026. November is the busiest ..."', C.dim, 0.4],
    ['ui: [', C.text, 1.0],
    ['  { createSurface: { surfaceId: "posts", catalogId: ".../agentrq/catalog.json" } },', C.text, 1.4],
    ['  { updateComponents: { surfaceId: "posts", components: [', C.text, 2.0],
    ['      { id: "root",  component: "Card",   child: "c" },', C.lit, 2.6],
    ['      { id: "c",     component: "Column", children: ["t", "s", "ch"] },', C.lit, 3.0],
    ['      { id: "t",     component: "Text",   text: "## Blog posts per month" },', C.lit, 3.4],
    ['      { id: "ch",    component: "Chart",  variant: "bar", data: [', C.lit, 3.8],
    ['          { label: "Mar", value: 7 }, { label: "Apr", value: 12 }, ... ] }', C.dim, 4.2],
    ['  ] } }', C.text, 4.6],
    [']', C.text, 4.6],
  ];
  return g({},
    el('rect', { x: 0, y: 0, width: VW, height: BAND, fill: C.bg }),
    pane(s, { x: X, y: Y, w: 900, h: 470, title: 'THE DOCS AGENT REPLIES · WORKSPACE MCP', color: DOCS }),
    ...L.map(([t, c, o], i) => from(s, mono(s, t, { x: X + 24, y: Y + 66 + i * 32, size: 15, fill: c }), at('what-json', 1.5 + o))),
    from(s, tagChip(s, 'a flat list of parts, each with an id', { x: X + 24, y: Y + 430, fill: C.lit }), at('what-json', 7.0)));
}

// The server's answer to a bad card: the real text, both problems.
function refusedPane(s, at) {
  const X = 130;
  const Y = 60;
  const L = [
    ['ui is not valid A2UI v1.0:', C.text, 0],
    ['components[2] "t": text: matches none of the forms', C.blocked, 0.6],
    ['  the schema allows', C.blocked, 0.6],
    ['components[3] "ch": Chart is in our catalog:', C.blocked, 1.4],
    ['  createSurface\'s catalogId must be', C.blocked, 1.4],
    ['  ".../a2ui/v1_0/catalogs/agentrq/catalog.json" to use it', C.blocked, 1.4],
  ];
  return g({},
    el('rect', { x: 0, y: 0, width: VW, height: BAND, fill: C.bg }),
    pane(s, { x: X, y: Y, w: 940, h: 330, title: 'THE FIRST TRY · REFUSED, NOTHING POSTED', color: C.blocked }),
    ...L.map(([t, c, o], i) => from(s, mono(s, t, { x: X + 24, y: Y + 70 + i * 34, size: 17, fill: c }), at('what-check', 0.6 + o))),
    from(s, tagChip(s, 'each problem, with its path', { x: X + 24, y: Y + 280, fill: C.ask }), at('what-check', 3.6)),
    from(s, tagChip(s, 'fixed, sent again: posted', { x: X + 360, y: Y + 280, fill: C.lit }), at('what-check', 6.4)));
}

// Where the text goes, and how Slack shows the voice card (BuildCardBlocks).
function elsewherePane(s, at) {
  const X = 80;
  const Y = 50;
  return g({},
    el('rect', { x: 0, y: 0, width: VW, height: BAND, fill: C.bg }),
    from(s, g({},
      pane(s, { x: X, y: Y, w: 430, h: 150, title: 'PUSH · EMAIL · OTHER AGENTS', color: C.dim }),
      s.text('docs: The voice for the Agent cards', { x: X + 20, y: Y + 66, font: 'body', size: 17, fill: C.text }),
      s.text('video is ready (6:45). Schedule it for', { x: X + 20, y: Y + 92, font: 'body', size: 17, fill: C.text }),
      s.text('Monday 09:00, ... or publish now?', { x: X + 20, y: Y + 118, font: 'body', size: 17, fill: C.text })), at('ctl-text', 3.2)),
    from(s, tagChip(s, 'the text', { x: X, y: Y + 166, fill: C.lit }), at('ctl-text', 4.0)),
    from(s, g({},
      pane(s, { x: X + 480, y: Y, w: 560, h: 330, title: 'SLACK · #AGENTRQ-DOCS', color: '#e01e5a' }),
      el('rect', { x: X + 500, y: Y + 44, width: 36, height: 36, rx: 6, fill: C.lit }),
      s.text('AgentRQ', { x: X + 548, y: Y + 60, font: 'bold', size: 16, fill: C.text }),
      el('rect', { x: X + 628, y: Y + 47, width: 34, height: 16, rx: 3, fill: C.line }),
      s.text('APP', { x: X + 645, y: Y + 59, font: 'semi', size: 10, fill: C.dim, anchor: 'middle' }),
      s.text('docs', { x: X + 548, y: Y + 82, font: 'body', size: 13, fill: C.dim }),
      el('rect', { x: X + 548, y: Y + 98, width: 3, height: 128, fill: C.line }),
      s.text('Voice ready: Agent cards video', { x: X + 562, y: Y + 122, font: 'bold', size: 17, fill: C.text }),
      s.text('6:45 · 7 chapters · the intro below', { x: X + 562, y: Y + 150, font: 'body', size: 14, fill: C.dim }),
      el('rect', { x: X + 562, y: Y + 166, width: 450, height: 2, fill: C.line }),
      el('rect', { x: X + 562, y: Y + 186, width: 160, height: 32, rx: 4, fill: 'none', stroke: C.dim, 'stroke-width': 1.5 }),
      s.text('Open in AgentRQ', { x: X + 642, y: Y + 207, font: 'semi', size: 14, fill: C.text, anchor: 'middle' })), at('ctl-text', 5.4)),
    from(s, tagChip(s, 'blocks, plus a button to open it', { x: X + 500, y: Y + 250, fill: C.lit }), at('ctl-text', 7.4)));
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
    description: 'AgentRQ agent cards (A2UI), narrated over real screens of the app: what a card is, how the server checks it, then a bar chart, a heatmap and a line in tabs, a status card, a list, an image and an audio player, buttons that answer, a form asked with elicit, and a live card that updates in place while the agent builds the website. All numbers are real.',
  });
  groundStrip(s);

  const CARDS = [
    { span: [0, end('pain')], kicker: 'THE REPORT', headline: ['A wall of', 'text.'], sub: 'The one that matters, in the middle.', art: artWall },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ', headline: ['Agents answer', 'with cards.'], sub: 'Built on A2UI, the open standard.', art: artPromise },
    { span: [start('what-pain'), end('what-pain')], kicker: '01 / WHAT IS A2UI', headline: ['JSON in,', 'a card out.'], sub: 'Described by the agent, drawn by the app.', art: artWhat },
    { span: [start('why-pain'), end('why-pain')], kicker: '02 / WHY IT UNLOCKS', headline: ['The agent knows', 'what matters.'], sub: 'Now it can show you.', art: artWhy },
    { span: [start('chart-pain'), end('chart-pain')], kicker: '03 / CHARTS', headline: ['Nine numbers,', 'one sentence.'], sub: 'Hard to read, harder to compare.', art: artNumbers },
    { span: [start('stat-pain'), end('stat-pain')], kicker: '04 / STATUS, LISTS, MEDIA', headline: ['Where is', 'the failure?'], sub: 'Buried in a list of checks.', art: artChecks },
    { span: [start('ask-pain'), end('ask-pain')], kicker: '05 / BUTTONS AND FORMS', headline: ['Five rounds', 'of questions.'], sub: 'For one plan.', art: artRounds },
    { span: [start('live-pain'), end('live-pain')], kicker: '06 / LIVE CARDS', headline: ['Wait in the dark,', 'or drown.'], sub: 'Long jobs, too many updates.', art: artSpam },
    { span: [start('ctl-pain'), end('ctl-pain')], kicker: '07 / SAFE BY DESIGN', headline: ['Drawing in', 'your app?'], sub: 'Strict rules, checked by the server.', art: artSafe },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Ask for', 'a card.'], sub: 'Real screens, real data, a real agent.', art: artEnd },
  ];
  addCards(s, CARDS, at);

  const cardSpans = CARDS.map((c) => c.span);
  const sp = (id, a) => [at(id, a), end(id) - 0.2];
  const BEHAVE = {
    claude: { work: [[at('hook', 0.6), end('hook') - 0.2]], ask: [sp('pain', 0.8)], done: [sp('promise', 4.6), sp('cta', 1)], say: [['?', [sp('stat-pain', 3.4)]]] },
    codex: { work: [[at('live-pain', 0.3), end('live-pain') - 0.2]], done: [sp('promise', 6.0), sp('cta', 1.3)], alert: [sp('ctl-pain', 1.4)], say: [['?', [sp('chart-pain', 3.4)]]] },
    agy: { done: [sp('promise', 7.6), sp('cta', 1.6), sp('why-pain', 3.6)], say: [['zZ', [sp('ask-pain', 3.0)]], ['?', [sp('what-pain', 0.6)]]] },
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
  SCREENS(sc, at, start, end);

  sc.visible([
    [start('what-ask'), at('what-json', 1.1)],
    [at('what-open', 0), at('what-check', 0.2)],
    [start('why-glance'), end('why-watch')],
    [start('chart-bar'), end('chart-line')],
    [start('stat-checks'), end('stat-media')],
    [start('ask-buttons'), at('ask-values', 2.8)],
    [start('live-start'), end('live-quiet')],
    [start('ctl-safe'), at('ctl-text', 2.8)],
    [start('ctl-ask'), end('recap')],
  ]).build();

  s.add(fadeSpan(s, jsonPane(s, at), [at('what-json', 1.1), end('what-json')]));
  s.add(fadeSpan(s, refusedPane(s, at), [at('what-check', 0.2), end('what-check')]));
  s.add(fadeSpan(s, elsewherePane(s, at), [at('ctl-text', 2.8), end('ctl-text')]));
  s.add(fadeSpan(s, answerPane(s, at), [at('ask-values', 2.8), end('ask-values')]));

  chapterChips(s, [['01 / WHAT IS A2UI', 'what-ask', 'what-check'], ['02 / WHY IT UNLOCKS', 'why-glance', 'why-watch'], ['03 / CHARTS', 'chart-bar', 'chart-line'],
    ['04 / STATUS, LISTS, MEDIA', 'stat-checks', 'stat-media'], ['05 / BUTTONS AND FORMS', 'ask-buttons', 'ask-values'], ['06 / LIVE CARDS', 'live-start', 'live-quiet'],
    ['07 / SAFE BY DESIGN', 'ctl-safe', 'ctl-ask']].map(([label, a, z]) => [label, start(a), end(z)]));

  captions(s, tl, { band: BAND, size: 28, chars: 72, lineGap: 32, baseline: 51 });
  return s;
};

// The screen beats, one chapter at a time (frames in CSS px of a 1440x810 shot).
function SCREENS(sc, at, start, end) {
  // Frames for the camera.
  const FORM_FRAME = [320, 160, 1040, 300]; // the new task form
  const TASK_TOP = [655, 45, 770, 190]; // a task's title and its description
  const CARD = [660, 106, 745, 400]; // the task's title and a card under it
  const CARD_MID = [660, 110, 745, 440]; // the title and a chart card with tabs
  const CARD_TALL = [660, 112, 745, 556]; // the title and a form or a live card
  const CTITLE = [686, 229, 240, 26]; // a card's title
  const THREAD = CARD_TALL; // a card and the messages under it
  // Measured on the shots (CSS px).
  const DESC = [329, 258, 1022, 40]; // what-ask: the question
  const TITLE = [329, 230, 400, 26];
  const ASKED = [668, 85, 520, 28]; // what-asked: the description, in the task
  const BARS = [686, 336, 680, 110]; // what-card: the chart
  const SUMMARY = [686, 263, 320, 20]; // what-card: 65 posts, November
  const NOV = [1312, 336, 52, 108];
  const HEAT = [686, 352, 700, 180]; // chart-heat: the grid
  const HEAT_SUM = [686, 263, 284, 20];
  const LINE = [686, 330, 700, 200]; // chart-line: the line
  const SEP = [1170, 336, 90, 40];
  const ROW_OK = [686, 314, 330, 58]; // stat-checks: build and tests
  const ROW_WARN = [686, 380, 320, 24]; // stat-checks: SEO lint
  const ROWS = [686, 262, 700, 142]; // stat-list
  const DATES = [1316, 262, 66, 142];
  const IMAGE = [686, 259, 328, 188]; // stat-media
  const CHIP = [676, 518, 80, 24]; // stat-media: home.png, the reply's file
  const PLAYER = [686, 314, 560, 56]; // ask-buttons
  const BTNS = [960, 388, 422, 34];
  const HREPLY = [1215, 528, 172, 50]; // ask-clicked: her reply
  const AREPLY = [670, 640, 300, 24]; // ask-done: the agent's answer
  const F_TITLE = [686, 288, 692, 30]; // ask-form
  const F_CHIPS = [688, 354, 262, 24];
  const F_LINKED = [768, 354, 180, 24];
  const F_DATE = [686, 418, 692, 26];
  const F_SLIDER = [686, 460, 700, 42];
  const F_CHECK = [686, 509, 196, 22];
  const F_GO = [1288, 579, 92, 32];
  const ANSWERED = [668, 562, 90, 26]; // ask-submitted
  const L_ROWS = [686, 307, 150, 126]; // live cards
  const L_TESTS = [686, 374, 145, 24];
  const L_TITLE = [686, 223, 205, 26];
  const L_CHART = [686, 440, 700, 196];

  // 01 What is A2UI
  sc.show('what-ask', start('what-ask'), { fade: 0.3 }).cut(start('what-ask'), 'window');
  sc.look(at('what-ask', 0.6), FORM_FRAME, { dur: 0.8 });
  sc.callout(at('what-ask', 1.6), at('what-ask', 3.6), TITLE, { label: 'a task for the docs agent', side: 'above' });
  sc.callout(at('what-ask', 3.8), end('what-ask') - 0.3, DESC, { label: 'a plain question', side: 'below' });
  sc.show('what-asked', start('what-json'), { fade: 0.3 }).cut(start('what-json'), TASK_TOP);
  sc.show('what-card', at('what-open', 0), { fade: 0.3 }).cut(at('what-open', 0), 'window');
  sc.look(at('what-open', 1.0), CARD, { dur: 0.9 });
  sc.callout(at('what-open', 2.2), end('what-open') - 0.3, CTITLE, { label: 'an A2UI v1.0 card', side: 'right' });
  sc.callout(at('what-draw', 0.8), at('what-draw', 4.4), BARS, { label: 'drawn by the app itself', side: 'above' });
  sc.show('what-card-light', at('what-draw', 4.6), { fade: 0.3 });
  sc.callout(at('what-draw', 4.8), at('what-draw', 5.4), BARS, { label: 'light', side: 'above' });
  sc.show('what-card', at('what-draw', 5.5), { fade: 0.3 });
  sc.callout(at('what-draw', 5.6), at('what-draw', 6.7), SUMMARY, { label: '65 posts', side: 'right' });
  sc.callout(at('what-draw', 6.8), end('what-draw') - 0.3, NOV, { label: 'November: 14', side: 'left' });

  // 02 Why it unlocks: one screen each, from the chapters ahead
  sc.show('stat-checks', start('why-glance'), { fade: 0.3 }).cut(start('why-glance'), CARD);
  sc.callout(at('why-glance', 3.0), at('why-glance', 4.8), ROW_WARN, { label: 'a warning mark', side: 'below' });
  sc.show('chart-line', at('why-glance', 4.9), { fade: 0.25 }).cut(at('why-glance', 4.9), CARD_MID);
  sc.callout(at('why-glance', 5.1), at('why-glance', 6.3), LINE, { label: 'the trend', side: 'above' });
  sc.show('what-card', at('why-glance', 6.4), { fade: 0.25 }).cut(at('why-glance', 6.4), CARD);
  sc.callout(at('why-glance', 6.6), end('why-glance') - 0.3, NOV, { label: 'the tallest bar', side: 'left' });
  sc.show('ask-buttons', start('why-press'), { fade: 0.3 }).cut(start('why-press'), CARD);
  sc.callout(at('why-press', 1.8), at('why-press', 4.2), BTNS, { label: 'a choice, as buttons', side: 'below' });
  sc.callout(at('why-press', 4.3), end('why-press') - 0.3, BTNS, { label: 'exactly the options offered', side: 'below' });
  sc.show('live-running', start('why-watch'), { fade: 0.3 }).cut(start('why-watch'), CARD_TALL);
  sc.callout(at('why-watch', 2.3), end('why-watch') - 0.3, L_TITLE, { label: 'one card that moves', side: 'right' });

  // 03 Charts
  sc.show('what-card', start('chart-bar'), { fade: 0.3 }).cut(start('chart-bar'), 'window');
  sc.look(at('chart-bar', 1.0), CARD, { dur: 0.8 });
  sc.callout(at('chart-bar', 3.1), end('chart-bar') - 0.3, BARS, { label: 'bars: side by side', side: 'above' });
  sc.show('chart-heat', start('chart-heat'), { fade: 0.3 }).cut(start('chart-heat'), CARD_MID);
  sc.callout(at('chart-heat', 0.9), at('chart-heat', 5.4), HEAT, { label: 'a heatmap: commits per day', side: 'above' });
  sc.callout(at('chart-heat', 5.6), end('chart-heat') - 0.3, HEAT_SUM, { label: '190 in November · 31 on Nov 23', side: 'right' });
  sc.callout(at('chart-tabs', 1.0), at('chart-tabs', 3.8), [763, 296, 180, 24], { label: 'tabs', side: 'right' });
  sc.click(at('chart-tabs', 4.2), { region: 'tab' });
  sc.show('chart-line', at('chart-tabs', 4.5), { fade: 0.2 }).away(at('chart-tabs', 4.6));
  sc.callout(at('chart-tabs', 5.4), end('chart-tabs') - 0.3, LINE, { label: 'the same data, as a line', side: 'above' });
  sc.callout(at('chart-line', 0.7), at('chart-line', 4.6), SEP, { label: 'September: 618', side: 'above' });
  sc.callout(at('chart-line', 4.8), end('chart-line') - 0.3, LINE, { label: 'the analytics pages\' colours', side: 'above' });

  // 04 Status, lists and media
  sc.show('stat-checks', start('stat-checks'), { fade: 0.3 }).cut(start('stat-checks'), 'window');
  sc.look(at('stat-checks', 0.6), CARD, { dur: 0.8 });
  sc.callout(at('stat-checks', 1.6), at('stat-checks', 3.0), CTITLE, { label: 'the site\'s real checks', side: 'right' });
  sc.callout(at('stat-checks', 3.1), at('stat-checks', 4.8), ROW_OK, { label: 'build and tests: pass', side: 'right' });
  sc.callout(at('stat-checks', 4.9), end('stat-checks') - 0.3, ROW_WARN, { label: '304 warnings: a yellow mark', side: 'below' });
  sc.show('stat-list', start('stat-list'), { fade: 0.3 }).cut(start('stat-list'), CARD);
  sc.callout(at('stat-list', 1.0), at('stat-list', 3.2), ROWS, { label: 'a list: one row per post', side: 'below' });
  sc.callout(at('stat-list', 3.3), end('stat-list') - 0.3, DATES, { label: 'values on the right', side: 'left' });
  sc.show('stat-media', start('stat-media'), { fade: 0.3 }).cut(start('stat-media'), THREAD);
  sc.callout(at('stat-media', 1.8), at('stat-media', 4.4), IMAGE, { label: 'a picture', side: 'right' });
  sc.callout(at('stat-media', 4.5), at('stat-media', 6.3), CHIP, { label: 'the file on the same reply', side: 'right' });
  sc.callout(at('stat-media', 6.4), end('stat-media') - 0.3, IMAGE, { label: 'the homepage, after the build', side: 'right' });

  // 05 Buttons and forms
  sc.show('ask-buttons', start('ask-buttons'), { fade: 0.3 }).cut(start('ask-buttons'), 'window');
  sc.look(at('ask-buttons', 0.6), CARD, { dur: 0.8 });
  sc.callout(at('ask-buttons', 3.6), at('ask-buttons', 5.3), PLAYER, { label: 'this video\'s own voice', side: 'below' });
  sc.callout(at('ask-buttons', 5.4), end('ask-buttons') - 0.3, BTNS, { label: 'three buttons', side: 'below' });
  sc.callout(at('ask-click', 0.6), at('ask-click', 1.8), { region: 'sched' }, { label: 'Schedule Monday 09:00', side: 'below' });
  sc.click(at('ask-click', 1.9), { region: 'sched' });
  sc.show('ask-clicked', at('ask-click', 2.1), { fade: 0.2 }).away(at('ask-click', 2.2)).cut(at('ask-click', 2.1), THREAD);
  sc.callout(at('ask-click', 2.6), end('ask-click') - 0.3, HREPLY, { label: 'posted as her reply', side: 'left' });
  sc.show('ask-done', start('ask-done'), { fade: 0.3 });
  sc.callout(at('ask-done', 1.0), at('ask-done', 4.2), BTNS, { label: 'read only, her choice marked', side: 'below' });
  sc.callout(at('ask-done', 4.4), end('ask-done') - 0.3, AREPLY, { label: 'the agent read it', side: 'right' });
  sc.show('ask-form', start('ask-form'), { fade: 0.3 }).cut(start('ask-form'), 'window');
  sc.look(at('ask-form', 0.6), CARD_TALL, { dur: 0.9 });
  sc.callout(at('ask-form', 3.5), at('ask-form', 5.9), CTITLE, { label: 'asked with elicit: it waits', side: 'right' });
  sc.callout(at('ask-form', 6.0), at('ask-form', 6.6), F_TITLE, { label: 'a title', side: 'above' });
  sc.callout(at('ask-form', 6.7), at('ask-form', 7.3), F_CHIPS, { label: 'channels', side: 'right' });
  sc.callout(at('ask-form', 7.4), at('ask-form', 8.3), F_DATE, { label: 'date and time', side: 'below' });
  sc.callout(at('ask-form', 8.4), at('ask-form', 9.0), F_SLIDER, { label: 'a slider', side: 'below' });
  sc.callout(at('ask-form', 9.1), end('ask-form') - 0.3, F_CHECK, { label: 'a checkbox', side: 'right' });
  sc.callout(at('ask-guess', 0.9), at('ask-guess', 3.6), F_TITLE, { label: 'its best guess, filled in', side: 'above' });
  sc.click(at('ask-guess', 4.3), [800, 354, 24, 24]);
  sc.click(at('ask-guess', 5.2), [900, 354, 24, 24]);
  sc.show('ask-picked', at('ask-guess', 5.4), { fade: 0.2 }).away(at('ask-guess', 5.5));
  sc.callout(at('ask-guess', 5.6), at('ask-guess', 6.4), F_LINKED, { label: 'LinkedIn and dev.to', side: 'right' });
  sc.callout(at('ask-guess', 6.5), at('ask-guess', 7.3), F_SLIDER, { label: 'moved to 4', side: 'below' });
  sc.click(at('ask-guess', 7.8), F_GO);
  sc.show('ask-submitted', at('ask-guess', 8.0), { fade: 0.2 }).away(at('ask-guess', 8.1)).cut(at('ask-guess', 8.0), [660, 110, 745, 520]);
  sc.callout(at('ask-values', 0.6), at('ask-values', 2.6), ANSWERED, { label: 'answered', side: 'right' });

  // 06 Live cards
  sc.show('live-queued', start('live-start'), { fade: 0.3 }).cut(start('live-start'), 'window');
  sc.look(at('live-start', 0.8), CARD_TALL, { dur: 0.9 });
  sc.callout(at('live-start', 5.5), at('live-start', 6.8), L_TITLE, { label: 'one card', side: 'right' });
  sc.callout(at('live-start', 6.9), end('live-start') - 0.3, L_ROWS, { label: 'four steps, all queued', side: 'right' });
  sc.show('live-running', start('live-run'), { fade: 0.25 });
  sc.callout(at('live-run', 1.0), at('live-run', 3.4), L_TITLE, { label: 'the same card, updated: 2/4', side: 'right' });
  sc.callout(at('live-run', 3.5), at('live-run', 5.3), [686, 307, 150, 56], { label: 'install, build: done', side: 'right' });
  sc.callout(at('live-run', 5.4), at('live-run', 6.9), L_TESTS, { label: 'tests: running', side: 'right' });
  sc.callout(at('live-run', 7.0), end('live-run') - 0.3, L_CHART, { label: 'the chart fills in', side: 'above' });
  sc.show('live-done', start('live-done'), { fade: 0.25 });
  sc.callout(at('live-done', 2.5), at('live-done', 4.3), L_ROWS, { label: 'all four done: 15 s', side: 'right' });
  sc.callout(at('live-done', 4.4), end('live-done') - 0.3, L_TITLE, { label: 'the same place in the thread', side: 'right' });
  sc.look(at('live-quiet', 0.6), 'window', { dur: 0.9 });
  sc.callout(at('live-quiet', 1.7), end('live-quiet') - 0.3, L_TITLE, { label: 'an edit: no notification', side: 'right' });

  // 07 Safe by design
  sc.show('stat-media', start('ctl-safe'), { fade: 0.3 }).cut(start('ctl-safe'), THREAD);
  sc.callout(at('ctl-safe', 0.8), at('ctl-safe', 4.6), CTITLE, { label: 'catalog parts only, no code', side: 'right' });
  sc.callout(at('ctl-safe', 4.7), end('ctl-safe') - 0.3, CHIP, { label: 'media: the reply\'s own files', side: 'right' });
  sc.show('ask-buttons', start('ctl-text'), { fade: 0.3 }).cut(start('ctl-text'), CARD);
  sc.callout(at('ctl-text', 0.8), at('ctl-text', 2.6), CTITLE, { label: 'a card, with its text', side: 'right' });
  sc.show('what-ask', start('ctl-ask'), { fade: 0.3 }).cut(start('ctl-ask'), FORM_FRAME);
  sc.callout(at('ctl-ask', 0.9), at('ctl-ask', 3.2), DESC, { label: 'nothing to switch on', side: 'below' });
  sc.callout(at('ctl-ask', 3.3), end('ctl-ask') - 0.3, DESC, { label: 'just ask for a card', side: 'below' });

  // Recap: one screen each.
  sc.show('chart-line', start('recap'), { fade: 0.3 }).cut(start('recap'), CARD_MID);
  sc.callout(at('recap', 0.6), at('recap', 2.6), LINE, { label: 'at a glance', side: 'above' });
  sc.show('ask-clicked', at('recap', 2.7), { fade: 0.2 }).cut(at('recap', 2.7), CARD);
  sc.callout(at('recap', 2.9), at('recap', 4.2), BTNS, { label: 'one click', side: 'below' });
  sc.show('ask-picked', at('recap', 4.3), { fade: 0.2 }).cut(at('recap', 4.3), CARD_TALL);
  sc.callout(at('recap', 4.5), at('recap', 6.6), CTITLE, { label: 'everything at once', side: 'right' });
  sc.show('live-done', at('recap', 6.7), { fade: 0.2 }).cut(at('recap', 6.7), CARD_TALL);
  sc.callout(at('recap', 6.9), end('recap') - 0.3, L_ROWS, { label: 'live', side: 'right' });
}

// The answer the agent got back from elicit, as the tool call returned it.
function answerPane(s, at) {
  const X = 170;
  const Y = 60;
  const L = [
    ['task elicit  →  answered', C.lit, 0],
    ['action: "accept",', C.text, 0.4],
    ['content: {', C.text, 0.4],
    ['  name: "schedule",', C.text, 0.8],
    ['  dataModel: {', C.text, 1.2],
    ['    title: "Your agent can answer with a card now",', C.lit, 1.6],
    ['    channels: ["youtube", "linkedin", "devto"],', C.lit, 2.0],
    ['    when: "2026-11-30T09:00:00",  clips: 4,  newsletter: true', C.lit, 2.4],
    ['  } }', C.text, 2.4],
  ];
  return g({},
    el('rect', { x: 0, y: 0, width: VW, height: BAND, fill: C.bg }),
    pane(s, { x: X, y: Y, w: 860, h: 400, title: 'WHAT THE DOCS AGENT GETS BACK · WORKSPACE MCP', color: DOCS }),
    ...L.map(([t, c, o], i) => from(s, mono(s, t, { x: X + 24, y: Y + 68 + i * 34, size: 17, fill: c }), at('ask-values', 3.0 + o))),
    from(s, tagChip(s, 'every value, as data', { x: X + 24, y: Y + 360, fill: C.lit }), at('ask-values', 5.0)));
}
