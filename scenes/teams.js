// AgentRQ teams: teammates share a workspace, and each agent learns what the
// others learned. Ada's agent saves a note, Ben's agent reads it before it
// starts, and Cy's agent improves the team's skill for everyone.
import { sprite, el, g } from '../src/index.js';
import {
  C, MASCOTS, PX, GROUND, OFF, newScene, sky, ground, intro, frame, mascot, cursor, press, during,
} from '../kit/agentrq.js';

// A teammate in pixels: hair, face, shirt and legs, drawn as a mascot so
// the kit's idle, blink, hops and bubbles work for people too.
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

// Three teammates, each with their own agent. Badges are in the person's
// colour: the work is theirs, the agent does it.
const PEOPLE = [
  { name: 'ada', initial: 'A', color: '#f472b6', m: MASCOTS[0], task: 'Fix export timeout', h: person('ada', '#f472b6', '#7c2d12', '#fdba74') },
  { name: 'ben', initial: 'B', color: '#38bdf8', m: MASCOTS[1], task: 'Add export filters', h: person('ben', '#38bdf8', '#1c1917', '#d6a77a') },
  { name: 'cy', initial: 'C', color: '#facc15', m: MASCOTS[2], task: 'Ship release 1.4', h: person('cy', '#facc15', '#a16207', '#fde2c8') },
];
// Each agent stands on the ground with its person just left of it.
const AGENTS = PEOPLE.map((p, i) => ({ ...p, x: 625 + i * 240, hx: 548 + i * 240 }));

// ---------------------------------------------------------------- the story
// Every time below is in seconds on the 24 s loop.
const SW = (i) => 0.9 + 0.55 * i;          // ada switches on Tasks, Skills, Memory
const TASK = [3.2, 9.0, 14.2];             // each person hands their agent a task
const WRITE = 6.4;                         // ada's agent saves what it learned
const SAVED = WRITE + 1;                   // the note lands in team memory
const READ = 9.8;                          // ben's agent reads it
const GOT = READ + 1;                      // and has it
const EDIT = 15.6;                         // cy's agent improves the skill
const ARRIVE = (i) => EDIT + 0.9 + 0.2 * i; // the new version reaches ada and ben
const DONE = [8, 13, 17.4];
const DANCE = 18.6;
const RESET = 22.6;

// ---------------------------------------------------------------- the window
const BX = 440;
const BY = 20;
const BW = 740;
const BH = 272;

const SWITCHES = ['Tasks', 'Skills', 'Memory'];
const switchAt = (i) => ({ x: BX + 300 + i * 150, y: BY + 54 });

const ROW_W = 344;
const ROW_H = 42;
const taskAt = (i) => ({ x: BX + 16, y: BY + 122 + i * 50 });
const RX = BX + 16 + ROW_W + 20;
const RW = BX + BW - 16 - RX;
const MEM = { x: RX, y: BY + 122 };
const SKILL = { x: RX, y: BY + 222 };

const NOTE = `
  wwwww.
  w...ww
  w.##.w
  w....w
  w.###w
  w....w
  wwwwww`;
const note = (opts) => sprite(NOTE, { w: '#e4e4e7', '#': '#71717a' }, opts);

const BOOK = `
  dccccccc
  dcwwwwcc
  dccccccc
  dccccccc
  dccccccc
  dppppppp
  .ddddddd`;
const book = (opts) => sprite(BOOK, { c: '#c084fc', d: '#7e22ce', w: '#fafafa', p: '#e4e4e7' }, opts);

// Where a mascot's bubble sits, as the kit places it.
function bubbleAt({ m, x }) {
  const rows = m.art.split('\n').map((l) => l.trim()).filter(Boolean);
  const width = Math.max(...rows.map((r) => r.length)) * PX;
  const top = GROUND - rows.length * PX - (m.float ? 12 : 0);
  return { x: x + width / 2 - 6, y: top - 34 };
}

export default function teams() {
  const s = newScene({
    poster: 13.2,
    description: 'AgentRQ teams, for people and their agents: Ada shares a workspace with teammates Ben and Cy, switching on Tasks, Skills and Memory. Ada\'s agent, claude, fixes an export timeout and saves what it learned to the team memory; Ben\'s agent, codex, reads that note before it starts and finishes with no wrong turns; Cy\'s agent, agy, improves the team\'s release skill and the new version reaches every agent, and they celebrate.',
  });

  sky(s);
  ground(s);
  story(s);
  screen(s);
  SWITCHES.forEach((_, i) => toggle(s, i));
  PEOPLE.forEach((_, i) => taskRow(s, i));
  memory(s);
  skill(s);
  flights(s);
  AGENTS.forEach((a, i) => agent(s, a, i));
  pointer(s);
  return s;
}

function story(s) {
  intro(s, {
    kicker: 'teams',
    headline: ['Learn it once,', 'the team knows.'],
    sub: 'People and their agents, one team.',
    steps: [['share', SW(0) - 0.2, TASK[0]], ['learn', TASK[0], TASK[1]], ['reuse', TASK[1], TASK[2]], ['improve', TASK[2], RESET]],
    log: [
      [0, SW(0), '> payments: not shared_'],
      [SW(0), TASK[0], '> ada: share with the team'],
      [TASK[0], SAVED, '> ada asks claude: export timeout'],
      [SAVED, TASK[1], '> claude saved ada/export.md', C.lit],
      [TASK[1], GOT, '> ben asks codex: export filters'],
      [GOT, DONE[1], '> codex read ada/export.md first', C.lit],
      [DONE[1], TASK[2], '> ben: done, no wrong turns', C.lit],
      [TASK[2], ARRIVE(0), '> cy asks agy: ship release 1.4'],
      [ARRIVE(0), DONE[2] + 0.4, '> agy improved release for all', C.lit],
      [DONE[2] + 0.4, RESET, '> 3 people, 3 agents, 1 lesson', C.lit],
    ],
  });
}

// The team workspace: its share switches, the team's tasks with each
// owner's initial, and the team memory and skills the agents read.
function screen(s) {
  frame(s, { x: BX, y: BY, w: BW, h: BH, title: 'payments' });
  s.add(
    s.text('TEAM WORKSPACE', { x: BX + 100, y: BY + 26, font: 'semi', size: 10, fill: '#71717a', spacing: 1.5 }),
    el('rect', { x: BX + 2, y: BY + 40, width: BW - 4, height: 1, fill: C.line, class: 'px' }),
    s.text('SHARE WITH TEAM', { x: BX + 16, y: BY + 69, font: 'semi', size: 10, fill: '#71717a', spacing: 1.5 }),
    el('rect', { x: BX + 2, y: BY + 90, width: BW - 4, height: 1, fill: C.line, class: 'px' }),
    s.text('TASKS', { x: BX + 16, y: BY + 112, font: 'semi', size: 10, fill: '#71717a', spacing: 1.5 }),
    s.text('MEMORY', { x: RX, y: BY + 112, font: 'semi', size: 10, fill: '#71717a', spacing: 1.5 }),
    s.text('every agent reads, each writes its own', { x: RX + 62, y: BY + 112, font: 'body', size: 10, fill: '#52525b' }),
    s.text('SKILLS', { x: RX, y: BY + 212, font: 'semi', size: 10, fill: '#71717a', spacing: 1.5 }),
  );
}

// A share switch: its label and a pixel on/off switch you click on.
function toggle(s, i) {
  const { x, y } = switchAt(i);
  const on = SW(i);
  s.add(s.text(SWITCHES[i], { x: x - 10, y: y + 15, font: 'semi', size: 13, fill: C.text, anchor: 'end' }));
  const off = g({},
    el('rect', { x, y, width: 40, height: 20, fill: '#3f3f46', class: 'px' }),
    el('rect', { x: x + 4, y: y + 4, width: 12, height: 12, fill: C.dim, class: 'px' }));
  const lit = g({},
    el('rect', { x, y, width: 40, height: 20, fill: C.ongoing, class: 'px' }),
    el('rect', { x: x + 24, y: y + 4, width: 12, height: 12, fill: C.ink, class: 'px' }));
  s.add(during(s, off, [[0, on], [RESET + 0.5, 24]]), during(s, lit, [[on, RESET + 0.5]]));
}

// A teammate's initial, in their agent's colour.
function badge(s, p, x, y) {
  return g({},
    el('rect', { x, y, width: 22, height: 22, fill: p.color, class: 'px' }),
    s.text(p.initial, { x: x + 11, y: y + 16, font: 'pixel', size: 14, fill: C.ink, anchor: 'middle' }));
}

// A team task: the owner's initial, its title, and its status, ongoing
// until its agent finishes.
function taskRow(s, i) {
  const p = PEOPLE[i];
  const { x, y } = taskAt(i);
  const status = (label, fill) => g({},
    el('rect', { x: x + ROW_W - 92, y: y + 18, width: 6, height: 6, fill, class: 'px' }),
    s.text(label, { x: x + ROW_W - 80, y: y + 25, font: 'mono', size: 11, fill: C.dim }));
  const parts = g({},
    el('rect', { x, y, width: ROW_W, height: ROW_H, fill: C.card, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    during(s, el('rect', { x, y, width: 4, height: ROW_H, fill: C.ongoing, class: 'px' }), [[TASK[i], DONE[i]]]),
    during(s, el('rect', { x, y, width: 4, height: ROW_H, fill: C.done, class: 'px' }), [[DONE[i], 24]]),
    badge(s, p, x + 14, y + 10),
    s.text(p.task, { x: x + 48, y: y + 26, font: 'semi', size: 13, fill: C.text }),
    during(s, status('ongoing', C.ongoing), [[TASK[i], DONE[i]]]),
    during(s, status('completed', C.done), [[DONE[i], 24]]),
  );
  s.add(s.anim(parts, [
    [0, { x: 0, y: 8, opacity: 0 }],
    [TASK[i], { opacity: 0 }, 'step'],
    [TASK[i] + 0.3, { y: 0, opacity: 1 }, 'out'],
    [RESET, { opacity: 1 }],
    [RESET + 0.5, { opacity: 0 }],
  ]));
}

// Team memory: empty until ada's agent saves its note; it glows when ben's
// agent reads it.
function memory(s) {
  const { x, y } = MEM;
  s.add(el('rect', { x, y, width: RW, height: ROW_H, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }));
  s.add(during(s, s.text('no notes yet', { x: x + 14, y: y + 26, font: 'body', size: 12, fill: '#52525b' }), [[0, SAVED], [RESET + 0.5, 24]]));
  const row = g({},
    badge(s, PEOPLE[0], x + 12, y + 10),
    note({ px: 3, x: x + 44, y: y + 10 }),
    s.text('ada/export.md', { x: x + 70, y: y + 26, font: 'mono', size: 13, fill: C.text }),
    s.text('batch of 500', { x: x + RW - 14, y: y + 26, font: 'body', size: 11, fill: C.dim, anchor: 'end' }));
  s.add(during(s, row, [[SAVED, RESET + 0.5]]));
  s.add(during(s, el('rect', { x, y, width: RW, height: ROW_H, fill: C.lit, opacity: 0.18, class: 'px' }), [[SAVED, SAVED + 0.5], [READ, GOT]]));
  s.add(during(s, el('rect', { x, y, width: RW, height: ROW_H, fill: 'none', stroke: C.lit, 'stroke-width': 2, class: 'px' }), [[READ, GOT]]));
}

// The team's release skill: v1, until cy's agent improves it.
function skill(s) {
  const { x, y } = SKILL;
  s.add(
    el('rect', { x, y, width: RW, height: ROW_H, fill: C.column, stroke: C.line, 'stroke-width': 1, class: 'px' }),
    book({ px: 3, x: x + 12, y: y + 10 }),
    s.text('release', { x: x + 48, y: y + 26, font: 'mono', size: 13, fill: C.text }),
    during(s, s.text('team skill, v1', { x: x + RW - 14, y: y + 26, font: 'body', size: 11, fill: C.dim, anchor: 'end' }), [[0, EDIT + 0.3], [RESET + 0.5, 24]]),
    during(s, s.text('v2, improved by cy', { x: x + RW - 14, y: y + 26, font: 'body', size: 11, fill: C.lit, anchor: 'end' }), [[EDIT + 0.3, RESET + 0.5]]),
    s.anim(el('rect', { x, y, width: RW, height: ROW_H, fill: C.lit, class: 'px' }),
      [[0, { opacity: 0 }], [EDIT - 0.15, { opacity: 0.3 }, 'step'], [EDIT + 0.4, { opacity: 0 }]]),
    during(s, el('rect', { x, y, width: RW, height: ROW_H, fill: 'none', stroke: C.lit, 'stroke-width': 2, class: 'px' }), [[EDIT - 0.6, ARRIVE(1) + 0.3]]),
  );
}

// One flight: a sprite from `start` to `end`, lifting first.
function fly(s, node, start, end, from, to) {
  const lift = { x: start.x + (end.x - start.x) * 0.1, y: start.y - 18 };
  s.add(s.anim(node, [
    [0, { ...start, opacity: 0 }],
    [from, { opacity: 1 }, 'step'],
    [from + 0.25, lift, 'out'],
    [to, end, 'inOut'],
    [to + 0.05, { opacity: 0 }, 'step'],
  ]));
}

// The note goes up from ada's agent into memory, and from memory to ben's
// agent; the improved skill goes out to ada's and ben's agents.
function flights(s) {
  const memSlot = { x: MEM.x + 44, y: MEM.y + 10 };
  fly(s, note({ px: 3 }), bubbleAt(AGENTS[0]), memSlot, WRITE, SAVED);
  fly(s, note({ px: 3 }), memSlot, bubbleAt(AGENTS[1]), READ, GOT);
  const skillSlot = { x: SKILL.x + 12, y: SKILL.y + 10 };
  [0, 1].forEach((i) => fly(s, book({ px: 3 }), skillSlot, bubbleAt(AGENTS[i]), EDIT + 0.2, ARRIVE(i)));
}

// Each agent hops at its task, works, and finishes. Ada's saves its note,
// ben's holds the note it read, cy's improves the skill; ada's and ben's
// hop again when the new skill reaches them.
function agent(s, a, i) {
  const say = [];
  let work;
  if (i === 0) {
    say.push([note({ px: 2, x: 11, y: 5 }), [[WRITE - 0.6, WRITE]]]);
    work = [[TASK[0] + 0.6, WRITE - 0.6], [SAVED, DONE[0]]];
  } else if (i === 1) {
    say.push([note({ px: 2, x: 11, y: 5 }), [[GOT, GOT + 1.2]], C.lit]);
    work = [[GOT + 1.2, DONE[1]]];
  } else {
    say.push([book({ px: 2, x: 9, y: 6 }), [[EDIT - 0.6, EDIT + 0.4]], C.lit]);
    work = [[TASK[2] + 0.6, EDIT - 0.6], [EDIT + 0.4, DONE[2]]];
  }
  const done = i === 2 ? [[DONE[2], RESET]] : [[DONE[i], ARRIVE(i) - 0.05], [ARRIVE(i) + 0.9, RESET]];
  if (i < 2) say.push([book({ px: 2, x: 9, y: 6 }), [[ARRIVE(i), ARRIVE(i) + 0.9]], C.lit]);
  const hops = [[SW(2) + 0.2 + 0.1 * i, 10], [TASK[i], 14], [DONE[i], 22], [DANCE + i * 0.15, 16], [DANCE + 0.9 + i * 0.15, 16]];
  if (i < 2) hops.push([ARRIVE(i), 12]);
  if (i === 1) hops.push([GOT, 14]);
  mascot(s, a.m, i, { x: a.x, hops, alert: [[TASK[i], TASK[i] + 0.6]], say, work, done });
  human(s, a, i);
}

// The person beside each agent: hands it the task, cheers when it is done
// and dances with the others. Ada also hops as she shares the workspace, and
// Ben gets a tick when his agent shows up with Ada's note.
function human(s, a, i) {
  const hops = [[TASK[i] - 0.6, 12], [DONE[i] + 0.2, 16], [DANCE + 0.08 + i * 0.15, 16], [DANCE + 0.98 + i * 0.15, 16]];
  if (i === 0) hops.push(...SWITCHES.map((_, k) => [SW(k), 8]));
  const say = [['go', [[TASK[i] - 0.6, TASK[i] + 0.3]], a.color]];
  if (i === 1) say.push([note({ px: 2, x: 11, y: 5 }), [[GOT + 0.2, GOT + 1.2]], C.lit]);
  mascot(s, a.h, i + 3, { x: a.hx, hops, say, done: [[DONE[i] + 0.2, DONE[i] + 1.4], [DANCE, RESET]] });
}

// You: switch on Tasks, Skills and Memory, then let the agents work.
function pointer(s) {
  const sw = (i) => ({ x: switchAt(i).x + 20, y: switchAt(i).y + 10 });
  cursor(s, [
    [0, OFF],
    [0.2, OFF],
    ...[0, 1, 2].flatMap((i) => [[SW(i) - 0.35, sw(i), 'inOut'], ...press(SW(i), sw(i))]),
    [SW(2) + 0.4, sw(2)],
    [SW(2) + 1.1, OFF, 'inOut'],
  ]);
}
