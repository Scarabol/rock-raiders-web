import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { DynamiteActivity } from '../activities/DynamiteActivity'
import { EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { CarryJob } from '../job/CarryJob'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { CarryDynamiteJob } from '../job/surface/CarryDynamiteJob'
import { Surface } from '../map/Surface'
import { CarryPathTarget } from './CarryPathTarget'
import { MaterialEntity } from './MaterialEntity'

export class Dynamite extends MaterialEntity {

    targetSurface: Surface

    constructor() {
        super(EntityType.DYNAMITE, 'MiscAnims/Dynamite/Dynamite.ae')
        this.changeActivity()
        this.priorityIdentifier = PriorityIdentifier.aiPriorityDestruction
    }

    getCarryTargets(): CarryPathTarget[] {
        if (this.targetSurface && this.targetSurface.isExplodable()) {
            return this.targetSurface.getDigPositions().map((p) => new CarryPathTarget(p, null, null))
        } else {
            return GameState.getBuildingsByType(EntityType.TOOLSTATION).map((b) => b.getDropPosition2D())
                .map((p) => new CarryPathTarget(p, null, null))
        }
    }

    ignite() {
        // TODO add as explosive and scare em all!
        this.worldMgr.sceneManager.scene.add(this.group)
        const center = this.targetSurface.getCenterWorld()
        center.y = this.group.position.y
        this.group.lookAt(center)
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
