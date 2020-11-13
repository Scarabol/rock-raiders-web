import { EventBus } from '../../event/EventBus';
import { BuildingDeselected, BuildingSelected } from '../../event/LocalEvents';
import { Building } from '../../game/model/entity/building/Building';
import { AnimEntity } from './anim/AnimEntity';
import { Selectable, SelectionType } from '../../game/model/Selectable';
import { ResourceManager } from '../../resource/ResourceManager';
import { MathUtils, Vector3 } from 'three';
import degToRad = MathUtils.degToRad;

export class BuildingEntity extends AnimEntity implements Selectable {

    type: Building;
    selected: boolean;
    powerSwitch: boolean = true;
    powerLink: boolean = false;
    spawning: boolean = false;

    constructor(buildingType: Building) {
        super(ResourceManager.getAnimationEntityType(buildingType.aeFile));
        this.type = buildingType;
        this.group.userData = {'selectable': this};
    }

    getSelectionType(): SelectionType {
        return SelectionType.BUILDING;
    }

    select() {
        if (!this.selected) {
            this.selected = true;
            this.selectionFrame.visible = true;
            EventBus.publishEvent(new BuildingSelected(this));
        }
        return this;
    }

    deselect() {
        if (this.selected) {
            this.selected = false;
            this.selectionFrame.visible = false;
            EventBus.publishEvent(new BuildingDeselected(this));
        }
    }

    getDropPosition(): Vector3 {
        const dropPos = this.getPosition().add(new Vector3(0, 0, this.type.dropPosDist)
            .applyEuler(this.getRotation()).applyAxisAngle(new Vector3(0, 1, 0), degToRad(this.type.dropPosAngleDeg)));
        dropPos.y = this.worldMgr.getTerrainHeight(dropPos.x, dropPos.z);
        return dropPos;
    }

    isPowered(): boolean {
        return this.powerSwitch && (this.type.selfPowered || this.powerLink);
    }

}
