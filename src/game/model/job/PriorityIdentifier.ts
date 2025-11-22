export const PRIORITY_IDENTIFIER = {
    none: '', // useful for truthiness checks
    train: 'train', // not shown in original game
    getIn: 'getIn',
    crystal: 'crystal',
    ore: 'ore',
    repair: 'repair',
    clearing: 'clearing',
    destruction: 'destruction',
    construction: 'construction',
    reinforce: 'reinforce',
    recharge: 'recharge',
    getTool: 'getTool', // not shown in original game
    buildPath: 'buildPath', // not shown in original game
} as const
export type PriorityIdentifier = typeof PRIORITY_IDENTIFIER[keyof typeof PRIORITY_IDENTIFIER]
