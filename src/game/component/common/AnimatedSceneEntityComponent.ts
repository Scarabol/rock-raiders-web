import { Vector2, Vector3 } from 'three'
import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { AbstractGameEntity } from '../../entity/AbstractGameEntity'
import { AnimEntityActivity } from '../../model/activities/AnimEntityActivity'
import { GameComponent } from '../../model/GameComponent'
import { Surface } from '../../model/map/Surface'
import { SceneManager } from '../../SceneManager'
import { PositionComponent } from './PositionComponent'

export class AnimatedSceneEntityComponent implements GameComponent {
    protected sceneEntity: AnimatedSceneEntity = null

    constructor(protected readonly sceneMgr: SceneManager, aeFilename: string, floorOffset?: number) {
        this.sceneEntity = new AnimatedSceneEntity(sceneMgr, aeFilename)
        if (floorOffset) this.sceneEntity.floorOffset = floorOffset
    }

    setupComponent(entity: AbstractGameEntity) {
        const positionComponent = entity.getComponent(PositionComponent)
        this.setPosition(positionComponent.getPosition2D())
        positionComponent.addOnChangeCallback((changedPosition) => {
            this.setPosition(changedPosition)
            this.sceneEntity.changeActivity(AnimEntityActivity.Route)
        })
    }

    private setPosition(changedPosition: Vector2) {
        this.sceneEntity.position.copy(this.sceneMgr.getFloorPosition(changedPosition))
        this.sceneEntity.position.y += this.sceneEntity.floorOffset
    }

    disposeComponent() {
        this.sceneEntity.disposeFromScene()
    }

    update(elapsedMs: number) {
        this.sceneEntity.update(elapsedMs)
    }

    focus(focus: Vector2) {
        this.sceneEntity.headTowards(focus)
    }

    getWorldDistance(target: Vector2): Vector3 {
        const targetWorld = this.sceneEntity.sceneMgr.getFloorPosition(target)
        targetWorld.y += this.sceneEntity.floorOffset
        return targetWorld.sub(this.sceneEntity.position)
    }

    changeActivity(activity: AnimEntityActivity = this.getDefaultActivity()) {
        this.sceneEntity.changeActivity(activity)
    }

    getDefaultActivity(): AnimEntityActivity {
        return this.sceneEntity.getDefaultActivity()
    }

    get surface(): Surface {
        return this.sceneEntity.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position)
    }

    addToScene(worldPosition: Vector2, radHeading: number) {
        this.sceneEntity.addToScene(worldPosition, radHeading)
    }

    set visible(state: boolean) {
        this.sceneEntity.visible = state
    }

    get visible(): boolean {
        return this.sceneEntity.visible
    }
}
