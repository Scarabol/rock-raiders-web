import { Vector2 } from 'three'
import { getRandomInclusive } from '../../../core/Util'
import { NATIVE_FRAMERATE, TILESIZE } from '../../../main'
import { ResourceManager } from '../../../resource/ResourceManager'
import { GameState } from '../GameState'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { Monster } from './Monster'

export class Bat extends Monster {

    constructor() {
        super('Creatures/bat/bat.ae')
    }

    get stats() {
        return ResourceManager.stats.Bat
    }

    startRandomMove() {
        Bat.onMove(this)
    }

    private static onMove(bat: Bat) {
        if (!bat.target || bat.moveToClosestTarget([bat.target]) === MoveState.TARGET_REACHED) {
            bat.target = bat.findTarget()
        }
        bat.moveTimeout = setTimeout(() => Bat.onMove(bat), 1000 / NATIVE_FRAMERATE)
    }

    determinePosY(x: number, z: number) {
        return this.worldMgr.getFloorHeight(x, z) + TILESIZE / 2
    }

    private findTarget(): PathTarget { // TODO move to nearby drilling noise, explosions or sonic blasters
        const terrain = this.worldMgr.sceneManager.terrain
        const currentCenter = terrain.getSurfaceFromWorld(this.getPosition()).getCenterWorld()
        for (let c = 0; c < 20; c++) {
            const targetX = getRandomInclusive(currentCenter.x - (TILESIZE + TILESIZE / 2), currentCenter.x + TILESIZE + TILESIZE / 2)
            const targetZ = getRandomInclusive(currentCenter.z - TILESIZE / 2, currentCenter.z + TILESIZE / 2)
            if (terrain.getSurfaceFromWorldXZ(targetX, targetZ).surfaceType.floor) { // TODO evaluate CrossLand, CrossLava, CrossWater from stats
                return new PathTarget(new Vector2(targetX, targetZ))
            }
        }
        console.warn('Could not find a solid target')
        return null
    }

    onDeath() {
        this.onLevelEnd()
        GameState.bats.remove(this)
    }

}
