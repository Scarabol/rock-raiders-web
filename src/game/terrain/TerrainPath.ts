import { Vector2 } from 'three'
import { PathTarget } from '../model/PathTarget'

export class TerrainPath {
    target: PathTarget
    locations: Vector2[] = []
    lengthSq: number = 0

    constructor(target: PathTarget, locations: Vector2[] | Vector2) {
        this.target = target
        this.locations = Array.ensure(locations)
        for (let c = 0; c < this.locations.length - 1; c++) {
            const start = this.locations[c]
            const end = this.locations[c + 1]
            this.lengthSq += start.distanceToSquared(end)
        }
    }

    get firstLocation(): Vector2 {
        return this.locations?.[0] || null
    }
}
