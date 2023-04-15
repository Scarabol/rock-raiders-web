import { Box3, Group, Mesh, MeshBasicMaterial, Object3D, PositionalAudio, Sphere, SphereGeometry, Sprite, Vector2, Vector3 } from 'three'
import { SoundManager } from '../audio/SoundManager'
import { PickSphereStats } from '../cfg/GameStatsCfg'
import { AnimationActivity, AnimEntityActivity } from '../game/model/anim/AnimationActivity'
import { Surface } from '../game/model/map/Surface'
import { Selectable } from '../game/model/Selectable'
import { Updatable } from '../game/model/Updateable'
import { SceneManager } from '../game/SceneManager'
import { TILESIZE } from '../params'
import { SelectionFrameSprite } from './SelectionFrameSprite'

export class SceneEntity {
    readonly updatableChildren: Updatable[] = []
    floorOffset: number = 0.1

    sceneMgr: SceneManager
    group: Group = new Group()
    meshGroup: Group = new Group()
    pickSphere: Mesh = null
    selectionFrame: Sprite = null
    selectionFrameDouble: Sprite = null
    boundingSphere: Sphere = new Sphere()
    lastRadiusSquare: number = null

    constructor(sceneMgr: SceneManager) {
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

    removeChild(other: Object3D) {
        this.group.remove(other)
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

    makeSelectable(entity: { stats: PickSphereStats } & Selectable, pickSphereHeightOffset: number = null) {
        this.addPickSphere(entity.stats.PickSphere, pickSphereHeightOffset)
        this.pickSphere.userData = {selectable: entity}
        this.selectionFrame = SceneEntity.createSelectionFrame(entity.stats.PickSphere, this.pickSphere.position, '#0f0')
        this.addChild(this.selectionFrame)
        this.selectionFrameDouble = SceneEntity.createSelectionFrame(entity.stats.PickSphere, this.pickSphere.position, '#f00')
        this.addChild(this.selectionFrameDouble)
    }

    addPickSphere(pickSphereDiameter: number, pickSphereHeightOffset: number = null) {
        if (this.pickSphere) return
        const pickSphereRadius = pickSphereDiameter / 2
        const geometry = new SphereGeometry(pickSphereRadius, pickSphereRadius, pickSphereRadius)
        const material = new MeshBasicMaterial({color: 0xa0a000, visible: false, wireframe: true}) // change visible to true for debugging
        this.pickSphere = new Mesh(geometry, material)
        this.pickSphere.position.y = pickSphereHeightOffset ?? (this.getBoundingSphereCenter().y - this.position.y)
        this.addChild(this.pickSphere)
    }

    private getBoundingSphereCenter(): Vector3 {
        const center = new Vector3()
        new Box3().setFromObject(this.meshGroup).getCenter(center)
        return center
    }

    private static createSelectionFrame(pickSphereDiameter: number, pickSphereCenter: Vector3, hexColor: string) {
        const selectionFrame = new SelectionFrameSprite(pickSphereDiameter, hexColor)
        selectionFrame.position.copy(pickSphereCenter)
        const selectionFrameSize = pickSphereDiameter * 3 / 4
        selectionFrame.scale.set(selectionFrameSize, selectionFrameSize, selectionFrameSize)
        selectionFrame.visible = false
        return selectionFrame
    }

    get surfaces(): Surface[] {
        return [this.sceneMgr.terrain.getSurfaceFromWorld(this.group.position)]
    }

    playPositionalAudio(sfxName: string, loop: boolean): PositionalAudio {
        const audio = new PositionalAudio(this.sceneMgr.audioListener)
        audio.setRefDistance(TILESIZE * 2)
        audio.loop = loop
        this.addChild(audio)
        SoundManager.getSoundBuffer(sfxName).then((audioBuffer) => {
            audio.setBuffer(audioBuffer).play() // TODO retry playing sound for looped ones, when audio context fails
            if (!audio.loop) audio.onEnded = () => this.removeChild(audio)
        }).catch(() => {
            this.removeChild(audio)
        })
        return audio
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
        this.sceneMgr.scene.add(this.group)
    }

    disposeFromScene() {
        this.sceneMgr.scene.remove(this.group)
        // TODO dispose scene meshes, use on-remove event trigger?
    }

    getDefaultActivity(): AnimationActivity {
        return AnimEntityActivity.Stand
    }

    changeActivity(activity: AnimationActivity = this.getDefaultActivity(), onAnimationDone: () => any = null, durationTimeMs: number = null) {
    }

    headTowards(location: Vector2) {
        this.group.lookAt(new Vector3(location.x, this.group.position.y, location.y))
    }

    update(elapsedMs: number) {
        this.updatableChildren.forEach((c) => c.update(elapsedMs))
    }
}
