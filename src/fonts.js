import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Bundled, all SIL OFL 1.1 (licences beside them in fonts/).
export const FONTS = {
  silkscreen: path.join(root, 'fonts/Silkscreen-Regular.ttf'),
  inter: path.join(root, 'fonts/Inter.ttf'),
  jetbrainsMono: path.join(root, 'fonts/JetBrainsMono.ttf'),
};

// An SVG shown as a README <img> loads nothing from outside itself, so every
// font is embedded, cut down to the characters the scene draws. A variable
// font is pinned to `axes` first ({ wght: 700 }) so only one style ships.
const PY = `
import sys, json, io, base64
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib import instancer
file, text, axes = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
font = TTFont(file)
if axes and 'fvar' in font:
    font = instancer.instantiateVariableFont(font, axes)
opts = subset.Options()
opts.flavor = 'woff2'
opts.hinting = False
opts.desubroutinize = True
opts.layout_features = ['kern']
opts.name_IDs = [0, 1, 2, 13, 14]  # copyright, family, style, licence
s = subset.Subsetter(opts)
s.populate(text=text)
s.subset(font)
buf = io.BytesIO()
font.flavor = 'woff2'
font.save(buf)
sys.stdout.write(base64.b64encode(buf.getvalue()).decode())
`;

export function subsetWoff2(file, text, axes = {}) {
  const chars = [...new Set(text + ' ')].sort().join('');
  const st = fs.statSync(file);
  const key = createHash('sha256')
    .update(JSON.stringify([file, st.size, st.mtimeMs, chars, axes])).digest('hex').slice(0, 24);
  const cacheDir = process.env.ANIMFW_CACHE ?? path.join(root, '.cache/fonts');
  const hit = path.join(cacheDir, `${key}.b64`);
  if (fs.existsSync(hit)) return fs.readFileSync(hit, 'utf8');
  const b64 = execFileSync('python3', ['-I', '-c', PY, file, chars, JSON.stringify(axes)], {
    encoding: 'utf8', maxBuffer: 64 << 20,
  });
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(hit, b64);
  return b64;
}
