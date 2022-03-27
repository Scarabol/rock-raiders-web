import { GameComponent } from '../../model/GameComponent'
import { AbstractGameEntity } from '../../entity/AbstractGameEntity'
import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { Vector2, Vector3 } from 'three'
import { AnimEntityActivity } from '../../model/activities/AnimEntityActivity'
import { Surface } from '../../model/map/Surface'
import { Terrain } from '../../model/map/Terrain'
import { SceneManager } from '../../SceneManager'

export class AnimatedSceneEntityComponent implements GameComponent {
    sceneEntity: AnimatedSceneEntity = null
    terrain: Terrain = null

    constructor(readonly sceneMgr: SceneManager, aeFilename: string, floorOffset?: number) {
        this.sceneEntity = new AnimatedSceneEntity(sceneMgr, aeFilename)
        if (floorOffset) this.sceneEntity.floorOffset = floorOffset
    }

    setupComponent(entity: AbstractGameEntity) {
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

    move(step: Vector3) {
        this.sceneEntity.position.add(step)
        this.sceneEntity.changeActivity(AnimEntityActivity.Route)
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
}
