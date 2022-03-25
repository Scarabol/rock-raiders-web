import { ResourceManager } from '../../../resource/ResourceManager'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { Monster } from './Monster'
import { PathTarget } from '../PathTarget'
import { TerrainPath } from '../map/TerrainPath'

export class RockMonster extends Monster {
    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, 'Creatures/RMonster/RMonster.ae', ResourceManager.configuration.stats.RockMonster)
    }

    findPathToTarget(target: PathTarget): TerrainPath {
        return this.sceneMgr.terrain.pathFinder.findPath(this.sceneEntity.position2D, target, this.stats, false)
    }

    disposeFromWorld() {
        super.disposeFromWorld()
        this.entityMgr.rockMonsters.remove(this)
    }
}
