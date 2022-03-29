import { Vector2, Vector3 } from 'three'
import { AbstractGameEntity } from '../../entity/AbstractGameEntity'
import { GameComponent } from '../../model/GameComponent'

type OnMoveCallback = (targetPosition: Vector2) => any

export class PositionComponent implements GameComponent {
    private readonly onMoveCallbacks: OnMoveCallback[] = []
    private readonly position: Vector3 = new Vector3()

    constructor(position: Vector2) {
        this.position.set(position.x, 0, position.y)
    }

    setupComponent(entity: AbstractGameEntity) {
    }

    disposeComponent() {
    }

    move(step: Vector3) {
        this.position.add(step)
        this.onMoveCallbacks.forEach((callback) => callback(this.getPosition2D()))
    }

    getPosition(): Vector3 {
        return this.position.clone()
    }

    getPosition2D(): Vector2 {
        return new Vector2(this.position.x, this.position.z)
    }

    addOnChangeCallback(callback: OnMoveCallback) {
        this.onMoveCallbacks.push(callback)
    }
}
