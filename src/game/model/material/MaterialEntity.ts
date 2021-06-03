import { ITEM_ACTION_RANGE_SQ } from '../../../params'
import { SceneEntity } from '../../../scene/SceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { CarryJob } from '../job/carry/CarryJob'
import { CarryPathTarget } from '../job/carry/CarryPathTarget'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { PathTarget } from '../PathTarget'

export abstract class MaterialEntity {

    sceneMgr: SceneManager
    entityMgr: EntityManager
    entityType: EntityType
    sceneEntity: SceneEntity = null
    positionAsPathTargets: PathTarget[] = []

    protected constructor(sceneMgr: SceneManager, entityMgr: EntityManager, entityType: EntityType) {
        this.sceneMgr = sceneMgr
        this.entityMgr = entityMgr
        this.entityType = entityType
    }

    abstract findCarryTargets(): CarryPathTarget[]

    abstract getPriorityIdentifier(): PriorityIdentifier

    createCarryJob(): CarryJob<MaterialEntity> {
        return new CarryJob(this) // TODO better create only one job per item?
    }

    getPositionAsPathTargets(): PathTarget[] {
        const position = this.sceneEntity.position2D
        if (this.positionAsPathTargets.length < 1 || !this.positionAsPathTargets[0].targetLocation.equals(position)) {
            this.positionAsPathTargets = [new PathTarget(position, ITEM_ACTION_RANGE_SQ)] // XXX becomes obsolete when using setter to change position
        }
        return this.positionAsPathTargets
    }

    removeFromScene() {
        this.sceneEntity.removeFromScene()
    }

}
