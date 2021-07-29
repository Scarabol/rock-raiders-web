import { BaseActivity } from './BaseActivity'

export class DynamiteActivity extends BaseActivity {
    static Normal = new DynamiteActivity('Normal')
    static TickDown = new DynamiteActivity('TickDown')
}
