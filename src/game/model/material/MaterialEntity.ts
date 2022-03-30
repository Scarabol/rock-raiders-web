import { ITEM_ACTION_RANGE_SQ } from '../../../params'
import { SceneEntity } from '../../../scene/SceneEntity'
import { EntityType } from '../EntityType'
import { CarryJob } from '../job/carry/CarryJob'
import { CarryPathTarget } from '../job/carry/CarryPathTarget'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { PathTarget } from '../PathTarget'
import { Disposable } from '../Disposable'
import { WorldManager } from '../../WorldManager'

export abstract class MaterialEntity implements Disposable {
    entityType: EntityType
    sceneEntity: SceneEntity = null
    positionAsPathTargets: PathTarget[] = []

    protected constructor(readonly worldMgr: WorldManager, entityType: EntityType) {
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

    disposeFromWorld() {
        this.sceneEntity.disposeFromScene()
        this.worldMgr.entityMgr.materials.remove(this)
        this.worldMgr.entityMgr.materialsUndiscovered.remove(this)
        this.worldMgr.entityMgr.scarer.remove(this)
    }

    update(elapsedMs: number) {
        this.sceneEntity.update(elapsedMs)
    }
}
