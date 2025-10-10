export const PRIORITY_IDENTIFIER = {
    none: 0, // useful for truthiness checks
    train: 1, // not shown in original game
    getIn: 2,
    crystal: 3,
    ore: 4,
    repair: 5,
    clearing: 6,
    destruction: 7,
    construction: 8,
    reinforce: 9,
    recharge: 10,
    getTool: 11, // not shown in original game
    buildPath: 12, // not shown in original game
} as const
export type PriorityIdentifier = typeof PRIORITY_IDENTIFIER[keyof typeof PRIORITY_IDENTIFIER]
