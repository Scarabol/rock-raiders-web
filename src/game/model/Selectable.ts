export interface Selectable {

    getSelectionType(): SelectionType;

    select();

    deselect(): any;

}

export enum SelectionType {

    SURFACE,
    PILOT,
    BUILDING,
    VEHICLE,
    GROUP,

}
