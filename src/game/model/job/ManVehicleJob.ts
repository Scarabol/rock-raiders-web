import { PathTarget } from '../PathTarget'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { JOB_STATE } from './JobState'
import { PRIORITY_IDENTIFIER } from './PriorityIdentifier'
import { RaiderJob } from './raider/RaiderJob'
import { BubblesCfg } from '../../../cfg/BubblesCfg'
import { JobFulfiller } from './Job'
import { EntityType } from '../EntityType'

export class ManVehicleJob extends RaiderJob {
    vehicle: VehicleEntity
    workplaces: PathTarget[]

    constructor(vehicle: VehicleEntity) {
        super()
        this.requiredTraining = vehicle.getRequiredTraining()
        this.priorityIdentifier = PRIORITY_IDENTIFIER.getIn
        this.vehicle = vehicle
        this.vehicle.callManJob = this
        const surface = this.vehicle.getSurface()
        const walkableSurface = [surface, ...surface.neighbors].find((s) => s.isWalkable() || s.building?.entityType === EntityType.DOCKS) ?? surface
        if (walkableSurface.building?.entityType === EntityType.DOCKS) {
            this.workplaces = walkableSurface.building.getTrainingTargets()
        } else {
            const hopOnSpot = walkableSurface.getRandomPosition()
            const getInRadius = this.vehicle.stats.pickSphere / 2
            this.workplaces = [PathTarget.fromLocation(hopOnSpot, getInRadius * getInRadius)]
        }
    }

    getWorkplace(entity: JobFulfiller): PathTarget | undefined {
        if (this.vehicle.isInBeam()) {
            this.jobState = JOB_STATE.canceled
            return undefined
        } else if (this.vehicle.driver) {
            this.jobState = JOB_STATE.complete
            return undefined
        }
        return entity.findShortestPath(this.workplaces)?.target
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        this.vehicle.callManJob = undefined
        super.onJobComplete(fulfiller)
        if (!this.raider) return
        this.vehicle.addDriver(this.raider)
        this.vehicle.unblockBuildingPowerPath()
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleDrive'
    }
}
