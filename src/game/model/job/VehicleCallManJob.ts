import { PathTarget } from '../PathTarget'
import { Raider } from '../raider/Raider'
import { RaiderTraining } from '../raider/RaiderTraining'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { PublicJob } from './Job'
import { JobState } from './JobState'
import { JobType } from './JobType'
import { PriorityIdentifier } from './PriorityIdentifier'

export class VehicleCallManJob extends PublicJob {

    // TODO add range check, which places raider in vehicle when nearby

    vehicle: VehicleEntity
    workplaces: PathTarget[]

    constructor(vehicle: VehicleEntity) {
        super(JobType.MAN_VEHICLE)
        this.vehicle = vehicle
        this.vehicle.callManJob = this
        this.workplaces = [new PathTarget(this.vehicle.getPosition2D())]
    }

    getWorkplaces(): PathTarget[] {
        if (this.vehicle.inBeam) {
            this.jobState = JobState.INCOMPLETE
            return []
        } else if (this.vehicle.driver) {
            this.jobState = JobState.COMPLETE
            return []
        }
        return this.workplaces
    }

    onJobComplete() {
        this.vehicle.addDriver(this.fulfiller[0] as Raider) // TODO this should only consider the one near the vehicle
        this.vehicle.callManJob = null
        super.onJobComplete()
    }

    getRequiredTraining(): RaiderTraining {
        return this.vehicle.getRequiredTraining()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityGetIn
    }

}
