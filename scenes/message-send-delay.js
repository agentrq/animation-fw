// AgentRQ's message send delay: every chat message waits in the thread for a
// countdown, so you can still take it back before the agent sees it.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, OFF, LOOP, newScene, sky, ground, intro, frame, button, mascot, cursor, press, during,
} from '../kit/agentrq.js';

// The thread's own greys, as the app draws them in the dark theme.
const HELD = { bg: '#1f1f23', line: '#52525b' };   // a held message: dashed
const SENT = '#2a2a2e';                           // a sent one: solid

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const FOCUS = 0.9;                         // you click into the composer
const SEND1 = 3.2;                         // you send "deploy to prod"
const CANCEL = 5.8;                        // at 3 you click Cancel
const BACK = CANCEL + 0.45;                // and it is back in the composer
const EDIT = 6.8;                          // you rewrite it
const SEND2 = 9.2;                         // and send "deploy to staging"
const NOW = 12.7;                          // at 2 you click Send Now
const ARRIVE = NOW + 0.8;                  // it lands with codex
const REPLY = 17;                          // codex's answer in the thread
const DANCE = 18;
const RESET = 22.6;
const DELAY = 5;

const FIRST = 'deploy to prod';
const SECOND = 'deploy to staging';

// What the composer holds, a few keys at a time: [second, text].
const TYPED = [
  [1.2, 'de'], [1.45, 'deplo'], [1.7, 'deploy t'], [1.95, 'deploy to p'], [2.2, FIRST],
  [SEND1, ''],
  [BACK, FIRST],
  [EDIT + 0.3, 'deploy to pr'], [EDIT + 0.55, 'deploy to '],
  [EDIT + 1.0, 'deploy to st'], [EDIT + 1.25, 'deploy to stag'], [EDIT + 1.5, 'deploy to stagin'], [EDIT + 1.75, SECOND],
  [SEND2, ''],
];

// ---------------------------------------------------------------- the window
const BX = 440;
const BY = 20;
const BW = 740;
const BH = 272;

// The held message, right-aligned above the composer.
const MW = 270;
const MX = BX + BW - 16 - MW;
const MY = BY + 96;
const MH = 96;
const CANCEL_AT = { x: MW - 12 - 86 - 8 - 70, y: 66, w: 70 };
const NOW_AT = { x: MW - 12 - 86, y: 66, w: 86 };

// The composer along the bottom.
const CP = { x: BX + 16, y: BY + 214, w: BW - 32, h: 44 };
const TX = CP.x + 14;                      // where typed text starts
const CH = 8.4;                            // one mono character at 14 px
const SEND_BTN = { x: CP.x + CP.w - 72, y: CP.y + 10, w: 60 };

export default function messageSendDelay() {
  const s = newScene({
    poster: 12.4,
    description: 'AgentRQ message send delay: you type \'deploy to prod\' and send it, and it waits in the thread with a 5 second countdown and Cancel and Send Now buttons while codex has not seen it yet. At 3 you click Cancel and the text comes back to the composer; you change it to \'deploy to staging\', send it, and click Send Now, so codex gets it, deploys, and the agents celebrate.',
  });

  sky(s);
  ground(s);
  story(s);
  screen(s);
  composer(s);
  held(s, FIRST, { at: SEND1, cancel: CANCEL });
  held(s, SECOND, { at: SEND2, now: NOW });
  sent(s);
  reply(s);
  delivery(s);
  MASCOTS.forEach((m, i) => agent(s, m, i));
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'send delay',
    headline: ['Second thoughts,', 'built in.'],
    sub: 'Messages wait before the agent sees them.',
    steps: [['write', FOCUS, SEND1], ['wait', SEND1, CANCEL], ['cancel', CANCEL, SEND2], ['send', SEND2, RESET]],
    log: [
      [0, FOCUS, '> codex: build is green_'],
      [FOCUS, SEND1, '> you: deploy to prod'],
      [SEND1, CANCEL, `> sending in ${DELAY}s`, C.ask],
      [CANCEL, SEND2, '> cancelled: back in composer'],
      [SEND2, NOW, `> sending in ${DELAY}s`, C.ask],
      [NOW, REPLY, '> delivered to codex'],
      [REPLY, RESET, '> deployed to staging', C.lit],
    ],
  });
}

// A chat bubble from the agent, on the left.
function agentBubble(s, text, { x, y, w }) {
  return g({},
    el('rect', { x, y, width: w, height: 44, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    el('rect', { x: x + 12, y: y + 10, width: 6, height: 6, fill: MASCOTS[1].color, class: 'px' }),
    s.text('codex', { x: x + 24, y: y + 17, font: 'mono', size: 10, fill: C.dim }),
    s.text(text, { x: x + 12, y: y + 35, font: 'body', size: 13, fill: C.text }));
}

// The task's chat: codex asked where to deploy.
function screen(s) {
  frame(s, { x: BX, y: BY, w: BW, h: BH, title: 'Ship release 1.4' });
  s.add(
    el('rect', { x: BX + BW - 108, y: BY + 10, width: 96, height: 22, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    el('rect', { x: BX + BW - 98, y: BY + 18, width: 6, height: 6, fill: C.ongoing, class: 'px' }),
    s.text('Ongoing', { x: BX + BW - 86, y: BY + 25, font: 'semi', size: 11, fill: C.dim }),
    el('rect', { x: BX + 2, y: BY + 40, width: BW - 4, height: 1, fill: C.line, class: 'px' }),
    agentBubble(s, 'Build #214 is green. Where to?', { x: BX + 16, y: BY + 48, w: 236 }),
  );
}

const textAt = (k) => TYPED[k][0];
const until = (k) => (k + 1 < TYPED.length ? TYPED[k + 1][0] : RESET + 0.3);

// The composer: its placeholder when empty, the text a few keys at a time,
// and the caret after the last one.
function composer(s) {
  const { x, y, w, h } = CP;
  s.add(
    el('rect', { x, y, width: w, height: h, fill: '#27272a', stroke: '#3f3f46', 'stroke-width': 1, class: 'px' }),
    during(s, el('rect', { x, y, width: w, height: h, fill: 'none', stroke: '#71717a', 'stroke-width': 2, class: 'px' }), [[FOCUS, RESET + 0.3]]),
  );
  const empty = TYPED.map(([, text], k) => [text, k]).filter(([text]) => !text).map(([, k]) => [textAt(k), until(k)]);
  s.add(during(s, s.text('Type instructions...', { x: TX, y: y + 27, font: 'body', size: 14, fill: '#71717a' }),
    [[0, TYPED[0][0]], ...empty.map(([from, to]) => [from, Math.min(to, RESET + 0.3)]), [RESET + 0.3, LOOP]]));
  TYPED.forEach(([t, text], k) => {
    if (text) s.add(during(s, s.text(text, { x: TX, y: y + 27, font: 'mono', size: 14, fill: C.text }), [[t, until(k)]]));
  });
  const caret = (n, from, to) => {
    const blink = s.anim(el('rect', { x: TX + 1 + n * CH, y: y + 13, width: 2, height: 18, fill: C.text, class: 'px' }),
      [[0, { opacity: 1 }], [0.5, { opacity: 0 }, 'step']], { period: 1 });
    s.add(during(s, blink, [[from, to]]));
  };
  caret(0, FOCUS, TYPED[0][0]);
  TYPED.forEach(([t, text], k) => caret(text.length, t, until(k)));

  button(s, { ...SEND_BTN, label: 'Send', clicks: [SEND1, SEND2] });
}

const DIGITS_FROM = (at) => Array.from({ length: DELAY }, (_, k) => [DELAY - k, at + k]);

// A held message: it rises out of the composer, counts down, and either
// drops back into it (cancel) or turns into a sent message (now).
function held(s, text, { at, cancel, now }) {
  const end = cancel ?? now;
  const tick = DIGITS_FROM(at).filter(([, t]) => t < end);
  const shown = (k) => [tick[k][1], k + 1 < tick.length ? tick[k + 1][1] : LOOP];

  const parts = [
    el('rect', { width: MW, height: MH, fill: HELD.bg, stroke: HELD.line, 'stroke-width': 2, 'stroke-dasharray': '6 4', class: 'px' }),
    s.anim(el('rect', { x: 12, y: 10, width: 6, height: 6, fill: C.text, class: 'px' }),
      [[0, { opacity: 1 }], [0.5, { opacity: 0.3 }, 'step']], { period: 1 }),
    s.text(text, { x: 12, y: 46, font: 'semi', size: 15, fill: C.text }),
    el('rect', { x: 12, y: 58, width: MW - 24, height: 1, fill: HELD.line, 'stroke-dasharray': '4 4', class: 'px' }),
  ];
  tick.forEach(([n], k) => parts.push(during(s, s.text(`Sending in ${n}s…`, { x: 24, y: 17, font: 'semi', size: 11, fill: C.dim }), [shown(k)])));

  // Cancel and Send Now, each flashing when you press it.
  const flash = (b, t, fill) => s.anim(el('rect', { x: b.x, y: b.y, width: b.w, height: 22, fill, class: 'px' }),
    [[0, { opacity: 0 }], [t - 0.15, { opacity: 0.8 }, 'step'], [t, { opacity: 0 }, 'step']]);
  parts.push(
    el('rect', { x: CANCEL_AT.x, y: CANCEL_AT.y, width: CANCEL_AT.w, height: 22, fill: C.bg, stroke: '#3f3f46', 'stroke-width': 1, class: 'px' }),
    cancel ? flash(CANCEL_AT, cancel, C.blocked) : null,
    s.text('CANCEL', { x: CANCEL_AT.x + CANCEL_AT.w / 2, y: CANCEL_AT.y + 15, font: 'semi', size: 10, fill: C.text, anchor: 'middle', spacing: 1 }),
    el('rect', { x: NOW_AT.x, y: NOW_AT.y, width: NOW_AT.w, height: 22, fill: C.text, class: 'px' }),
    now ? flash(NOW_AT, now, C.ongoing) : null,
    s.text('SEND NOW', { x: NOW_AT.x + NOW_AT.w / 2, y: NOW_AT.y + 15, font: 'semi', size: 10, fill: C.ink, anchor: 'middle', spacing: 1 }),
  );

  // The countdown in big pixels on its left edge, with a bar that drains.
  const badge = [
    el('rect', { x: -60, y: 12, width: 52, height: 62, fill: C.bg, stroke: C.ask, 'stroke-width': 2, class: 'px' }),
    el('rect', { x: -8, y: 38, width: 8, height: 4, fill: C.ask, class: 'px' }),
  ];
  tick.forEach(([n], k) => badge.push(during(s, s.text(String(n), { x: -34, y: 52, font: 'pixel', size: 32, fill: C.ask, anchor: 'middle' }), [shown(k)])));
  for (let k = 0; k < DELAY; k++) {
    const block = el('rect', { x: -52 + k * 8, y: 62, width: 6, height: 4, fill: C.ask, class: 'px' });
    badge.push(during(s, block, [[0, at + DELAY - k]]));
  }
  parts.push(g({}, badge));

  const keys = [
    [0, { x: MX, y: CP.y, opacity: 0, scale: 0.9 }],
    [at, { opacity: 0 }, 'step'],
    [at + 0.4, { y: MY, opacity: 1, scale: 1 }, 'out'],
  ];
  if (cancel) {
    // Pulled back down into the composer, unsent.
    keys.push([cancel + 0.05, { y: MY, scale: 1, opacity: 1 }], [BACK, { y: CP.y - 20, scale: 0.6, opacity: 0 }, 'in']);
  } else {
    keys.push([now + 0.05, { opacity: 1 }, 'step'], [now + 0.15, { opacity: 0 }, 'step']);
  }
  s.add(s.anim(g({}, parts), keys, { origin: 'center' }));
}

// The second message once it is sent: solid, with no countdown.
function sent(s) {
  const bubble = g({},
    el('rect', { x: MX, y: MY, width: MW, height: 50, fill: SENT, class: 'px' }),
    s.text('You · just now', { x: MX + 12, y: MY + 17, font: 'semi', size: 11, fill: C.dim }),
    s.text(SECOND, { x: MX + 12, y: MY + 38, font: 'semi', size: 15, fill: C.text }));
  s.add(s.anim(bubble, [[0, { opacity: 0 }], [NOW + 0.15, { opacity: 1 }, 'step'], [RESET, { opacity: 1 }], [RESET + 0.5, { opacity: 0 }]]));
}

// codex's answer, under it.
function reply(s) {
  s.add(s.anim(agentBubble(s, 'Deployed to staging. All green.', { x: 0, y: 0, w: 236 }), [
    [0, { x: BX + 16, y: BY + 164, opacity: 0 }],
    [REPLY, { opacity: 0 }, 'step'],
    [REPLY + 0.35, { y: BY + 158, opacity: 1 }, 'out'],
    [RESET, { opacity: 1 }],
    [RESET + 0.5, { opacity: 0 }],
  ]));
}

const LETTER = `
  wwwwwwwww
  ww.....ww
  w.w...w.w
  w..w.w..w
  w...w...w
  wwwwwwwww`;

// On Send Now the message flies out of the window to codex.
function delivery(s) {
  const from = { x: MX + MW / 2 - 14, y: MY + 20 };
  const top = { x: 820, y: 210 };
  const to = { x: 650, y: 318 };
  s.add(s.anim(sprite(LETTER, { w: C.text }, { px: 3 }), [
    [0, { ...from, opacity: 0 }],
    [NOW + 0.15, { opacity: 1 }, 'step'],
    [NOW + 0.45, top, 'out'],
    [ARRIVE, { ...to, opacity: 1 }, 'in'],
    [ARRIVE + 0.05, { opacity: 0 }, 'step'],
  ]));
}

// A bubble with dimmed dots: codex is idle, and has not been sent anything.
function idleDots(s) {
  return g({}, [8, 15, 22].map((x) => el('rect', { x, y: 10, width: 4, height: 4, fill: '#a1a1aa', class: 'px' })));
}

// codex waits while each message is held, then works on the one it gets;
// the others watch, and everyone celebrates at the end.
function agent(s, m, i) {
  const dance = [[DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]];
  if (m.name !== 'codex') {
    mascot(s, m, i, { hops: dance, done: [[DANCE, RESET]] });
    return;
  }
  mascot(s, m, i, {
    hops: [[ARRIVE, 14], [REPLY, 22], ...dance],
    say: [[idleDots(s), [[SEND1 + 0.4, BACK], [SEND2 + 0.4, ARRIVE]], '#3f3f46']],
    alert: [[ARRIVE, ARRIVE + 0.7]],
    work: [[ARRIVE + 0.7, REPLY]],
    done: [[REPLY, RESET]],
  });
}

// You: click into the composer, send, cancel, edit, send, Send Now.
function pointer(s) {
  const box = { x: TX + 160, y: CP.y + 24 };
  const send = { x: SEND_BTN.x + 30, y: SEND_BTN.y + 14 };
  const cancel = { x: MX + CANCEL_AT.x + 35, y: MY + CANCEL_AT.y + 13 };
  const now = { x: MX + NOW_AT.x + 43, y: MY + NOW_AT.y + 13 };
  const end = { x: TX + SECOND.length * CH + 20, y: CP.y + 24 };
  cursor(s, [
    [0, OFF],
    [0.2, OFF],
    [FOCUS - 0.15, box, 'inOut'],
    ...press(FOCUS, box),
    [SEND1 - 0.7, box],
    [SEND1 - 0.2, send, 'inOut'],
    ...press(SEND1, send),
    [SEND1 + 1.4, send],
    [CANCEL - 0.5, cancel, 'inOut'],
    ...press(CANCEL, cancel),
    [CANCEL + 0.4, cancel],
    [EDIT - 0.2, end, 'inOut'],
    ...press(EDIT, end),
    [SEND2 - 0.7, end],
    [SEND2 - 0.2, send, 'inOut'],
    ...press(SEND2, send),
    [SEND2 + 1.6, send],
    [NOW - 0.5, now, 'inOut'],
    ...press(NOW, now),
    [NOW + 0.5, now],
    [NOW + 1.2, OFF, 'inOut'],
  ]);
}
