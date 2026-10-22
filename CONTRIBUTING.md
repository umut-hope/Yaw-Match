# Contributing

Thanks for helping! The most useful contributions are better game data: new games,
corrected yaw values and better sources.

## Report or add a game

The easiest way is to open an
[**Add or fix a game** issue](https://github.com/umut-hope/Yaw-Match/issues/new?template=add-game.yml).
Please include where the value comes from.

## Edit the data yourself

1. Add or edit a file in `data/games/`. The file name must match the `id`, for example
   `data/games/my-game.json` with `"id": "my-game"`.
2. Follow the fields in [`data/schema.ts`](data/schema.ts):

   ```json
   {
     "id": "my-game",
     "name": "My Game",
     "yaw": 0.022,
     "sensCurve": "linear",
     "fov": null,
     "ads": null,
     "configFiles": [],
     "consoleCommand": "sensitivity {sens}",
     "sources": [{ "url": "https://example.com", "title": "Where the value comes from", "note": "Lists 0.022" }],
     "verifiedBy": "community",
     "notes": "Optional caveats for players"
   }
   ```

3. Run `npm test`. It validates every game file against the schema.
4. Open a pull request.

## Data rules

- **Never guess a value.** Every yaw needs a source, or `verifiedBy` must be `"unverified"`.
- Pick the trust level honestly:
  - `official`: the developer's own documentation
  - `measurement`: measured in game; describe the method in the source note
  - `community`: several independent sources agree
  - `unverified`: no source, or sources disagree
- When sources disagree, list all of them and say so in the source notes.
- Leave `fov` as `null` and `configFiles` empty if you are not sure. Missing data is
  better than wrong data.
- Do not copy another site's database. Cite individual pages as sources instead.
- Text only: no game logos, icons, cover art or screenshots.

## Measuring yaw in game

A simple way to check a value:

1. Set a known sensitivity and DPI.
2. Use a tool that sends an exact number of mouse counts, or move the mouse along a ruler.
3. Find the counts (or distance) for exactly one full 360° turn.
4. `yaw = 360 / (counts × sensitivity)`.

Repeat a few times and include the setup in the source note.

## Code

- `src/core/` is pure math: no DOM, no UI imports, full unit tests.
- TypeScript strict mode; run `npm run check` and `npm test` before opening a PR.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).

By contributing you agree that code is released under MIT and game data under CC BY 4.0.
