import { ResourceManager } from '../../resource/ResourceManager';
import { Selectable, SelectionType } from '../../game/model/Selectable';
import { EventBus } from '../../event/EventBus';
import { RaiderDeselected, RaiderSelected } from '../../event/WorldEvents';
import { MovableEntity } from '../../game/model/entity/MovableEntity';

export class Raider extends MovableEntity implements Selectable {

    selected: boolean;

    constructor() {
        super(ResourceManager.getAnimationEntityType('mini-figures/pilot/pilot.ae'), 1); // FIXME read speed (and other stats) from cfg
        this.group.userData = {'selectable': this};
    }

    getSelectionType(): SelectionType {
        return SelectionType.PILOT;
    }

    select(): Selectable {
        if (!this.selected) {
            this.selected = true;
            this.selectionFrame.visible = true;
            // TODO stop any movement/job execution
            EventBus.publishEvent(new RaiderSelected(this));
        }
        return this;
    }

    deselect() {
        if (this.selected) {
            this.selected = false;
            this.selectionFrame.visible = false;
            EventBus.publishEvent(new RaiderDeselected(this));
        }
    }

}
