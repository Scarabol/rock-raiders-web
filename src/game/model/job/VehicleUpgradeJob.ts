import { AbstractJob } from './Job'
import { VehicleUpgrade } from '../vehicle/VehicleUpgrade'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { PathTarget } from '../PathTarget'
import { EntityManager } from '../../EntityManager'
import { BuildingActivity } from '../anim/AnimationActivity'
import { EventBus } from '../../../event/EventBus'
import { VehicleUpgradeCompleteEvent } from '../../../event/LocalEvents'

export class VehicleUpgradeJob extends AbstractJob {
    readonly workplace: PathTarget

    constructor(readonly entityMgr: EntityManager, readonly vehicle: VehicleEntity, readonly upgrade: VehicleUpgrade) {
        super()
        this.workplace = this.entityMgr.getUpgradePathTargets()
            .map((b) => vehicle.findPathToTarget(b))
            .filter((t) => !!t)
            .sort((l, r) => l.lengthSq - r.lengthSq)?.[0]?.target
    }

    getWorkplace(entity: VehicleEntity): PathTarget {
        return this.workplace
    }

    onJobComplete() {
        this.workplace.building.sceneEntity.setAnimation(BuildingActivity.Upgrade, () => {
            super.onJobComplete()
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
        if (this.vehicle !== vehicle) return
    }
}
