// AgentRQ's speech-to-text: you dictate a task and a reply, and an in-browser
// Whisper model writes them down without your voice leaving the device.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, CHECK, OFF, LOOP, rng, newScene, sky, ground, intro, frame, mascot, cursor, press, during,
} from '../kit/agentrq.js';

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const REC1 = 0.8;                          // you click the mic on the New Task form
const STOP1 = 3.6;                         // and click again to stop
const LOADED = 5.6;                        // the first time, the model downloads
const TR1 = 6;                             // then transcribes
const CREATE = 8.6;                        // you create the task
const SWITCH = CREATE + 0.3;               // and the task opens
const PICK = 9.6;                          // agy takes it
const ASK = 11;                            // agy asks in the thread
const REC2 = 12;                           // you dictate the reply
const STOP2 = 14.2;                        // the model is cached: straight to text
const SEND = 16.2;                         // cmd + enter
const DONE = 18.4;
const DANCE = 18.8;
const RESET = 22.6;

const TASK = 'Add a dark mode toggle to settings';
const ANSWER = 'yes, keep the system default';
const QUESTION = 'Follow the system theme by default?';

// What the field holds as the words land: [second, text].
const TYPED1 = [[7, 'Add a dark'], [7.3, 'Add a dark mode toggle'], [7.6, TASK]];
const TYPED2 = [[15, 'yes, keep'], [15.3, ANSWER]];
// What you say, a few words at a time.
const SAID1 = [[REC1 + 0.4, '"Add a dark'], [REC1 + 1.1, '"Add a dark mode toggle'], [REC1 + 1.8, `"${TASK}"`]];
const SAID2 = [[REC2 + 0.4, '"yes, keep'], [REC2 + 1.1, `"${ANSWER}"`]];
const LOAD = [[STOP1 + 0.2, 0], [STOP1 + 0.7, 42], [STOP1 + 1.3, 77], [LOADED - 0.1, 100]];

// ---------------------------------------------------------------- the window
const BX = 440;
const BY = 20;
const BW = 600;
const BH = 272;
const IX = BX + 16;                        // inside the window
const IW = BW - 32;

const TOOLS = 146;                         // the row of small buttons
const MIC = { x: IX + 38, y: TOOLS, s: 28 };
const SUBMIT = { x: IX + IW - 36, y: TOOLS };
const SEND_BTN = { x: IX + IW - 68, y: TOOLS + 2 };
const DESC = { x: IX + 14, y: 114 };       // the description's first line
const REPLY = { x: IX + 14, y: 134 };      // the reply composer's line
const CH = 8;                              // one mono character at 14 px, measured

// The on-device box under the form, with the model's chip in it.
const DEV = { x: IX, y: 192, w: IW, h: 92 };
const WAVE = { x: IX + 18, y: 248, bars: 12, pitch: 12, levels: 5 };
const CHIP = { x: IX + 220, y: 226, w: 60, h: 44 };
const INFO = IX + 314;

export default function speechToText() {
  const s = newScene({
    poster: 13.4,
    description: 'AgentRQ speech-to-text: you click the mic on the New Task form and say \'Add a dark mode toggle to settings\'. The first time, a Whisper model downloads into the browser; it turns your voice into text on the device, uploading nothing, and the text lands in the description. agy takes the task, asks a question, you dictate the reply, agy finishes and the agents celebrate.',
  });

  sky(s);
  ground(s);
  story(s);
  frame(s, { x: BX, y: BY, w: BW, h: BH, title: '' });
  cloud(s);
  s.add(fade(s, g({},
    titles(s),
    formScreen(s),
    taskScreen(s),
    tools(s),
    device(s),
    speech(s, SAID1, REC1, STOP1),
    speech(s, SAID2, REC2, STOP2),
    tooltip(s),
    keys(s),
  )));
  MASCOTS.forEach((m, i) => agent(s, m, i));
  pointer(s);
  return s;
}

// Everything on the stage fades out at the end of the loop and comes back
// in its first state.
function fade(s, node) {
  return s.anim(node, [[0, { opacity: 1 }], [RESET, { opacity: 1 }], [RESET + 0.5, { opacity: 0 }], [RESET + 0.6, { opacity: 1 }, 'step']]);
}

const FORM = [[0, SWITCH], [RESET + 0.6, LOOP]];
const TASKVIEW = [[SWITCH, RESET + 0.5]];

function story(s) {
  intro(s, {
    kicker: 'speech-to-text',
    headline: ['Say it.', 'Agents read it.'],
    sub: 'Dictation that stays on your device.',
    steps: [['speak', REC1, STOP1], ['transcribe', STOP1, CREATE], ['send', CREATE, DONE], ['done', DONE, RESET]],
    log: [
      [0, REC1, '> mic ready_'],
      [REC1, STOP1, '> recording...', C.blocked],
      [STOP1, TR1, '> first use: fetching whisper-base', C.ask],
      [TR1, CREATE, '> transcribed on-device, 0 bytes uploaded'],
      [CREATE, ASK, '> agy took the task'],
      [ASK, REC2, '> agy: follow the system theme?', C.ask],
      [REC2, STOP2, '> recording...', C.blocked],
      [STOP2, SEND, '> model cached on this device'],
      [SEND, DONE, '> sent to agy'],
      [DONE, RESET, '> done, 0 bytes uploaded', C.lit],
    ],
  });
}

function titles(s) {
  const at = { x: BX + 16, y: BY + 26, font: 'semi', size: 15, fill: C.text };
  return g({},
    during(s, s.text('New Task', at), FORM),
    during(s, s.text(TASK, at), TASKVIEW),
    el('rect', { x: BX + 2, y: 58, width: BW - 4, height: 1, fill: C.line, class: 'px' }),
    during(s, status(s, 'Ongoing', C.ongoing), [[SWITCH, DONE]]),
    during(s, status(s, 'Completed', C.done), [[DONE, RESET + 0.5]]));
}

function status(s, label, dot) {
  const w = label.length * 7 + 30;
  const x = BX + BW - 12 - w;
  return g({},
    el('rect', { x, y: BY + 10, width: w, height: 22, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    el('rect', { x: x + 10, y: BY + 18, width: 6, height: 6, fill: dot, class: 'px' }),
    s.text(label, { x: x + 22, y: BY + 25, font: 'semi', size: 11, fill: C.dim }));
}

// The words in a field, a few at a time, and the caret after them.
function typed(s, list, { x, y }, until) {
  return g({}, list.map(([t, text], k) => {
    const to = k + 1 < list.length ? list[k + 1][0] : until;
    const caret = s.anim(el('rect', { x: x + 1 + text.length * CH, y: y - 14, width: 2, height: 18, fill: C.text, class: 'px' }),
      [[0, { opacity: 1 }], [0.5, { opacity: 0 }, 'step']], { period: 1 });
    return g({},
      during(s, s.text(text, { x, y, font: 'mono', size: 14, fill: C.text }), [[t, to]]),
      k === list.length - 1 ? during(s, caret, [[t, to]]) : null);
  }));
}

// The New Task form: an optional title, the description, and its controls.
function formScreen(s) {
  const card = g({},
    el('rect', { x: IX, y: 66, width: IW, height: 116, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    s.text('Task Title (optional)', { x: DESC.x, y: 86, font: 'semi', size: 13, fill: '#52525b' }),
    el('rect', { x: IX + 1, y: 94, width: IW - 2, height: 1, fill: C.line, class: 'px' }),
    during(s, s.text('Provide detailed context or instructions...', { x: DESC.x, y: DESC.y, font: 'body', size: 13, fill: '#71717a' }), [[0, TYPED1[0][0]], [RESET + 0.6, LOOP]]),
    typed(s, TYPED1, DESC, CREATE + 0.3),
    // Agent | Human, then the hint and the round submit button.
    el('rect', { x: IX + 82, y: TOOLS + 13, width: 1, height: 14, fill: C.line, class: 'px' }),
    el('rect', { x: IX + 92, y: TOOLS + 2, width: 112, height: 24, fill: '#27272a', stroke: C.line, 'stroke-width': 1, class: 'px' }),
    el('rect', { x: IX + 94, y: TOOLS + 4, width: 54, height: 20, fill: '#3f3f46', class: 'px' }),
    s.text('AGENT', { x: IX + 121, y: TOOLS + 18, font: 'bold', size: 9, fill: C.text, anchor: 'middle', spacing: 1 }),
    s.text('HUMAN', { x: IX + 176, y: TOOLS + 18, font: 'bold', size: 9, fill: '#71717a', anchor: 'middle', spacing: 1 }),
    s.text('Cmd ⌘ + Enter to create', { x: SUBMIT.x - 10, y: TOOLS + 18, font: 'semi', size: 10, fill: '#71717a', anchor: 'end' }),
    el('rect', { x: SUBMIT.x, y: SUBMIT.y, width: 28, height: 28, fill: C.text, class: 'px' }),
    s.anim(el('rect', { x: SUBMIT.x, y: SUBMIT.y, width: 28, height: 28, fill: C.ongoing, class: 'px' }),
      [[0, { opacity: 0 }], [CREATE - 0.15, { opacity: 0.8 }, 'step'], [CREATE, { opacity: 0 }, 'step']]),
    sprite(`
      ...#...
      ..###..
      .#.#.#.
      ...#...
      ...#...
      ...#...`, { '#': C.ink }, { px: 2, x: SUBMIT.x + 7, y: SUBMIT.y + 8 }));
  return during(s, card, FORM);
}

// A chat message in the thread: who sent it, then the text.
function message(s, { x, w, who, dot, text }) {
  return g({},
    el('rect', { x, y: 66, width: w, height: 40, fill: dot ? C.column : '#2a2a2e', stroke: dot ? C.line : 'none', 'stroke-width': 1, class: 'px' }),
    dot ? el('rect', { x: x + 12, y: 74, width: 6, height: 6, fill: dot, class: 'px' }) : null,
    s.text(who, { x: x + (dot ? 24 : 12), y: 81, font: dot ? 'mono' : 'semi', size: 10, fill: C.dim }),
    s.text(text, { x: x + 12, y: 98, font: 'body', size: 13, fill: C.text }));
}

// The task, once created: agy's question, your answer, and the composer.
function taskScreen(s) {
  const agy = MASCOTS.find((m) => m.name === 'agy');
  const screen = g({},
    during(s, message(s, { x: IX, w: 270, who: 'agy', dot: agy.color, text: QUESTION }), [[ASK, RESET + 0.5]]),
    during(s, message(s, { x: IX + IW - 230, w: 230, who: 'You · just now', text: ANSWER }), [[SEND + 0.1, RESET + 0.5]]),
    el('rect', { x: IX, y: 112, width: IW, height: 70, fill: '#27272a', stroke: '#3f3f46', 'stroke-width': 1, class: 'px' }),
    during(s, s.text('Type instructions... (Cmd ⌘ + Enter to send)', { x: REPLY.x, y: REPLY.y, font: 'body', size: 13, fill: '#71717a' }),
      [[0, TYPED2[0][0]], [SEND, LOOP]]),
    typed(s, TYPED2, REPLY, SEND),
    // The kit's button() adds itself to the scene; this one lives in the screen.
    el('rect', { x: SEND_BTN.x, y: SEND_BTN.y, width: 60, height: 24, fill: C.text, class: 'px' }),
    s.anim(el('rect', { x: SEND_BTN.x, y: SEND_BTN.y, width: 60, height: 24, fill: C.ongoing, class: 'px' }),
      [[0, { opacity: 0 }], [SEND - 0.15, { opacity: 0.8 }, 'step'], [SEND, { opacity: 0 }, 'step']]),
    s.text('Send', { x: SEND_BTN.x + 30, y: SEND_BTN.y + 17, font: 'semi', size: 13, fill: C.ink, anchor: 'middle' }));
  return during(s, screen, TASKVIEW);
}

const MIC_ART = `
  ...###...
  ..#...#..
  ..#...#..
  ..#...#..
  #.#...#.#
  #..###..#
  .#.....#.
  ..#####..
  ....#....
  ..#####..`;

// Attach files and the mic: idle, red while it listens, a grey spinner
// while the model loads and transcribes.
function tools(s) {
  const { x, y, s: size } = MIC;
  const red = g({},
    el('rect', { x, y, width: size, height: size, fill: C.blocked, class: 'px' }),
    s.anim(el('rect', { x: x + 10, y: y + 10, width: 8, height: 8, fill: C.text, class: 'px' }),
      [[0, { opacity: 1 }], [0.5, { opacity: 0.35 }, 'inOut'], [1, { opacity: 1 }, 'inOut']], { period: 1 }));
  const spin = s.anim(sprite(`
    ..##..
    .#....
    #.....
    #.....`, { '#': C.text }, { px: 2, x: -6, y: -6 }), [[0, { x: x + 14, y: y + 14, rotate: 0 }], [0.8, { rotate: 360 }]], { period: 0.8 });
  return g({},
    sprite(`
      ....###.
      ...#...#
      ..#..#.#
      .#..#..#
      #..#..#.
      #.#..#..
      #...#...
      .###....`, { '#': '#a1a1aa' }, { px: 2, x: IX + 7, y: TOOLS + 6 }),
    sprite(MIC_ART, { '#': '#a1a1aa' }, { px: 2, x: x + 5, y: y + 4 }),
    during(s, red, [[REC1, STOP1], [REC2, STOP2]]),
    during(s, g({}, el('rect', { x, y, width: size, height: size, fill: '#52525b', class: 'px' }), spin), [[STOP1, TYPED1[0][0]], [STOP2, TYPED2[0][0]]]));
}

// The tooltip over the mic says what it is doing.
function tooltip(s) {
  const tip = (text, spans) => {
    const w = text.length * 6.4 + 20;
    return during(s, g({},
      el('rect', { x: IX + 4, y: 118, width: w, height: 22, fill: '#3f3f46', class: 'px' }),
      el('rect', { x: MIC.x + 10, y: 140, width: 8, height: 4, fill: '#3f3f46', class: 'px' }),
      s.text(text, { x: IX + 14, y: 133, font: 'semi', size: 11, fill: C.text })), spans);
  };
  const loading = LOAD.map(([t, pct], k) => tip(`Loading STT model... ${pct}%`, [[t, k + 1 < LOAD.length ? LOAD[k + 1][0] : TR1]]));
  return g({},
    tip('Voice input', [[REC1 - 0.5, REC1], [REC2 - 0.5, REC2]]),
    tip('Stop recording', [[STOP1 - 0.6, STOP1], [STOP2 - 0.6, STOP2]]),
    ...loading,
    tip('Transcribing...', [[TR1, TYPED1[0][0]], [STOP2, TYPED2[0][0]]]));
}

// What you are saying, in a bubble by the pointer.
function speech(s, said, from, to) {
  const w = said.at(-1)[1].length * 7.6 + 24;
  const x = MIC.x + 30;
  const parts = [
    el('rect', { x: x + 4, y: 112, width: w - 8, height: 28, fill: C.text, class: 'px' }),
    el('rect', { x, y: 116, width: w, height: 20, fill: C.text, class: 'px' }),
    el('rect', { x: x + 4, y: 140, width: 8, height: 4, fill: C.text, class: 'px' }),
    el('rect', { x: x, y: 144, width: 4, height: 4, fill: C.text, class: 'px' }),
  ];
  said.forEach(([t, text], k) => {
    const until = k + 1 < said.length ? said[k + 1][0] : to - 0.6;
    parts.push(during(s, s.text(text, { x: x + 12, y: 131, font: 'semi', size: 13, fill: C.ink }), [[t, until]]));
  });
  return during(s, g({}, parts), [[from + 0.3, to - 0.6]]);
}

// The bars of one voice: how tall each is, step by step.
function voice(seed) {
  const r = rng(seed);
  const { bars, levels } = WAVE;
  return Array.from({ length: bars }, (_, b) => {
    const peak = Math.round(levels * (0.45 + 0.55 * Math.sin(Math.PI * (b + 0.5) / bars)));
    return Array.from({ length: 8 }, () => Math.max(1, Math.round(r() * peak)));
  });
}

const barX = (b) => WAVE.x + b * WAVE.pitch;
const block = (b, k, fill) => [
  el('rect', { x: barX(b), y: WAVE.y - 2 - 4 * k, width: 8, height: 4, fill, class: 'px' }),
  el('rect', { x: barX(b), y: WAVE.y + 2 + 4 * (k - 1), width: 8, height: 4, fill, class: 'px' }),
];

// The bars bouncing while you speak: each block shows when its bar reaches it.
function bouncing(s, heights) {
  const parts = [];
  heights.forEach((steps, b) => {
    parts.push(el('rect', { x: barX(b), y: WAVE.y - 2, width: 8, height: 4, fill: C.lit, class: 'px' }));
    for (let k = 1; k <= WAVE.levels; k++) {
      const keys = [[0, { opacity: steps[0] >= k ? 1 : 0 }]];
      steps.forEach((h, j) => { if (j) keys.push([j * 0.1, { opacity: h >= k ? 1 : 0 }, 'step']); });
      if (keys.length > 1 || steps[0] >= k) parts.push(s.anim(g({}, block(b, k, C.lit)), keys, { period: 0.8 }));
    }
  });
  return g({}, parts);
}

// The last bars, held still, then sliding into the chip.
function still(heights) {
  return g({}, heights.flatMap((steps, b) => [
    el('rect', { x: barX(b), y: WAVE.y - 2, width: 8, height: 4, fill: C.lit, class: 'px' }),
    ...Array.from({ length: steps[3] }, (_, k) => block(b, k + 1, C.lit)).flat(),
  ]));
}

// The box that is this computer: the voice, the model's chip, its download.
function device(s) {
  const { x, y, w, h } = DEV;
  s.def(el('clipPath', { id: 'into-chip' }, el('rect', { x, y, width: CHIP.x + CHIP.w / 2 - x, height: h })));
  const v1 = voice(11);
  const v2 = voice(29);
  const slide = (heights, wait, go) => s.anim(still(heights), [
    [0, { x: 0, opacity: 0 }],
    [wait, { opacity: 0.45 }, 'step'],
    [go, { x: 0, opacity: go === wait ? 1 : 0.45 }, 'step'],
    [go + 0.8, { x: CHIP.x + CHIP.w / 2 - WAVE.x, opacity: 1 }, 'in'],
    [go + 0.85, { opacity: 0 }, 'step'],
  ]);

  const parts = [
    el('rect', { x, y, width: w, height: h, fill: 'none', stroke: '#3f3f46', 'stroke-width': 2, 'stroke-dasharray': '6 4', class: 'px' }),
    s.text('ON THIS DEVICE', { x: x + 14, y: y + 18, font: 'bold', size: 10, fill: C.dim, spacing: 1.5 }),
    ...[0, 1, 2, 3, 4].map((k) => el('rect', { x: CHIP.x - 52 + k * 9, y: WAVE.y - 2, width: 4, height: 4, fill: '#3f3f46', class: 'px' })),
    // While you speak, the lane marches green into the chip.
    during(s, g({}, [0, 1, 2, 3, 4].map((k) => s.anim(el('rect', { x: CHIP.x - 52 + k * 9, y: WAVE.y - 2, width: 4, height: 4, fill: C.lit, class: 'px' }),
      [[0, { opacity: 0.15 }], [+(k * 0.1).toFixed(1), { opacity: 1 }, 'step'], [+(k * 0.1 + 0.2).toFixed(1), { opacity: 0.15 }, 'step']], { period: 0.6 }))), [[REC1, STOP1], [REC2, STOP2]]),
    during(s, bouncing(s, v1), [[REC1, STOP1]]),
    during(s, bouncing(s, v2), [[REC2, STOP2]]),
    g({ 'clip-path': 'url(#into-chip)' }, slide(v1, STOP1, TR1), slide(v2, STOP2, STOP2)),
    chip(s),
    ...words(s, TR1 + 0.6),
    ...words(s, STOP2 + 0.6),
    model(s),
  ];
  return g({}, parts);
}

// The Whisper chip: empty until the model drops in, then lit, and bright
// while it transcribes.
function chip(s) {
  const { x, y, w, h } = CHIP;
  const pins = [];
  for (let px = x + 8; px < x + w - 4; px += 12) {
    pins.push(el('rect', { x: px, y: y - 6, width: 4, height: 6, fill: '#52525b', class: 'px' }));
    pins.push(el('rect', { x: px, y: y + h, width: 4, height: 6, fill: '#52525b', class: 'px' }));
  }
  for (let py = y + 8; py < y + h - 4; py += 12) {
    pins.push(el('rect', { x: x - 6, y: py, width: 6, height: 4, fill: '#52525b', class: 'px' }));
    pins.push(el('rect', { x: x + w, y: py, width: 6, height: 4, fill: '#52525b', class: 'px' }));
  }
  const IN = LOADED + 0.4;
  const label = (fill) => s.text('whisper', { x: x + w / 2, y: y + h / 2 + 4, font: 'mono', size: 11, fill, anchor: 'middle' });
  return g({},
    ...pins,
    el('rect', { x, y, width: w, height: h, fill: '#27272a', stroke: '#52525b', 'stroke-width': 2, class: 'px' }),
    label('#71717a'),
    during(s, g({},
      el('rect', { x, y, width: w, height: h, fill: '#14532d', stroke: C.ongoing, 'stroke-width': 2, class: 'px' }),
      label(C.lit)), [[IN, RESET + 0.5]]),
    during(s, g({},
      el('rect', { x, y, width: w, height: h, fill: C.ongoing, stroke: C.lit, 'stroke-width': 2, class: 'px' }),
      label(C.ink)), [[TR1, TYPED1[0][0]], [STOP2, TYPED2[0][0]]]));
}

// Words rising out of the chip into the field above.
function words(s, at) {
  return [0, 0.15, 0.3].map((d, k) => s.anim(el('rect', { width: 4, height: 4, fill: C.lit, class: 'px' }), [
    [0, { x: CHIP.x + 16 + k * 12, y: CHIP.y - 10, opacity: 0 }],
    [at + d, { opacity: 1 }, 'step'],
    [at + d + 0.4, { y: 150, opacity: 1 }, 'out'],
    [at + d + 0.45, { opacity: 0 }, 'step'],
  ]));
}

// The model: not here yet, downloading once, then cached.
function model(s) {
  const bar = { x: INFO, y: 238, w: 220, h: 12 };
  const parts = [
    s.text('whisper-base · WebGPU', { x: INFO, y: 228, font: 'mono', size: 11, fill: C.dim }),
    el('rect', { x: bar.x, y: bar.y, width: bar.w, height: bar.h, fill: 'none', stroke: '#3f3f46', 'stroke-width': 2, class: 'px' }),
    during(s, s.text('downloads once, on first use', { x: INFO, y: 270, font: 'semi', size: 11, fill: '#71717a' }), [[0, STOP1 + 0.2], [RESET + 0.6, LOOP]]),
    during(s, el('rect', { x: bar.x, y: bar.y, width: bar.w, height: bar.h, fill: C.done, class: 'px' }), [[LOADED, RESET + 0.5]]),
  ];
  LOAD.forEach(([t, pct], k) => {
    const to = k + 1 < LOAD.length ? LOAD[k + 1][0] : LOADED + 0.4;
    parts.push(during(s, s.text(`Loading STT model... ${pct}%`, { x: INFO, y: 270, font: 'semi', size: 11, fill: C.ask }), [[t, to]]));
    const fill = Math.round((bar.w - 8) * pct / 100 / 4) * 4;
    if (fill) parts.push(during(s, el('rect', { x: bar.x + 4, y: bar.y + 4, width: fill, height: 4, fill: C.ask, class: 'px' }), [[t, LOADED]]));
  });
  parts.push(
    during(s, g({},
      sprite(CHECK, { '#': C.lit }, { px: 2, x: INFO, y: 261 }),
      s.text('cached on this device', { x: INFO + 20, y: 270, font: 'semi', size: 11, fill: C.lit })), [[LOADED + 0.4, RESET + 0.5]]),
    // At 100% the model drops out of the bar into the chip.
    s.anim(sprite(`
      .####.
      ######
      ##..##
      ##..##
      ######
      .####.`, { '#': C.lit }, { px: 2 }), [
      [0, { x: INFO + 100, y: bar.y, opacity: 0 }],
      [LOADED, { opacity: 1 }, 'step'],
      [LOADED + 0.15, { x: INFO + 20, y: 204 }, 'out'],
      [LOADED + 0.4, { x: CHIP.x + CHIP.w / 2 - 6, y: CHIP.y + 4 }, 'in'],
      [LOADED + 0.45, { opacity: 0 }, 'step'],
    ]));
  return g({}, parts);
}

// The cloud outside the window, crossed out: nothing is uploaded.
function cloud(s) {
  const cx = 1110;
  s.add(
    sprite(`
      ....####......
      ..########....
      .##########...
      .###########..
      ##############
      ##############
      .############.`, { '#': '#3f3f46' }, { px: 5, x: cx - 35, y: 140 }),
    s.anim(sprite(`
      ##.......##
      .##.....##.
      ..##...##..
      ...##.##...
      ....###....
      ...##.##...
      ..##...##..
      .##.....##.
      ##.......##`, { '#': C.blocked }, { px: 4, x: -22, y: -18 }), [
      [0, { x: cx, y: 157, scale: 1 }],
      ...[TR1 + 0.6, STOP2 + 0.6].flatMap((t) => [[t, { scale: 1 }], [t + 0.15, { scale: 1.25 }, 'out'], [t + 0.35, { scale: 1 }, 'in']]),
    ]),
    s.text('nothing uploaded', { x: cx, y: 202, font: 'mono', size: 11, fill: C.dim, anchor: 'middle' }),
  );
}

// You send the reply from the keyboard.
function keys(s) {
  const cap = (label, x) => g({},
    el('rect', { x, y: TOOLS + 3, width: 22, height: 22, fill: C.column, stroke: '#52525b', 'stroke-width': 1, class: 'px' }),
    s.text(label, { x: x + 11, y: TOOLS + 19, font: 'semi', size: 12, fill: C.text, anchor: 'middle' }));
  const x = SEND_BTN.x - 60;
  const down = (node) => s.anim(node, [[0, { y: 0 }], [SEND - 0.15, { y: 2 }, 'step'], [SEND + 0.1, { y: 0 }, 'step']]);
  return during(s, g({}, down(cap('⌘', x)), down(cap('↵', x + 26))), [[TYPED2.at(-1)[0] + 0.2, SEND + 0.5]]);
}

// agy takes the task, asks, gets your answer, finishes; then the dance.
function agent(s, m, i) {
  const dance = [[DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]];
  if (m.name !== 'agy') {
    mascot(s, m, i, { hops: dance, done: [[DANCE, RESET]] });
    return;
  }
  mascot(s, m, i, {
    hops: [[SWITCH, 8], [PICK, 14], [SEND + 0.3, 14], [DONE, 22], ...dance],
    alert: [[SWITCH, PICK], [SEND + 0.3, SEND + 0.9]],
    work: [[PICK, ASK], [SEND + 0.9, DONE]],
    ask: [[ASK, SEND + 0.3]],
    done: [[DONE, RESET]],
  });
}

// You: the mic, the mic again to stop, create; then the mic twice for the reply.
function pointer(s) {
  const mic = { x: MIC.x + 14, y: MIC.y + 14 };
  const submit = { x: SUBMIT.x + 14, y: SUBMIT.y + 14 };
  cursor(s, [
    [0, OFF],
    [0.1, OFF],
    [REC1 - 0.5, mic, 'inOut'],
    ...press(REC1, mic),
    ...press(STOP1, mic),
    [TYPED1.at(-1)[0], mic],
    [CREATE - 0.3, submit, 'inOut'],
    ...press(CREATE, submit),
    [CREATE + 0.3, submit],
    [CREATE + 1, OFF, 'inOut'],
    [REC2 - 1.1, OFF],
    [REC2 - 0.5, mic, 'inOut'],
    ...press(REC2, mic),
    ...press(STOP2, mic),
    [STOP2 + 0.4, mic],
    [STOP2 + 1.1, OFF, 'inOut'],
  ]);
}
