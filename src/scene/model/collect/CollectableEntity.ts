import { BaseEntity } from '../BaseEntity'
import { GameState } from '../../../game/model/GameState'
import { EventBus } from '../../../event/EventBus'
import { JobCreateEvent } from '../../../event/WorldEvents'
import { Carryable } from './Carryable'
import { CollectJob } from '../../../game/model/job/CollectJob'
import { CollectPathTarget } from '../CollectionTarget'
import { Vector2 } from 'three'
import { Building } from '../../../game/model/entity/building/Building'

export abstract class CollectableEntity extends BaseEntity implements Carryable {

    collectableType: CollectableType
    targets: CollectPathTarget[] = []

    protected constructor(collectableType: CollectableType) {
        super()
        this.collectableType = collectableType
    }

    abstract getTargetBuildingTypes(): Building[];

    hasTarget(): boolean {
        return this.updateTargets().length > 0
    }

    getTargets(): Vector2[] {
        return this.updateTargets().map((t) => t.targetLocation)
    }

    getCollectTargets(): CollectPathTarget[] {
        return this.updateTargets()
    }

    resetTarget() {
        this.targets = []
        this.updateTargets()
    }

    private updateTargets(): CollectPathTarget[] {
        if (this.targets.length < 1) {
            const sites = GameState.buildingSites.filter((b) => b.needs(this.getCollectableType()))
            if (sites.length > 0) {
                this.targets = sites.map((s) => new CollectPathTarget(s.getRandomDropPosition(), s, null))
            } else {
                const buildings = GameState.getBuildingsByType(...this.getTargetBuildingTypes())
                if (buildings.length > 0) {
                    this.targets = buildings.map((b) => new CollectPathTarget(b.getDropPosition2D(), null, b))
                }
            }
        } else if (this.targets.some((t) => t.site && t.site.complete)) {
            this.resetTarget()
        } else if (this.targets.some((t) => t.building && !t.building.isPowered())) {
            this.resetTarget()
        }
        return this.targets
    }

    onDiscover() {
        super.onDiscover()
        GameState.collectablesUndiscovered.remove(this)
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
