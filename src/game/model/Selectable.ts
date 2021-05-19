export interface Selectable {

    getSelectionType(): SelectionType

    select(): boolean

    deselect(): any

}

export enum SelectionType {

    NOTHING,
    SURFACE,
    RAIDER,
    BUILDING,
    VEHICLE_EMPTY,
    VEHICLE_MANED,
    GROUP,

}
