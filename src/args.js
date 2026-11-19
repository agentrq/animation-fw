// Command-line parsing for bin/video.js: positional words and --flags, nothing else.
const VALUE = ['out', 'quality', 'workers', 'fps', 'size', 'crf', 'preset', 'poster-at', 'audio', 'timeline'];
const FLAG = ['draft', 'no-pack', 'help'];

export function parseArgs(argv) {
  const opts = {};
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { pos.push(a); continue; }
    const key = a.slice(2);
    if (FLAG.includes(key)) opts[key] = true;
    else if (VALUE.includes(key)) {
      if (argv[i + 1] === undefined || argv[i + 1].startsWith('--')) throw new Error(`--${key} needs a value`);
      opts[key] = argv[++i];
    } else throw new Error(`unknown option --${key}`);
  }
  return { opts, pos };
}
