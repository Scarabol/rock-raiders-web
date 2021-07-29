import { AnimEntityActivity } from './AnimEntityActivity'

// noinspection JSUnusedGlobalSymbols
export class RaiderActivity extends AnimEntityActivity {
    static RunPanic = new RaiderActivity('Activity_RunPanic')
    static Drill = new RaiderActivity('Activity_Drill')
    static Walk = new RaiderActivity('Activity_Walk')
    static Reinforce = new RaiderActivity('Activity_Reinforce')
    static Reverse = new RaiderActivity('Activity_Reverse')
    static TurnLeft = new RaiderActivity('Activity_TurnLeft')
    static TurnRight = new RaiderActivity('Activity_TurnRight')
    static CantDo = new RaiderActivity('Activity_CantDo')
    static Collect = new RaiderActivity('Activity_Collect')
    static Clear = new RaiderActivity('Activity_Clear')
    static Carry = new RaiderActivity('Activity_Carry')
    static CarryTurnLeft = new RaiderActivity('Activity_CarryTurnLeft')
    static CarryTurnRight = new RaiderActivity('Activity_CarryTurnRight')
    static CarryStand = new RaiderActivity('Activity_CarryStand')
    static Dynamite = new RaiderActivity('Activity_Dynamite')
    static Place = new RaiderActivity('Activity_Place')
    static Deposit = new RaiderActivity('Activity_Deposit')
    static Repair = new RaiderActivity('Activity_Repair')
    static rest = new RaiderActivity('Activity_rest')
    static routeRubble = new RaiderActivity('Activity_routeRubble')
    static CarryRubble = new RaiderActivity('Activity_CarryRubble')
    static Eat = new RaiderActivity('Activity_Eat')
    static FireLaser = new RaiderActivity('Activity_FireLaser')
    static GetUp = new RaiderActivity('Activity_GetUp')
    static ThrownByRockMonster = new RaiderActivity('Activity_ThrownByRockMonster')
    static Slip = new RaiderActivity('Activity_Slip')
    static Train = new RaiderActivity('Activity_Train')
    static Recharge = new RaiderActivity('Activity_Recharge')

    static Waiting1 = new RaiderActivity('Activity_Waiting1')
    static Waiting2 = new RaiderActivity('Activity_Waiting2')
    static Waiting3 = new RaiderActivity('Activity_Waiting3')
    static Waiting4 = new RaiderActivity('Activity_Waiting4')

    static Hoverboard = new RaiderActivity('Activity_Hoverboard')
    static Standhoverboard = new RaiderActivity('Activity_Standhoverboard')
    static HitLefthoverboard = new RaiderActivity('Activity_HitLefthoverboard')
    static HitRighthoverboard = new RaiderActivity('Activity_HitRighthoverboard')
    static HitFronthoverboard = new RaiderActivity('Activity_HitFronthoverboard')
    static HitBackhoverboard = new RaiderActivity('Activity_HitBackhoverboard')

    static SMALLTRUCK = new RaiderActivity('Activity_SMALLTRUCK')
    static StandSMALLTRUCK = new RaiderActivity('Activity_StandSMALLTRUCK')
    static HitLeftSMALLTRUCK = new RaiderActivity('Activity_HitLeftSMALLTRUCK')
    static HitRightSMALLTRUCK = new RaiderActivity('Activity_HitRightSMALLTRUCK')
    static HitFrontSMALLTRUCK = new RaiderActivity('Activity_HitFrontSMALLTRUCK')
    static HitBackSMALLTRUCK = new RaiderActivity('Activity_HitBackSMALLTRUCK')

    static SMALLheli = new RaiderActivity('Activity_SMALLheli')
    static StandSMALLheli = new RaiderActivity('Activity_StandSMALLheli')
    static HitLeftSMALLheli = new RaiderActivity('Activity_HitLeftSMALLheli')
    static HitRightSMALLheli = new RaiderActivity('Activity_HitRightSMALLheli')
    static HitFrontSMALLheli = new RaiderActivity('Activity_HitFrontSMALLheli')
    static HitBackSMALLheli = new RaiderActivity('Activity_HitBackSMALLheli')

    static SMALLCAT = new RaiderActivity('Activity_SMALLCAT')
    static StandSMALLCAT = new RaiderActivity('Activity_StandSMALLCAT')
    static HitLeftSMALLCAT = new RaiderActivity('Activity_HitLeftSMALLCAT')
    static HitRightSMALLCAT = new RaiderActivity('Activity_HitRightSMALLCAT')
    static HitFrontSMALLCAT = new RaiderActivity('Activity_HitFrontSMALLCAT')
    static HitBackSMALLCAT = new RaiderActivity('Activity_HitBackSMALLCAT')

    static SMALLMLP = new RaiderActivity('Activity_SMALLMLP')
    static StandSMALLMLP = new RaiderActivity('Activity_StandSMALLMLP')
    static HitLeftSMALLMLP = new RaiderActivity('Activity_HitLeftSMALLMLP')
    static HitRightSMALLMLP = new RaiderActivity('Activity_HitRightSMALLMLP')
    static HitFrontSMALLMLP = new RaiderActivity('Activity_HitFrontSMALLMLP')
    static HitBackSMALLMLP = new RaiderActivity('Activity_HitBackSMALLMLP')

    static LARGECAT = new RaiderActivity('Activity_LARGECAT')
    static StandLARGECAT = new RaiderActivity('Activity_StandLARGECAT')
    static HitLeftLARGECAT = new RaiderActivity('Activity_HitLeftLARGECAT')
    static HitRightLARGECAT = new RaiderActivity('Activity_HitRightLARGECAT')
    static HitFrontLARGECAT = new RaiderActivity('Activity_HitFrontLARGECAT')
    static HitBackLARGECAT = new RaiderActivity('Activity_HitBackLARGECAT')

    static SMALLDIGGER = new RaiderActivity('Activity_SMALLDIGGER')
    static StandSMALLDIGGER = new RaiderActivity('Activity_StandSMALLDIGGER')
}
