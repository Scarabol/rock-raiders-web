import { AbstractGameComponent } from '../ECS'
import { TILESIZE } from '../../params'

export enum RaiderScareRange {
    BAT = TILESIZE / 2,
    ROCKY = TILESIZE,
    DYNAMITE = 1.5 * TILESIZE,
}

export class RaiderScareComponent extends AbstractGameComponent {
    readonly scareRadiusSq

    constructor(scareRadius: RaiderScareRange) {
        super()
        this.scareRadiusSq = scareRadius * scareRadius
    }
}
