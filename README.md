# animation-fw

Animated SVG scenes as code, for READMEs: pixel sprites, a timeline in
seconds compiled to CSS keyframes, fonts embedded and cut to the characters
used, a checker for what GitHub will run, and exact PNG/GIF previews.

```sh
npm install && npx playwright install chromium   # once; fonts need: pip install fonttools brotli
node bin/animfw.js preview scenes/task-board.js  # dist/task-board.svg, .gif, -sheet.png, -poster.png
node bin/animfw.js check dist/*.svg
npm test
```

## Why it is built this way

GitHub shows a README SVG as an `<img>`: scripts are stripped and nothing
outside the file loads. So motion is CSS `@keyframes` only, and fonts are
inlined as WOFF2 subsets. `animfw check` fails a scene that breaks either.

Every animation runs on the scene's loop, or on a period that divides it,
so the picture repeats as one. With `prefers-reduced-motion` the scene stops
on its `poster` second.

## A scene

A scene module's default export returns a `Scene`:

```js
import { Scene, FONTS, sprite } from '../src/index.js';

export default () => {
  const s = new Scene({ width: 1200, height: 440, loop: 24, poster: 12, background: '#09090b',
    description: 'Alt text: what happens in the loop.' })
    .font('pixel', FONTS.silkscreen)
    .font('bold', FONTS.inter, { axes: { wght: 700 } });
  const bot = sprite(`
    .##.
    #oo#
  `, { '#': '#d97757', o: '#000' }, { px: 4 });
  // Keys are [second, props, ease]; props carry forward. x/y/scale/rotate
  // become one transform, anything else is written as CSS (opacity, fill).
  s.add(s.anim(bot, [[0, { x: 100, y: 300 }], [2, { x: 400 }, 'inOut'], [3, { opacity: 0 }, 'step']]));
  s.add(s.text('Hello', { x: 40, y: 60, font: 'bold', size: 40 }));
  return s;
};
```

Draw animated content at the origin and give its position in the keys: the
CSS transform replaces any `transform` attribute on the same element.

Eases: `linear` (default), `step` (hold, then jump at the key), `in`, `out`,
`inOut`, `back`, or any CSS timing function.

## Fonts

Bundled, all SIL OFL 1.1 (licences in `fonts/`): Silkscreen, Inter and
JetBrains Mono. Subsets are cached in `.cache/fonts`.
