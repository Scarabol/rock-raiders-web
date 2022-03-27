import { GameComponent } from '../../model/GameComponent'
import { AbstractGameEntity } from '../../entity/AbstractGameEntity'
import { AnimatedSceneEntityComponent } from './AnimatedSceneEntityComponent'
import { Vector2 } from 'three'

export enum MAP_MARKER_TYPE {
    NORMAL,
    MONSTER,
    MATERIAL,
}

export class EntityMapMarkerComponent implements GameComponent {
    private sceneEntity: AnimatedSceneEntityComponent

    constructor(readonly mapMarkerType: MAP_MARKER_TYPE) {
    }

    setupComponent(entity: AbstractGameEntity) {
        this.sceneEntity = entity.getComponent(AnimatedSceneEntityComponent)
    }

    disposeComponent() {
    }

    position2d(): Vector2 {
        return this.sceneEntity.sceneEntity.position2D
    }
}
