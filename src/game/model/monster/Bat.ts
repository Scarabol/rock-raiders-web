import { Vector2 } from 'three'
import { getRandomInclusive } from '../../../core/Util'
import { NATIVE_FRAMERATE, TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { Monster } from './Monster'

export class Bat extends Monster {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.BAT, 'Creatures/bat/bat.ae')
        this.sceneEntity.floorOffset = TILESIZE / 2
    }

    get stats() {
        return ResourceManager.stats.Bat
    }

    startRandomMove() {
        Bat.onMove(this)
    }

    private static onMove(bat: Bat) {
        if (bat.target.length < 1 || bat.moveToClosestTarget(bat.target) === MoveState.TARGET_REACHED) {
            bat.target = [bat.findTarget()]
        }
        bat.moveTimeout = setTimeout(() => Bat.onMove(bat), 1000 / NATIVE_FRAMERATE)
    }

    private findTarget(): PathTarget { // TODO move to nearby drilling noise, explosions or sonic blasters
        const terrain = this.sceneMgr.terrain
        const currentCenter = terrain.getSurfaceFromWorld(this.sceneEntity.position.clone()).getCenterWorld()
        for (let c = 0; c < 20; c++) {
            const targetX = getRandomInclusive(currentCenter.x - (TILESIZE + TILESIZE / 2), currentCenter.x + TILESIZE + TILESIZE / 2)
            const targetZ = getRandomInclusive(currentCenter.z - TILESIZE / 2, currentCenter.z + TILESIZE / 2)
            if (terrain.getSurfaceFromWorldXZ(targetX, targetZ).surfaceType.floor) {
                return new PathTarget(new Vector2(targetX, targetZ))
            }
        }
        console.warn('Could not find a target')
        return null
    }

    onDeath() {
        this.removeFromScene()
        this.entityMgr.bats.remove(this)
    }

}
