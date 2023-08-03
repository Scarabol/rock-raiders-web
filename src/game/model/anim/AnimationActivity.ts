export type AnimationActivity = string

export enum BarrierActivity {
    Short = 'Short',
    Expand = 'Expand',
    Long = 'Long',
    Teleport = 'Teleport',
}

export enum DynamiteActivity {
    Normal = 'Normal',
    TickDown = 'TickDown',
}

export enum BuildingActivity {
    Stand = 'Activity_Stand',
    Teleport = 'Activity_Teleport',
    Deposit = 'Activity_Deposit',
    Explode = 'Activity_Explode',
    Unpowered = 'Activity_Unpowered',
    Upgrade = 'Activity_Upgrade',
}

export enum AnimEntityActivity {
    Stand = 'Activity_Stand',
    Route = 'Activity_Route',
    TeleportIn = 'Activity_TeleportIn',
    Carry = 'Activity_Carry',
    StandCarry = 'Activity_CarryStand',
}

export enum RaiderActivity {
    Drill = 'Activity_Drill',
    Walk = 'Activity_Walk',
    Reinforce = 'Activity_Reinforce',
    TurnLeft = 'Activity_TurnLeft',
    TurnRight = 'Activity_TurnRight',
    Collect = 'Activity_Collect',
    Clear = 'Activity_Clear',
    Dynamite = 'Activity_Dynamite',
    Place = 'Activity_Place',
    Deposit = 'Activity_Deposit',
    Repair = 'Activity_Repair',
    rest = 'Activity_rest',
    routeRubble = 'Activity_routeRubble',
    CarryRubble = 'Activity_CarryRubble',
    Eat = 'Activity_Eat',
    Slip = 'Activity_Slip',
    Train = 'Activity_Train',
    RunPanic = 'Activity_RunPanic',
    Thrown = 'Activity_ThrownByRockMonster',
    GetUp = 'Activity_GetUp',

    Hoverboard = 'Activity_Hoverboard',
    Standhoverboard = 'Activity_Standhoverboard',
    SMALLTRUCK = 'Activity_SMALLTRUCK',
    StandSMALLTRUCK = 'Activity_StandSMALLTRUCK',
    SMALLheli = 'Activity_SMALLheli',
    StandSMALLheli = 'Activity_StandSMALLheli',
    SMALLCAT = 'Activity_SMALLCAT',
    StandSMALLCAT = 'Activity_StandSMALLCAT',
    SMALLMLP = 'Activity_SMALLMLP',
    StandSMALLMLP = 'Activity_StandSMALLMLP',
    LARGECAT = 'Activity_LARGECAT',
    StandLARGECAT = 'Activity_StandLARGECAT',
    SMALLDIGGER = 'Activity_SMALLDIGGER',
    StandSMALLDIGGER = 'Activity_StandSMALLDIGGER',

    Shoot = 'Activity_FireLaser',
    Recharge = 'Activity_Recharge',
}

export enum RockMonsterActivity {
    Unpowered = 'Activity_Unpowered',
    Emerge = 'Activity_Emerge',
    WakeUp = 'Activity_WakeUp',
    Eat = 'Activity_Eat',
    Stamp = 'Activity_Stamp',
    Enter = 'Activity_Enter',
    Gather = 'Activity_Gather',
    Throw = 'Activity_Throw',
    Punch = 'Activity_Repair',
    Crumble = 'Activity_Crumble',
    ThrowMan = 'Activity_ThrowMan',
}

export enum SlugActivity {
    Emerge = 'Activity_Emerge',
    Enter = 'Activity_Enter',
    Suck = 'Activity_Repair',
}
