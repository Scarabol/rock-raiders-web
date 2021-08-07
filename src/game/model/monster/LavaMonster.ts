import { MonsterEntityStats } from '../../../cfg/GameStatsCfg'
import { ResourceManager } from '../../../resource/ResourceManager'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { Monster } from './Monster'

export class LavaMonster extends Monster {
    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.LAVA_MONSTER, 'Creatures/LavaMonster/LavaMonster.ae')
    }

    get stats(): MonsterEntityStats {
        return ResourceManager.configuration.stats.LavaMonster
    }

    disposeFromWorld() {
        super.disposeFromWorld()
        this.entityMgr.rockMonsters.remove(this)
    }
}
