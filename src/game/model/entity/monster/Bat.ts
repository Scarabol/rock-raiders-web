import { Monster } from './Monster'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { Vector3 } from 'three'
import { NATIVE_FRAMERATE, TILESIZE } from '../../../../main'
import { clearTimeoutSafe, getRandomInclusive, removeFromArray } from '../../../../core/Util'
import { GameState } from '../../GameState'
import { MonsterActivity } from '../../../../scene/model/activities/MonsterActivity'
import { BaseActivity } from '../../../../scene/model/activities/BaseActivity'

export class Bat extends Monster {

    moveTimeout
    target: Vector3 = null

    constructor() {
        super(ResourceManager.getAnimationEntityType('Creatures/bat/bat.ae'))
        this.heightOffset = TILESIZE
    }

    startMoving() {
        Bat.onMove(this)
    }

    private static onMove(bat: Bat) {
        if (bat.target) bat.target.y = bat.group.position.y
        if (!bat.target || bat.getPosition().distanceToSquared(bat.target) <= Math.pow(bat.getSpeed(), 2)) {
            bat.target = bat.findTarget()
        }
        bat.moveToTarget(bat.target)
        if (!bat.worldMgr.sceneManager.terrain.getSurfaceFromWorld(bat.getPosition()).surfaceType.floor) {
            bat.onDeath()
        } else {
            bat.moveTimeout = setTimeout(() => Bat.onMove(bat), 1000 / NATIVE_FRAMERATE)
        }
    }

    private findTarget(): Vector3 { // TODO move to nearby drilling noise, explosions or sonic blasters
        const terrain = this.worldMgr.sceneManager.terrain
        const currentCenter = terrain.getSurfaceFromWorld(this.getPosition()).getCenterWorld()
        for (let c = 0; c < 20; c++) {
            const targetX = getRandomInclusive(currentCenter.x - (TILESIZE + TILESIZE / 2), currentCenter.x + TILESIZE + TILESIZE / 2)
            const targetZ = getRandomInclusive(currentCenter.z - TILESIZE / 2, currentCenter.z + TILESIZE / 2)
            const target = new Vector3(targetX, 0, targetZ)
            if (terrain.getSurfaceFromWorld(target).surfaceType.floor) { // TODO evaluate CrossLand, CrossLava, CrossWater from stats
                target.y = this.worldMgr.getTerrainHeight(targetX, targetZ) + TILESIZE
                return target
            }
        }
        console.warn('Could not find a solid target for spider')
        return null
    }

    onDeath() {
        this.onLevelEnd()
        this.worldMgr.sceneManager.scene.remove(this.group)
        removeFromArray(GameState.bats, this)
    }

    onLevelEnd() {
        this.moveTimeout = clearTimeoutSafe(this.moveTimeout)
    }

    getRouteActivity(): BaseActivity {
        return MonsterActivity.Route
    }

}
