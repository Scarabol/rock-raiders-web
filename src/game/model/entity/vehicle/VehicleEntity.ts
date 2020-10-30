import { Selectable, SelectionType } from '../../Selectable';

export class VehicleEntity implements Selectable {

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