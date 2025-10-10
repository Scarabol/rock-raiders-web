export const WALL_TYPE = {
    floor: 0,
    corner: 1,
    wall: 2,
    invertedCorner: 3,
    roof: 4,
    weirdCrevice: 20,
} as const
export type WallType = typeof WALL_TYPE[keyof typeof WALL_TYPE]
