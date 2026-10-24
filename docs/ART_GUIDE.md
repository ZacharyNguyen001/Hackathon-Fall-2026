# Art guide (for the human artist)

**Rule:** all art is made by a person. No AI-generated images, sprites, icons or logos (CLAUDE.md rule 3).
Claude writes the code that *draws* your art, never the art itself.

## Where artwork goes
- `src/art/` (this folder does not exist yet; create it) holds everything human-made:
  - `palettes.ts`: the colors for Moon and Mars (sky, ground, ledge) and later suit colors.
  - `sprites.ts` (+ image files such as `player.png`, `habitat.png`...): the sprites.
  - Put **your name in a comment at the top of each file** (the rules require crediting the human author).
- Claude does not edit anything inside `src/art/`.

## What is a placeholder right now (all in `src/game/Game.ts`, search for `TODO-ART`)
| What | Placeholder | Size in game pixels |
|---|---|---|
| Moon/Mars colors | the `PALETTE` object at the top of Game.ts | n/a |
| Ground and ledge tiles | flat colored squares | 8 x 8 |
| Player | white rectangle | about 5 x 10 |
| Shelters (habitat, storm shelter, airlock) | colored boxes with a dark inside | habitat 48 x 32, storm shelter 64 x 40, airlock 32 x 32 |
| Solar pads (Mars) | thin dark-blue bar | 24 x 3 |
| Coins | small yellow square | about 8 x 8 cell |

The whole screen is 384 x 216 game pixels and gets scaled up by a whole number, so draw small and crisp.
The thin **blue bars on Mars are the solar pads** and the blue-grey box is the habitat; both are placeholders.

## Hooking art in (not built yet)
Right now dropping files in `src/art/` changes nothing: the game has no sprite loader yet. Once the team says
go, Claude writes the loader/renderer (allowed) so Game.ts draws your images instead of the rectangles.
