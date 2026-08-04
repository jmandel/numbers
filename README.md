# Number & Letter Cards

A flashcard app for kids learning to recognize written characters. One big
character fills the screen; the adult asks the child what it is and grades the
answer. This generalizes the original single-file
[numbers.html](https://github.com/jmandel/jmandel.github.io/blob/master/c/numbers.html)
to numbers, capital letters, small letters, a combined deck, or any custom set
of characters, and adds rotation, richer tracking, and an insights view.

Each card is drawn in a random font, color, size, and tilt (configurable up to
30°) so the child learns the shape rather than one rendering of it. Scheduling
is a five-box Leitner system: cards the child knows come back less often, and
misses reset to the front of the line. When the child names the wrong
character, tapping what they said records the confusion and shows both
characters side by side in the same font so the difference can be pointed out;
both characters in the pair come back soon while the contrast is fresh.

Every graded card is logged with its font, tilt, and answer time, and the stats
screen turns that log into per-character mastery and accuracy, the most
confused pairs plus a full shown-versus-said matrix, rolling accuracy over
time, and breakdowns of whether rotation or particular typefaces cause more
misses. Progress is keyed by character, so switching decks never loses it. All
data stays in localStorage on the device.

## Development

Built with [Bun](https://bun.sh), React, TypeScript, and Zustand.

```sh
bun install
bun run dev        # dev server with hot reload
bun run build      # static build in dist/
bun run typecheck
```

Pushes to `main` build and deploy to GitHub Pages via the workflow in
`.github/workflows/deploy.yml`.
