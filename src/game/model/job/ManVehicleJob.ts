import { PathTarget } from '../PathTarget'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { JobState } from './JobState'
import { PriorityIdentifier } from './PriorityIdentifier'
import { RaiderJob } from './raider/RaiderJob'
import { Raider } from '../raider/Raider'
import { BubblesCfg } from '../../../cfg/BubblesCfg'
import { JobFulfiller } from './Job'

export class ManVehicleJob extends RaiderJob {
    vehicle: VehicleEntity
    workplace: PathTarget

    constructor(vehicle: VehicleEntity) {
        super()
        this.requiredTraining = vehicle.getRequiredTraining()
        this.priorityIdentifier = PriorityIdentifier.GET_IN
        this.vehicle = vehicle
        this.vehicle.callManJob = this
        const surface = this.vehicle.getSurface()
        const walkableSurface = [surface, ...surface.neighbors].find((s) => s.isWalkable())
        const hopOnSpot = walkableSurface.getRandomPosition() // XXX find spot close to the possibly non-walkable actual surface
        this.workplace = PathTarget.fromLocation(hopOnSpot, this.vehicle.sceneEntity.getRadiusSquare() / 4)
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        if (this.vehicle.isInBeam()) {
            this.jobState = JobState.CANCELED
            return null
        } else if (this.vehicle.driver) {
            this.jobState = JobState.COMPLETE
            return null
        }
        return this.workplace
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        this.vehicle.addDriver(this.raider)
        this.vehicle.callManJob = null
        super.onJobComplete(fulfiller)
        this.vehicle.unblockTeleporter()
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleDrive'
    }
}
