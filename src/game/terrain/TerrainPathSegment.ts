import { Vector2 } from 'three'

export class TerrainPathStep {
    constructor(
        readonly position: Vector2,
        readonly direction: Vector2,
        readonly remainingStepLength: number,
        public targetReached: boolean = false,
    ) {
    }
}

export class TerrainPathSegment {
    readonly startControl: Vector2
    readonly targetControl: Vector2
    readonly approxLengths: number[] = new Array(10)
    private currentLocation: Vector2
    private currentDirection: Vector2
    private currentProgress: number = 0

    constructor(
        readonly startLocation: Vector2,
        startDir: Vector2,
        readonly targetLocation: Vector2,
        targetDir: Vector2,
    ) {
        const length = targetLocation.clone().sub(startLocation).length()
        startDir = startDir.clone().normalize()
        targetDir = targetDir.clone().normalize()
        this.startControl = startLocation.clone().addScaledVector(startDir, length / 2)
        this.targetControl = targetLocation.clone().addScaledVector(targetDir, -length / 2)
        // Set start condition
        this.currentLocation = startLocation.clone()
        this.currentDirection = startDir.clone()
        // Estimate length
        let approxLength = 0
        this.approxLengths[0] = approxLength
        for (let i = 1, p = this.startLocation; i < this.approxLengths.length; i += 1) {
            const nextP = this.bezierCurveD0(i / (this.approxLengths.length - 1))
            approxLength += nextP.clone().sub(p).length()
            p = nextP
            this.approxLengths[i] = approxLength
        }
    }

    private bezierCurveD0(t: number): Vector2 {
        const p0 = this.startLocation.clone().multiplyScalar(Math.pow(t, 0) * Math.pow(1 - t, 3))
        const p1 = this.startControl.clone().multiplyScalar(3 * Math.pow(t, 1) * Math.pow(1 - t, 2))
        const p2 = this.targetControl.clone().multiplyScalar(3 * Math.pow(t, 2) * Math.pow(1 - t, 1))
        const p3 = this.targetLocation.clone().multiplyScalar(Math.pow(t, 3) * Math.pow(1 - t, 0))
        return p0.add(p1).add(p2).add(p3)
    }

    private bezierCurveD1(t: number): Vector2 {
        const p0 = this.startControl.clone().sub(this.startLocation).multiplyScalar(3 * Math.pow(1 - t, 2))
        const p1 = this.targetControl.clone().sub(this.startControl).multiplyScalar(6 * (1 - t) * t)
        const p2 = this.targetLocation.clone().sub(this.targetControl).multiplyScalar(3 * Math.pow(t, 2))
        return p0.add(p1).add(p2)
    }

    step(pos: Vector2, dir: Vector2, stepLength: number, maxTurn: number = Infinity): TerrainPathStep {
        let remainingStepLength = stepLength
        let fraction = 1
        let vec = this.currentLocation.clone().sub(pos)
        let vecLength = vec.length()
        update: {
            if (vecLength >= remainingStepLength) {
                fraction = vecLength ? remainingStepLength / vecLength : 0
                remainingStepLength = 0
                break update
            }
            remainingStepLength -= vecLength
            const totalApproxLength = this.approxLengths[this.approxLengths.length - 1]
            let p = this.currentProgress * (this.approxLengths.length - 1)
            let i = Math.trunc(p)
            let lengthOffset = this.approxLengths[i] ?? totalApproxLength
            lengthOffset += ((this.approxLengths[i + 1] ?? totalApproxLength) - (this.approxLengths[i] ?? totalApproxLength)) * (p - i)
            for (; i < this.approxLengths.length - 1; i += 1) {
                if (this.approxLengths[i + 1] - lengthOffset <= remainingStepLength) {
                    continue
                }
                this.currentProgress = (i +
                    (remainingStepLength - (this.approxLengths[i] - lengthOffset)) /
                    (this.approxLengths[i + 1] - this.approxLengths[i])
                ) / (this.approxLengths.length - 1)
                remainingStepLength = 0
                this.currentLocation = this.bezierCurveD0(this.currentProgress)
                this.currentDirection = this.bezierCurveD1(this.currentProgress)
                break update
            }
            remainingStepLength -= totalApproxLength - lengthOffset
            this.currentProgress = 1
            this.currentLocation.copy(this.targetLocation)
            this.currentDirection = this.bezierCurveD1(this.currentProgress)
        }
        const turn = Math.sign(dir.clone().cross(this.currentDirection)) * dir.angleTo(this.currentDirection)
        fraction = Math.min(fraction, maxTurn / Math.abs(turn))
        remainingStepLength = Math.min(remainingStepLength, stepLength * (1 - Math.min(1, Math.abs(turn) / maxTurn)))
        const newPos = pos.clone().multiplyScalar(1 - fraction).addScaledVector(this.currentLocation, fraction)
        const newDir = dir.clone().rotateAround(new Vector2(), turn * fraction)
        return new TerrainPathStep(newPos, newDir, remainingStepLength)
    }
}
