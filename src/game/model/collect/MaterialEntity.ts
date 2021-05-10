import { EventBus } from '../../../event/EventBus'
import { JobCreateEvent } from '../../../event/WorldEvents'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { AnimEntity } from '../anim/AnimEntity'
import { BuildingSite } from '../building/BuildingSite'
import { EntitySuperType, EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { CarryJob } from '../job/CarryJob'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { PathTarget } from '../PathTarget'
import { BuildingCarryPathTarget, CarryPathTarget, SiteCarryPathTarget } from './CarryPathTarget'

export abstract class MaterialEntity extends AnimEntity {

    targetBuildingTypes: EntityType[] = []
    priorityIdentifier: PriorityIdentifier = null
    targets: CarryPathTarget[] = []
    targetSite: BuildingSite = null
    positionPathTarget: PathTarget[] = null

    protected constructor(worldMgr: WorldManager, sceneMgr: SceneManager, entityType: EntityType, aeFilename: string = null) {
        super(worldMgr, sceneMgr, EntitySuperType.MATERIAL, entityType, aeFilename)
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
                this.targets = sites.map((s) => new SiteCarryPathTarget(s.getRandomDropPosition(), s))
            } else {
                const buildings = GameState.getBuildingsByType(...this.getTargetBuildingTypes())
                if (buildings.length > 0) {
                    this.targets = buildings.map((b) => new BuildingCarryPathTarget(b))
                }
            }
        } else if (this.targets.some((t) => t.isInvalid())) {
            this.resetTarget()
        }
        return this.targets
    }

    onDiscover() {
        super.onDiscover()
        GameState.materialsUndiscovered.remove(this)
        GameState.materials.push(this)
        EventBus.publishEvent(new JobCreateEvent(this.createCarryJob()))
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

    createCarryJob(): CarryJob<MaterialEntity> {
        return new CarryJob(this)
    }

    onAddToSite() {
        this.addToScene(null, null)
    }

    getPositionPathTarget(): PathTarget[] {
        const position = this.getPosition2D()
        if (!this.positionPathTarget || !this.positionPathTarget[0].targetLocation.equals(position)) {
            this.positionPathTarget = [new PathTarget(position)]
        }
        return this.positionPathTarget
    }

}
