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
        // Turn around immediately if moving in the opposite direction
        if (startDir.angleTo(targetDir) > Math.PI * 0.75) {
            startDir.copy(targetDir)
        }
        this.startControl = startLocation.clone().addScaledVector(startDir, length / 2)
        this.targetControl = targetLocation.clone().addScaledVector(targetDir, -length / 2)
        // Set start condition
        this.currentLocation = startLocation.clone()
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

    step(pos: Vector2, stepLength: number): TerrainPathStep {
        const vec = this.currentLocation.clone().sub(pos)
        const vecLength = vec.length()
        if (vecLength >= stepLength) {
            vec.clampLength(0, stepLength)
            return new TerrainPathStep(pos.clone().add(vec), vec, 0)
        }
        stepLength -= vecLength
        const totalApproxLength = this.approxLengths[this.approxLengths.length - 1]
        let p = this.currentProgress * (this.approxLengths.length - 1)
        let i = Math.trunc(p)
        let lengthOffset = this.approxLengths[i] ?? totalApproxLength
        lengthOffset += ((this.approxLengths[i + 1] ?? totalApproxLength) - (this.approxLengths[i] ?? totalApproxLength)) * (p - i)
        for (; i < this.approxLengths.length - 1; i += 1) {
            if (this.approxLengths[i + 1] - lengthOffset <= stepLength) {
                continue
            }
            this.currentProgress = (i +
                (stepLength - (this.approxLengths[i] - lengthOffset)) /
                (this.approxLengths[i + 1] - this.approxLengths[i])
            ) / (this.approxLengths.length - 1)
            const newPos = this.bezierCurveD0(this.currentProgress)
            const newDir = this.bezierCurveD1(this.currentProgress)
            this.currentLocation.copy(newPos)
            return new TerrainPathStep(newPos, newDir, 0)
        }
        stepLength -= totalApproxLength - lengthOffset
        this.currentProgress = 1
        const newPos = this.targetLocation.clone()
        const newDir = this.bezierCurveD1(this.currentProgress)
        this.currentLocation.copy(newPos)
        return new TerrainPathStep(newPos, newDir, stepLength)
    }
}
