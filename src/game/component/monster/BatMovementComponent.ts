import { Vector2 } from 'three'
import { TILESIZE } from '../../../params'
import { TerrainPath } from '../../model/map/TerrainPath'
import { MoveState } from '../../model/MoveState'
import { PathTarget } from '../../model/PathTarget'
import { MonsterMovementComponent } from './MonsterMovementComponent'

export class BatMovementComponent extends MonsterMovementComponent {
    target: PathTarget[] = []

    update(elapsedMs: number) {
        if (this.target.length < 1 || this.moveToClosestTarget(this.target, elapsedMs) === MoveState.TARGET_REACHED) {
            this.target = [this.findTarget()]
        }
    }

    private findTarget(): PathTarget { // TODO move to nearby drilling noise, explosions or sonic blasters
        const currentCenter = this.position.surfaceCenter2D()
        for (let c = 0; c < 20; c++) {
            const targetX = Math.randomInclusive(currentCenter.x - (TILESIZE + TILESIZE / 2), currentCenter.x + TILESIZE + TILESIZE / 2)
            const targetZ = Math.randomInclusive(currentCenter.y - TILESIZE / 2, currentCenter.y + TILESIZE / 2)
            if (this.terrain.getSurfaceFromWorldXZ(targetX, targetZ).surfaceType.floor) {
                return PathTarget.fromLocation(new Vector2(targetX, targetZ))
            }
        }
        console.warn('Could not find a target')
        return null
    }

    findPathToTarget(target: PathTarget): TerrainPath {
        return new TerrainPath(target, target.targetLocation)
    }
}
