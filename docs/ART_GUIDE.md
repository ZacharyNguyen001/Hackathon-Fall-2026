# Art guide (for the human artist: Johnae)

**Rule:** all art is made by a person, by hand. No AI-generated images, sprites, icons or logos (CLAUDE.md rule 3).
Claude does not write or edit anything inside `src/art/`.

Full step-by-step instructions (including the loader code) are in **`docs/team/johnae-coins-and-art.md`**, Parts B and C.

## Exact files (all in `src/art/`, PNG with transparent background, 1 art pixel = 1 game pixel)
| File | Size (px) |
|---|---|
| `palettes.ts` | exports `PALETTES = { mars: {sky, ground, ledge}, moon: {...} }` (hex colors) |
| `sprites.ts` | exports `SPRITES: Record<string, string>` of the imported PNGs |
| `player.png` | 8 x 12 (hitbox is 5 x 10, feet at the bottom) |
| `habitat.png` | 48 x 32 |
| `storm-shelter.png` | 64 x 40 |
| `airlock.png` | 32 x 32 |
| `solar-pad.png` | 24 x 8 |
| `coin.png` | 8 x 8 |
| `ground-mars.png`, `ground-moon.png`, `ledge-mars.png`, `ledge-moon.png` | 8 x 8 each (optional) |

Put the artist's name in a comment at the top of `palettes.ts` and `sprites.ts`.
The screen is 384 x 216 game pixels, scaled up by a whole number, so draw small and crisp.

## What the placeholders are now (`src/game/Game.ts`, search `TODO-ART`)
Flat colored rectangles: tiles (8 x 8), player (white 5 x 10), shelters (colored boxes), solar pads (the thin dark-blue bar on Mars), coins (small yellow squares).

## How the game finds your art
A small loader (`src/game/spriteLoader.ts`, written in Johnae's guide, Part C) draws your PNGs when they exist and keeps drawing the rectangles when a picture is missing, so the game never breaks while art is in progress.
