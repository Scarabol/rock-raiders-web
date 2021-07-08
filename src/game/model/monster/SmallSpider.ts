import { Vector2 } from 'three'
import { getRandom, getRandomInclusive } from '../../../core/Util'
import { TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { SurfaceType } from '../map/SurfaceType'
import { TerrainPath } from '../map/TerrainPath'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { Monster } from './Monster'

export class SmallSpider extends Monster {

    idleTimer: number = 0

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.SMALL_SPIDER, 'Creatures/SpiderSB/SpiderSB.ae')
        this.sceneEntity.floorOffset = 1 // TODO rotate spider according to surface normal vector
    }

    get stats() {
        return ResourceManager.stats.SmallSpider
    }

    findPathToTarget(target: PathTarget): TerrainPath { // TODO consider stats: random move and random enter wall
        return new TerrainPath(target, target.targetLocation)
    }

    update(elapsedMs: number) {
        this.sceneEntity.update(elapsedMs)
        this.idleTimer -= elapsedMs
        if (this.idleTimer > 0) return
        if (this.target.length > 0 && this.moveToClosestTarget(this.target, elapsedMs) === MoveState.MOVED) { // TODO consider elapsed time when moving
            if (!this.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position).surfaceType.floor) {
                this.onDeath()
            }
        } else {
            this.sceneEntity.changeActivity()
            this.target = [this.findTarget()]
            this.idleTimer = 1000 + getRandom(9000)
        }
    }

    private findTarget(): PathTarget {
        const terrain = this.sceneMgr.terrain
        const currentCenter = terrain.getSurfaceFromWorld(this.sceneEntity.position.clone()).getCenterWorld()
        for (let c = 0; c < 20; c++) {
            const targetX = getRandomInclusive(currentCenter.x - (TILESIZE + TILESIZE / 2), currentCenter.x + TILESIZE + TILESIZE / 2)
            const targetZ = getRandomInclusive(currentCenter.z - TILESIZE / 2, currentCenter.z + TILESIZE / 2)
            const surfaceType = terrain.getSurfaceFromWorldXZ(targetX, targetZ).surfaceType
            if (surfaceType !== SurfaceType.WATER && surfaceType !== SurfaceType.LAVA) { // TODO evaluate CrossLand, CrossLava, CrossWater from stats
                return new PathTarget(new Vector2(targetX, targetZ))
            }
        }
        console.warn('Could not find a target')
        return null
    }

    onDeath() {
        this.removeFromScene()
        this.entityMgr.spiders.remove(this)
    }

}
