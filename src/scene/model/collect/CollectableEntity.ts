import { BaseEntity } from '../BaseEntity'
import { GameState } from '../../../game/model/GameState'
import { EventBus } from '../../../event/EventBus'
import { JobCreateEvent } from '../../../event/WorldEvents'
import { Carryable } from './Carryable'
import { Vector2 } from 'three'
import { Building } from '../../../game/model/entity/building/Building'
import { BuildingEntity } from '../BuildingEntity'
import { BuildingSite } from '../BuildingSite'
import { CollectJob } from '../../../game/model/job/CollectJob'
import { removeFromArray } from '../../../core/Util'

export abstract class CollectableEntity extends BaseEntity implements Carryable {

    collectableType: CollectableType
    targetSite: BuildingSite
    targetBuilding: BuildingEntity
    targetPos: Vector2[] = []
    targetType: CollectTargetType | Building

    protected constructor(collectableType: CollectableType) {
        super()
        this.collectableType = collectableType
    }

    abstract getTargetBuildingTypes(): Building[];

    getTargetPositions(): Vector2[] {
        if (this.targetPos.length < 1) {
            const sites = GameState.buildingSites.filter((b) => b.needs(this.getCollectableType()))
            if (sites.length > 0) {
                this.targetSite = sites[0] // FIXME consider other sites
                this.targetPos = [this.targetSite.getPosition2D()] // TODO use random drop position
                this.targetType = CollectTargetType.BUILDING_SITE
                this.targetSite.assign(this)
            } else {
                const buildings = GameState.getBuildingsByType(...this.getTargetBuildingTypes())
                if (buildings.length > 0) {
                    this.targetBuilding = buildings[0] // FIXME consider other buildings
                    this.targetPos = [this.targetBuilding.getDropPosition2D()]
                    this.targetType = this.targetBuilding.type
                }
            }
        } else if (this.targetSite) {
            if (this.targetSite.complete) this.resetTarget()
        } else if (this.targetBuilding) {
            // TODO check if building has been teleported away or turned off
        }
        return this.targetPos
    }

    getTargetType(): CollectTargetType | Building {
        return this.targetType
    }

    resetTarget() {
        if (this.targetSite) this.targetSite.unAssign(this)
        this.targetSite = null
        this.targetBuilding = null
        this.targetPos = null
        this.targetType = null
    }

    onDiscover() {
        super.onDiscover()
        removeFromArray(GameState.collectablesUndiscovered, this)
        GameState.collectables.push(this)
        EventBus.publishEvent(new JobCreateEvent(new CollectJob(this)))
    }

    getCollectableType(): CollectableType {
        return this.collectableType
    }

}

export enum CollectableType {

    DYNAMITE,
    CRYSTAL,
    ORE,
    BRICK,
    BARRIER,

}

export enum CollectTargetType {

    BUILDING_SITE,

}
