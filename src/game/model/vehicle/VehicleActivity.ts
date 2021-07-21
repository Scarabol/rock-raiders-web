import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { MovableEntityActivity } from '../activities/MovableEntityActivity'

export class VehicleActivity extends MovableEntityActivity {

    static TeleportIn = new AnimEntityActivity('Activity_TeleportIN')

}
