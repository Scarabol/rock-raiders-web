import { Job, JobFulfiller } from './Job'
import { VehicleUpgrade } from '../vehicle/VehicleUpgrade'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { PathTarget } from '../PathTarget'
import { WorldManager } from '../../WorldManager'
import { BuildingActivity } from '../anim/AnimationActivity'
import { VehicleUpgradeCompleteEvent } from '../../../event/LocalEvents'
import { EventBroker } from '../../../event/EventBroker'

export class UpgradeVehicleJob extends Job {
    readonly workplace: PathTarget

    constructor(worldMgr: WorldManager, readonly vehicle: VehicleEntity, readonly upgrade: VehicleUpgrade) {
        super()
        this.workplace = vehicle.findShortestPath(worldMgr.entityMgr.getVehicleUpgradePathTargets())?.target
    }

    getWorkplace(entity: VehicleEntity): PathTarget {
        if (!this.workplace.building.isPowered()) {
            this.vehicle.upgrading = false
            return null
        }
        return this.workplace
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        const building = this.workplace.building
        const primary = building.primarySurface
        const primaryPath = building.primaryPathSurface
        const opposite = building.worldMgr.sceneMgr.terrain.getSurface(2 * primaryPath.x - primary.x, 2 * primaryPath.y - primary.y)
        fulfiller.sceneEntity.headTowards(opposite.getCenterWorld2D())
        this.vehicle.upgrading = true
        const upgradeAnimationSpeed = building.stats.FunctionCoef[building.level] || 1
        building.sceneEntity.setAnimationSpeed(upgradeAnimationSpeed)
        building.sceneEntity.setAnimation(BuildingActivity.Upgrade, () => {
            building.sceneEntity.setAnimationSpeed(1)
            super.onJobComplete(fulfiller)
            building.sceneEntity.setAnimation(BuildingActivity.Stand)
            this.vehicle.addUpgrade(this.upgrade)
            EventBroker.publish(new VehicleUpgradeCompleteEvent())
            this.vehicle.upgrading = false
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
