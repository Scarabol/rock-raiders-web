import { Job, JobFulfiller } from './Job'
import { VehicleUpgrade } from '../vehicle/VehicleUpgrade'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { PathTarget } from '../PathTarget'
import { EntityManager } from '../../EntityManager'
import { BuildingActivity } from '../anim/AnimationActivity'
import { EventBus } from '../../../event/EventBus'
import { VehicleUpgradeCompleteEvent } from '../../../event/LocalEvents'

export class VehicleUpgradeJob extends Job {
    readonly workplace: PathTarget

    constructor(readonly entityMgr: EntityManager, readonly vehicle: VehicleEntity, readonly upgrade: VehicleUpgrade) {
        super()
        this.workplace = vehicle.findShortestPath(this.entityMgr.getUpgradePathTargets())?.target
    }

    getWorkplace(entity: VehicleEntity): PathTarget {
        return this.workplace
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        this.workplace.building.sceneEntity.setAnimation(BuildingActivity.Upgrade, () => { // TODO Use FunctionCoef from config as animation speed
            super.onJobComplete(fulfiller)
            this.workplace.building.sceneEntity.setAnimation(BuildingActivity.Stand)
            this.vehicle.addUpgrade(this.upgrade)
            EventBus.publishEvent(new VehicleUpgradeCompleteEvent())
        })
    }

    assign(vehicle: VehicleEntity): void {
        if (this.vehicle === vehicle) return
        throw new Error('Job already assigned')
    }

    unAssign(vehicle: VehicleEntity): void {
        // This job should not be unassigned
    }

    hasFulfiller(): boolean {
        return !!this.vehicle
    }
}
