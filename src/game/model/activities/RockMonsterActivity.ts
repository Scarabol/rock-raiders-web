import { AnimEntityActivity } from './AnimEntityActivity'

export class RockMonsterActivity extends AnimEntityActivity {

    static TurnLeft = new RockMonsterActivity('Activity_TurnLeft')
    static TurnRight = new RockMonsterActivity('Activity_TurnRight')
    static Emerge = new RockMonsterActivity('Activity_Emerge')
    static Enter = new RockMonsterActivity('Activity_Enter')
    static Gather = new RockMonsterActivity('Activity_Gather')
    static Carry = new RockMonsterActivity('Activity_Carry')
    static Throw = new RockMonsterActivity('Activity_Throw')
    static CarryTurnLeft = new RockMonsterActivity('Activity_CarryTurnLeft')
    static CarryTurnRight = new RockMonsterActivity('Activity_CarryTurnRight')
    static CarryStand = new RockMonsterActivity('Activity_CarryStand')
    static Repair = new RockMonsterActivity('Activity_Repair')
    static Crumble = new RockMonsterActivity('Activity_Crumble')
    static Stamp = new RockMonsterActivity('Activity_Stamp')
    static Rest = new RockMonsterActivity('Activity_Rest')
    static ThrowMan = new RockMonsterActivity('Activity_ThrowMan')
    static Eat = new RockMonsterActivity('Activity_Eat')
    static HitHard = new RockMonsterActivity('Activity_HitHard')
    static Unpowered = new RockMonsterActivity('Activity_Unpowered')
    static WakeUp = new RockMonsterActivity('Activity_WakeUp')

}
