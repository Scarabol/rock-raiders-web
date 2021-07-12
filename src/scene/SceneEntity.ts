import { Box3, Group, Mesh, MeshBasicMaterial, Object3D, PositionalAudio, Sphere, SphereGeometry, Sprite, Vector2, Vector3 } from 'three'
import { SoundManager } from '../audio/SoundManager'
import { AnimEntityActivity } from '../game/model/activities/AnimEntityActivity'
import { Surface } from '../game/model/map/Surface'
import { Selectable } from '../game/model/Selectable'
import { SceneManager } from '../game/SceneManager'
import { TILESIZE } from '../params'
import { SelectionFrameSprite } from './SelectionFrameSprite'

export class SceneEntity {

    floorOffset: number = 0.1

    sceneMgr: SceneManager
    group: Group = new Group()
    pickSphere: Mesh = null
    selectionFrame: Sprite = null
    boundingSphere: Sphere = new Sphere()

    constructor(sceneMgr: SceneManager) {
        this.sceneMgr = sceneMgr
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

    add(other: Object3D) {
        this.group.add(other)
    }

    remove(other: Object3D) {
        this.group.remove(other)
    }

    getRadiusSquare(): number {
        new Box3().setFromObject(this.group).getBoundingSphere(this.boundingSphere)
        return this.boundingSphere.radius * this.boundingSphere.radius
    }

    getHeading(): number {
        return this.group.rotation.y
    }

    setHeading(heading: number) {
        this.group.rotation.y = heading
    }

    lookAt(target: Vector3) {
        this.group.lookAt(target)
    }

    createPickSphere(pickSphereDiameter: number, selectable: Selectable, pickSphereHeightOffset: number = this.getBoundingSphereCenter().y - this.position.y) {
        if (this.pickSphere) return
        const pickSphereRadius = pickSphereDiameter / 2
        const geometry = new SphereGeometry(pickSphereRadius, pickSphereRadius, pickSphereRadius)
        const material = new MeshBasicMaterial({color: 0xffff00, visible: false}) // change visible to true for debugging
        this.pickSphere = new Mesh(geometry, material)
        this.pickSphere.userData = {selectable: selectable}
        this.pickSphere.position.y = pickSphereHeightOffset
        this.add(this.pickSphere)
        this.selectionFrame = SceneEntity.createSelectionFrame(pickSphereDiameter, this.pickSphere.position, '#0f0')
        this.add(this.selectionFrame)
    }

    getBoundingSphereCenter(): Vector3 {
        const center = new Vector3()
        new Box3().setFromObject(this.group).getCenter(center)
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
        const audio = new PositionalAudio(this.sceneMgr.listener)
        audio.setRefDistance(TILESIZE * 2)
        audio.loop = loop
        this.add(audio)
        SoundManager.getSoundBuffer(sfxName).then((audioBuffer) => {
            audio.setBuffer(audioBuffer).play() // TODO retry playing sound for looped ones, when audio context fails
            if (!audio.loop) audio.onEnded = () => this.remove(audio)
        }).catch(() => {
            this.remove(audio)
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

    removeFromScene() {
        this.sceneMgr.scene.remove(this.group)
    }

    getDefaultActivity(): AnimEntityActivity {
        return AnimEntityActivity.Stand
    }

    changeActivity(activity: AnimEntityActivity = this.getDefaultActivity(), onAnimationDone: () => any = null, durationTimeMs: number = null) {
    }

    headTowards(location: Vector2) {
        this.lookAt(new Vector3(location.x, this.group.position.y, location.y))
    }

    update(elapsedMs: number) {
    }

}
