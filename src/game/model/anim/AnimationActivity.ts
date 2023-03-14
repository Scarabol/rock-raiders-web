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
    Teleport = 'Activity_Teleport',
    Deposit = 'Activity_Deposit',
    Explode = 'Activity_Explode',
    Unpowered = 'Activity_Unpowered',
}

export enum AnimEntityActivity {
    Stand = 'Activity_Stand',
    Route = 'Activity_Route',
}

export enum RaiderActivity {
    Stand = 'Activity_Stand',
    Drill = 'Activity_Drill',
    Walk = 'Activity_Walk',
    Reinforce = 'Activity_Reinforce',
    TurnLeft = 'Activity_TurnLeft',
    TurnRight = 'Activity_TurnRight',
    Collect = 'Activity_Collect',
    Clear = 'Activity_Clear',
    Carry = 'Activity_Carry',
    CarryStand = 'Activity_CarryStand',
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

    TeleportIn = 'Activity_TeleportIn',

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
}

export enum RockMonsterActivity {
    Unpowered = 'Activity_Unpowered',
}
