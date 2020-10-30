export interface Selectable {

    getSelectionType(): SelectionType;

    select();

    deselect(): any;

}

export enum SelectionType {

    NONE,
    SURFACE,
    PILOT,
    BUILDING,
    VEHICLE,
    GROUP,

}
