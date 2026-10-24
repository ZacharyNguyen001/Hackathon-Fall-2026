/** Tile ids stored in GameMap.tiles. */
export const T_EMPTY = 0
export const T_GROUND = 1
export const T_LEDGE = 2

export const isSolid = (t: number) => t !== T_EMPTY
