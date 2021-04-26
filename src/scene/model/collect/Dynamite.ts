import { Building } from '../../../game/model/entity/building/Building'
import { GameState } from '../../../game/model/GameState'
import { PriorityIdentifier } from '../../../game/model/job/PriorityIdentifier'
import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { DynamiteActivity } from '../activities/DynamiteActivity'
import { CollectPathTarget } from '../CollectPathTarget'
import { Surface } from '../map/Surface'
import { CollectableEntity } from './CollectableEntity'
import { CollectableType } from './CollectableType'

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
