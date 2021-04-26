import { Vector2 } from 'three'
import { getRandom, getRandomInclusive } from '../../../../core/Util'
import { NATIVE_FRAMERATE, TILESIZE } from '../../../../main'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { SurfaceType } from '../../../../scene/model/map/SurfaceType'
import { MoveState } from '../../../../scene/model/MoveState'
import { PathTarget } from '../../../../scene/model/PathTarget'
import { GameState } from '../../GameState'
import { Monster } from './Monster'

export class SmallSpider extends Monster {

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
        const prevSurface = spider.getCurrentSurface()
        if (spider.target && spider.moveToClosestTarget([spider.target]) === MoveState.MOVED) {
            const nextSurface = spider.getCurrentSurface()
            if (prevSurface !== nextSurface) {
                (GameState.spidersBySurface.get(prevSurface) || []).remove(spider)
                GameState.spidersBySurface.getOrUpdate(nextSurface, () => []).push(spider)
            }
            if (!spider.worldMgr.sceneManager.terrain.getSurfaceFromWorld(spider.getPosition()).surfaceType.floor) {
                spider.onDeath()
            } else {
                spider.moveTimeout = setTimeout(() => SmallSpider.onMove(spider), 1000 / NATIVE_FRAMERATE)
            }
        } else {
            spider.changeActivity()
            spider.moveTimeout = setTimeout(() => {
                spider.target = spider.findTarget()
                SmallSpider.onMove(spider)
            }, 1000 + getRandom(9000))
        }
    }

    private findTarget(): PathTarget {
        const terrain = this.worldMgr.sceneManager.terrain
        const currentCenter = terrain.getSurfaceFromWorld(this.getPosition()).getCenterWorld()
        for (let c = 0; c < 20; c++) {
            const targetX = getRandomInclusive(currentCenter.x - (TILESIZE + TILESIZE / 2), currentCenter.x + TILESIZE + TILESIZE / 2)
            const targetZ = getRandomInclusive(currentCenter.z - TILESIZE / 2, currentCenter.z + TILESIZE / 2)
            const surfaceType = terrain.getSurfaceFromWorldXZ(targetX, targetZ).surfaceType
            if (surfaceType !== SurfaceType.WATER && surfaceType !== SurfaceType.LAVA) { // TODO evaluate CrossLand, CrossLava, CrossWater from stats
                return new PathTarget(new Vector2(targetX, targetZ))
            }
        }
        console.warn('Could not find a solid target')
        return null
    }

    onDeath() {
        this.onLevelEnd()
        GameState.spiders.remove(this);
        (GameState.spidersBySurface.get(this.getCurrentSurface()) || []).remove(this)
    }

}
