/**
 * FILE PURPOSE: names for the numbers stored in the map grid (0 = empty air, 1 = ground, 2 = floating ledge) and a helper `isSolid` that says whether the player can stand on or bump into a tile.
 */
/** Tile ids stored in GameMap.tiles. */
export const T_EMPTY = 0
export const T_GROUND = 1
export const T_LEDGE = 2

export const isSolid = (t: number) => t !== T_EMPTY
