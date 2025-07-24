import { Vector2 } from 'three'
import { PathTarget } from '../model/PathTarget'
import { TerrainPathSegment, TerrainPathStep } from './TerrainPathSegment'

export class TerrainPath {

    private segment: TerrainPathSegment | null = null
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

    step(pos: Vector2, dir: Vector2, stepLength: number, maxTurn: number = Infinity): TerrainPathStep {
        if (!this.segment) {
            if (this.locations.length === 0) {
                return new TerrainPathStep(pos, dir, stepLength, true)
            }
            if (this.locations.length === 1) {
                this.segment = new TerrainPathSegment(pos, dir, this.locations[0], this.target.focusPoint ? this.target.focusPoint.clone().sub(this.locations[0]) : this.locations[0].clone().sub(pos))
            } else {
                const d = this.locations[1].clone().sub(this.locations[0])
                this.segment = new TerrainPathSegment(pos, dir, this.locations[0].clone().addScaledVector(d, 0.5), d)
            }
        }
        let step = this.segment.step(pos, dir, stepLength, maxTurn)
        if (step.remainingStepLength > 0) {
            this.segment = null
            this.locations.shift()
            step = this.step(step.position, step.direction, step.remainingStepLength, maxTurn)
        }
        step.targetReached = this.target.targetLocation.clone().sub(step.position).lengthSq() <= this.target.radiusSq
        return step
    }
}
