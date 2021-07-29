import { AnimEntityActivity } from './AnimEntityActivity'

export class BuildingActivity extends AnimEntityActivity {
    static Teleport = new BuildingActivity('Activity_Teleport')
    static Deposit = new BuildingActivity('Activity_Deposit')
    static Explode = new BuildingActivity('Activity_Explode')
    static Unpowered = new BuildingActivity('Activity_Unpowered')
}
