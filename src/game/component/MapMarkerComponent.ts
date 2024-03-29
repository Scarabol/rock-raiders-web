import { AbstractGameComponent } from '../ECS'

export enum MapMarkerType {
    DEFAULT = 1,
    MONSTER,
    MATERIAL,
    SCANNER,
}

export enum MapMarkerChange {
    UPDATE = 1,
    REMOVE,
}

export class MapMarkerComponent extends AbstractGameComponent {
    constructor(readonly mapMarkerType: MapMarkerType) {
        super()
    }
}
