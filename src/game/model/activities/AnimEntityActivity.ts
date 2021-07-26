import { BaseActivity } from './BaseActivity'

export class AnimEntityActivity extends BaseActivity {

    static Stand = new AnimEntityActivity('Activity_Stand')
    static Route = new AnimEntityActivity('Activity_Route')
    static TeleportIn = new AnimEntityActivity('Activity_TeleportIn')

}
