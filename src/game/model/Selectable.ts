export interface Selectable {
    selected: boolean

    isSelectable(): boolean

    isInSelection(): boolean

    select(): boolean

    deselect(): any
}
