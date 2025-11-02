import { AbstractGameComponent } from '../ECS'
import { TILESIZE } from '../../params'
import { PRNG } from '../factory/PRNG'
import { Vector2 } from 'three'

export class SlugHoleComponent extends AbstractGameComponent {
    constructor(readonly tileX: number, readonly tileY: number) {
        super()
    }

    getRandomPosition(): Vector2 {
        return new Vector2(
            this.tileX * TILESIZE + TILESIZE / 4 + PRNG.terrain.random() * TILESIZE / 2,
            this.tileY * TILESIZE + TILESIZE / 4 + PRNG.terrain.random() * TILESIZE / 2,
        )
    }
}
