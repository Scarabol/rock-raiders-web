import { AnimEntity } from './AnimEntity';
import { iGet } from '../../../core/Util';
import { ResourceManager } from '../../engine/ResourceManager';
import { Selectable, SelectionType } from '../Selectable';
import { EventBus } from '../../event/EventBus';
import { RaiderDeselected, RaiderSelected } from '../../event/WorldEvents';

export class Raider extends AnimEntity implements Selectable {

    selected: boolean;

    constructor() {
        super(iGet(ResourceManager.entity, 'mini-figures/pilot/pilot.ae'));
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
