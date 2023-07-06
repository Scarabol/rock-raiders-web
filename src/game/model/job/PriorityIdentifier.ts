export enum PriorityIdentifier { // This needs to be an actual enum, because it is serialized between workers
    NONE = 0, // useful for truthiness checks
    TRAIN,
    GET_IN,
    CRYSTAL,
    ORE,
    REPAIR,
    CLEARING,
    DESTRUCTION,
    CONSTRUCTION,
    REINFORCE,
    RECHARGE,
}
