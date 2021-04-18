import { Monster } from './Monster'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { Vector2 } from 'three'
import { NATIVE_FRAMERATE, TILESIZE } from '../../../../main'
import { clearTimeoutSafe, getRandom, getRandomInclusive, removeFromArray } from '../../../../core/Util'
import { SurfaceType } from '../../../../scene/model/map/SurfaceType'
import { GameState } from '../../GameState'
import { MonsterActivity } from '../../../../scene/model/activities/MonsterActivity'
import { BaseActivity } from '../../../../scene/model/activities/BaseActivity'
import { MoveState } from '../../../../scene/model/MoveState'

export class SmallSpider extends Monster {

    moveTimeout
    target: Vector2 = null

    constructor() {
        super(ResourceManager.getAnimationEntityType('Creatures/SpiderSB/SpiderSB.ae'))
    }

    get stats() {
        return ResourceManager.stats.SmallSpider
    }

    startMoving() {
        SmallSpider.onMove(this)
    }

    private static onMove(spider: SmallSpider) {
        if (spider.target && spider.moveToTarget(spider.target) === MoveState.MOVED) {
            if (!spider.worldMgr.sceneManager.terrain.getSurfaceFromWorld(spider.getPosition()).surfaceType.floor) {
                spider.onDeath()
            } else {
                spider.moveTimeout = setTimeout(() => SmallSpider.onMove(spider), 1000 / NATIVE_FRAMERATE)
            }
        } else {
            spider.changeActivity(MonsterActivity.Stand)
            spider.moveTimeout = setTimeout(() => {
                spider.target = spider.findSolidTarget()
                SmallSpider.onMove(spider)
            }, 1000 + getRandom(9000))
        }
    }

    private findSolidTarget(): Vector2 {
        const terrain = this.worldMgr.sceneManager.terrain
        const currentCenter = terrain.getSurfaceFromWorld(this.getPosition()).getCenterWorld()
        for (let c = 0; c < 20; c++) {
            const targetX = getRandomInclusive(currentCenter.x - (TILESIZE + TILESIZE / 2), currentCenter.x + TILESIZE + TILESIZE / 2)
            const targetZ = getRandomInclusive(currentCenter.z - TILESIZE / 2, currentCenter.z + TILESIZE / 2)
            const surfaceType = terrain.getSurfaceFromWorldXZ(targetX, targetZ).surfaceType
            if (surfaceType !== SurfaceType.WATER && surfaceType !== SurfaceType.LAVA) { // TODO evaluate CrossLand, CrossLava, CrossWater from stats
                return new Vector2(targetX, targetZ)
            }
        }
        console.warn('Could not find a solid target')
        return null
    }

    onDeath() {
        this.onLevelEnd()
        this.worldMgr.sceneManager.scene.remove(this.group)
        removeFromArray(GameState.spiders, this)
    }

    onLevelEnd() {
        this.moveTimeout = clearTimeoutSafe(this.moveTimeout)
    }

    getRouteActivity(): BaseActivity {
        return MonsterActivity.Route
    }

}
