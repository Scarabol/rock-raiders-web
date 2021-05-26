export interface Selectable {

    selected: boolean

    getSelectionType(): SelectionType

    isSelectable(): boolean

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
