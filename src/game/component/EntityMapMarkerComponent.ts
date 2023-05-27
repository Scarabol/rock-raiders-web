import { AbstractGameComponent } from '../ECS'

export enum MapMarkerType {
    DEFAULT,
    MONSTER,
    MATERIAL,
}

export class EntityMapMarkerComponent extends AbstractGameComponent {
    constructor(readonly mapMarkerType: MapMarkerType = MapMarkerType.DEFAULT) {
        super()
    }
}
