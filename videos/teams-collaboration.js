// AgentRQ Teams, narrated, about six and a half minutes: each chapter opens on a
// pain in the house style (ground, mascots, pixel art), then shows the fix on real
// screens of the app, captured with src/capture.js from a local AgentRQ where Ada,
// Ben and Chen share their storefront workspaces in a team called Platform. Every
// state on screen was played for real, in the UI and through each agent's MCP
// calls. The captures and their regions are in videos/screens/teams-collaboration.
// Build: node bin/video.js videos/teams-collaboration.js --size 3840x2160
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { el, g } from '../src/index.js';
import { C, mascotByName, mascot } from '../kit/agentrq.js';
import { loadTimeline, beatsById, videoScene, showDuring, captions, VW } from './lib.js';
import { BAND, LIFT, ARTX, collect, groundStrip, pane, bubbleLine, doc, tagChip, arrow, from, addCards, chapterChips } from './house.js';
import { Screen, loadShots } from './screen.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IDS = JSON.parse(fs.readFileSync(path.join(dir, 'teams-collaboration.narration.json'), 'utf8')).lines.map((l) => l.id);
export const SHOTS = path.join(dir, 'screens/teams-collaboration');

// Ada's, Ben's and Chen's agents.
const NAMES = ['claude', 'codex', 'agy'];
const MX = (i) => 700 + i * 200;
const ADA = mascotByName('claude').color;
const BEN = mascotByName('codex').color;
const CHEN = mascotByName('agy').color;

// ---------------------------------------------------------------- the cards' art

// A switch, off until `t` and on from then.
function toggle(s, x, y, t) {
  const sw = (on) => g({},
    el('rect', { x, y, width: 44, height: 24, rx: 12, fill: on ? C.ongoing : C.line }),
    el('circle', { cx: on ? x + 32 : x + 12, cy: y + 12, r: 8, fill: on ? C.text : C.notstarted }));
  return g({}, sw(false), from(s, sw(true), t));
}

// Monday Ben's agent cracks a flaky build in two hours; Tuesday Ada's starts again.
export function artTwoAfternoons(s, at) {
  const lines = (x, t0, last, fill) => ['the build flakes again', 'retry it... still red', last].map((text, i) =>
    from(s, bubbleLine(s, { x: x + 12, y: 112 + i * 36, w: 262, text, fill: i === 2 ? fill : undefined }), t0 + i * 1.0));
  const t1 = at('hook', 0.8);
  const t2 = at('hook', 4.6);
  return g({},
    pane(s, { x: ARTX, y: 70, w: 286, h: 230, title: 'MONDAY / BEN', color: BEN }),
    pane(s, { x: ARTX + 304, y: 70, w: 286, h: 230, title: 'TUESDAY / ADA', color: ADA }),
    ...lines(ARTX, t1, 'cleared the cache: green', '#14532d'),
    ...lines(ARTX + 304, t2, 'where do I even start?', '#713f12'),
    from(s, tagChip(s, '2 hours', { x: ARTX + 12, y: 260, fill: C.ask }), t1 + 3.0),
    from(s, tagChip(s, '2 hours, again', { x: ARTX + 316, y: 260, fill: C.blocked, color: C.text }), t2 + 2.6),
    from(s, g({ transform: `translate(${ARTX + 150} 254)` }, doc(s, 'the fix', { w: 110, fill: '#bbf7d0', ink: '#14532d' })), at('pain', 0.8)),
    ...['one chat', 'one laptop', 'found twice'].map((label, i) =>
      from(s, tagChip(s, label, { x: 40 + [0, 132, 284][i], y: 320, fill: [C.ask, '#fb923c', C.blocked][i], color: i === 2 ? C.text : C.ink }), at('pain', 0.8 + i * 1.6))));
}

// The promise: a team, and a switch for each part of a workspace.
export function artPromise(s, at) {
  const members = [['Ada Park', ADA], ['Ben Okafor', BEN], ['Chen Wei', CHEN]];
  const parts = ['tasks', 'memory', 'skills', 'Pano docs'];
  return g({},
    el('rect', { x: ARTX, y: 70, width: 270, height: 280, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    s.text('PLATFORM', { x: ARTX + 20, y: 104, font: 'pixel', size: 18, fill: C.lit }),
    ...members.map(([name, color], i) => g({},
      el('rect', { x: ARTX + 20, y: 132 + i * 52, width: 230, height: 40, fill: C.card, stroke: C.line, class: 'px' }),
      el('rect', { x: ARTX + 32, y: 146 + i * 52, width: 12, height: 12, fill: color, class: 'px' }),
      s.text(name, { x: ARTX + 56, y: 157 + i * 52, font: 'semi', size: 15, fill: C.text }))),
    s.text('a team, no admins', { x: ARTX + 20, y: 330, font: 'body', size: 15, fill: C.dim }),
    el('rect', { x: 860, y: 70, width: 300, height: 280, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    s.text('YOU CHOOSE', { x: 880, y: 104, font: 'pixel', size: 18, fill: C.lit }),
    ...parts.map((label, i) => g({},
      s.text(label, { x: 880, y: 152 + i * 44, font: 'semi', size: 17, fill: C.text }),
      toggle(s, 1094, 135 + i * 44, at('promise', 3.4 + i * 1.3)))),
    s.text('per workspace', { x: 880, y: 330, font: 'body', size: 15, fill: C.dim }));
}

// A login on a sticky note, and an admin busy for a week.
function artSharedLogin(s, at) {
  const t = at('setup-pain', 3.2);
  const note = g({ transform: `translate(${ARTX + 20} 84) rotate(-4)` },
    el('rect', { width: 200, height: 150, fill: '#fef08a', class: 'px' }),
    el('rect', { x: 76, y: -8, width: 48, height: 14, fill: '#ffffff66', class: 'px' }),
    s.text('team login', { x: 18, y: 44, font: 'semi', size: 18, fill: '#27272a' }),
    s.text('user: team@', { x: 18, y: 80, font: 'mono', size: 14, fill: '#27272a' }),
    s.text('pw: hunter2', { x: 18, y: 106, font: 'mono', size: 14, fill: '#27272a' }));
  const cross = g({}, ...[0, 1].map((k) => el('rect', { x: ARTX + 30, y: 152, width: 200, height: 12, fill: C.blocked, class: 'px', transform: `rotate(${k ? -32 : 32} ${ARTX + 130} 158)` })));
  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  return g({},
    note, from(s, cross, t + 0.6),
    el('rect', { x: ARTX + 270, y: 70, width: 320, height: 220, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    s.text('ADMIN SETUP', { x: ARTX + 290, y: 102, font: 'pixel', size: 14, fill: C.ask }),
    ...DAYS.map((d, i) => g({},
      s.text(d, { x: ARTX + 314 + i * 56, y: 136, font: 'pixel', size: 11, fill: C.dim, anchor: 'middle' }),
      el('rect', { x: ARTX + 292 + i * 56, y: 148, width: 44, height: 100, fill: C.card, stroke: C.line, class: 'px' }),
      from(s, el('rect', { x: ARTX + 296 + i * 56, y: 152, width: 36, height: 92, fill: '#713f12', class: 'px' }), t + 1.2 + i * 0.5))),
    from(s, tagChip(s, 'still setting up', { x: ARTX + 360, y: 260, fill: C.ask }), t + 4.0));
}

// Standup: asking what Ben's agent is on, and scrolling back through old chats.
function artStandup(s, at) {
  const scroll = s.anim(g({}, ...Array.from({ length: 8 }, (_, i) =>
    el('rect', { x: ARTX + 322, y: 112 + i * 20, width: [220, 180, 240, 150, 200, 230, 170, 210][i], height: 8, fill: C.line, class: 'px' }))),
  [[0, { y: 0 }], [1, { y: -20 }, 'linear']], { period: 1 });
  const dots = [0, 1, 2].map((d) => s.anim(el('rect', { x: ARTX + 322 + d * 12, y: 278, width: 6, height: 6, fill: C.dim, class: 'px' }),
    [[0, { opacity: 0.3 }], [0.25 + d * 0.25, { opacity: 1 }, 'step'], [1, { opacity: 0.3 }]], { period: 1 }));
  return g({},
    pane(s, { x: ARTX, y: 70, w: 286, h: 230, title: 'ADA', color: ADA }),
    pane(s, { x: ARTX + 304, y: 70, w: 286, h: 230, title: 'BEN / CODEX', color: BEN }),
    scroll, ...dots,
    from(s, bubbleLine(s, { x: ARTX + 60, y: 112, w: 214, text: 'what is your agent on?', you: true }), at('tasks-pain', 1.8)),
    from(s, bubbleLine(s, { x: ARTX + 60, y: 148, w: 214, text: 'the signup bug? the cart?', you: true }), at('tasks-pain', 3.0)),
    from(s, bubbleLine(s, { x: ARTX + 12, y: 196, w: 214, text: 'scrolling old chats...', fill: '#713f12' }), at('tasks-pain', 4.4)),
    from(s, g({ transform: `translate(${ARTX + 240} 240)` }, arrow()), at('tasks-pain', 4.6)));
}

// Monday's fix, gone when the session ends; Tuesday starts with nothing.
function artLost(s, at) {
  const t = at('memory-pain', 4.4);
  const fix = g({ transform: `translate(${ARTX + 24} 124)` }, doc(s, 'flaky-build fix', { w: 160, fill: '#bbf7d0', ink: '#14532d' }));
  return g({},
    pane(s, { x: ARTX, y: 70, w: 286, h: 230, title: 'MONDAY SESSION', color: BEN }),
    pane(s, { x: ARTX + 304, y: 70, w: 286, h: 230, title: 'TUESDAY SESSION', color: ADA }),
    s.anim(fix, [[0, { opacity: 1 }], [t, { opacity: 1 }], [t + 0.8, { opacity: 0.12 }]]),
    from(s, tagChip(s, 'session closed', { x: ARTX + 24, y: 240, fill: C.blocked, color: C.text }), t + 0.6),
    from(s, g({},
      s.text('?', { x: ARTX + 447, y: 200, font: 'pixel', size: 64, fill: C.ask, anchor: 'middle' }),
      s.text('nothing remembered', { x: ARTX + 447, y: 246, font: 'body', size: 15, fill: C.dim, anchor: 'middle' })), t + 1.4));
}

// Three copies of one release skill, each a little different.
function artDrift(s, at) {
  const COPIES = [['ADA', ADA, 4, [2]], ['BEN', BEN, 3, []], ['CHEN', CHEN, 5, [1, 4]]];
  return g({}, ...COPIES.map(([who, color, steps, odd], i) => {
    const x = ARTX + i * 204;
    const t = at('skills-pain', 2.6 + i * 0.9);
    return from(s, g({},
      el('rect', { x, y: 70, width: 186, height: 230, fill: '#fef3c7', class: 'px' }),
      el('rect', { x: x + 166, y: 70, width: 20, height: 20, fill: C.panel, class: 'px' }),
      s.text(who, { x: x + 14, y: 98, font: 'pixel', size: 13, fill: color === BEN ? '#27272a' : color }),
      s.text('release.md', { x: x + 14, y: 122, font: 'mono', size: 13, fill: '#78350f' }),
      ...Array.from({ length: steps }, (_, k) => g({},
        s.text(`${k + 1}.`, { x: x + 14, y: 156 + k * 26, font: 'mono', size: 12, fill: '#78350f' }),
        el('rect', { x: x + 38, y: 148 + k * 26, width: [110, 90, 120, 80, 100][k], height: 8, fill: odd.includes(k) ? '#f97316' : '#78350f55', class: 'px' }))),
      from(s, tagChip(s, ['v? 4 steps', 'v? 3 steps', 'v? 5 steps'][i], { x: x + 14, y: 262, fill: C.blocked, color: C.text }), at('skills-pain', 5.6 + i * 0.4))), t);
  }));
}

// Share the whole board, drafts and all, or paste a copy that goes stale.
function artBoardOrCopy(s, at) {
  const note = (x, y, fill, label, rot) => g({ transform: `translate(${x} ${y}) rotate(${rot})` },
    el('rect', { width: 120, height: 92, fill, class: 'px' }),
    el('rect', { x: 42, y: -6, width: 36, height: 12, fill: '#ffffff66', class: 'px' }),
    s.text(label, { x: 10, y: 30, font: 'semi', size: 13, fill: '#27272a' }),
    el('rect', { x: 10, y: 46, width: 90, height: 4, fill: '#00000022', class: 'px' }),
    el('rect', { x: 10, y: 58, width: 66, height: 4, fill: '#00000022', class: 'px' }));
  const t = at('docs-pain', 4.8);
  return g({},
    pane(s, { x: ARTX, y: 70, w: 300, h: 240, title: 'ADA / PANO', color: ADA }),
    note(ARTX + 18, 110, '#bbf7d0', 'launch plan', -3),
    note(ARTX + 160, 108, '#fbcfe8', 'draft: loyalty', 3),
    note(ARTX + 88, 206, '#fef08a', 'notes: budget', -2),
    from(s, tagChip(s, 'not ready', { x: ARTX + 168, y: 176, fill: C.blocked, color: C.text }), t),
    from(s, tagChip(s, 'not ready', { x: ARTX + 96, y: 274, fill: C.blocked, color: C.text }), t + 0.4),
    pane(s, { x: ARTX + 330, y: 70, w: 260, h: 240, title: 'PLATFORM', color: C.lit }),
    s.anim(g({}, doc(s, 'plan (copy)', { w: 120, fill: '#bbf7d0', ink: '#14532d' }), g({ transform: 'translate(96 18)' }, arrow())),
      [[0, { x: ARTX + 24, y: 136, opacity: 0 }], [at('docs-pain', 2.0), { opacity: 1 }, 'step'], [at('docs-pain', 3.4), { x: ARTX + 354, y: 136 }, 'inOut']]),
    from(s, tagChip(s, 'stale by Friday', { x: ARTX + 354, y: 186, fill: C.ask }), at('docs-pain', 6.0)),
    from(s, tagChip(s, 'or share it all?', { x: ARTX + 354, y: 226, fill: '#fb923c' }), at('docs-pain', 6.6)));
}

// Day one: Chen's agent, an empty memory, and questions in chat.
function artDayOne(s, at) {
  const ASKS = ['which build cache?', 'how do we release?', 'where is the plan?', 'who owns checkout?'];
  return g({},
    pane(s, { x: ARTX, y: 70, w: 590, h: 240, title: 'CHEN / ANTIGRAVITY, DAY ONE', color: CHEN }),
    g({ transform: `translate(${ARTX + 20} 108)` }, doc(s, 'memory.md', { w: 130 })),
    s.text('(empty)', { x: ARTX + 20, y: 162, font: 'mono', size: 13, fill: C.dim }),
    ...ASKS.map((text, i) => from(s, bubbleLine(s, { x: ARTX + 250 + (i % 2) * 40, y: 108 + i * 44, w: 250, text, fill: '#713f12' }), at('hire-pain', 1.6 + i * 1.1))),
    from(s, tagChip(s, 'weeks of questions', { x: 40, y: 320, fill: C.ask }), at('hire-pain', 5.4)));
}

// The end card: the question to answer, and where to try it.
function artEnd(s) {
  return g({},
    s.text('agentrq.com', { x: 860, y: 200, font: 'bold', size: 64, fill: C.text, anchor: 'middle', spacing: -1.5 }),
    s.text('Teams: tasks, memory, skills and Pano docs', { x: 860, y: 244, font: 'body', size: 20, fill: C.dim, anchor: 'middle' }),
    el('rect', { x: 620, y: 290, width: 480, height: 54, fill: C.panel, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
    s.text('What has your agent learned?', { x: 860, y: 324, font: 'semi', size: 18, fill: C.lit, anchor: 'middle' }));
}

// ---------------------------------------------------------------- the video

export default () => {
  const tl = loadTimeline();
  const { at, start, end } = beatsById(tl, IDS);

  const s = videoScene({
    tl,
    ground: false,
    poster: at('team-tasks', 6),
    thumbnail: at('memory-read', 3),
    description: 'AgentRQ Teams, narrated over real screens of the app: Ada creates a team and invites Ben by link, each shares a storefront workspace and the two become one team workspace with live tasks, Ben\'s agent saves a fix to its memory that Ada\'s agent reads the next day, the team\'s release skill goes from version one to two in one place, Ada shares one Pano doc and unshares it, a new hire\'s agent gets it right on the first task, and every share has its own switch.',
  });
  groundStrip(s);

  // ------------------------------------------------ cards
  const CARDS = [
    { span: [0, end('pain')], kicker: 'ONE TEAM, MANY AGENTS', headline: ['Same bug.', 'Two afternoons.'], sub: 'The fix lived in one chat, on one laptop.', art: artTwoAfternoons },
    { span: [start('promise'), end('promise')], kicker: 'AGENTRQ TEAMS', headline: ['Share what', 'you choose.'], sub: 'Tasks, memory, skills and Pano docs.', art: artPromise },
    { span: [start('setup-pain'), end('setup-pain')], kicker: '01 / SET UP', headline: ['One shared login?', 'Never.'], sub: 'Nor an admin busy for days.', art: artSharedLogin },
    { span: [start('tasks-pain'), end('tasks-pain')], kicker: '02 / SEE THE TEAM', headline: ['What is your agent', 'doing right now?'], sub: 'Everyone asks. Everyone scrolls.', art: artStandup },
    { span: [start('memory-pain'), end('memory-pain')], kicker: '03 / MEMORY', headline: ['Solved once.', 'Lost by Tuesday.'], sub: 'The lesson stays in one session.', art: artLost },
    { span: [start('skills-pain'), end('skills-pain')], kicker: '04 / SKILLS', headline: ['Three copies.', 'Three versions.'], sub: 'Every copy has quietly drifted.', art: artDrift },
    { span: [start('docs-pain'), end('docs-pain')], kicker: '05 / PANO DOCS', headline: ['Whole board,', 'or a stale copy?'], sub: 'Her drafts are not ready for anyone.', art: artBoardOrCopy },
    { span: [start('hire-pain'), end('hire-pain')], kicker: '06 / NEW HIRE', headline: ['Day one.', 'Knows nothing.'], sub: 'Every lesson, learned again.', art: artDayOne },
    { span: [start('cta'), tl.end], kicker: 'TRY IT', headline: ['Solve it once.', 'The team keeps it.'], sub: 'Share what you choose, per workspace.', art: artEnd },
  ];
  addCards(s, CARDS, at);

  // The mascots, Ada's, Ben's and Chen's agents, stand under every card and react to its story.
  const cardSpans = CARDS.map((c) => c.span);
  const sp = (id, a = 1, z) => [at(id, a), z === undefined ? end(id) - 0.2 : at(id, z)];
  const BEHAVE = {
    claude: {
      work: [sp('hook', 4.6, 7.4), sp('memory-pain', 0.9, 4.2)],
      ask: [sp('pain', 0.6), sp('tasks-pain', 1.8), sp('memory-pain', 4.6)],
      alert: [sp('setup-pain', 3.2)],
      done: [sp('promise', 1), sp('cta', 1)],
    },
    codex: {
      work: [sp('hook', 0.6, 3.6), sp('tasks-pain', 0.8)],
      done: [sp('hook', 3.8, 7.4), sp('promise', 1.3), sp('cta', 1.3)],
      alert: [sp('setup-pain', 3.6)],
      ask: [sp('skills-pain', 2.6), sp('docs-pain', 1.8)],
    },
    agy: {
      ask: [sp('skills-pain', 4.4), sp('hire-pain', 1.2)],
      done: [sp('promise', 1.6), sp('cta', 1.6)],
      say: [['zZ', [sp('hook', 0.5, 7.6), sp('pain', 0.2)]]],
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
  const CHAT = [470, 100, 950, 300]; // a task's agent messages
  const MODAL = [470, 262, 500, 290]; // a dialog over the page
  const CLONE = [470, 210, 500, 390]; // the taller clone dialog

  // 01 Set up
  sc.show('team-new', start('create'), { fade: 0 }).cut(start('create'), { region: 'form', by: 40 });
  sc.callout(at('create', 3.2), at('create', 4.6), 'name', { label: 'type a name', side: 'below' });
  sc.click(at('create', 4.9), 'create');
  sc.show('team-created', at('create', 5.1), { fade: 0.25 }).away(at('create', 5.3));
  sc.look(at('create', 5.1), [80, 100, 900, 150], { dur: 0.6 });
  sc.callout(at('create', 5.9), end('create') - 0.3, { region: 'rows', w: 0.5 }, { label: 'its first member', side: 'below' });
  sc.show('invite-typed', start('invite'), { fade: 0.3 }).cut(start('invite'), { region: 'form', by: 30 });
  sc.callout(at('invite', 0.8), at('invite', 3.4), 'email', { label: 'a teammate, by email', side: 'below' });
  sc.click(at('invite', 3.7), 'send');
  sc.show('invite-link', at('invite', 3.9), { fade: 0.3 }).away(at('invite', 4.1));
  sc.look(at('invite', 3.9), [480, 265, 520, 290], { dur: 0.7 });
  sc.callout(at('invite', 4.8), end('invite') - 0.3, 'link', { label: 'a link to send', side: 'below' });
  sc.show('invite-accept', start('accept'), { fade: 0.3 }).cut(start('accept'), { region: 'card', by: 40 });
  sc.click(at('accept', 2.0), 'accept');
  sc.show('ben-joined', at('accept', 2.3), { fade: 0.3 }).away(at('accept', 2.5));
  sc.look(at('accept', 2.3), 'window', { dur: 0.8 });
  sc.callout(at('accept', 3.2), at('accept', 5.8), 'banner', { label: 'Ben, with his own account', side: 'above' });
  sc.callout(at('accept', 6.0), end('accept') - 0.3, [84, 100, 380, 64], { label: 'nothing shared yet', side: 'right' });
  sc.show('members', start('members'), { fade: 0.3 }).cut(start('members'), [340, 120, 1030, 170]);
  sc.callout(at('members', 0.7), at('members', 2.6), [354, 154, 1004, 114], { label: 'two members', side: 'below' });
  sc.callout(at('members', 2.8), end('members') - 0.3, 'remove', { label: 'any member can remove', side: 'below' });
  sc.show('activity', start('activity'), { fade: 0.3 }).cut(start('activity'), { region: 'list', by: 16 });
  sc.callout(at('activity', 1.0), end('activity') - 0.3, 'list', { label: 'who did what', side: 'below' });

  // 02 See the team
  sc.show('share-off', start('share'), { fade: 0 }).cut(start('share'), [90, 110, 1290, 290]);
  sc.callout(at('share', 0.8), at('share', 2.6), 'tabs', { label: 'team settings', side: 'below' });
  sc.click(at('share', 3.8), [1314, 341, 44, 24]);
  sc.show('share-on', at('share', 4.0), { fade: 0.25 }).away(at('share', 4.2));
  sc.callout(at('share', 4.3), at('share', 5.2), [354, 329, 1004, 48], { label: 'storefront, on', side: 'below' });
  sc.callout(at('share', 5.4), end('share') - 0.3, 'list', { label: 'one switch per workspace', side: 'below' });
  sc.show('activity-merged', start('merge'), { fade: 0.3 }).cut(start('merge'), { region: 'list', by: 16 });
  sc.callout(at('merge', 0.7), at('merge', 2.7), 'top', { label: 'Ben shares his storefront', side: 'below' });
  sc.callout(at('merge', 2.9), at('merge', 5.4), [354, 154, 1004, 78], { label: 'same name: one team workspace', side: 'below' });
  sc.callout(at('merge', 5.6), end('merge') - 0.3, [354, 244, 1004, 33], { label: 'nothing to configure', side: 'below' });
  sc.show('team-tasks', start('team-tasks'), { fade: 0.3 }).cut(start('team-tasks'), [70, -20, 800, 430]);
  sc.callout(at('team-tasks', 1.4), at('team-tasks', 4.6), 'owner0', { label: "the owner's name", side: 'right' });
  sc.callout(at('team-tasks', 1.8), at('team-tasks', 4.6), 'owner1');
  sc.callout(at('team-tasks', 4.8), end('team-tasks') - 0.3, [86, 166, 382, 66], { label: 'Ben is on it', side: 'right' });
  sc.show('team-filter-open', start('filter'), { fade: 0.3 }).cut(start('filter'), [860, 20, 560, 190]);
  sc.callout(at('filter', 1.0), at('filter', 2.4), [1005, 41, 260, 135], { label: 'filter by member', side: 'below' });
  sc.show('team-filter-ben', at('filter', 2.6), { fade: 0.3 }).look(at('filter', 2.6), [70, 20, 1350, 420], { dur: 0.7 });
  sc.callout(at('filter', 3.5), at('filter', 4.5), { region: 'list', h: 0.42 }, { label: "only Ben's work", side: 'right' });
  sc.show('team-kanban', at('filter', 4.6), { fade: 0.3 }).cut(at('filter', 4.6), 'window');
  sc.show('team-analytics', start('analytics'), { fade: 0.3 }).cut(start('analytics'), [90, 60, 1330, 560]);
  sc.callout(at('analytics', 1.4), end('analytics') - 0.3, [100, 200, 200, 82], { label: 'done this week', side: 'below' });
  sc.show('team-task', start('readonly'), { fade: 0.3 }).cut(start('readonly'), 'window');
  sc.callout(at('readonly', 0.7), at('readonly', 2.0), 'bar', { label: 'read-only', side: 'above' });
  sc.look(at('readonly', 2.1), CHAT, { dur: 0.8 });
  sc.callout(at('readonly', 3.0), at('readonly', 5.2), [477, 251, 918, 127], { label: 'no reply box, no approvals', side: 'below' });
  sc.callout(at('readonly', 5.4), at('readonly', 7.0), 'clone', { label: 'clone it', side: 'below' });
  sc.click(at('readonly', 7.2), 'clone');
  sc.show('clone-modal', at('readonly', 7.4), { fade: 0.3 }).away(at('readonly', 7.6));
  sc.look(at('readonly', 7.4), CLONE, { dur: 0.7 });
  sc.callout(at('readonly', 8.3), end('readonly') - 0.3, 'confirm', { label: 'into her own workspace', side: 'left' });

  // 03 Memory
  sc.show('ws-sharing', start('memory-index'), { fade: 0 }).cut(start('memory-index'), [340, 200, 1030, 330]);
  sc.callout(at('memory-index', 1.0), at('memory-index', 3.6), 'parts', { label: 'memory, shared', side: 'below' });
  sc.callout(at('memory-index', 3.8), end('memory-index') - 0.3, 'mates', { label: "every teammate's memory", side: 'above' });
  sc.show('ben-saved', start('memory-save'), { fade: 0.3 }).cut(start('memory-save'), CHAT);
  sc.callout(at('memory-save', 1.0), at('memory-save', 4.6), 'msg1', { label: 'Monday: what it learned', side: 'below' });
  sc.callout(at('memory-save', 4.8), end('memory-save') - 0.3, 'msg2', { label: 'saved to its memory', side: 'below' });
  sc.show('ada-fixed', start('memory-read'), { fade: 0.3 }).cut(start('memory-read'), CHAT);
  sc.callout(at('memory-read', 0.8), at('memory-read', 5.2), 'msg', { label: "Tuesday: Ben's note, read first", side: 'below' });
  sc.callout(at('memory-read', 5.4), end('memory-read') - 0.3, 'msg', { label: 'green in two minutes', side: 'below' });
  sc.show('ws-sharing', start('memory-own'), { fade: 0.3 }).cut(start('memory-own'), [340, 300, 1030, 170]);
  sc.callout(at('memory-own', 0.8), at('memory-own', 3.2), 'mates', { label: 'theirs, to read', side: 'above' });
  sc.callout(at('memory-own', 3.4), end('memory-own') - 0.3, 'benRow', { label: 'nobody can overwrite it', side: 'below' });

  // 04 Skills
  sc.show('team-skills', start('skills-team'), { fade: 0 }).cut(start('skills-team'), [60, -30, 920, 450]);
  sc.callout(at('skills-team', 0.8), at('skills-team', 3.6), [90, 60, 520, 50], { label: 'the team owns its skills', side: 'below' });
  sc.callout(at('skills-team', 3.8), at('skills-team', 6.0), [92, 345, 560, 50], { label: 'every agent can use it', side: 'below' });
  sc.show('ws-team-skills', at('skills-team', 6.2), { fade: 0.3 }).look(at('skills-team', 6.2), [340, 300, 1030, 240], { dur: 0.8 });
  sc.callout(at('skills-team', 7.2), end('skills-team') - 0.3, 'sw', { label: 'each workspace opts in', side: 'left' });
  sc.show('ben-skill-v2', start('skills-edit'), { fade: 0.3 }).cut(start('skills-edit'), CHAT);
  sc.callout(at('skills-edit', 0.8), at('skills-edit', 3.2), 'msg', { label: 'the missing tag step', side: 'below' });
  sc.show('skill-v1', at('skills-edit', 3.4), { fade: 0.3 }).cut(at('skills-edit', 3.4), [90, 330, 1000, 300]);
  sc.show('skill-v2', at('skills-edit', 4.4), { fade: 0.6 });
  sc.callout(at('skills-edit', 5.0), end('skills-edit') - 0.3, [100, 485, 760, 14], { label: 'step 4, added: version 2', side: 'right' });
  sc.show('ada-release', start('skills-next'), { fade: 0.3 }).cut(start('skills-next'), CHAT);
  sc.callout(at('skills-next', 0.9), end('skills-next') - 0.3, 'msg', { label: 'every step, the tag included', side: 'below' });

  // 05 Pano docs
  sc.show('ada-pano', start('docs-share'), { fade: 0 }).cut(start('docs-share'), [400, 150, 1010, 330]);
  sc.callout(at('docs-share', 0.8), at('docs-share', 2.6), 'card2', { label: 'the launch plan', side: 'below' });
  sc.click(at('docs-share', 2.9), 'card2');
  sc.show('doc-share-off', at('docs-share', 3.1), { fade: 0.3 }).away(at('docs-share', 3.3));
  sc.look(at('docs-share', 3.1), [120, 120, 1290, 360], { dur: 0.8 });
  sc.callout(at('docs-share', 4.0), at('docs-share', 5.3), 'row', { label: 'share with a team', side: 'below' });
  sc.click(at('docs-share', 5.6), 'sw');
  sc.show('doc-share-on', at('docs-share', 5.8), { fade: 0.25 }).away(at('docs-share', 6.0));
  sc.callout(at('docs-share', 6.2), end('docs-share') - 0.3, 'row', { label: 'only this doc', side: 'below' });
  sc.show('team-pano', start('docs-team'), { fade: 0.3 }).cut(start('docs-team'), [80, 100, 700, 330]);
  sc.callout(at('docs-team', 0.9), at('docs-team', 3.2), 'card', { label: 'on the team Pano', side: 'right' });
  sc.click(at('docs-team', 3.4), 'card');
  sc.show('team-doc', at('docs-team', 3.6), { fade: 0.3 }).away(at('docs-team', 3.8));
  sc.look(at('docs-team', 3.6), [120, 120, 1290, 360], { dur: 0.8 });
  sc.callout(at('docs-team', 4.6), end('docs-team') - 0.3, [138, 142, 860, 66], { label: 'by Ada, read-only', side: 'below' });
  sc.show('ben-agent-doc', start('docs-agent'), { fade: 0.3 }).cut(start('docs-agent'), CHAT);
  sc.callout(at('docs-agent', 1.0), end('docs-agent') - 0.3, 'msg', { label: 'read from the team Pano', side: 'below' });
  sc.show('doc-unshare', start('docs-unshare'), { fade: 0.3 }).cut(start('docs-unshare'), MODAL);
  sc.callout(at('docs-unshare', 0.8), at('docs-unshare', 2.8), [495, 290, 449, 225], { label: 'stop sharing', side: 'above' });
  sc.click(at('docs-unshare', 3.1), [800, 458, 108, 34]);
  sc.show('team-pano-empty', at('docs-unshare', 3.3), { fade: 0.3 }).away(at('docs-unshare', 3.5));
  sc.look(at('docs-unshare', 3.3), [80, 40, 900, 200], { dur: 0.6 });
  sc.callout(at('docs-unshare', 4.2), end('docs-unshare') - 0.3, 'empty', { label: 'gone for the team, at once', side: 'below' });

  // 06 New hire
  sc.show('chen-accept', start('hire-join'), { fade: 0 }).cut(start('hire-join'), { region: 'card', by: 40 });
  sc.click(at('hire-join', 1.8), 'accept');
  sc.show('members-3', at('hire-join', 2.1), { fade: 0.3 }).away(at('hire-join', 2.3));
  sc.look(at('hire-join', 2.1), [340, 130, 1030, 210], { dur: 0.6 });
  sc.callout(at('hire-join', 2.9), at('hire-join', 4.4), 'chen', { label: 'Chen is in', side: 'below' });
  sc.show('chen-share', at('hire-join', 4.6), { fade: 0.3 }).cut(at('hire-join', 4.6), [340, 120, 1040, 200]);
  sc.callout(at('hire-join', 5.2), end('hire-join') - 0.3, 'list', { label: 'storefront joins the team on its own', side: 'below' });
  sc.show('chen-task', start('hire-first'), { fade: 0.3 }).cut(start('hire-first'), CHAT);
  sc.callout(at('hire-first', 0.8), at('hire-first', 7.3), 'msg', { label: "the team's memory and release skill", side: 'below' });
  sc.callout(at('hire-first', 7.5), end('hire-first') - 0.3, 'msg', { label: 'right the first time', side: 'below' });

  // 07 You stay in control
  sc.show('control-sharing', start('control'), { fade: 0 }).cut(start('control'), [340, 180, 1030, 330]);
  sc.callout(at('control', 0.8), at('control', 2.6), 'sharing', { label: 'yours to decide', side: 'below' });
  sc.callout(at('control', 2.8), at('control', 5.3), 'sw', { label: 'shared only when you switch it on', side: 'left' });
  sc.callout(at('control', 5.5), end('control') - 0.3, 'parts', { label: 'tasks, memory, skills: a switch each', side: 'below' });
  sc.show('stop-sharing', start('leave'), { fade: 0.3 }).cut(start('leave'), MODAL);
  sc.callout(at('leave', 0.9), at('leave', 4.3), [495, 290, 449, 222], { label: 'gone for them, right away', side: 'above' });
  sc.show('danger', at('leave', 4.5), { fade: 0.3 }).cut(at('leave', 4.5), [350, 140, 1040, 150]);
  sc.callout(at('leave', 5.0), end('leave') - 0.3, [360, 168, 1000, 60], { label: 'every share stops with you', side: 'below' });
  sc.show('control-sharing', start('obey'), { fade: 0.3 }).cut(start('obey'), [340, 330, 1030, 220]);
  sc.callout(at('obey', 0.8), end('obey') - 0.3, 'mates', { label: 'what their agents may read', side: 'above' });

  // Recap: the whole team, then one screen for each part it keeps.
  sc.show('members-3', start('recap'), { fade: 0.4 }).cut(start('recap'), 'window');
  sc.callout(at('recap', 1.0), at('recap', 4.2), [354, 154, 1004, 171], { label: 'the whole team keeps it', side: 'below' });
  sc.show('team-tasks', at('recap', 4.4), { fade: 0.3 });
  sc.callout(at('recap', 4.6), at('recap', 5.6), { region: 'list', h: 0.5 }, { label: 'live tasks', side: 'right' });
  sc.show('ada-fixed', at('recap', 5.7), { fade: 0.3 });
  sc.callout(at('recap', 5.9), at('recap', 6.9), 'msg', { label: 'shared memory', side: 'below' });
  sc.show('skill-v2', at('recap', 7.0), { fade: 0.3 });
  sc.callout(at('recap', 7.2), at('recap', 8.2), 'editor', { label: 'one playbook', side: 'below' });
  sc.show('team-doc', at('recap', 8.3), { fade: 0.3 });
  sc.callout(at('recap', 8.5), end('recap') - 0.3, 'body', { label: 'the docs you choose', side: 'below' });

  sc.visible([
    [start('create'), end('activity')],
    [start('share'), end('readonly')],
    [start('memory-index'), end('memory-own')],
    [start('skills-team'), end('skills-next')],
    [start('docs-share'), end('docs-unshare')],
    [start('hire-join'), end('hire-first')],
    [start('control'), end('recap')],
  ]).build();

  // The chapter, in a corner, while its screens show.
  chapterChips(s, [['01 / SET UP', 'create', 'activity'], ['02 / SEE THE TEAM', 'share', 'readonly'], ['03 / MEMORY', 'memory-index', 'memory-own'],
    ['04 / SKILLS', 'skills-team', 'skills-next'], ['05 / PANO DOCS', 'docs-share', 'docs-unshare'], ['06 / NEW HIRE', 'hire-join', 'hire-first'],
    ['07 / YOU STAY IN CONTROL', 'control', 'obey']].map(([label, a, z]) => [label, start(a), end(z)]));

  captions(s, tl, { band: BAND, size: 28, chars: 72, lineGap: 32, baseline: 51 });
  return s;
};
