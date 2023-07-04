import { MonsterEntityStats } from '../../cfg/GameStatsCfg'
import { AbstractGameComponent } from '../ECS'

export class MonsterStatsComponent extends AbstractGameComponent {
    constructor(readonly stats: MonsterEntityStats) {
        super()
    }
}
