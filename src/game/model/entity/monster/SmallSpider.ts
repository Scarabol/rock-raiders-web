import { Monster } from './Monster'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { Vector3 } from 'three'
import { NATIVE_FRAMERATE, TILESIZE } from '../../../../main'
import { clearTimeoutSafe, getRandom, getRandomInclusive, removeFromArray } from '../../../../core/Util'
import { SurfaceType } from '../../../../scene/model/map/SurfaceType'
import { GameState } from '../../GameState'
import { MonsterActivity } from '../../../../scene/model/activities/MonsterActivity'
import { BaseActivity } from '../../../../scene/model/activities/BaseActivity'

export class SmallSpider extends Monster {

    moveTimeout
    target: Vector3 = null

    constructor() {
        super(ResourceManager.getAnimationEntityType('Creatures/SpiderSB/SpiderSB.ae'))
    }

    startMoving() {
        SmallSpider.onMove(this)
    }

    private static onMove(spider: SmallSpider) {
        if (spider.target && spider.getPosition().distanceToSquared(spider.target) > Math.pow(spider.getSpeed(), 2)) {
            spider.changeActivity(MonsterActivity.Route)
            spider.moveToTarget(spider.target)
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

    findPathToTarget(target: Vector3): Vector3[] {
        return [target] // TODO add intermediate point to path to make it more interesting
    }

    private findSolidTarget(): Vector3 {
        const terrain = this.worldMgr.sceneManager.terrain
        const currentCenter = terrain.getSurfaceFromWorld(this.getPosition()).getCenterWorld()
        for (let c = 0; c < 20; c++) {
            const targetX = getRandomInclusive(currentCenter.x - (TILESIZE + TILESIZE / 2), currentCenter.x + TILESIZE + TILESIZE / 2)
            const targetZ = getRandomInclusive(currentCenter.z - TILESIZE / 2, currentCenter.z + TILESIZE / 2)
            const target = new Vector3(targetX, 0, targetZ)
            const surfaceType = terrain.getSurfaceFromWorld(target).surfaceType
            if (surfaceType !== SurfaceType.WATER && surfaceType !== SurfaceType.LAVA) { // TODO evaluate CrossLand, CrossLava, CrossWater from stats
                target.y = this.worldMgr.getTerrainHeight(targetX, targetZ)
                return target
            }
        }
        console.warn('Could not find a solid target for spider')
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
