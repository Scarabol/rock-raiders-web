import { Vector3 } from 'three'

export interface Selectable {

    getSelectionType(): SelectionType;

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
