import { AbstractGameComponent } from '../ECS'
import { Vector3 } from 'three'
import { Surface } from '../model/map/Surface'

export class PositionComponent extends AbstractGameComponent {
    readonly position: Vector3 = new Vector3()
    floorOffset: number = 0.1
    surface: Surface

    constructor(worldPos: Vector3, surface: Surface) {
        super()
        this.position.copy(worldPos)
        this.surface = surface
    }

    isDiscovered(): boolean {
        return this.surface.discovered
    }
}
