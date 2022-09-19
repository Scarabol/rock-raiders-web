import { SupervisedJob } from '../../Supervisor'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { JobState } from './JobState'
import { PriorityIdentifier } from './PriorityIdentifier'
import { RaiderJob } from './raider/RaiderJob'

export class ManVehicleJob extends RaiderJob implements SupervisedJob {
    vehicle: VehicleEntity
    workplaces: PathTarget[]

    constructor(vehicle: VehicleEntity) {
        super()
        this.vehicle = vehicle
        this.vehicle.callManJob = this
        this.workplaces = [new PathTarget(this.vehicle.sceneEntity.position2D.clone(), null, this.vehicle.sceneEntity.getRadiusSquare())]
    }

    getWorkplaces(): PathTarget[] {
        if (!!this.vehicle.beamUpAnimator) {
            this.jobState = JobState.CANCELED
            return []
        } else if (this.vehicle.driver) {
            this.jobState = JobState.COMPLETE
            return []
        }
        return this.workplaces
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
