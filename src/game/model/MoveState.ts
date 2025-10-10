export const MOVE_STATE = {
    moved: 1,
    targetReached: 2,
    targetUnreachable: 3,
} as const
export type MoveState = typeof MOVE_STATE[keyof typeof MOVE_STATE]
