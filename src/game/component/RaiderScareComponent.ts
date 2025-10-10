import { AbstractGameComponent } from '../ECS'
import { TILESIZE } from '../../params'

export const RAIDER_SCARE_RANGE = {
    bat: TILESIZE / 2,
    rocky: TILESIZE,
    dynamite: 1.5 * TILESIZE,
} as const
type RaiderScareRange = typeof RAIDER_SCARE_RANGE[keyof typeof RAIDER_SCARE_RANGE]

export class RaiderScareComponent extends AbstractGameComponent {
    readonly scareRadiusSq: number

    constructor(scareRadius: RaiderScareRange) {
        super()
        this.scareRadiusSq = scareRadius * scareRadius
    }
}
