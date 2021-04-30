import { Vector3 } from 'three'
import { SelectionEvent } from '../../event/LocalEvents'

export interface Selectable {

    getSelectionType(): SelectionType;

    select(): SelectionEvent;

    deselect(): any;

    getSelectionCenter(): Vector3;

}

export enum SelectionType {

    SURFACE,
    RAIDER,
    BUILDING,
    VEHICLE,
    GROUP,

}
