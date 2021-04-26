import { Building } from '../../../game/model/entity/building/Building'
import { GameState } from '../../../game/model/GameState'
import { ResourceManager } from '../../../resource/ResourceManager'
import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { DynamiteActivity } from '../activities/DynamiteActivity'
import { AnimEntity } from '../anim/AnimEntity'
import { Surface } from '../map/Surface'
import { PathTarget } from '../PathTarget'
import { Carryable } from './Carryable'
import { CollectableType } from './CollectableEntity'

export class Dynamite extends AnimEntity implements Carryable {

    targetSurface: Surface

    constructor() {
        super(ResourceManager.getAnimationEntityType('MiscAnims/Dynamite/Dynamite.ae'))
        this.changeActivity()
    }

    get stats() {
        return {}
    }

    hasTarget(): boolean {
        return this.targetSurface && this.targetSurface.isExplodable() || GameState.hasOneBuildingOf(Building.TOOLSTATION)
    }

    getCarryTargets(): PathTarget[] {
        if (this.targetSurface && this.targetSurface.isExplodable()) {
            return this.targetSurface.getDigPositions().map((p) => new PathTarget(p))
        } else {
            return GameState.getBuildingsByType(Building.TOOLSTATION).map((b) => b.getDropPosition2D())
                .map((p) => new PathTarget(p))
        }
    }

    getCollectableType(): CollectableType {
        return CollectableType.DYNAMITE
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
