import { MonsterEntityStats } from '../../../cfg/GameStatsCfg'
import { ResourceManager } from '../../../resource/ResourceManager'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { Monster } from './Monster'

export class RockMonster extends Monster {
    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.ROCK_MONSTER, 'Creatures/RMonster/RMonster.ae')
    }

    get stats(): MonsterEntityStats {
        return ResourceManager.configuration.stats.RockMonster
    }

    disposeFromWorld() {
        super.disposeFromWorld()
        this.entityMgr.rockMonsters.remove(this)
    }
}
