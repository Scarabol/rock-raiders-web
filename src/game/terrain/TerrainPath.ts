import { Vector2 } from 'three'
import { PathTarget } from '../model/PathTarget'
import { TerrainPathSegment, TerrainPathStep } from './TerrainPathSegment'

export class TerrainPath {
    readonly lengthSq: number = 0
    private segment: TerrainPathSegment | undefined

    constructor(readonly target: PathTarget, readonly locations: Vector2[]) {
        for (let c = 0; c < this.locations.length - 1; c++) {
            const start = this.locations[c]
            const end = this.locations[c + 1]
            this.lengthSq += start.distanceToSquared(end)
        }
    }

    step(pos: Vector2, dir: Vector2, stepLength: number): TerrainPathStep {
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
        let step = this.segment.step(pos, stepLength)
        if (step.remainingStepLength > 0) {
            this.segment = undefined
            this.locations.shift()
            step = this.step(step.position, step.direction, step.remainingStepLength)
        }
        step.targetReached = this.target.targetLocation.clone().sub(step.position).lengthSq() <= this.target.radiusSq
        return step
    }
}
