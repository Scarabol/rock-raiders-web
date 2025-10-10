import { AbstractGameComponent } from '../ECS'

export const MAP_MARKER_TYPE = {
    default: 1,
    monster: 2,
    material: 3,
    scanner: 4,
} as const
export type MapMarkerType = typeof MAP_MARKER_TYPE[keyof typeof MAP_MARKER_TYPE]

export const MAP_MARKER_CHANGE = {
    update: 1,
    remove: 2,
} as const
export type MapMarkerChange = typeof MAP_MARKER_CHANGE[keyof typeof MAP_MARKER_CHANGE]

export class MapMarkerComponent extends AbstractGameComponent {
    constructor(readonly mapMarkerType: MapMarkerType) {
        super()
    }
}
