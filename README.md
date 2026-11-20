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

Making an AgentRQ scene? Read [SCENES.md](SCENES.md): the house style lives
in `kit/agentrq.js`, and `scenes/task-board.js` is the reference.

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

## Narrated videos

`videos/` holds stories told with a voice, as 16:9 video rather than a README loop: the house kit on top (left column,
stage, mascots) and the narration as captions underneath. One command takes a story from script to finished files.

```sh
node bin/video.js setup                              # once: fetches the local voice (Piper)
node bin/video.js new weekly-digest                  # a story to start from: scene + script
node bin/video.js videos/weekly-digest.js --draft    # a rough cut in seconds, to check timing
node bin/video.js videos/weekly-digest.js            # the real thing
```

A video is two files that share a name: the scene (`videos/overview.js`) and its script (`videos/overview.narration.json`,
one line per beat: `{ id, min, text }`, where `min` is the beat's shortest length in seconds). From the script the pipeline:

1. **Speaks it** with the local voice and measures every line. A beat lasts as long as its speech needs, never less than its
   `min`. Each line's audio is kept by what it says, so changing one line speaks only that line, and an unchanged script is
   not spoken again (`.cache/voice/<name>`). Nothing leaves the machine.
2. **Times the scene to the speech.** The scene reads `loadTimeline()` from `videos/lib.js`: `tl.S[b]` is where beat `b`
   starts, `tl.T(b, offset)` a moment inside it (authored against `min`, stretched to the real length), `tl.at(b, 0.7)` a
   fraction of the way through. The captions are the script's sentences, each on screen while it is spoken.
3. **Draws every frame in parallel.** A frame is "pause all CSS animations, set them to this moment, take a picture", so frames
   do not depend on each other: several browsers draw them at once and one ffmpeg receives them in order, with a bounded
   backlog. One browser draws about 14 frames a second at 1080p; eight draw about a hundred. The 70 s story (2,100 frames at
   1920x1080) renders in about 20 s on a 20-core machine instead of about 2.5 minutes, and as a draft in about 5 s.
4. **Packs the files** into `out/`: `<name>.mp4`, `<name>-poster.png` (1920x1080) and `<name>-poster-1280x720.jpg` from the
   frame the scene names as its `thumbnail`, and `<name>-preview.mp4` (480 p, mono, under 4 MB, for places that cap uploads).

```js
const s = videoScene({ tl, thumbnail: tl.at(1, 0.75), description: '...' }); // the poster frame: caption showing, stage full
```

| flag | |
|---|---|
| `--draft` | 960 wide, 15 fps, fastest encode; written as `<name>-draft.mp4`, no posters |
| `--quality hq\|web\|draft` | `hq` (default): 1920x1080, 30 fps, crf 14, slow. `web`: crf 20, medium |
| `--out <dir>` | where the files go (default `out`) |
| `--workers <n>` | browsers drawing frames (default: half the CPUs, at most 8; each is about 300 MB) |
| `--poster-at <s>` | poster frame, instead of the scene's `thumbnail` |
| `--no-pack` | the video only |
| `--fps`, `--size 1920x1080`, `--crf`, `--preset` | override the quality's settings |
| `--audio <wav> --timeline <json>` | use a voice made elsewhere instead of the script (a second argument ending in `.mp4` names the file) |

Say the brand as `Agent R Q` in a script (and `Agent R Q dot com`): the voice reads "agentrq" as "agentek". The captions put
`AgentRQ` and `agentrq.com` back; a script with the lowercase name is refused. More caption spellings go in a `"captions"`
object beside `"lines"`.

**What it needs.** ffmpeg (on the PATH, `FFMPEG=/path/to/ffmpeg`, or the optional `ffmpeg-static` package), Chromium
(`npx playwright install chromium`), and the voice: `node bin/video.js setup` downloads Piper (MIT) and the `en_US-bryce-medium` (public domain, free for commercial use; avoid the `ryan` voices, whose data is CC BY-NC-SA)
voice into `~/.cache/animfw/voice` (`ANIMFW_VOICE_HOME` moves it; `PIPER` and `PIPER_VOICE` point at your own). Fonts need
Python's `fonttools` and `brotli`; if they are installed with `pip install --target DIR`, set `ANIMFW_PYLIB=DIR`.
