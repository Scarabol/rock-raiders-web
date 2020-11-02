import { Selectable, SelectionType } from '../../game/model/Selectable';
import { MovableEntity } from '../../game/model/entity/MovableEntity';

export class VehicleEntity extends MovableEntity implements Selectable {

    selected: boolean;

    getSelectionType(): SelectionType {
        return SelectionType.VEHICLE;
    }

    select(): Selectable {
        if (!this.selected) {
            this.selected = true;
        }
        return this;
    }

    deselect(): any {
        if (this.selected) {
            this.selected = false;
        }
    }

}