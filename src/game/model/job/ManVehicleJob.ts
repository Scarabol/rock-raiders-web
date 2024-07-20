import { PathTarget } from '../PathTarget'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { JobState } from './JobState'
import { PriorityIdentifier } from './PriorityIdentifier'
import { RaiderJob } from './raider/RaiderJob'
import { Raider } from '../raider/Raider'
import { BubblesCfg } from '../../../cfg/BubblesCfg'
import { JobFulfiller } from './Job'
import { EntityType } from '../EntityType'

export class ManVehicleJob extends RaiderJob {
    vehicle: VehicleEntity
    workplaces: PathTarget[]

    constructor(vehicle: VehicleEntity) {
        super()
        this.requiredTraining = vehicle.getRequiredTraining()
        this.priorityIdentifier = PriorityIdentifier.GET_IN
        this.vehicle = vehicle
        this.vehicle.callManJob = this
        const surface = this.vehicle.getSurface()
        const walkableSurface = [surface, ...surface.neighbors].find((s) => s.isWalkable() || s.building?.entityType === EntityType.DOCKS) ?? surface
        if (walkableSurface.building?.entityType === EntityType.DOCKS) {
            this.workplaces = walkableSurface.building.getTrainingTargets()
        } else {
            const hopOnSpot = walkableSurface.getRandomPosition()
            const getInRadius = this.vehicle.stats.PickSphere / 2
            this.workplaces = [PathTarget.fromLocation(hopOnSpot, getInRadius * getInRadius)]
        }
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        if (this.vehicle.isInBeam()) {
            this.jobState = JobState.CANCELED
            return null
        } else if (this.vehicle.driver) {
            this.jobState = JobState.COMPLETE
            return null
        }
        return entity.findShortestPath(this.workplaces)?.target
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        this.vehicle.addDriver(this.raider)
        this.vehicle.callManJob = null
        super.onJobComplete(fulfiller)
        this.vehicle.unblockBuildingPowerPath()
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleDrive'
    }
}
