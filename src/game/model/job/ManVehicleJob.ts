import { SupervisedJob } from '../../Supervisor'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { JobState } from './JobState'
import { PriorityIdentifier } from './PriorityIdentifier'
import { RaiderJob } from './raider/RaiderJob'
import { Raider } from '../raider/Raider'
import { BubblesCfg } from '../../../cfg/BubblesCfg'
import { JobFulfiller } from './Job'

export class ManVehicleJob extends RaiderJob implements SupervisedJob {
    vehicle: VehicleEntity
    workplace: PathTarget

    constructor(vehicle: VehicleEntity) {
        super()
        this.vehicle = vehicle
        this.vehicle.callManJob = this
        const surface = this.vehicle.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(this.vehicle.sceneEntity.position)
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

    getRequiredTraining(): RaiderTraining {
        return this.vehicle.getRequiredTraining()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.GET_IN
    }

    hasFulfiller(): boolean {
        return !!this.raider
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleDrive'
    }
}
