import { Vector2 } from 'three'
import { TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { TerrainPath } from '../map/TerrainPath'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { Monster } from './Monster'

export class Bat extends Monster {
    target: PathTarget[] = []

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, 'Creatures/bat/bat.ae', ResourceManager.configuration.stats.Bat)
        this.sceneEntity.floorOffset = TILESIZE / 2
    }

    findPathToTarget(target: PathTarget): TerrainPath { // TODO consider stats: random move
        return new TerrainPath(target, target.targetLocation)
    }

    update(elapsedMs: number) {
        this.sceneEntity.update(elapsedMs)
        if (this.target.length < 1 || this.moveToClosestTarget(this.target, elapsedMs) === MoveState.TARGET_REACHED) {
            this.target = [this.findTarget()]
        }
    }

    private findTarget(): PathTarget { // TODO move to nearby drilling noise, explosions or sonic blasters
        const terrain = this.sceneMgr.terrain
        const currentCenter = terrain.getSurfaceFromWorld(this.sceneEntity.position.clone()).getCenterWorld()
        for (let c = 0; c < 20; c++) {
            const targetX = Math.randomInclusive(currentCenter.x - (TILESIZE + TILESIZE / 2), currentCenter.x + TILESIZE + TILESIZE / 2)
            const targetZ = Math.randomInclusive(currentCenter.z - TILESIZE / 2, currentCenter.z + TILESIZE / 2)
            if (terrain.getSurfaceFromWorldXZ(targetX, targetZ).surfaceType.floor) {
                return new PathTarget(new Vector2(targetX, targetZ))
            }
        }
        console.warn('Could not find a target')
        return null
    }

    disposeFromWorld() {
        super.disposeFromWorld()
        this.entityMgr.bats.remove(this)
    }
}
