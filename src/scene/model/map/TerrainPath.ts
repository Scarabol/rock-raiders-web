import { Vector2 } from 'three'

export class TerrainPath {

    locations: Vector2[] = []
    lengthSq: number = 0

    constructor(locations: Vector2 | Vector2[]) {
        this.locations = Array.isArray(locations) ? locations : [locations]
        for (let c = 0; c < this.locations.length - 1; c++) {
            const start = this.locations[c]
            const end = this.locations[c + 1]
            this.lengthSq += start.distanceToSquared(end)
        }
    }

    addLocation(location: Vector2): TerrainPath {
        this.locations.push(location)
        if (this.locations.length > 1) {
            this.lengthSq += this.locations[this.locations.length - 2].distanceToSquared(location)
        }
        return this
    }

    get targetPosition(): Vector2 {
        return this.locations[this.locations.length - 1] || null
    }

    get firstLocation(): Vector2 {
        return this.locations[0] || null
    }

}
