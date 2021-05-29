import { SceneEntity } from '../../../scene/SceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { BuildingSite } from '../building/BuildingSite'
import { EntityType } from '../EntityType'
import { CarryJob } from '../job/carry/CarryJob'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { PathTarget } from '../PathTarget'
import { BuildingCarryPathTarget, CarryPathTarget, SiteCarryPathTarget } from './CarryPathTarget'

export abstract class MaterialEntity {

    sceneMgr: SceneManager
    entityMgr: EntityManager
    entityType: EntityType = null
    sceneEntity: SceneEntity
    targets: CarryPathTarget[] = []
    targetSite: BuildingSite = null
    positionPathTarget: PathTarget[] = null

    protected constructor(sceneMgr: SceneManager, entityMgr: EntityManager, entityType: EntityType) {
        this.sceneMgr = sceneMgr
        this.entityMgr = entityMgr
        this.entityType = entityType
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
            const sites = this.entityMgr.buildingSites.filter((b) => b.needs(this.entityType))
            if (sites.length > 0) {
                this.targets = sites.map((s) => new SiteCarryPathTarget(s.getRandomDropPosition(), s))
            } else {
                const buildings = this.entityMgr.getBuildingsByType(...this.getTargetBuildingTypes())
                if (buildings.length > 0) {
                    this.targets = buildings.map((b) => new BuildingCarryPathTarget(b))
                }
            }
        } else if (this.targets.some((t) => t.isInvalid())) {
            this.resetTarget()
        }
        return this.targets
    }

    setTargetSite(site: BuildingSite) {
        if (this.targetSite === site) return
        this.targetSite?.unAssign(this)
        this.targetSite = site
        this.targetSite?.assign(this)
    }

    abstract getPriorityIdentifier(): PriorityIdentifier

    getTargetBuildingTypes(): EntityType[] {
        return [EntityType.TOOLSTATION]
    }

    createCarryJob(): CarryJob<MaterialEntity> {
        return new CarryJob(this)
    }

    getPositionPathTarget(): PathTarget[] {
        const position = this.sceneEntity.position2D.clone()
        if (!this.positionPathTarget || !this.positionPathTarget[0].targetLocation.equals(position)) {
            this.positionPathTarget = [new PathTarget(position)]
        }
        return this.positionPathTarget
    }

    removeFromScene() {
        this.sceneEntity.removeFromScene()
    }

}
