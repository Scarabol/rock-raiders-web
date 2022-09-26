import { Vector2, Vector3 } from 'three'
import { AbstractGameEntity } from '../../entity/AbstractGameEntity'
import { GameComponent } from '../../model/GameComponent'
import { Surface } from '../../model/map/Surface'
import { Terrain } from '../../model/map/Terrain'

type OnMoveCallback = (targetPosition: Vector2) => any

export class PositionComponent implements GameComponent {
    private readonly onMoveCallbacks: OnMoveCallback[] = []
    private readonly position: Vector3 = new Vector3()
    private terrain: Terrain
    private surface: Surface

    setupComponent(entity: AbstractGameEntity) {
        this.terrain = entity.worldMgr.sceneMgr.terrain
        this.surface = this.terrain.getSurfaceFromWorld(this.position)
    }

    disposeComponent() {
    }

    move(step: Vector3) {
        this.position.add(step)
        this.surface = this.terrain.getSurfaceFromWorld(this.position)
        this.onMoveCallbacks.forEach((callback) => callback(this.getPosition2D()))
    }

    getPosition(): Vector3 {
        return this.position.clone()
    }

    setPosition2D(position: Vector2) {
        this.position.set(position.x, 0, position.y)
        this.surface = this.terrain.getSurfaceFromWorld(this.position)
    }

    getPosition2D(): Vector2 {
        return new Vector2(this.position.x, this.position.z)
    }

    addOnChangeCallback(callback: OnMoveCallback) {
        this.onMoveCallbacks.push(callback)
    }

    isDiscovered(): boolean {
        return this.surface.discovered
    }

    isOnPath(): boolean {
        return this.surface.isPath()
    }

    isOnRubble(): boolean {
        return this.surface.hasRubble()
    }

    isNotFloor(): boolean {
        return !this.surface.surfaceType.floor
    }

    surfaceCenter2D(): Vector2 {
        return this.surface.getCenterWorld2D()
    }
}
