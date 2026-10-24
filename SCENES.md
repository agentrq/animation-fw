# Making an AgentRQ README scene

`scenes/task-board.js` is the reference. Read it before you start: every
new scene is the same shape, and is built from `kit/agentrq.js` so the
series reads as one.

## The house style

- **Canvas 1200 × 440, a 24 s loop, dark.** `newScene()` sets these and the
  fonts; a test fails a scene that changes them.
- **Left column (x 40–410): `intro()`.** The logo, a pixel-font kicker
  naming the feature, a two-line Inter headline (short and plain, ending in
  a full stop), a one-line subtitle, 3–4 step chips lit in turn as the story
  moves, and a log line (`> ...`) saying what just happened.
- **Stage (x 440–1180, y 20–300): a sketch of the app's own screen** for the
  feature, drawn with `frame()`, `button()` and plain rects in the kit's
  colours `C`. Use the app's real labels and statuses. It is a sketch, so keep
  only what tells the story.
- **Ground (y 400) and the mascots on it: `mascot()`.** claude, codex, agy,
  hermes and openclaw, by name from `MASCOTS` / `mascotByName()`. Use the ones
  the story needs; place them under the stage with `x`. They hop
  (`hops`) and speak in bubbles: `alert` `!`, `work` `...`, `ask` `?`, `done`
  tick, or your own with `say` (`'zZ'`).
- **You are the pointer: `cursor()`** with `press()` for each click.
- **`sky()` and `ground()`** first, in that order.
- **Story beats:** something arrives, agents act, one moment needs you, it
  ends well and the agents celebrate. Hold the end for a few seconds, then
  fade everything out by ~23 s so the loop restarts clean.
- **`poster`** is the second the scene shows with reduced motion: pick the
  frame that tells the whole story on its own (usually just after the end).
- **`description`** is the alt text: say what happens, in one or two
  sentences.

## The rules

- Motion is CSS only, and everything is inside the file. `animfw check`
  enforces it; `npm test` runs it on every scene, with a 300 KB budget.
- **Never change what an existing kit export draws.** Other scenes depend
  on it. Add a new export or a new option instead, and check
  `scenes/task-board.js` still builds byte-for-byte the same (`cmp` the SVG
  before and after).
- Draw animated content at the origin and give its position in the keys: a
  CSS transform replaces a `transform` attribute on the same element.
- Times are seconds on the 24 s loop. Name the beats as constants at the
  top of the scene, as the task board does.

## Working in parallel

Several agents make scenes at once, so each works in its own git worktree
of this repo, on its own branch:

```sh
FW=/home/rpi/Code/go/src/github.com/agentrq/animation-fw
git -C $FW worktree add $FW-<slug> -b scene/<slug> main
cd $FW-<slug> && ln -s $FW/node_modules node_modules
node bin/animfw.js preview scenes/<slug>.js   # dist/<slug>.svg, .gif, -sheet.png, -poster.png
npm test
```

Look at `dist/<slug>-sheet.png` after every change: it is eight labelled
frames of the loop. For one exact moment, `frames()` in `src/render.js`.

When the README PR is merged: commit the scene on `scene/<slug>`, then
`git -C $FW merge scene/<slug>` and `git -C $FW worktree remove $FW-<slug>`.

## Into the README

The SVG goes in the agentrq repo at `docs/assets/readme/<slug>.svg`, and is
shown from there (no landing deploy). In `README.md`'s Features table, add a
full-width row right under the feature's own row:

```html
<tr>
<td colspan="2"><img src="docs/assets/readme/<slug>.svg" width="1200" alt="<the scene's description>" /></td>
</tr>
```

A feature whose cell already spans both columns (Pano, Workspace Forks) takes
the image inside that cell, after its paragraph. Set the line under
`## ✨ Features` to exactly:

> Real captures from the running app, and animated sketches of the main features.

When `README.zh-CN.md` has a section for the feature under 核心概念, put the
image there too, with the alt text in Chinese.
