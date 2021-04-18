import { Monster } from './Monster'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { Vector2 } from 'three'
import { NATIVE_FRAMERATE, TILESIZE } from '../../../../main'
import { clearTimeoutSafe, getRandomInclusive, removeFromArray } from '../../../../core/Util'
import { GameState } from '../../GameState'
import { MonsterActivity } from '../../../../scene/model/activities/MonsterActivity'
import { BaseActivity } from '../../../../scene/model/activities/BaseActivity'
import { MoveState } from '../../../../scene/model/MoveState'

export class Bat extends Monster {

    moveTimeout
    target: Vector2 = null

    constructor() {
        super(ResourceManager.getAnimationEntityType('Creatures/bat/bat.ae'))
    }

    get stats() {
        return ResourceManager.stats.Bat
    }

    startMoving() {
        Bat.onMove(this)
    }

    private static onMove(bat: Bat) {
        if (!bat.target || bat.moveToTarget(bat.target) === MoveState.TARGET_REACHED) {
            bat.target = bat.findTarget()
        }
        bat.moveTimeout = setTimeout(() => Bat.onMove(bat), 1000 / NATIVE_FRAMERATE)
    }

    determinePosY(x: number, z: number) {
        return this.worldMgr.getFloorHeight(x, z) + TILESIZE / 2
    }

    private findTarget(): Vector2 { // TODO move to nearby drilling noise, explosions or sonic blasters
        const terrain = this.worldMgr.sceneManager.terrain
        const currentCenter = terrain.getSurfaceFromWorld(this.getPosition()).getCenterWorld()
        for (let c = 0; c < 20; c++) {
            const targetX = getRandomInclusive(currentCenter.x - (TILESIZE + TILESIZE / 2), currentCenter.x + TILESIZE + TILESIZE / 2)
            const targetZ = getRandomInclusive(currentCenter.z - TILESIZE / 2, currentCenter.z + TILESIZE / 2)
            if (terrain.getSurfaceFromWorldXZ(targetX, targetZ).surfaceType.floor) { // TODO evaluate CrossLand, CrossLava, CrossWater from stats
                return new Vector2(targetX, targetZ)
            }
        }
        console.warn('Could not find a solid target')
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
