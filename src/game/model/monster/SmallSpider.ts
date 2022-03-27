import { Vector2 } from 'three'
import { TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { SurfaceType } from '../map/SurfaceType'
import { TerrainPath } from '../map/TerrainPath'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { Monster } from './Monster'

export class SmallSpider extends Monster {
    target: PathTarget[] = []
    idleTimer: number = 0

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, 'Creatures/SpiderSB/SpiderSB.ae', ResourceManager.configuration.stats.SmallSpider)
        this.sceneEntity.floorOffset = 1 // TODO rotate spider according to surface normal vector
    }

    findPathToTarget(target: PathTarget): TerrainPath { // TODO consider stats: random move and random enter wall
        return new TerrainPath(target, target.targetLocation)
    }

    update(elapsedMs: number) {
        this.sceneEntity.update(elapsedMs)
        if (this.idleTimer > 0) {
            this.idleTimer -= elapsedMs
            return
        }
        if (this.target.length <= 0 || this.moveToClosestTarget(this.target, elapsedMs) !== MoveState.MOVED) {
            this.sceneEntity.changeActivity()
            this.target = [this.findTarget()]
            this.idleTimer = 1000 + Math.randomInclusive(9000)
        } else if (!this.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position).surfaceType.floor) {
            this.disposeFromWorld()
        }
    }

    private findTarget(): PathTarget {
        const terrain = this.sceneMgr.terrain
        const currentCenter = terrain.getSurfaceFromWorld(this.sceneEntity.position.clone()).getCenterWorld()
        for (let c = 0; c < 20; c++) {
            const targetX = Math.randomInclusive(currentCenter.x - (TILESIZE + TILESIZE / 2), currentCenter.x + TILESIZE + TILESIZE / 2)
            const targetZ = Math.randomInclusive(currentCenter.z - TILESIZE / 2, currentCenter.z + TILESIZE / 2)
            const surfaceType = terrain.getSurfaceFromWorldXZ(targetX, targetZ).surfaceType
            if (surfaceType !== SurfaceType.WATER && surfaceType !== SurfaceType.LAVA) { // TODO evaluate CrossLand, CrossLava, CrossWater from stats
                return new PathTarget(new Vector2(targetX, targetZ))
            }
        }
        console.warn('Could not find a target')
        return null
    }

    disposeFromWorld() {
        super.disposeFromWorld()
        this.entityMgr.spiders.remove(this)
    }
}
