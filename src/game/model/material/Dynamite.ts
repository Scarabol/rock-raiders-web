import { DynamiteSceneEntity } from '../../../scene/entities/DynamiteSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { DynamiteActivity } from '../activities/DynamiteActivity'
import { EntityType } from '../EntityType'
import { CarryDynamiteJob } from '../job/carry/CarryDynamiteJob'
import { CarryJob } from '../job/carry/CarryJob'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { Surface } from '../map/Surface'
import { CarryPathTarget } from './CarryPathTarget'
import { MaterialEntity } from './MaterialEntity'

export class Dynamite extends MaterialEntity {

    targetSurface: Surface

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager, surface: Surface) {
        super(sceneMgr, entityMgr, EntityType.DYNAMITE)
        this.sceneEntity = new DynamiteSceneEntity(sceneMgr)
        this.targetSurface = surface
    }

    getCarryTargets(): CarryPathTarget[] {
        if (this.targetSurface && this.targetSurface.isDigable()) {
            return this.targetSurface.getDigPositions().map((p) => new CarryPathTarget(p))
        } else {
            return this.entityMgr.getBuildingsByType(EntityType.TOOLSTATION).map((b) => b.getDropPosition2D())
                .map((p) => new CarryPathTarget(p))
        }
    }

    ignite() {
        // TODO add as explosive and scare em all!
        const center = this.targetSurface.getCenterWorld()
        center.y = this.sceneEntity.position.y
        this.sceneEntity.lookAt(center)
        this.sceneEntity.changeActivity(DynamiteActivity.TickDown, () => {
            this.sceneEntity.removeFromScene()
            this.targetSurface.collapse()
            // TODO add explosion animation
            // TODO damage raider, vehicle, buildings
        })
    }

    createCarryJob(): CarryJob<Dynamite> {
        return new CarryDynamiteJob(this)
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityDestruction
    }

}
