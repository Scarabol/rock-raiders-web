import { SupervisedJob } from '../../Supervisor'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { JobState } from './JobState'
import { PriorityIdentifier } from './PriorityIdentifier'
import { RaiderJob } from './raider/RaiderJob'
import { Raider } from '../raider/Raider'

export class ManVehicleJob extends RaiderJob implements SupervisedJob {
    vehicle: VehicleEntity
    workplace: PathTarget

    constructor(vehicle: VehicleEntity) {
        super()
        this.vehicle = vehicle
        this.vehicle.callManJob = this
        this.workplace = PathTarget.fromLocation(this.vehicle.sceneEntity.position2D, 10) // FIXME use radius square
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

    onJobComplete() {
        this.vehicle.addDriver(this.raider)
        this.vehicle.callManJob = null
        super.onJobComplete()
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
}
