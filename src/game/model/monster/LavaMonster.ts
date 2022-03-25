import { ResourceManager } from '../../../resource/ResourceManager'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { Monster } from './Monster'
import { PathTarget } from '../PathTarget'
import { TerrainPath } from '../map/TerrainPath'

export class LavaMonster extends Monster {
    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, 'Creatures/LavaMonster/LavaMonster.ae', ResourceManager.configuration.stats.LavaMonster)
    }

    findPathToTarget(target: PathTarget): TerrainPath  {
        return this.sceneMgr.terrain.pathFinder.findPath(this.sceneEntity.position2D, target, this.stats, false)
    }

    disposeFromWorld() {
        super.disposeFromWorld()
        this.entityMgr.rockMonsters.remove(this)
    }
}
