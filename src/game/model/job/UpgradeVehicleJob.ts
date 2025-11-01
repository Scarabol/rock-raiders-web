import { Job, JobFulfiller } from './Job'
import { VehicleUpgrade, VehicleUpgrades } from '../vehicle/VehicleUpgrade'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { PathTarget } from '../PathTarget'
import { WorldManager } from '../../WorldManager'
import { BUILDING_ACTIVITY } from '../anim/AnimationActivity'
import { VehicleUpgradeCompleteEvent } from '../../../event/LocalEvents'
import { EventBroker } from '../../../event/EventBroker'
import { GameState } from '../GameState'
import { MaterialAmountChanged } from '../../../event/WorldEvents'

export class UpgradeVehicleJob extends Job {
    readonly workplace: PathTarget | undefined

    constructor(worldMgr: WorldManager, readonly vehicle: VehicleEntity, readonly upgrade: VehicleUpgrade) {
        super()
        this.workplace = vehicle.findShortestPath(worldMgr.entityMgr.getVehicleUpgradePathTargets())?.target
    }

    getWorkplace(_entity: JobFulfiller): PathTarget | undefined {
        if (!this.workplace?.building?.isPowered()) {
            this.vehicle.upgrading = false
            return undefined
        }
        return this.workplace
    }

    override onJobComplete(fulfiller: JobFulfiller): void {
        const costIndex = VehicleUpgrades.toCostIndex(this.upgrade)
        const upgradeCostOre = this.vehicle.stats.upgradeCostOre?.[costIndex] ?? 0
        const upgradeCostBrick = this.vehicle.stats.upgradeCostStuds?.[costIndex] ?? 0
        if (GameState.numBrick < upgradeCostBrick && GameState.numOre < upgradeCostOre) {
            console.log(`Cannot afford vehicle upgrade! Ore: ${GameState.numOre}/${upgradeCostOre} Bricks: ${GameState.numBrick}/${upgradeCostBrick}`)
            super.onJobComplete(fulfiller)
            return
        }
        const building = this.workplace?.building
        if (!building) {
            super.onJobComplete(fulfiller)
            return
        }
        fulfiller.sceneEntity.headTowards(this.workplace.focusPoint!)
        this.vehicle.upgrading = true
        const upgradeAnimationSpeed = building.stats.functionCoef[building.level] || 1
        building.sceneEntity.setAnimationSpeed(upgradeAnimationSpeed)
        building.sceneEntity.setAnimation(BUILDING_ACTIVITY.upgrade, () => {
            building.sceneEntity.setAnimationSpeed(1)
            super.onJobComplete(fulfiller)
            building.sceneEntity.setAnimation(BUILDING_ACTIVITY.stand)
            this.vehicle.upgrading = false
            if (GameState.numBrick >= upgradeCostBrick) {
                GameState.numBrick -= upgradeCostBrick
            } else if (GameState.numOre >= upgradeCostOre) {
                GameState.numOre -= upgradeCostOre
            } else {
                return
            }
            EventBroker.publish(new MaterialAmountChanged())
            this.vehicle.addUpgrade(this.upgrade)
            EventBroker.publish(new VehicleUpgradeCompleteEvent())
        })
    }

    assign(vehicle: VehicleEntity): void {
        if (this.vehicle === vehicle) return
        throw new Error('Job already assigned')
    }

    unAssign(_vehicle: VehicleEntity): void {
        // This job should not be unassigned
    }

    hasFulfiller(): boolean {
        return !!this.vehicle
    }
}
