// AgentRQ workspaces, memory and skills, narrated, about six minutes: each chapter
// opens on a pain in the house style (ground, mascots, pixel art), then shows the
// fix on real screens of the app, captured with src/capture.js from a local
// AgentRQ where Ada runs three projects (storefront, billing, docs), each in its own
// workspace with its own agent. Every state on screen was played for real, in the
// UI and through each agent's MCP calls: billing's agent reports itself as codex,
// the others as claude-code. The captures and their regions are in
// videos/screens/workspaces-memory-skills.
// Build: node bin/video.js videos/workspaces-memory-skills.js --size 3840x2160
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { el, g } from '../src/index.js';
import { C, mascotByName, mascot } from '../kit/agentrq.js';
import { loadTimeline, beatsById, videoScene, showDuring, captions, VW } from './lib.js';
import { BAND, LIFT, ARTX, collect, groundStrip, pane, bubbleLine, doc, tagChip, arrow, from, addCards, chapterChips } from './house.js';
import { Screen, loadShots } from './screen.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'workspaces-memory-skills.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, 'screens/workspaces-memory-skills');

// The storefront's, billing's and docs' agents.
const NAMES = ['claude', 'codex', 'agy'];
const MX = (i) => 700 + i * 200;
const SHOP = mascotByName('claude').color;
const BILL = mascotByName('codex').color;
const DOCS = mascotByName('agy').color;
const PROJECTS = [['storefront', SHOP], ['billing', BILL], ['docs', DOCS]];

// ---------------------------------------------------------------- the cards' art

// A folder for a project, with its name on the tab.
function folder(s, x, y, name, color, { w = 170, h = 120 } = {}) {
  return g({},
    el('rect', { x, y, width: 70, height: 16, fill: color, class: 'px' }),
    el('rect', { x, y: y + 14, width: w, height: h, fill: C.panel, stroke: color, 'stroke-width': 2, class: 'px' }),
    s.text(name, { x: x + 14, y: y + 48, font: 'semi', size: 17, fill: C.text }),
    s.text(`~/code/${name}`, { x: x + 14, y: y + 74, font: 'mono', size: 12, fill: C.dim }));
}

// One agent for three repos: asked for billing, it edits the storefront; the next morning, nothing is left.
function artWrongRepo(s, at) {
  const t = at('hook', 5.4);
  const chat = at('pain', 0.6);
  return g({},
    ...PROJECTS.map(([name, color], i) => folder(s, ARTX + i * 200, 70, name, color)),
    from(s, bubbleLine(s, { x: ARTX + 120, y: 238, w: 300, text: 'change the billing invoices', you: true }), at('hook', 4.2)),
    from(s, g({ transform: `translate(${ARTX + 60} 196) rotate(-90 13 13)` }, arrow()), t),
    from(s, tagChip(s, 'edited storefront', { x: ARTX + 14, y: 162, fill: C.blocked, color: C.text }), t + 0.4),
    s.anim(g({ transform: `translate(${ARTX + 430} 284)` }, doc(s, "yesterday's chat", { w: 150 })), [[0, { opacity: 0 }], [chat, { opacity: 0 }, 'step'], [chat + 0.05, { opacity: 1 }, 'step'], [at('pain', 4.4), { opacity: 1 }], [at('pain', 5.4), { opacity: 0.12 }]]),
    from(s, tagChip(s, 'starts from zero', { x: ARTX + 300, y: 326, fill: C.ask }), at('pain', 5.6)));
}

// The promise: three workspaces, each with its own tasks, agent and key, and its memory and skills.
function artPromise(s, at) {
  const ROWS = ['tasks', 'agent', 'key', 'memory', 'skills'];
  return g({}, ...PROJECTS.map(([name, color], i) => {
    const x = ARTX + i * 200;
    return g({},
      el('rect', { x, y: 70, width: 184, height: 270, fill: C.panel, stroke: color, 'stroke-width': 2, class: 'px' }),
      el('rect', { x: x + 14, y: 88, width: 12, height: 12, fill: color, class: 'px' }),
      s.text(name, { x: x + 36, y: 100, font: 'semi', size: 16, fill: C.text }),
      ...ROWS.map((row, k) => from(s, g({},
        el('rect', { x: x + 14, y: 122 + k * 42, width: 156, height: 32, fill: C.card, stroke: C.line, class: 'px' }),
        s.text(row, { x: x + 26, y: 143 + k * 42, font: 'body', size: 14, fill: k >= 3 ? C.lit : C.text }),
        el('rect', { x: x + 148, y: 132 + k * 42, width: 12, height: 12, fill: k >= 3 ? C.lit : color, class: 'px' })), at('promise', 1.4 + k * 1.2 + i * 0.15))));
  }));
}

// One chat for every project: requests for three repos in one stream, and the agent guessing.
function artGuess(s, at) {
  const ASKS = [['fix the cart badge', SHOP], ['add VAT to invoices', BILL], ['update the refunds guide', DOCS], ['rename the checkout step', SHOP]];
  return g({},
    pane(s, { x: ARTX, y: 70, w: 590, h: 250, title: 'ONE CHAT, EVERY PROJECT', color: C.lit }),
    ...ASKS.map(([text, color], i) => g({},
      from(s, bubbleLine(s, { x: ARTX + 200, y: 108 + i * 44, w: 300, text, you: true }), at('ws-pain', 0.8 + i * 0.9)),
      from(s, el('rect', { x: ARTX + 512, y: 116 + i * 44, width: 14, height: 14, fill: color, class: 'px' }), at('ws-pain', 0.9 + i * 0.9)))),
    from(s, g({}, s.text('?', { x: ARTX + 90, y: 214, font: 'pixel', size: 72, fill: C.ask, anchor: 'middle' }),
      s.text('which repo?', { x: ARTX + 90, y: 256, font: 'body', size: 15, fill: C.dim, anchor: 'middle' })), at('ws-pain', 4.4)));
}

// One key that opens every project: one leak, three open locks.
function artOneKey(s, at) {
  const t = at('key-pain', 3.4);
  const lock = (x, color, open) => g({},
    el('rect', { x: x + 14, y: open ? 92 : 104, width: 8, height: 30, fill: C.dim, class: 'px' }),
    el('rect', { x: x + 50, y: 104, width: 8, height: 30, fill: C.dim, class: 'px' }),
    el('rect', { x: x + 14, y: open ? 84 : 96, width: 44, height: 10, fill: C.dim, class: 'px' }),
    el('rect', { x, y: 132, width: 72, height: 60, fill: color, class: 'px' }));
  return g({},
    ...PROJECTS.map(([name, color], i) => {
      const x = ARTX + 250 + i * 116;
      return g({}, lock(x, color, false), from(s, lock(x, color, true), t + 0.6 + i * 0.4),
        s.text(name, { x: x + 36, y: 220, font: 'body', size: 14, fill: C.text, anchor: 'middle' }));
    }),
    g({ transform: `translate(${ARTX} 110)` },
      el('circle', { cx: 40, cy: 40, r: 32, fill: 'none', stroke: C.ask, 'stroke-width': 14 }),
      el('rect', { x: 66, y: 34, width: 140, height: 14, fill: C.ask, class: 'px' }),
      el('rect', { x: 170, y: 48, width: 14, height: 22, fill: C.ask, class: 'px' }),
      el('rect', { x: 192, y: 48, width: 14, height: 18, fill: C.ask, class: 'px' })),
    from(s, tagChip(s, 'leaked once', { x: ARTX + 20, y: 210, fill: C.blocked, color: C.text }), t),
    from(s, tagChip(s, 'all three open', { x: ARTX + 300, y: 258, fill: C.blocked, color: C.text }), t + 2.0));
}

// The same hour, twice: learned on Monday, learned again on Tuesday.
function artRelearn(s, at) {
  const lines = (x, t0, last, fill) => ['tests: connection refused', 'try the dev database...', last].map((text, i) =>
    from(s, bubbleLine(s, { x: x + 12, y: 112 + i * 36, w: 262, text, fill: i === 2 ? fill : undefined }), t0 + i * 1.0));
  const t1 = at('mem-pain', 1.2);
  const t2 = at('mem-pain', 6.2);
  return g({},
    pane(s, { x: ARTX, y: 70, w: 286, h: 230, title: 'MONDAY / BILLING', color: BILL }),
    pane(s, { x: ARTX + 304, y: 70, w: 286, h: 230, title: 'TUESDAY / NEW SESSION', color: BILL }),
    ...lines(ARTX, t1, 'port 5433: green', '#14532d'),
    ...lines(ARTX + 304, t2, 'where do I even start?', '#713f12'),
    from(s, tagChip(s, '1 hour', { x: ARTX + 12, y: 260, fill: C.ask }), t1 + 3.0),
    from(s, tagChip(s, '1 hour, again', { x: ARTX + 316, y: 260, fill: C.blocked, color: C.text }), t2 + 2.6));
}

// Copies of one release playbook on laptops and wikis, each a little different.
function artDrift(s, at) {
  const COPIES = [['LAPTOP', SHOP, 4, [2]], ['WIKI', BILL, 3, []], ['CHAT PIN', DOCS, 5, [1, 4]]];
  return g({}, ...COPIES.map(([where, color, steps, odd], i) => {
    const x = ARTX + i * 204;
    return from(s, g({},
      el('rect', { x, y: 70, width: 186, height: 230, fill: '#fef3c7', class: 'px' }),
      el('rect', { x: x + 166, y: 70, width: 20, height: 20, fill: C.panel, class: 'px' }),
      s.text(where, { x: x + 14, y: 98, font: 'pixel', size: 13, fill: color === BILL ? '#27272a' : color }),
      s.text('release.md', { x: x + 14, y: 122, font: 'mono', size: 13, fill: '#78350f' }),
      ...Array.from({ length: steps }, (_, k) => g({},
        s.text(`${k + 1}.`, { x: x + 14, y: 156 + k * 26, font: 'mono', size: 12, fill: '#78350f' }),
        el('rect', { x: x + 38, y: 148 + k * 26, width: [110, 90, 120, 80, 100][k], height: 8, fill: odd.includes(k) ? '#f97316' : '#78350f55', class: 'px' }))),
      from(s, tagChip(s, `${steps} steps`, { x: x + 14, y: 262, fill: C.blocked, color: C.text }), at('skill-pain', 4.6 + i * 0.4))), at('skill-pain', 1.6 + i * 0.9));
  }));
}

// Docs and billing carry different risks; one rule for both fits neither.
function artRisk(s, at) {
  const card = (x, name, color, label, fill, ink, t) => g({},
    el('rect', { x, y: 70, width: 280, height: 230, fill: C.panel, stroke: color, 'stroke-width': 2, class: 'px' }),
    el('rect', { x: x + 18, y: 90, width: 12, height: 12, fill: color, class: 'px' }),
    s.text(name, { x: x + 40, y: 102, font: 'semi', size: 18, fill: C.text }),
    ...[0, 1, 2].map((k) => el('rect', { x: x + 18, y: 130 + k * 26, width: [200, 160, 220][k], height: 8, fill: C.line, class: 'px' })),
    from(s, tagChip(s, label, { x: x + 18, y: 240, fill, color: ink }), t));
  return g({},
    card(ARTX, 'docs', DOCS, 'low risk: let it run', '#86efac', C.ink, at('ctl-pain', 1.8)),
    card(ARTX + 310, 'billing', BILL, 'moves money: ask first', C.blocked, C.text, at('ctl-pain', 3.4)));
}

// The end card: the question to answer, and where to try it.
function artEnd(s) {
  return g({},
    s.text('agentrq.com', { x: 860, y: 200, font: 'bold', size: 64, fill: C.text, anchor: 'middle', spacing: -1.5 }),
    s.text('Workspaces, memory and skills', { x: 860, y: 244, font: 'body', size: 20, fill: C.dim, anchor: 'middle' }),
    el('rect', { x: 600, y: 290, width: 520, height: 54, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
    s.text('What does your agent relearn?', { x: 860, y: 324, font: 'semi', size: 18, fill: C.lit, anchor: 'middle' }));
}

// A terminal over the screen: the real reply to billing's token on the storefront's MCP URL.
function terminal(s, t0, t1) {
  const x = 250;
  const y = 330;
  const node = g({},
    el('rect', { x, y, width: 700, height: 132, fill: '#09090b', stroke: C.lit, 'stroke-width': 2, class: 'px' }),
    el('rect', { x, y, width: 700, height: 26, fill: C.card, class: 'px' }),
    s.text('billing key, storefront URL', { x: x + 14, y: y + 18, font: 'mono', size: 13, fill: C.dim }),
    s.text('$ curl -X POST app.agentrq.com/mcp/<storefront>?token=<billing key>', { x: x + 14, y: y + 58, font: 'mono', size: 15, fill: C.text }),
    s.text('401 Unauthorized', { x: x + 14, y: y + 90, font: 'mono', size: 15, fill: C.blocked }),
    s.text('"situational security: unauthorized"', { x: x + 14, y: y + 116, font: 'mono', size: 15, fill: C.ask }));
  return s.anim(node, [[0, { opacity: 0 }], [t0, { opacity: 0 }, 'step'], [t0 + 0.3, { opacity: 1 }], [t1 - 0.3, { opacity: 1 }], [t1, { opacity: 0 }]]);
}

// ---------------------------------------------------------------- the video

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);

  const s = videoScene({
    tl,
    ground: false,
    poster: at('ws-online', 6),
    thumbnail: at('mem-save', 6),
    description: 'AgentRQ workspaces, memory and skills, narrated over real screens of the app: Ada gives billing its own workspace from the Backend template and connects Codex to it, a task reaches only billing\'s agent, a fork shares memory and merges back, each workspace\'s token is refused on any other, the self-learning loop saves the rule that billing\'s tests need Postgres on 5433 and the next task reads it first, two agents saving at once merge instead of overwriting, one release skill is switched on per workspace and fixed once to version two, and each workspace keeps its own settings.',
  });
  groundStrip(s);

  // ------------------------------------------------ cards
  const CARDS = [
    { span: [0, end('pain')], kicker: 'ONE AGENT, THREE PROJECTS', headline: ['Right fix.', 'Wrong repo.'], sub: 'And tomorrow it starts from zero.', art: artWrongRepo },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ WORKSPACES', headline: ['One project.', 'One workspace.'], sub: 'Memory for facts, skills for steps.', art: artPromise },
    { span: [start('ws-pain'), end('ws-pain')], kicker: '01 / ONE WORKSPACE PER PROJECT', headline: ['Which repo', 'did you mean?'], sub: 'One chat for every project means guessing.', art: artGuess },
    { span: [start('key-pain'), end('key-pain')], kicker: '02 / A KEY PER WORKSPACE', headline: ['One key.', 'Every project.'], sub: 'One leak, and all of them are open.', art: artOneKey },
    { span: [start('mem-pain'), end('mem-pain')], kicker: '03 / MEMORY', headline: ['Learned at noon.', 'Gone by morning.'], sub: 'An hour to find port 5433. Again.', art: artRelearn },
    { span: [start('skill-pain'), end('skill-pain')], kicker: '04 / SKILLS', headline: ['One playbook.', 'Three copies.'], sub: 'Every copy drifts a little more.', art: artDrift },
    { span: [start('ctl-pain'), end('ctl-pain')], kicker: '05 / YOU STAY IN CONTROL', headline: ['Same rules', 'for every repo?'], sub: 'Docs is safe. Billing moves money.', art: artRisk },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Teach it once.', 'Every agent knows.'], sub: 'Workspaces, memory and skills.', art: artEnd },
  ];
  addCards(s, CARDS, at);

  // The mascots, the three projects' agents, stand under every card and react to its story.
  const cardSpans = CARDS.map((c) => c.span);
  const sp = (id, a = 1, z) => [at(id, a), z === undefined ? end(id) - 0.2 : at(id, z)];
  const BEHAVE = {
    claude: {
      work: [sp('hook', 0.6, 4.0), sp('ws-pain', 0.6)],
      alert: [sp('hook', 5.4, 8.6)],
      ask: [sp('mem-pain', 6.2)],
      done: [sp('promise', 1), sp('cta', 1)],
    },
    codex: {
      work: [sp('mem-pain', 1.0, 4.6), sp('ctl-pain', 3.4)],
      done: [sp('mem-pain', 4.8, 6.0), sp('promise', 1.3), sp('cta', 1.3)],
      alert: [sp('key-pain', 3.4)],
      ask: [sp('skill-pain', 2.6)],
    },
    agy: {
      ask: [sp('ws-pain', 4.4), sp('skill-pain', 4.4)],
      done: [sp('promise', 1.6), sp('ctl-pain', 1.8), sp('cta', 1.6)],
      say: [['zZ', [sp('pain', 4.4)]]],
    },
  };
  const hopsAt = (spans) => spans.map(([t0]) => [t0, 16]);
  const crowd = collect(s, () => NAMES.forEach((n, i) => {
    const m = BEHAVE[n];
    mascot(s, { ...mascotByName(n), name: n === 'agy' ? 'antigravity' : n }, i, {
      x: MX(i), hops: hopsAt([...(m.done ?? []), ...(m.alert ?? [])]), ...m, say: m.say ?? [],
    });
  }));
  s.add(showDuring(s, g({ transform: `translate(0 ${LIFT})` }, crowd), cardSpans));

  // ------------------------------------------------ screens
  const shots = loadShots(SHOTS);
  const sc = new Screen(s, shots, { safe: { x: 0, y: 0, w: VW, h: BAND } });
  const CHAT = [470, 90, 960, 330]; // a task's messages
  // Dialogs: their regions are the whole overlay, so the camera frames each panel by its measured box.
  const FORK_MODAL = [520, 230, 450, 370];
  const MERGE_MODAL = [520, 280, 450, 280];
  const RESET_MODAL = [520, 250, 450, 340];
  const AUTO = [480, 100, 900, 470]; // the auto-allow list, under the settings title
  const AUTO_LIST = [550, 190, 804, 310];

  // 01 One workspace per project
  sc.show('new-typed', start('ws-create'), { fade: 0 }).cut(start('ws-create'), { region: 'form', by: 20 });
  sc.callout(at('ws-create', 2.4), at('ws-create', 4.0), 'name', { label: 'one project, one workspace', side: 'below' });
  sc.callout(at('ws-create', 4.2), at('ws-create', 5.8), 'dir', { label: "its repo's folder", side: 'below' });
  sc.show('new-backend', at('ws-create', 6.0), { fade: 0.25 });
  sc.callout(at('ws-create', 6.4), end('ws-create') - 0.2, 'picker', { label: 'Coding, then Backend', side: 'below' });
  sc.look(start('ws-mission'), [200, 395, 640, 380], { dur: 0.8 });
  sc.callout(at('ws-mission', 1.2), at('ws-mission', 3.6), 'mission', { label: 'how its agent works', side: 'right' });
  sc.callout(at('ws-mission', 3.8), end('ws-mission') - 0.3, { region: 'mission', y: 0.18, h: 0.49 }, { label: 'tests, safe migrations', side: 'left' });
  sc.show('billing-offline', start('ws-connect'), { fade: 0.3 }).look(start('ws-connect'), 'window', { dur: 0.6 });
  sc.callout(at('ws-connect', 0.8), at('ws-connect', 2.2), 'connect', { label: 'the setup guide', side: 'below' });
  sc.click(at('ws-connect', 2.4), 'connect');
  sc.show('setup-claude', at('ws-connect', 2.6), { fade: 0.25 }).away(at('ws-connect', 2.8));
  sc.look(at('ws-connect', 2.6), [330, 120, 1080, 420], { dur: 0.6 });
  sc.callout(at('ws-connect', 3.4), at('ws-connect', 5.4), 'tabs', { label: 'a tab for each agent', side: 'below' });
  sc.show('setup-codex', at('ws-connect', 5.6), { fade: 0.25 }).look(at('ws-connect', 5.6), [330, 90, 1080, 560], { dur: 0.7 });
  sc.callout(at('ws-connect', 6.5), end('ws-connect') - 0.3, 'title', { label: 'Codex: the exact commands', side: 'above' });
  sc.show('home-online', start('ws-online'), { fade: 0.3 }).cut(start('ws-online'), [0, 0, 1060, 330]);
  sc.callout(at('ws-online', 0.8), at('ws-online', 3.4), 'billing', { label: 'billing: online', side: 'below' });
  sc.callout(at('ws-online', 4.0), at('ws-online', 6.4), 'billing', { label: 'codex', side: 'below' });
  sc.callout(at('ws-online', 6.6), end('ws-online') - 0.3, 'storefront', { label: 'claude-code', side: 'below' });
  sc.show('task-typed', start('ws-tasks'), { fade: 0.3 }).cut(start('ws-tasks'), { region: 'form', by: 30 });
  sc.callout(at('ws-tasks', 0.6), at('ws-tasks', 2.0), 'title');
  sc.callout(at('ws-tasks', 0.6), at('ws-tasks', 2.0), { region: 'body', h: 0.45 }, { label: 'a task for billing', side: 'below' });
  sc.click(at('ws-tasks', 2.2), 'send');
  sc.show('task-billing', at('ws-tasks', 2.4), { fade: 0.25 }).away(at('ws-tasks', 2.6));
  sc.look(at('ws-tasks', 2.4), CHAT, { dur: 0.6 });
  sc.callout(at('ws-tasks', 3.2), at('ws-tasks', 5.0), 'reply', { label: "billing's agent, on it", side: 'below' });
  sc.show('home-detailed', at('ws-tasks', 5.2), { fade: 0.3 }).look(at('ws-tasks', 5.2), [0, 0, 1060, 380], { dur: 0.6 });
  sc.callout(at('ws-tasks', 6.0), at('ws-tasks', 7.2), 'billing', { label: 'here', side: 'below' });
  sc.callout(at('ws-tasks', 7.4), end('ws-tasks') - 0.3, 'storefront', { label: 'never here', side: 'below' });
  sc.show('fork-menu', start('ws-fork'), { fade: 0.3 }).cut(start('ws-fork'), [0, 120, 700, 400]);
  sc.callout(at('ws-fork', 1.6), at('ws-fork', 3.0), 'fork', { label: 'Fork workspace', side: 'right' });
  sc.click(at('ws-fork', 3.2), 'fork');
  sc.show('fork-modal', at('ws-fork', 3.4), { fade: 0.25 }).away(at('ws-fork', 3.6));
  sc.look(at('ws-fork', 3.4), FORK_MODAL, { dur: 0.6 });
  sc.callout(at('ws-fork', 4.2), at('ws-fork', 6.0), 'text', { label: 'its own queue and agent', side: 'below' });
  sc.click(at('ws-fork', 6.2), 'go');
  sc.show('fork-memory', at('ws-fork', 6.4), { fade: 0.25 }).away(at('ws-fork', 6.6));
  sc.look(at('ws-fork', 6.4), [330, 60, 1080, 400], { dur: 0.6 });
  sc.callout(at('ws-fork', 7.2), at('ws-fork', 8.4), 'banner', { label: 'the same memory and skills', side: 'below' });
  sc.callout(at('ws-fork', 8.6), end('ws-fork') - 0.3, 'link', { label: "billing's note, here too", side: 'below' });
  sc.show('merge-menu', start('ws-merge'), { fade: 0.3 }).cut(start('ws-merge'), [0, 120, 700, 400]);
  sc.callout(at('ws-merge', 0.6), at('ws-merge', 1.8), 'merge', { label: 'merge it back', side: 'right' });
  sc.click(at('ws-merge', 2.0), 'merge');
  sc.show('merge-modal', at('ws-merge', 2.2), { fade: 0.25 }).away(at('ws-merge', 2.4));
  sc.look(at('ws-merge', 2.2), MERGE_MODAL, { dur: 0.6 });
  sc.callout(at('ws-merge', 3.0), at('ws-merge', 4.4), 'message', { label: 'agent stops, tasks move back', side: 'below' });
  sc.show('merged', at('ws-merge', 4.6), { fade: 0.3 }).look(at('ws-merge', 4.6), [100, 150, 700, 420], { dur: 0.6 });
  sc.callout(at('ws-merge', 5.4), end('ws-merge') - 0.3, 'refunds', { label: 'back in billing', side: 'right' });

  // 02 A key per workspace
  sc.show('setup-key', start('key-scope'), { fade: 0 }).cut(start('key-scope'), { region: 'config', by: 30 });
  sc.callout(at('key-scope', 0.8), at('key-scope', 4.4), 'config', { label: 'a token for billing alone', side: 'below' });
  sc.show('danger', start('key-reset'), { fade: 0.3 }).cut(start('key-reset'), { region: 'reset', by: 60 });
  sc.callout(at('key-reset', 1.4), at('key-reset', 3.4), 'reset', { label: 'Reset Workspace ID', side: 'below' });
  sc.click(at('key-reset', 3.6), 'reset');
  sc.show('reset-modal', at('key-reset', 3.8), { fade: 0.25 }).away(at('key-reset', 4.0));
  sc.look(at('key-reset', 3.8), RESET_MODAL, { dur: 0.6 });
  sc.callout(at('key-reset', 4.6), end('key-reset') - 0.3, 'text', { label: 'every old token stops', side: 'below' });

  // 03 Memory
  sc.show('new-create', start('mem-loop'), { fade: 0 }).cut(start('mem-loop'), { region: 'learning', by: 40 });
  sc.callout(at('mem-loop', 0.6), at('mem-loop', 3.6), 'learning', { label: 'in every workspace', side: 'left' });
  sc.callout(at('mem-loop', 3.8), end('mem-loop') - 0.3, { region: 'learning', h: 0.45 }, { label: 'before a task is done', side: 'left' });
  sc.show('learning-rule', start('mem-rule'), { fade: 0.3 }).cut(start('mem-rule'), { region: 'learning', by: 40 });
  sc.callout(at('mem-rule', 0.6), end('mem-rule') - 0.3, { region: 'learning', y: 0.7, h: 0.3 }, { label: 'the rule, not the story', side: 'below' });
  sc.show('mem-saved', start('mem-save'), { fade: 0.3 }).cut(start('mem-save'), CHAT);
  sc.callout(at('mem-save', 0.6), at('mem-save', 3.4), 'found', { label: 'an hour to find', side: 'below' });
  sc.callout(at('mem-save', 3.6), end('mem-save') - 0.3, 'loop', { label: 'one rule, saved', side: 'above' });
  sc.show('memories', start('mem-index'), { fade: 0.3 }).cut(start('mem-index'), [330, 60, 1080, 360]);
  sc.callout(at('mem-index', 0.6), at('mem-index', 3.6), 'body', { label: 'the index', side: 'below' });
  sc.click(at('mem-index', 4.6), 'link');
  sc.show('memory-note', at('mem-index', 4.8), { fade: 0.25 }).away(at('mem-index', 5.0));
  sc.callout(at('mem-index', 5.4), end('mem-index') - 0.3, 'body', { label: 'the note, in place', side: 'below' });
  sc.show('mem-next', start('mem-next'), { fade: 0.3 }).cut(start('mem-next'), CHAT);
  sc.callout(at('mem-next', 1.6), at('mem-next', 6.4), 'reply', { label: 'memory first', side: 'below' });
  sc.callout(at('mem-next', 6.6), end('mem-next') - 0.3, 'reply', { label: 'right port, no hour lost', side: 'below' });
  sc.show('mem-conflict', start('mem-safe'), { fade: 0.3 }).cut(start('mem-safe'), CHAT);
  sc.callout(at('mem-safe', 2.6), at('mem-safe', 5.9), 'refused', { label: 'refused, loaded again', side: 'below' });
  // On "merges, and saves": the index holds the fork's note and billing's, nothing overwritten.
  sc.show('memories-full', at('mem-safe', 6.1), { fade: 0.3 }).cut(at('mem-safe', 6.1), [330, 60, 1080, 360]);
  sc.callout(at('mem-safe', 6.4), end('mem-safe') - 0.3, 'body', { label: 'nothing overwritten', side: 'below' });

  // 04 Skills
  sc.show('skills-import', start('skill-import'), { fade: 0 }).cut(start('skill-import'), [330, 60, 1080, 420]);
  sc.callout(at('skill-import', 0.6), at('skill-import', 2.4), 'grid', { label: 'skills in your account', side: 'below' });
  sc.callout(at('skill-import', 2.6), at('skill-import', 5.0), 'url', { label: 'import from GitHub', side: 'below' });
  sc.callout(at('skill-import', 5.2), end('skill-import') - 0.3, 'release', { label: 'written by an agent', side: 'below' });
  sc.show('skill-page', start('skill-on'), { fade: 0.3 }).cut(start('skill-on'), { region: 'workspaces', by: 60 });
  sc.callout(at('skill-on', 0.6), at('skill-on', 3.0), 'workspaces', { label: 'on, per workspace', side: 'below' });
  sc.click(at('skill-on', 3.4), 'shop');
  sc.show('skill-page-on', at('skill-on', 3.6), { fade: 0.25 }).away(at('skill-on', 3.8));
  sc.callout(at('skill-on', 4.2), end('skill-on') - 0.3, 'shop', { label: 'storefront: on, one copy', side: 'below' });
  sc.show('skill-use', start('skill-use'), { fade: 0.3 }).cut(start('skill-use'), CHAT);
  sc.callout(at('skill-use', 1.2), end('skill-use') - 0.3, 'reply', { label: 'found it, followed it', side: 'below' });
  sc.show('skill-fix', start('skill-fix'), { fade: 0.3 }).cut(start('skill-fix'), CHAT);
  sc.callout(at('skill-fix', 0.6), at('skill-fix', 3.0), 'found', { label: 'a missing step', side: 'below' });
  sc.callout(at('skill-fix', 3.2), at('skill-fix', 6.0), 'saved', { label: 'version 2', side: 'above' });
  sc.show('skill-v2', at('skill-fix', 6.2), { fade: 0.3 }).look(at('skill-fix', 6.2), [620, 380, 760, 300], { dur: 0.6 }); // room left of the list for the label
  sc.callout(at('skill-fix', 7.0), end('skill-fix') - 0.3, 'step', { label: 'storefront has it too', side: 'left' });

  // 05 You stay in control
  sc.show('docs-auto', start('ctl-settings'), { fade: 0 }).cut(start('ctl-settings'), AUTO);
  sc.callout(at('ctl-settings', 1.4), at('ctl-settings', 5.4), AUTO_LIST, { label: 'docs: npm and git, no asking', side: 'below' });
  sc.show('billing-auto', at('ctl-settings', 5.6), { fade: 0.3 });
  sc.callout(at('ctl-settings', 6.2), end('ctl-settings') - 0.3, AUTO_LIST, { label: 'billing: asks you first', side: 'below' });
  sc.show('ctl-skill', start('ctl-skills'), { fade: 0.3 }).cut(start('ctl-skills'), CHAT);
  sc.callout(at('ctl-skills', 0.8), end('ctl-skills') - 0.3, 'reply', { label: 'not on here: refused', side: 'below' });
  sc.show('learning-docs', start('ctl-learning'), { fade: 0.3 }).cut(start('ctl-learning'), { region: 'learning', by: 40 });
  sc.callout(at('ctl-learning', 0.8), end('ctl-learning') - 0.3, 'learning', { label: "docs' own loop", side: 'above' });

  // Recap: one screen for each promise.
  sc.show('home-online', start('recap'), { fade: 0.4 }).cut(start('recap'), [0, 0, 1060, 330]);
  sc.callout(at('recap', 0.4), at('recap', 2.2), { region: 'billing' }, { label: 'a workspace per project', side: 'below' });
  sc.show('setup-key', at('recap', 2.4), { fade: 0.3 }).cut(at('recap', 2.4), { region: 'config', by: 30 });
  sc.callout(at('recap', 2.6), at('recap', 4.2), 'config', { label: 'a key for each', side: 'below' });
  sc.show('mem-next', at('recap', 4.4), { fade: 0.3 }).cut(at('recap', 4.4), CHAT);
  sc.callout(at('recap', 4.6), at('recap', 6.6), 'reply', { label: 'memory, read first', side: 'below' });
  sc.show('skill-v2', at('recap', 6.8), { fade: 0.3 }).cut(at('recap', 6.8), { region: 'body', by: 30 });
  sc.callout(at('recap', 7.0), end('recap') - 0.3, 'body', { label: 'one copy of every playbook', side: 'below' });

  sc.visible([
    [start('ws-create'), end('ws-merge')],
    [start('key-scope'), end('key-reset')],
    [start('mem-loop'), end('mem-safe')],
    [start('skill-import'), end('skill-fix')],
    [start('ctl-settings'), end('recap')],
  ]).build();
  // Over the screen, after it: the real 401 for billing's token on another workspace.
  s.add(terminal(s, at('key-scope', 4.6), end('key-scope') - 0.1));

  // The chapter, in a corner, while its screens show.
  chapterChips(s, [['01 / ONE WORKSPACE PER PROJECT', 'ws-create', 'ws-merge'], ['02 / A KEY PER WORKSPACE', 'key-scope', 'key-reset'], ['03 / MEMORY', 'mem-loop', 'mem-safe'],
    ['04 / SKILLS', 'skill-import', 'skill-fix'], ['05 / YOU STAY IN CONTROL', 'ctl-settings', 'ctl-learning']].map(([label, a, z]) => [label, start(a), end(z)]));

  captions(s, tl, { band: BAND, size: 28, chars: 72, lineGap: 32, baseline: 51 });
  return s;
};
