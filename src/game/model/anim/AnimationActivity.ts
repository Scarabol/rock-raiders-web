export type AnimationActivity = string

export const BARRIER_ACTIVITY = {
    short: 'Short',
    expand: 'Expand',
    long: 'Long',
    teleport: 'Teleport',
} as const

export const DYNAMITE_ACTIVITY = {
    normal: 'Normal',
    tickDown: 'TickDown',
}

export const BUILDING_ACTIVITY = {
    stand: 'Activity_Stand',
    teleport: 'Activity_Teleport',
    deposit: 'Activity_Deposit',
    explode: 'Activity_Explode',
    unpowered: 'Activity_Unpowered',
    upgrade: 'Activity_Upgrade',
}

export const ANIM_ENTITY_ACTIVITY = {
    stand: 'Activity_Stand',
    route: 'Activity_Route',
    teleportIn: 'Activity_TeleportIn',
    carry: 'Activity_Carry',
    standCarry: 'Activity_CarryStand',
}
export type AnimEntityActivity = typeof ANIM_ENTITY_ACTIVITY[keyof typeof ANIM_ENTITY_ACTIVITY]

export const RAIDER_ACTIVITY = {
    drill: 'Activity_Drill',
    walk: 'Activity_Walk',
    reinforce: 'Activity_Reinforce',
    turnLeft: 'Activity_TurnLeft',
    turnRight: 'Activity_TurnRight',
    collect: 'Activity_Collect',
    clear: 'Activity_Clear',
    dynamite: 'Activity_Dynamite',
    place: 'Activity_Place',
    deposit: 'Activity_Deposit',
    repair: 'Activity_Repair',
    rest: 'Activity_rest',
    routeRubble: 'Activity_routeRubble',
    carryRubble: 'Activity_CarryRubble',
    eat: 'Activity_Eat',
    slip: 'Activity_Slip',
    train: 'Activity_Train',
    runPanic: 'Activity_RunPanic',
    thrown: 'Activity_ThrownByRockMonster',
    getUp: 'Activity_GetUp',

    hoverboard: 'Activity_Hoverboard',
    standHoverboard: 'Activity_Standhoverboard',
    smallTruck: 'Activity_SMALLTRUCK',
    standSmallTruck: 'Activity_StandSMALLTRUCK',
    smallHeli: 'Activity_SMALLheli',
    standSmallHeli: 'Activity_StandSMALLheli',
    smallCat: 'Activity_SMALLCAT',
    standSmallCat: 'Activity_StandSMALLCAT',
    smallMlp: 'Activity_SMALLMLP',
    standSmallMLP: 'Activity_StandSMALLMLP',
    largeCat: 'Activity_LARGECAT',
    standLargeCat: 'Activity_StandLARGECAT',
    smallDigger: 'Activity_SMALLDIGGER',
    standSmallDigger: 'Activity_StandSMALLDIGGER',

    shoot: 'Activity_FireLaser',
    recharge: 'Activity_Recharge',
}
export type RaiderActivity = typeof RAIDER_ACTIVITY[keyof typeof RAIDER_ACTIVITY]

export const ROCK_MONSTER_ACTIVITY = {
    unpowered: 'Activity_Unpowered',
    emerge: 'Activity_Emerge',
    wakeUp: 'Activity_WakeUp',
    eat: 'Activity_Eat',
    stamp: 'Activity_Stamp',
    enter: 'Activity_Enter',
    gather: 'Activity_Gather',
    throw: 'Activity_Throw',
    punch: 'Activity_Repair',
    crumble: 'Activity_Crumble',
    throwMan: 'Activity_ThrowMan',
    rest: 'Activity_Rest',
    hitHard: 'Activity_HitHard',
}

export const SLUG_ACTIVITY = {
    emerge: 'Activity_Emerge',
    enter: 'Activity_Enter',
    suck: 'Activity_Repair',
}
