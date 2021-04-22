import { BaseEntity } from '../BaseEntity'
import { GameState } from '../../../game/model/GameState'
import { EventBus } from '../../../event/EventBus'
import { JobCreateEvent } from '../../../event/WorldEvents'
import { Carryable } from './Carryable'
import { CollectJob } from '../../../game/model/job/CollectJob'
import { CollectPathTarget } from '../CollectionTarget'
import { Building } from '../../../game/model/entity/building/Building'
import { BuildingSite } from '../BuildingSite'
import { PriorityIdentifier } from '../../../game/model/job/PriorityIdentifier'

export abstract class CollectableEntity extends BaseEntity implements Carryable {

    targets: CollectPathTarget[] = []
    targetSite: BuildingSite = null

    abstract getTargetBuildingTypes(): Building[];

    hasTarget(): boolean {
        return this.updateTargets().length > 0
    }

    getCarryTargets(): CollectPathTarget[] {
        return this.updateTargets()
    }

    resetTarget() {
        this.targets = []
        this.targetSite = null
        this.updateTargets()
    }

    protected updateTargets(): CollectPathTarget[] {
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

    abstract getCollectableType(): CollectableType

    abstract getPriorityIdentifier(): PriorityIdentifier

    setTargetSite(site: BuildingSite) {
        if (this.targetSite === site) return
        this.targetSite?.unAssign(this)
        this.targetSite = site
        this.targetSite?.assign(this)
    }

}

export enum CollectableType {

    DYNAMITE,
    CRYSTAL,
    ORE,
    BRICK,
    BARRIER,
    ELECTRIC_FENCE,

}
