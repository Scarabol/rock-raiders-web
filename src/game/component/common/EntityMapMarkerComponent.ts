import { Vector2 } from 'three'
import { AbstractGameEntity } from '../../entity/AbstractGameEntity'
import { GameComponent } from '../../model/GameComponent'
import { PositionComponent } from './PositionComponent'

export enum MAP_MARKER_TYPE {
    NORMAL,
    MONSTER,
    MATERIAL,
}

export class EntityMapMarkerComponent implements GameComponent {
    private position: PositionComponent

    constructor(readonly mapMarkerType: MAP_MARKER_TYPE) {
    }

    setupComponent(entity: AbstractGameEntity) {
        this.position = entity.getComponent(PositionComponent)
    }

    disposeComponent() {
    }

    position2D(): Vector2 {
        return this.position.getPosition2D()
    }
}
