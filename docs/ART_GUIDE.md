# Art guide (for the human artist: Johnae)

**Rule:** all art is made by a person, by hand. No AI-generated images, sprites, icons or logos (CLAUDE.md rule 3).
Claude does not write or edit anything inside `src/art/`.


## Exact files (all in `src/art/`, PNG with transparent background, 1 art pixel = 1 game pixel)
| File | Size (px) |
|---|---|
| `palettes.ts` | exports `PALETTES = { mars: {sky, ground, ledge}, moon: {...} }` (hex colors) |
| `sprites.ts` | exports `SPRITES: Record<string, string>` of the imported PNGs |
| `player.png` | 8 x 12 (hitbox is 5 x 10, feet at the bottom) |
| `habitat.png` | 48 x 32 |
| `storm-shelter.png` | 64 x 40 |
| `airlock.png` | 32 x 32 |
| `coin.png` | 8 x 8 |
| `mars-ground.png`, `moon-ground.png` | 8 x 8 each (ground tiles). Ledges have no picture: they use the palette's `ledge` color |

Put the artist's name in a comment at the top of `palettes.ts` and `sprites.ts`.
The screen is 384 x 216 game pixels, scaled up by a whole number, so draw small and crisp.

## What the placeholders are now (`src/game/Game.ts`, search `TODO-ART`)
Flat colored rectangles: tiles (8 x 8), player (white 5 x 10), shelters (colored boxes), coins (small yellow squares).

## How the game finds your art
A small loader (`src/game/spriteLoader.ts`, written in Johnae's guide, Part C) draws your PNGs when they exist and keeps drawing the rectangles when a picture is missing, so the game never breaks while art is in progress.
