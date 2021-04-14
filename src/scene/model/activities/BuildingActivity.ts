import { BaseActivity } from './BaseActivity'

export class BuildingActivity extends BaseActivity {

    static Stand = new BuildingActivity('Activity_Stand')
    static Teleport = new BuildingActivity('Activity_Teleport')
    static Deposit = new BuildingActivity('Activity_Deposit')
    static Explode = new BuildingActivity('Activity_Explode')
    static Unpowered = new BuildingActivity('Activity_Unpowered')

}
