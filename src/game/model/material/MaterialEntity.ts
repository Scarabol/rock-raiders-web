import { ITEM_ACTION_RANGE_SQ } from '../../../params'
import { SceneEntity } from '../../../scene/SceneEntity'
import { WorldManager } from '../../WorldManager'
import { Disposable } from '../Disposable'
import { EntityType } from '../EntityType'
import { CarryJob } from '../job/carry/CarryJob'
import { CarryPathTarget } from '../job/carry/CarryPathTarget'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { PathTarget } from '../PathTarget'

export abstract class MaterialEntity implements Disposable {
    sceneEntity: SceneEntity = null
    positionAsPathTargets: PathTarget[] = []

    protected constructor(readonly worldMgr: WorldManager, readonly entityType: EntityType, readonly priorityIdentifier: PriorityIdentifier) {
    }

    abstract findCarryTargets(): CarryPathTarget[]

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
    }

    update(elapsedMs: number) {
        this.sceneEntity.update(elapsedMs)
    }
}
