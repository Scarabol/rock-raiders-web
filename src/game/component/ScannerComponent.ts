import { AbstractGameComponent } from '../ECS'
import { PositionComponent } from './PositionComponent'
import { TILESIZE } from '../../params'

export class ScannerComponent extends AbstractGameComponent {
    range: number = 0
    rangeSQ: number = 0
    scanDelay: number = 0

    constructor(public origin: PositionComponent, range: number) {
        super()
        this.setRange(range)
    }

    setRange(range: number) {
        if (this.range === range) return
        this.range = range
        this.rangeSQ = Math.pow(this.range * TILESIZE, 2) + 1
    }
}
