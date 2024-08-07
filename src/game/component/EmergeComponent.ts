import { AbstractGameComponent } from '../ECS'
import { Surface } from '../terrain/Surface'

export class EmergeComponent extends AbstractGameComponent {
    emergeDelayMs: number = 0

    constructor(readonly emergeSpawnId: number, readonly triggerSurface: Surface | undefined, public emergeSurface: Surface | undefined) {
        super()
    }
}
