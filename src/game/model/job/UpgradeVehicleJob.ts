import { Job, JobFulfiller } from './Job'
import { VehicleUpgrade } from '../vehicle/VehicleUpgrade'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { PathTarget } from '../PathTarget'
import { WorldManager } from '../../WorldManager'
import { BuildingActivity } from '../anim/AnimationActivity'
import { EventBus } from '../../../event/EventBus'
import { UpgradeVehicleCompleteEvent } from '../../../event/LocalEvents'

export class UpgradeVehicleJob extends Job {
    readonly workplace: PathTarget

    constructor(worldMgr: WorldManager, readonly vehicle: VehicleEntity, readonly upgrade: VehicleUpgrade) {
        super()
        this.workplace = vehicle.findShortestPath(worldMgr.entityMgr.getUpgradePathTargets())?.target
    }

    getWorkplace(entity: VehicleEntity): PathTarget {
        return this.workplace
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        const building = this.workplace.building
        const upgradeAnimationSpeed = building.stats.FunctionCoef[building.level] || 1
        building.sceneEntity.setAnimationSpeed(upgradeAnimationSpeed)
        building.sceneEntity.setAnimation(BuildingActivity.Upgrade, () => {
            building.sceneEntity.setAnimationSpeed(1)
            super.onJobComplete(fulfiller)
            building.sceneEntity.setAnimation(BuildingActivity.Stand)
            this.vehicle.addUpgrade(this.upgrade)
            EventBus.publishEvent(new UpgradeVehicleCompleteEvent())
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
