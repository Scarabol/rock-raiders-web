import { Vector2 } from 'three'
import { EventBus } from '../../../../event/EventBus'
import { MaterialAmountChanged } from '../../../../event/WorldEvents'
import { BuildingActivity } from '../../activities/BuildingActivity'
import { RaiderActivity } from '../../activities/RaiderActivity'
import { BuildingEntity } from '../../building/BuildingEntity'
import { EntityType } from '../../EntityType'
import { GameState } from '../../GameState'
import { MaterialEntity } from '../../material/MaterialEntity'
import { PathTarget } from '../../PathTarget'
import { Job } from '../Job'

export class BuildingCarryPathTarget extends PathTarget {
    private gatherReservedBy: Job = null

    constructor(readonly building: BuildingEntity) {
        super(building.getDropPosition2D())
    }

    getFocusPoint(): Vector2 {
        return this.building.sceneEntity.position2D
    }

    reserveGatherSlot(carryJob: Job): boolean {
        if (this.building.entityType === EntityType.POWER_STATION || this.building.entityType === EntityType.ORE_REFINERY) {
            if (!this.gatherReservedBy && this.building.sceneEntity.activity.activityKey === this.building.sceneEntity.getDefaultActivity().activityKey) {
                this.gatherReservedBy = carryJob // TODO how to avoid deadlock between reserve and gather?
                return true
            } else {
                return this.gatherReservedBy === carryJob
            }
        } else {
            return true
        }
    }

    gatherItem(item: MaterialEntity) {
        if (this.building.entityType === EntityType.POWER_STATION || this.building.entityType === EntityType.ORE_REFINERY) {
            this.building.sceneEntity.pickupEntity(item.sceneEntity)
            this.building.sceneEntity.changeActivity(BuildingActivity.Deposit, () => {
                this.building.sceneEntity.changeActivity()
                this.building.sceneEntity.dropAllEntities()
                this.addItemToStorage(item)
            })
        } else {
            this.addItemToStorage(item)
        }
    }

    private addItemToStorage(item: MaterialEntity) {
        switch (item.entityType) {
            case EntityType.CRYSTAL:
                GameState.numCrystal++
                break
            case EntityType.ORE:
                GameState.numOre++
                break
        }
        EventBus.publishEvent(new MaterialAmountChanged())
        item.sceneEntity.disposeFromScene()
        this.gatherReservedBy = null
    }

    getDropAction(): RaiderActivity {
        return this.building.getDropAction()
    }

    isInvalid(): boolean {
        return !this.building.isPowered()
    }
}
