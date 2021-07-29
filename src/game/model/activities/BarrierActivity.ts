import { BaseActivity } from './BaseActivity'

export class BarrierActivity extends BaseActivity {
    static Short = new BarrierActivity('Short')
    static Expand = new BarrierActivity('Expand')
    static Long = new BarrierActivity('Long')
    static Teleport = new BarrierActivity('Teleport')
}
