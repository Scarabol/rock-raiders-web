import { Vector3 } from 'three'

export interface Selectable {

    getSelectionType(): SelectionType

    select(): boolean

    deselect(): any

    getSelectionCenter(): Vector3

}

export enum SelectionType {

    NOTHING,
    SURFACE,
    RAIDER,
    BUILDING,
    VEHICLE,
    GROUP,

}
