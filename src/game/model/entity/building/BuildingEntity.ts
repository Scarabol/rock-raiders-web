import { EventBus } from '../../../event/EventBus';
import { BuildingDeselected, BuildingSelected } from '../../../event/LocalEvents';
import { Building } from './Building';
import { AnimEntity } from '../AnimEntity';
import { Selectable, SelectionType } from '../../Selectable';
import { iGet } from '../../../../core/Util';
import { ResourceManager } from '../../../engine/ResourceManager';

export class BuildingEntity extends AnimEntity implements Selectable {

    type: Building;
    selected: boolean;

    constructor(buildingType: Building) {
        super(iGet(ResourceManager.entity, buildingType.aeFile));
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

}
