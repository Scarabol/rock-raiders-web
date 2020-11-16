import { ResourceManager } from '../../../resource/ResourceManager';
import { CollectableType } from './CollectableEntity';
import { Building } from '../../../game/model/entity/building/Building';
import { AnimEntity } from '../anim/AnimEntity';
import { Carryable } from './Carryable';
import { Surface } from '../map/Surface';

export class Dynamite extends AnimEntity implements Carryable {

    targetSurface: Surface;

    constructor(targetSurface: Surface) {
        super(ResourceManager.getAnimationEntityType('MiscAnims/Dynamite/Dynamite.ae'));
        this.targetSurface = targetSurface;
    }

    getTargetBuildingTypes(): Building[] {
        return []; // TODO return toolstation, if no job is assigned/active
    }

    getCollectableType(): CollectableType {
        return CollectableType.DYNAMITE;
    }

    ignite() {
        this.worldMgr.sceneManager.scene.add(this.group); // TODO add as explosive and scare em all!
        const center = this.targetSurface.getCenterWorld();
        center.y = this.group.position.y;
        this.group.lookAt(center);
        this.setActivity('TickDown', () => {
            this.worldMgr.sceneManager.scene.remove(this.group);
            this.targetSurface.collapse();
            // TODO add explosion animation
            // TODO damage raider, vehicle, buildings
        });
    }

}
