import { EventBus } from '../../../event/EventBus'
import { JobCreateEvent } from '../../../event/WorldEvents'
import { AnimEntity } from '../anim/AnimEntity'
import { BuildingSite } from '../building/BuildingSite'
import { EntitySuperType, EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { CollectJob } from '../job/CollectJob'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { CarryPathTarget } from './CarryPathTarget'

export abstract class MaterialEntity extends AnimEntity {

    targetBuildingTypes: EntityType[] = []
    priorityIdentifier: PriorityIdentifier = null
    targets: CarryPathTarget[] = []
    targetSite: BuildingSite = null

    protected constructor(entityType: EntityType, aeFilename: string = null) {
        super(EntitySuperType.MATERIAL, entityType, aeFilename)
        this.targetBuildingTypes = [EntityType.TOOLSTATION]
    }

    getCarryTargets(): CarryPathTarget[] {
        return this.updateTargets()
    }

    resetTarget() {
        this.targets = []
        this.targetSite = null
        this.updateTargets()
    }

    protected updateTargets(): CarryPathTarget[] {
        if (this.targets.length < 1) {
            const sites = GameState.buildingSites.filter((b) => b.needs(this.entityType))
            if (sites.length > 0) {
                this.targets = sites.map((s) => new CarryPathTarget(s.getRandomDropPosition(), s, null))
            } else {
                const buildings = GameState.getBuildingsByType(...this.getTargetBuildingTypes())
                if (buildings.length > 0) {
                    this.targets = buildings.map((b) => new CarryPathTarget(b.getDropPosition2D(), null, b))
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
        GameState.materialsUndiscovered.remove(this)
        GameState.materials.push(this)
        EventBus.publishEvent(new JobCreateEvent(new CollectJob(this)))
    }

    setTargetSite(site: BuildingSite) {
        if (this.targetSite === site) return
        this.targetSite?.unAssign(this)
        this.targetSite = site
        this.targetSite?.assign(this)
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return this.priorityIdentifier
    }

    getTargetBuildingTypes(): EntityType[] {
        return this.targetBuildingTypes
    }

}
