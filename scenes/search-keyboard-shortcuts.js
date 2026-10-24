// AgentRQ's task finder and single-key shortcuts: ⌘K finds any task from the
// copy this device saved, and every other move is one letter.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, OFF, LOOP, newScene, sky, ground, intro, frame, mascot, cursor, during,
} from '../kit/agentrq.js';

// The dark theme's own greys for the modals.
const ROW_HI = '#27272a';                  // the highlighted row
const BORDER = '#3f3f46';                  // a kbd badge
const SHADE = '#000';                      // the dimmed backdrop

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const ASK = 1;                             // claude asks, on a task off screen
const OPEN = 2.8;                          // ⌘K
const LETTER = (k) => 3.7 + 0.22 * k;      // "migration", a key at a time
const QUERY = 'migration';
const ENTER = 7.4;                         // ↵ opens the task
const CHAT = 8.8;                          // C flips to Chat
const ANSWER = 'yes, go ahead';
const ANSWER_AT = 9.5;                     // your answer, a key at a time
const SEND = 11.6;                         // ↵ sends it
const REPLY = 14.2;                        // claude is done
const SWITCH = 15.2;                       // W
const ESC = 16.2;                          // Esc closes the switcher
const PANO = 16.7;                         // P
const HELP = 17.5;                         // ?
const DANCE = 18.4;
const RESET = 22.6;
const PRESS = 0.16;

// ---------------------------------------------------------------- the stage
const BX = 440;
const BY = 20;
const BW = 740;
const BH = 272;

// The finder, centred on the stage.
const FX = 600;
const FY = 42;
const FW = 420;
const HEAD = 40;
const ROW = 34;
const FOOT = 26;

// The tasks the finder knows, and which of them each query leaves.
const TASKS = {
  login: ['Fix login redirect', '0krb7GqLm2a', 'ongoing'],
  billing: ['Migrate billing webhooks', '0krb9TzP4kd', 'ongoing'],
  users: ['Run the users migration', '0krbVq8Hn3e', 'blocked'],
  admin: ['Fix admin page crash', '0krb6Rw2Yt7', 'completed'],
  wiki: ['Mirror docs to the wiki', '0krb5Kd9Ws1', 'ongoing'],
};
// [characters typed, rows]: the results narrow as the query grows.
const NARROW = [
  [0, ['login', 'billing', 'users', 'admin', 'wiki']],
  [2, ['billing', 'users', 'admin', 'wiki']],
  [4, ['billing', 'users']],
  [7, ['users']],
];

// The keycap row, under the log on the left.
const KY = 334;
const KEYS = [
  { id: 'esc', label: 'esc', w: 32, small: true },
  { id: 'cmd', label: '⌘', w: 32 },
  { id: 'k', label: 'K', w: 32 },
  { id: 'abc', label: '', w: 54 },
  { id: 'enter', label: '↵', w: 32 },
  { id: 'c', label: 'C', w: 32 },
  { id: 'w', label: 'W', w: 32 },
  { id: 'p', label: 'P', w: 32 },
  { id: 'help', label: '?', w: 32 },
];

// [second, letter, index] for each letter key pressed; other characters take
// a beat but no key on the row.
const letters = (text, from, step) => [...text].map((ch, k) => [from + step * k, ch, k]).filter(([, ch]) => /[a-z]/.test(ch));
const TYPED = letters(QUERY, LETTER(0), 0.22);
const ANSWERED = letters(ANSWER, ANSWER_AT, 0.14);
const LAST = TYPED.at(-1)[0];

// When each key goes down, and while what it opened stays up.
const PRESSES = {
  esc: [ESC], cmd: [OPEN], k: [OPEN], abc: [...TYPED, ...ANSWERED].map(([t]) => t),
  enter: [ENTER, SEND], c: [CHAT], w: [SWITCH], p: [PANO], help: [HELP],
};
const HELD = { cmd: [[OPEN, ENTER]], k: [[OPEN, ENTER]], help: [[HELP, RESET]] };

export default function searchKeyboardShortcuts() {
  const s = newScene({
    poster: 6.6,
    description: 'AgentRQ search and keyboard shortcuts: claude has a question on a task you cannot see in a busy workspace, so you press ⌘K and type \'migration\'. The finder narrows the tasks saved on this device to \'Run the users migration\' without asking the server; Enter opens it and C flips to the chat, where you answer and claude finishes. Then W, P and ? bring up the workspace switcher, the Pano and the keyboard shortcuts sheet while the agents celebrate.',
  });

  sky(s);
  ground(s);
  story(s);
  keyboard(s);
  board(s);
  task(s);
  pano(s);
  backdrop(s);
  finder(s);
  switcher(s);
  sheet(s);
  MASCOTS.forEach((m, i) => agent(s, m, i));
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'search',
    headline: ['Every task,', 'one key away.'],
    sub: 'Find tasks offline. Get around by key.',
    steps: [['cmd k', OPEN, LETTER(0)], ['find', LETTER(0), ENTER], ['open', ENTER, SWITCH], ['keys', SWITCH, RESET]],
    log: [
      [0, ASK, '> 32 tasks in agentrq-code'],
      [ASK, OPEN, '> claude asked, but where?', C.ask],
      [OPEN, LAST + 0.3, '> ⌘K: finder open'],
      [LAST + 0.3, ENTER, '> 1 match, saved here, offline', C.lit],
      [ENTER, SEND, '> opened · C: chat'],
      [SEND, REPLY, '> you: yes, go ahead'],
      [REPLY, SWITCH, '> claude: 48,210 users moved', C.lit],
      [SWITCH, HELP, '> W: workspaces · P: pano'],
      [HELP, RESET, '> ?: shortcuts'],
    ],
  });
}

// ---------------------------------------------------------------- keyboard
// A pixel keycap for each key the story uses. It goes down and lights on
// every press, and keeps a glow while what it opened is on screen.
function keyboard(s) {
  let x = 44;
  for (const key of KEYS) {
    const { w } = key;
    s.add(el('rect', { x, y: KY + 6, width: w, height: 34, fill: '#000', class: 'px' }));
    s.add(el('rect', { x, y: KY + 34, width: w, height: 6, fill: C.line, class: 'px' }));

    const presses = PRESSES[key.id] ?? [];
    const lit = [[0, { opacity: 0 }], ...presses.flatMap((t) => [[t, { opacity: 1 }, 'step'], [t + PRESS, { opacity: 0 }, 'step']])];
    const label = key.id === 'abc'
      ? letterLabels(s, w)
      : s.text(key.label, { x: w / 2, y: key.small ? 21 : 23, font: key.small ? 'semi' : 'bold', size: key.small ? 11 : 16, fill: C.text, anchor: 'middle' });
    const cap = g({},
      el('rect', { width: w, height: 34, fill: C.card, stroke: BORDER, 'stroke-width': 2, class: 'px' }),
      s.anim(el('rect', { x: 2, y: 2, width: w - 4, height: 30, fill: C.ongoing, class: 'px' }), lit),
      label);
    const down = [[0, { x, y: KY }], ...presses.flatMap((t) => [[t, { y: KY + 5 }, 'step'], [t + PRESS, { y: KY }, 'step']])];
    s.add(s.anim(cap, down));

    if (HELD[key.id]) {
      s.add(during(s, el('rect', { x: x - 3, y: KY - 3, width: w + 6, height: 46, fill: 'none', stroke: C.lit, 'stroke-width': 2, class: 'px' }), HELD[key.id]));
    }
    x += w + 6;
  }
}

// The wide letter key shows whichever letter you just typed, and 'a-z' at rest.
function letterLabels(s, w) {
  const all = [...TYPED, ...ANSWERED];
  const style = { x: w / 2, y: 23, font: 'bold', size: 16, fill: C.text, anchor: 'middle' };
  const rest = [[0, all[0][0]], [TYPED.at(-1)[0] + 0.5, ANSWERED[0][0]], [ANSWERED.at(-1)[0] + 0.5, LOOP]];
  return g({},
    during(s, s.text('a–z', { ...style, font: 'semi', size: 12, y: 22, fill: C.dim }), rest),
    ...all.map(([t, ch], k) => {
      const end = Math.min(all[k + 1]?.[0] ?? LOOP, t + 0.5);
      return during(s, s.text(ch.toUpperCase(), style), [[t, end]]);
    }));
}

// ---------------------------------------------------------------- screens
const kbd = (s, label, { x, y, w = 28 }) => g({},
  el('rect', { x, y, width: w, height: 18, fill: 'none', stroke: BORDER, 'stroke-width': 1, class: 'px' }),
  s.text(label, { x: x + w / 2, y: y + 13, font: 'semi', size: 10, fill: C.dim, anchor: 'middle' }));

const BOARD = [
  ['Fix login redirect', C.ongoing, 'codex'],
  ['Polish settings UI', C.ongoing, 'agy'],
  ['Write release notes', C.notstarted, 'hermes'],
  ['Triage new issues', C.ongoing, 'openclaw'],
  ['Bump the Go toolchain', C.done, 'codex'],
  ['Tidy the docs sidebar', C.notstarted, 'agy'],
  ['Cache avatar images', C.done, 'hermes'],
];

// The busy workspace: a long list, and the task with the question is not in
// sight. The ⌘K hint sits in the header.
function board(s) {
  const parts = [
    el('rect', { width: BW, height: BH, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    s.text('agentrq-code', { x: 16, y: 26, font: 'semi', size: 15, fill: C.text }),
    el('rect', { x: BW - 150, y: 9, width: 138, height: 24, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    during(s, el('rect', { x: BW - 150, y: 9, width: 138, height: 24, fill: C.ongoing, opacity: 0.35, class: 'px' }), [[OPEN, OPEN + PRESS]]),
    kbd(s, '⌘K', { x: BW - 144, y: 12 }),
    s.text('Search tasks', { x: BW - 108, y: 25, font: 'semi', size: 12, fill: C.dim }),
    el('rect', { x: 2, y: 40, width: BW - 4, height: 1, fill: C.line, class: 'px' }),
  ];
  BOARD.forEach(([title, dot, who], r) => {
    const y = 48 + r * 30;
    const m = MASCOTS.find((x) => x.name === who);
    parts.push(
      el('rect', { x: 12, y, width: BW - 24, height: 26, fill: C.column, class: 'px' }),
      el('rect', { x: 24, y: y + 10, width: 6, height: 6, fill: dot, class: 'px' }),
      s.text(title, { x: 40, y: y + 18, font: 'semi', size: 13, fill: C.text }),
      el('rect', { x: BW - 120, y: y + 10, width: 6, height: 6, fill: m.color, class: 'px' }),
      s.text(who, { x: BW - 108, y: y + 17, font: 'mono', size: 10, fill: C.dim }),
    );
  });
  parts.push(s.text('+ 25 more', { x: 40, y: BH - 4, font: 'mono', size: 10, fill: C.notstarted }));
  s.add(s.anim(g({}, parts), [[0, { x: BX, y: BY, opacity: 1 }], [ENTER + 0.1, { opacity: 0 }, 'step'], [RESET + 0.6, { opacity: 1 }, 'step']]));
}

const statusBadge = (s, label, fill, { x, y }) => g({},
  el('rect', { x, y, width: 104, height: 22, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
  el('rect', { x: x + 10, y: y + 8, width: 6, height: 6, fill, class: 'px' }),
  s.text(label, { x: x + 22, y: y + 15, font: 'pixel', size: 8, fill: C.dim }));

// A chat bubble from claude, on the left.
function claudeSays(s, text, { y, w }) {
  return g({},
    el('rect', { x: 16, y, width: w, height: 44, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    el('rect', { x: 28, y: y + 10, width: 6, height: 6, fill: MASCOTS[0].color, class: 'px' }),
    s.text('claude', { x: 40, y: y + 17, font: 'mono', size: 10, fill: C.dim }),
    s.text(text, { x: 28, y: y + 35, font: 'body', size: 13, fill: C.text }));
}

// The task, opened from the finder: Trajectory first, then C for Chat, where
// claude's question waits and you answer it.
function task(s) {
  const tab = (label, x, w, on) => during(s, g({},
    el('rect', { x, y: 48, width: w, height: 22, fill: ROW_HI, class: 'px' }),
    s.text(label, { x: x + w / 2, y: 63, font: 'semi', size: 11, fill: C.text, anchor: 'middle' })), on);
  const parts = [
    el('rect', { width: BW, height: BH, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    s.text(TASKS.users[0], { x: 16, y: 26, font: 'semi', size: 15, fill: C.text }),
    s.text(TASKS.users[1], { x: 210, y: 26, font: 'mono', size: 10, fill: C.notstarted }),
    during(s, statusBadge(s, 'blocked', C.blocked, { x: BW - 116, y: 10 }), [[0, SEND]]),
    during(s, statusBadge(s, 'ongoing', C.ongoing, { x: BW - 116, y: 10 }), [[SEND, REPLY]]),
    during(s, statusBadge(s, 'completed', C.done, { x: BW - 116, y: 10 }), [[REPLY, LOOP]]),
    el('rect', { x: 2, y: 40, width: BW - 4, height: 1, fill: C.line, class: 'px' }),
    el('rect', { x: 16, y: 48, width: 168, height: 22, fill: 'none', stroke: C.line, 'stroke-width': 1, class: 'px' }),
    tab('Chat', 16, 64, [[CHAT, LOOP]]),
    tab('Trajectory', 80, 104, [[0, CHAT]]),
    s.text('Chat', { x: 48, y: 63, font: 'semi', size: 11, fill: C.dim, anchor: 'middle' }),
    s.text('Trajectory', { x: 132, y: 63, font: 'semi', size: 11, fill: C.dim, anchor: 'middle' }),
  ];
  // Hide whichever label is under its own highlight by drawing the lit ones last.
  parts.push(
    during(s, s.text('Chat', { x: 48, y: 63, font: 'semi', size: 11, fill: C.text, anchor: 'middle' }), [[CHAT, LOOP]]),
    during(s, s.text('Trajectory', { x: 132, y: 63, font: 'semi', size: 11, fill: C.text, anchor: 'middle' }), [[0, CHAT]]),
  );

  // Trajectory: the steps so far, ending on the question.
  const steps = [
    [C.done, 'Read', 'db/migrations/0042_users.sql'],
    [C.done, 'Bash', 'make migrate DRY_RUN=1'],
    [C.ask, 'Ask', 'Run it on production?'],
  ];
  parts.push(during(s, g({}, steps.map(([dot, tool, arg], r) => g({},
    el('rect', { x: 16, y: 84 + r * 34, width: BW - 32, height: 28, fill: C.column, class: 'px' }),
    el('rect', { x: 28, y: 95 + r * 34, width: 6, height: 6, fill: dot, class: 'px' }),
    s.text(tool, { x: 44, y: 102 + r * 34, font: 'semi', size: 12, fill: C.text }),
    s.text(arg, { x: 92, y: 102 + r * 34, font: 'mono', size: 12, fill: C.dim })))), [[0, CHAT]]));

  // Chat: the question, your answer, claude's report, and the composer.
  const mine = g({},
    el('rect', { x: BW - 16 - 150, y: 136, width: 150, height: 34, fill: '#2a2a2e', class: 'px' }),
    s.text(ANSWER, { x: BW - 16 - 138, y: 158, font: 'semi', size: 13, fill: C.text }));
  const composer = [
    el('rect', { x: 16, y: BH - 56, width: BW - 32, height: 40, fill: ROW_HI, stroke: BORDER, 'stroke-width': 1, class: 'px' }),
    during(s, s.text('Type instructions...', { x: 30, y: BH - 31, font: 'body', size: 14, fill: '#71717a' }), [[0, ANSWERED[0][0]], [SEND, LOOP]]),
  ];
  ANSWERED.forEach(([t, , at], k) => {
    const shown = ANSWER.slice(0, at + 1);
    composer.push(during(s, s.text(shown, { x: 30, y: BH - 31, font: 'mono', size: 14, fill: C.text }), [[t, ANSWERED[k + 1]?.[0] ?? SEND]]));
  });
  parts.push(during(s, g({},
    claudeSays(s, 'Dry run is clean. Run it on production?', { y: 82, w: 300 }),
    during(s, mine, [[SEND, LOOP]]),
    during(s, claudeSays(s, 'Migrated 48,210 users. All green.', { y: 158, w: 260 }), [[REPLY, LOOP]]),
    ...composer), [[CHAT, LOOP]]));

  s.add(s.anim(g({}, parts), [[0, { x: BX, y: BY, opacity: 0 }], [ENTER + 0.1, { opacity: 1 }, 'step'], [PANO, { opacity: 0 }, 'step']]));
}

// P: the Pano, the account's shared notes.
const NOTES = ['#fef08a', '#fbcfe8', '#bbf7d0', '#bfdbfe', '#fde68a', '#e9d5ff'];
function pano(s) {
  const parts = [
    el('rect', { width: BW, height: BH, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    s.text('Pano', { x: 16, y: 26, font: 'semi', size: 15, fill: C.text }),
    el('rect', { x: 2, y: 40, width: BW - 4, height: 1, fill: C.line, class: 'px' }),
  ];
  NOTES.forEach((fill, k) => {
    const x = 28 + (k % 3) * 236;
    const y = 56 + Math.floor(k / 3) * 104;
    parts.push(
      el('rect', { x, y, width: 212, height: 90, fill, class: 'px' }),
      el('rect', { x: x + 14, y: y + 16, width: 110, height: 8, fill: '#000', opacity: 0.45, class: 'px' }),
      el('rect', { x: x + 14, y: y + 36, width: 180, height: 4, fill: '#000', opacity: 0.2, class: 'px' }),
      el('rect', { x: x + 14, y: y + 48, width: 150, height: 4, fill: '#000', opacity: 0.2, class: 'px' }),
      el('rect', { x: x + 14, y: y + 60, width: 166, height: 4, fill: '#000', opacity: 0.2, class: 'px' }),
    );
  });
  s.add(s.anim(g({}, parts), [[0, { x: BX, y: BY, opacity: 0 }], [PANO, { opacity: 1 }, 'step'], [RESET, { opacity: 1 }], [RESET + 0.5, { opacity: 0 }]]));
}

// The dimmed board behind every modal.
function backdrop(s) {
  s.add(during(s, el('rect', { x: BX, y: BY, width: BW, height: BH, fill: SHADE, opacity: 0.6, class: 'px' }),
    [[OPEN + 0.05, ENTER + 0.1], [SWITCH, ESC], [HELP, RESET + 0.5]]));
}

const MAGNIFIER = `
  .###..
  #...#.
  #...#.
  #...#.
  .###..
  ....##`;

const OFFLINE = `
  #...........
  .#..####....
  ..##....#...
  .#.#.....##.
  #...#......#
  #....#.....#
  .#####.#####
  .......#....
  ........#...`;

// A modal's search bar: the icon, the field and an Esc badge.
function searchBar(s, w, placeholder) {
  return g({},
    el('rect', { width: w, height: HEAD, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    sprite(MAGNIFIER, { '#': '#71717a' }, { px: 2, x: 14, y: 14 }),
    s.text(placeholder, { x: 38, y: 25, font: 'body', size: 13, fill: '#52525b' }),
    kbd(s, 'Esc', { x: w - 44, y: 11 }));
}

// ⌘K: the finder drops in, and its rows narrow as you type.
function finder(s) {
  const bar = searchBar(s, FW, '');
  const typed = [];
  TYPED.forEach(([t], k) => {
    const until = TYPED[k + 1]?.[0] ?? ENTER + 0.1;
    typed.push(during(s, s.text(QUERY.slice(0, k + 1), { x: 38, y: 25, font: 'mono', size: 14, fill: C.text }), [[t, until]]));
  });
  const placeholder = during(s, s.text('Task ID, or any word in a title or description', { x: 38, y: 25, font: 'body', size: 13, fill: '#71717a' }), [[0, TYPED[0][0]]]);
  const caretAt = (n, from, to) => during(s, s.anim(el('rect', { x: 39 + n * 8.4, y: 12, width: 2, height: 17, fill: C.text, class: 'px' }),
    [[0, { opacity: 1 }], [0.5, { opacity: 0 }, 'step']], { period: 1 }), [[from, to]]);
  const carets = [caretAt(0, 0, TYPED[0][0]), ...TYPED.map(([t], k) => caretAt(k + 1, t, TYPED[k + 1]?.[0] ?? LOOP))];

  // Each stage of the narrowing is its own list and footer.
  const lists = NARROW.map(([n, ids], k) => {
    const from = n ? TYPED[n - 1][0] : 0;
    const to = NARROW[k + 1] ? TYPED[NARROW[k + 1][0] - 1][0] : LOOP;
    const h = ids.length * ROW;
    const rows = ids.map((id, r) => {
      const [title, tid, status] = TASKS[id];
      return g({},
        r === 0 ? el('rect', { x: 2, y: HEAD + r * ROW, width: FW - 4, height: ROW, fill: ROW_HI, class: 'px' }) : null,
        s.text(title, { x: 16, y: HEAD + r * ROW + 16, font: 'semi', size: 13, fill: C.text }),
        s.text(tid, { x: 16, y: HEAD + r * ROW + 28, font: 'mono', size: 9, fill: '#71717a' }),
        s.text(status, { x: FW - 16, y: HEAD + r * ROW + 21, font: 'pixel', size: 8, fill: id === 'users' ? C.blocked : '#71717a', anchor: 'end' }));
    });
    const foot = HEAD + h;
    return during(s, g({},
      el('rect', { y: HEAD, width: FW, height: h + FOOT, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
      ...rows,
      el('rect', { x: 2, y: foot, width: FW - 4, height: FOOT - 2, fill: C.column, class: 'px' }),
      s.text('↑↓ NAVIGATE   ↵ OPEN', { x: 16, y: foot + 17, font: 'semi', size: 9, fill: '#71717a', spacing: 1 }),
      s.text('Titles: saved here · IDs: every workspace', { x: FW - 16, y: foot + 17, font: 'semi', size: 10, fill: C.dim, anchor: 'end' })), [[from, to]]);
  });

  // It never asked the server: a cloud with a slash, beside the footer.
  const offline = g({},
    el('rect', { width: 92, height: 22, fill: C.bg, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
    sprite(OFFLINE, { '#': C.lit }, { px: 2, x: 6, y: 2 }),
    s.text('offline', { x: 38, y: 15, font: 'pixel', size: 8, fill: C.lit }));

  const box = g({}, ...lists, bar, placeholder, ...typed, ...carets,
    s.anim(offline, [[0, { x: FW - 146, y: 9, opacity: 0, scale: 0.6 }], [LAST + 0.3, { opacity: 0 }, 'step'], [LAST + 0.6, { opacity: 1, scale: 1 }, 'back']], { origin: 'center' }));

  s.add(s.anim(box, [
    [0, { x: FX, y: FY - 24, opacity: 0 }],
    [OPEN + 0.05, { opacity: 0 }, 'step'],
    [OPEN + 0.4, { y: FY, opacity: 1 }, 'out'],
    [ENTER + 0.05, { opacity: 1 }, 'step'],
    [ENTER + 0.1, { opacity: 0 }, 'step'],
  ]));
}

// W: the workspace switcher, for a moment, until Esc.
function switcher(s) {
  const names = ['agentrq-code', 'agentrq-landing', 'supervisor'];
  const box = g({},
    el('rect', { y: HEAD, width: FW, height: names.length * 30 + 8, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }),
    searchBar(s, FW, 'Search workspaces by name'),
    ...names.map((name, r) => g({},
      r === 0 ? el('rect', { x: 2, y: HEAD + 4 + r * 30, width: FW - 4, height: 30, fill: ROW_HI, class: 'px' }) : null,
      s.text(name, { x: 16, y: HEAD + 24 + r * 30, font: 'semi', size: 13, fill: C.text }))));
  s.add(s.anim(box, [
    [0, { x: FX, y: FY - 24, opacity: 0 }],
    [SWITCH, { opacity: 0 }, 'step'],
    [SWITCH + 0.3, { y: FY, opacity: 1 }, 'out'],
    [ESC, { opacity: 1 }, 'step'],
    [ESC + 0.05, { opacity: 0 }, 'step'],
  ]));
}

// ?: the keyboard shortcuts sheet, held to the end.
const SHEET = [
  ['ANYWHERE', [['Find task', '⌘K'], ['New task', 'N'], ['Switch workspace', 'W'], ['Switch machine', 'M'], ['Open the Pano', 'P'], ['Show keyboard shortcuts', '?']]],
  ['IN A TASK', [['Chat view', 'C'], ['Trajectory view', 'T']]],
];
function sheet(s) {
  const SW = 340;
  const parts = [];
  let y = 0;
  parts.push(
    s.text('KEYBOARD SHORTCUTS', { x: 18, y: 21, font: 'bold', size: 10, fill: C.text, spacing: 1.5 }),
    el('rect', { x: SW - 26, y: 13, width: 10, height: 2, fill: '#71717a', transform: `rotate(45 ${SW - 21} 14)` }),
    el('rect', { x: SW - 26, y: 13, width: 10, height: 2, fill: '#71717a', transform: `rotate(-45 ${SW - 21} 14)` }),
  );
  y = 32;
  for (const [title, items] of SHEET) {
    parts.push(el('rect', { x: 2, y, width: SW - 4, height: 1, fill: C.line, class: 'px' }));
    parts.push(s.text(title, { x: 18, y: y + 18, font: 'bold', size: 8, fill: '#71717a', spacing: 1.5 }));
    y += 26;
    for (const [label, combo] of items) {
      parts.push(
        s.text(label, { x: 18, y: y + 12, font: 'semi', size: 12, fill: C.text }),
        el('rect', { x: SW - 18 - 26, y, width: 26, height: 17, fill: 'none', stroke: BORDER, 'stroke-width': 1, class: 'px' }),
        s.text(combo, { x: SW - 18 - 13, y: y + 12, font: 'mono', size: 10, fill: '#e4e4e7', anchor: 'middle' }),
      );
      y += 19;
    }
    y += 6;
  }
  parts.push(
    el('rect', { x: 2, y, width: SW - 4, height: 24, fill: C.column, class: 'px' }),
    s.text('Single-key shortcuts pause while you are typing in a field.', { x: 18, y: y + 16, font: 'body', size: 10, fill: '#71717a' }),
  );
  const h = y + 24;
  const box = g({}, el('rect', { width: SW, height: h, fill: C.panel, stroke: C.line, 'stroke-width': 2, class: 'px' }), ...parts);
  const SX = BX + (BW - SW) / 2;
  const SY = BY + Math.round((BH - h) / 2);
  s.add(s.anim(box, [
    [0, { x: SX, y: SY - 24, opacity: 0 }],
    [HELP, { opacity: 0 }, 'step'],
    [HELP + 0.35, { y: SY, opacity: 1 }, 'out'],
    [RESET, { opacity: 1 }],
    [RESET + 0.5, { opacity: 0 }],
  ]));
}

// ---------------------------------------------------------------- the agents
// claude's question waits until you answer it; the others are busy with
// their own work the whole time, and everyone celebrates at the end.
function agent(s, m, i) {
  const dance = [[DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]];
  if (m.name === 'claude') {
    mascot(s, m, i, {
      hops: [[ASK, 10], [SEND + 0.3, 14], [REPLY, 22], ...dance],
      ask: [[ASK, SEND + 0.3]],
      work: [[SEND + 0.3, REPLY]],
      done: [[REPLY, RESET]],
    });
    return;
  }
  mascot(s, m, i, {
    hops: dance,
    work: [[0.4 + i * 0.3, DANCE]],
    done: [[DANCE, RESET]],
  });
}

// You: the pointer hunts through the long list for claude's task, and gives
// up; from then on it is the keyboard.
function pointer(s) {
  const row = (r) => ({ x: BX + 300 + (r % 2) * 60, y: BY + 62 + r * 30 });
  cursor(s, [
    [0, OFF],
    [0.2, OFF],
    [0.8, row(1), 'inOut'],
    [1.3, row(3), 'inOut'],
    [1.8, row(6), 'inOut'],
    [2.2, row(6)],
    [2.7, OFF, 'inOut'],
  ]);
}

