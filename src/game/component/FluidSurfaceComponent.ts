import { AbstractGameComponent } from '../ECS'
import { BufferAttribute } from 'three/src/core/BufferAttribute'
import { InterleavedBufferAttribute } from 'three'

export class FluidSurfaceComponent extends AbstractGameComponent {
    readonly xToY: boolean
    readonly u: number[] = [0, 0, 1, 0, 1, 1]
    readonly v: number[] = [1, 0, 0, 1, 0, 1]

    constructor(tileX: number, tileY: number, readonly uvAttribute: BufferAttribute | InterleavedBufferAttribute) {
        super()
        this.xToY = (tileX % 2) === (tileY % 2)
    }
}
