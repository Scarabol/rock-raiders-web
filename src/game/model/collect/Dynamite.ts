import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { DynamiteActivity } from '../activities/DynamiteActivity'
import { Building } from '../building/Building'
import { GameState } from '../GameState'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { Surface } from '../map/Surface'
import { CollectableEntity } from './CollectableEntity'
import { CollectableType } from './CollectableType'
import { CollectPathTarget } from './CollectPathTarget'

export class Dynamite extends CollectableEntity {

    targetSurface: Surface

    constructor() {
        super(CollectableType.DYNAMITE, 'MiscAnims/Dynamite/Dynamite.ae')
        this.changeActivity()
        this.priorityIdentifier = PriorityIdentifier.aiPriorityDestruction
    }

    hasTarget(): boolean {
        return this.targetSurface && this.targetSurface.isExplodable() || GameState.hasOneBuildingOf(Building.TOOLSTATION)
    }

    getCarryTargets(): CollectPathTarget[] {
        if (this.targetSurface && this.targetSurface.isExplodable()) {
            return this.targetSurface.getDigPositions().map((p) => new CollectPathTarget(p, null, null))
        } else {
            return GameState.getBuildingsByType(Building.TOOLSTATION).map((b) => b.getDropPosition2D())
                .map((p) => new CollectPathTarget(p, null, null))
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

}
