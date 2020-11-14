import { Vector3 } from 'three';
import { LocalEvent } from '../../event/LocalEvents';

export interface Selectable {

    getSelectionType(): SelectionType;

    getSelectionEvent(): LocalEvent;

    select();

    deselect(): any;

    getSelectionCenter(): Vector3;

}

export enum SelectionType {

    SURFACE,
    PILOT,
    BUILDING,
    VEHICLE,
    GROUP,

}
