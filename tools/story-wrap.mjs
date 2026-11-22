// node tools/story-wrap.mjs <slug>: writes videos/<slug>.js (a wrapper on videos/story.js)
// and videos/<slug>.narration.json (the voice script) from videos/stories/<slug>.json.
import fs from 'node:fs';
const slug = process.argv[2];
if (!slug) { console.error('usage: story-wrap.mjs <slug>'); process.exit(2); }
const data = JSON.parse(fs.readFileSync(`videos/stories/${slug}.json`, 'utf8'));
fs.writeFileSync(`videos/${slug}.js`, `import { storyScene } from './story.js';\nexport default () => storyScene('${slug}');\n`);
fs.writeFileSync(`videos/${slug}.narration.json`, JSON.stringify({ lines: data.lines.map(({ id, min, text }) => ({ id, min, text })) }, null, 2));
console.log(`wrote videos/${slug}.js and videos/${slug}.narration.json (${data.lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0)} words)`);
