export interface Selectable {

    getSelectionType(): SelectionType;

    select(): Selectable;

    deselect(): any;

}

export enum SelectionType {

    NONE,
    SURFACE,
    PILOT,
    BUILDING,

}
