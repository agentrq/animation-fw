// `node bin/video.js new <name>`: a story to start from. The narration is the
// script (one line per beat); the scene shows each beat. Both run as they are.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const NARRATION = {
  lines: [
    { id: 'hook', min: 4.5, text: 'Start with the problem, in a sentence or two. Then ask the question this video answers.' },
    { id: 'show', min: 5, text: 'Show it working. One idea per line, said the way you would tell a friend.' },
    { id: 'close', min: 4.5, text: 'End on what to do next. Try it at Agent R Q dot com.' },
  ],
};

const scene = (name, rel) => `// ${name}, narrated. Edit ${name}.narration.json (one line per beat, spoken as written;
// say the name as "Agent R Q"), then:
//   node bin/video.js videos/${name}.js --draft    a rough cut in seconds, to check timing
//   node bin/video.js videos/${name}.js            the video, its posters and a small preview in out/
import { C, mascotByName, mascot } from '${rel}/kit/agentrq.js';
import { loadTimeline, videoScene, story, captions } from '${rel}/videos/lib.js';

const tl = loadTimeline();
const { T } = tl;

export default function ${name.replace(/-(\w)/g, (_, c) => c.toUpperCase())}() {
  const s = videoScene({
    tl,
    // The frame used for the posters: 70% of the way through the second beat.
    thumbnail: tl.at(1, 0.7),
    description: 'Say what happens in this video, for someone who cannot see it.',
  });

  // The left column: one headline per beat, a line of subtitle and a log line.
  story(s, tl, {
    kicker: 'the topic',
    steps: [['show', tl.S[1], tl.S[2]], ['next', tl.S[2], tl.end]],
    beats: [
      { at: [0], headline: ['Your hook,', 'in two lines.'], sub: 'The problem, plainly.', log: '> the problem' },
      { at: [1], headline: ['Then show', 'it working.'], sub: 'One idea at a time.', log: '> it works' },
      { at: [2], headline: ['End on the', 'next step.'], sub: 'Find it at agentrq.com.', log: '> agentrq.com' },
    ],
  });

  // Mascots stand on the ground. hops are [second, height]; work, alert, ask and
  // done show a speech bubble over the given [from, to] spans; say adds your own.
  mascot(s, mascotByName('claude'), 0, {
    hops: [[T(1, 0.8), 16]],
    work: [[tl.S[1], T(1, 3)]],
    done: [[T(1, 3.2), tl.end]],
  });
  mascot(s, mascotByName('codex'), 1, {
    hops: [[T(2, 0.8), 16]],
    say: [['next!', [[T(2, 0.8), tl.end]], C.lit]],
  });

  captions(s, tl);
  return s;
}
`;

export function scaffoldVideo(name, { dir = 'videos' } = {}) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error('a video name is lower-case words joined by dashes, like "weekly-digest"');
  const target = path.resolve(dir);
  const files = [path.join(target, `${name}.js`), path.join(target, `${name}.narration.json`)];
  const taken = files.filter((f) => fs.existsSync(f));
  if (taken.length) throw new Error(`${taken.map((f) => path.relative('.', f)).join(' and ')} already exists`);
  fs.mkdirSync(target, { recursive: true });
  // Node resolves a scene's imports from where the file really is, links followed.
  const rel = path.relative(fs.realpathSync(target), fs.realpathSync(root)).split(path.sep).join('/') || '.';
  fs.writeFileSync(files[0], scene(name, rel));
  fs.writeFileSync(files[1], `${JSON.stringify(NARRATION, null, 2)}\n`);
  return files;
}
