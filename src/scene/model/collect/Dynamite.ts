import { ResourceManager } from '../../../resource/ResourceManager'
import { CollectableType } from './CollectableEntity'
import { Building } from '../../../game/model/entity/building/Building'
import { AnimEntity } from '../anim/AnimEntity'
import { Carryable } from './Carryable'
import { Surface } from '../map/Surface'
import { Vector2 } from 'three'
import { GameState } from '../../../game/model/GameState'
import { DynamiteActivity } from '../activities/DynamiteActivity'

export class Dynamite extends AnimEntity implements Carryable {

    targetSurface: Surface

    constructor() {
        super(ResourceManager.getAnimationEntityType('MiscAnims/Dynamite/Dynamite.ae'))
        this.setActivity(DynamiteActivity.Normal)
    }

    get stats() {
        return {}
    }

    getTargetPositions(): Vector2[] {
        if (this.targetSurface && this.targetSurface.isExplodable()) {
            return this.targetSurface.getDigPositions()
        } else {
            return GameState.getBuildingsByType(Building.TOOLSTATION).map((b) => b.getDropPosition2D())
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
        this.setActivity(DynamiteActivity.TickDown, () => {
            this.worldMgr.sceneManager.scene.remove(this.group)
            this.targetSurface.collapse()
            // TODO add explosion animation
            // TODO damage raider, vehicle, buildings
        })
    }

}
