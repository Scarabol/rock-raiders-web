import { Box3, Group, Object3D, PositionalAudio, Sphere, Vector2, Vector3 } from 'three'
import { AnimationActivity, AnimEntityActivity } from '../game/model/anim/AnimationActivity'
import { Surface } from '../game/terrain/Surface'
import { Updatable } from '../game/model/Updateable'
import { SceneManager } from '../game/SceneManager'

export class SceneEntity {
    readonly updatableChildren: Updatable[] = []

    sceneMgr: SceneManager
    group: Group = new Group()
    meshGroup: Group = new Group()
    boundingSphere: Sphere = new Sphere()
    lastRadiusSquare: number = null

    constructor(sceneMgr: SceneManager, readonly floorOffset: number = 0.1) {
        this.sceneMgr = sceneMgr
        this.group.add(this.meshGroup)
    }

    set visible(state: boolean) {
        this.group.visible = state
    }

    get visible(): boolean {
        return this.group.visible
    }

    get position(): Vector3 {
        return this.group.position
    }

    set position(position: Vector3) {
        this.group.position.copy(position)
    }

    get position2D(): Vector2 {
        return new Vector2(this.group.position.x, this.group.position.z)
    }

    addChild(other: Object3D) {
        this.group.add(other)
    }

    addToMeshGroup(other: Object3D) {
        this.meshGroup.add(other)
        this.lastRadiusSquare = null
    }

    removeFromMeshGroup(other: Object3D) {
        this.meshGroup.remove(other)
        this.lastRadiusSquare = null
    }

    addUpdatable(other: Object3D & Updatable) {
        this.addToMeshGroup(other)
        this.updatableChildren.add(other)
    }

    getRadiusSquare(): number {
        if (!this.lastRadiusSquare) {
            new Box3().setFromObject(this.meshGroup).getBoundingSphere(this.boundingSphere)
            this.lastRadiusSquare = this.boundingSphere.radius * this.boundingSphere.radius
        }
        return this.lastRadiusSquare
    }

    getHeading(): number {
        return this.group.rotation.y
    }

    setHeading(heading: number) {
        this.group.rotation.y = heading
    }

    get surfaces(): Surface[] {
        return [this.sceneMgr.terrain.getSurfaceFromWorld(this.group.position)]
    }

    playPositionalAudio(sfxName: string, loop: boolean): PositionalAudio {
        return this.sceneMgr.addPositionalAudio(this.group, sfxName, true, loop)
    }

    addToScene(worldPosition: Vector2, radHeading: number) {
        if (worldPosition) {
            this.position.copy(this.sceneMgr.getFloorPosition(worldPosition))
            this.position.y += this.floorOffset
        }
        if (radHeading !== undefined && radHeading !== null) {
            this.setHeading(radHeading)
        }
        this.visible = this.surfaces.some((s) => s.discovered)
        this.sceneMgr.addEntity(this)
    }

    disposeFromScene() {
        this.sceneMgr.removeEntity(this)
        // TODO dispose scene meshes, use on-remove event trigger?
    }

    getDefaultActivity(): AnimationActivity {
        return AnimEntityActivity.Stand
    }

    changeActivity(activity: AnimationActivity = this.getDefaultActivity(), onAnimationDone: () => any = null, durationTimeMs: number = null) {
    }

    headTowards(location: Vector2) {
        this.group.lookAt(new Vector3(location.x, this.group.position.y, location.y)) // XXX externalize look at vector
    }

    update(elapsedMs: number) {
        this.updatableChildren.forEach((c) => c.update(elapsedMs))
    }
}
