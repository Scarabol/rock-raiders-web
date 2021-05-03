import { Vector2 } from 'three'
import { getRandom, getRandomInclusive } from '../../../core/Util'
import { NATIVE_FRAMERATE, TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { Surface } from '../map/Surface'
import { SurfaceType } from '../map/SurfaceType'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { Monster } from './Monster'

export class SmallSpider extends Monster {

    currentSurface: Surface = null

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.SMALL_SPIDER, 'Creatures/SpiderSB/SpiderSB.ae')
    }

    get stats() {
        return ResourceManager.stats.SmallSpider
    }

    startMoving() {
        SmallSpider.onMove(this)
    }

    private static onMove(spider: SmallSpider) {
        const prevSurface = spider.currentSurface || spider.sceneMgr.terrain.getSurfaceFromWorld(spider.group.position)
        if (spider.target.length > 0 && spider.moveToClosestTarget(spider.target) === MoveState.MOVED) {
            const nextSurface = spider.sceneMgr.terrain.getSurfaceFromWorld(spider.group.position)
            if (prevSurface !== nextSurface) {
                (GameState.spidersBySurface.get(prevSurface) || []).remove(spider)
                GameState.spidersBySurface.getOrUpdate(nextSurface, () => []).push(spider)
            }
            if (!spider.sceneMgr.terrain.getSurfaceFromWorld(spider.getPosition()).surfaceType.floor) {
                spider.onDeath()
            } else {
                spider.moveTimeout = setTimeout(() => SmallSpider.onMove(spider), 1000 / NATIVE_FRAMERATE)
            }
        } else {
            spider.changeActivity()
            spider.moveTimeout = setTimeout(() => {
                spider.target = [spider.findTarget()]
                SmallSpider.onMove(spider)
            }, 1000 + getRandom(9000))
        }
    }

    private findTarget(): PathTarget {
        const terrain = this.sceneMgr.terrain
        const currentCenter = terrain.getSurfaceFromWorld(this.getPosition()).getCenterWorld()
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
        this.onLevelEnd()
        GameState.spiders.remove(this)
        GameState.spidersBySurface.getOrUpdate(this.currentSurface, () => []).remove(this)
    }

}
