import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { AnimEntityActivity } from '../activities/AnimEntityActivity'
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
        super(sceneMgr, entityMgr, EntityType.DYNAMITE, 'MiscAnims/Dynamite/Dynamite.ae')
        this.targetSurface = surface
        this.priorityIdentifier = PriorityIdentifier.aiPriorityDestruction
        this.changeActivity()
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
        this.changeActivity(DynamiteActivity.TickDown, () => {
            this.removeFromScene()
            this.targetSurface.collapse()
            // TODO add explosion animation
            // TODO damage raider, vehicle, buildings
        })
    }

    getDefaultActivity(): AnimEntityActivity {
        return DynamiteActivity.Normal
    }

    createCarryJob(): CarryJob<Dynamite> {
        return new CarryDynamiteJob(this)
    }

}
