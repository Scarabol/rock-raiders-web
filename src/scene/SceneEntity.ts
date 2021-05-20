import { Box3, CanvasTexture, Group, Matrix4, Mesh, MeshBasicMaterial, Object3D, Sphere, SphereGeometry, Sprite, SpriteMaterial, Vector3 } from 'three'
import { createContext } from '../core/ImageHelper'
import { Selectable } from '../game/model/Selectable'
import { SceneEntityUserData } from './SceneEntityUserData'

export class SceneEntity {

    group: Group = new Group()

    pickSphere: Mesh = null
    selectionFrame: Sprite = null
    boundingSphere: Sphere = new Sphere()

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

    setSelectable(selectable: Selectable) {
        this.group.userData = this.group.userData || new SceneEntityUserData();
        (this.group.userData as SceneEntityUserData).selectable = selectable
    }

    flipXAxis() {
        this.group.applyMatrix4(new Matrix4().makeScale(-1, 1, 1))
    }

    createPickSphere(pickSphereDiameter: number, pickSphereHeightOffset: number = this.getBoundingSphereCenter().y - this.position.y) { // TODO Refactor this is always triggered after changeActivity is called for the first time
        if (this.pickSphere) return
        const pickSphereRadius = pickSphereDiameter / 2
        const geometry = new SphereGeometry(pickSphereRadius, pickSphereRadius, pickSphereRadius)
        const material = new MeshBasicMaterial({color: 0xffff00, visible: false}) // change visible to true for debugging
        this.pickSphere = new Mesh(geometry, material)
        this.pickSphere.userData = {selectable: this}
        this.pickSphere.position.y = pickSphereHeightOffset
        this.add(this.pickSphere)
        this.createSelectionFrame(pickSphereDiameter, this.pickSphere.position)
    }

    getBoundingSphereCenter(): Vector3 {
        const center = new Vector3()
        new Box3().setFromObject(this.group).getCenter(center)
        return center
    }

    private createSelectionFrame(pickSphereDiameter: number, pickSphereCenter: Vector3) {
        const selectionFrameTextureSize = 128
        const ctx = createContext(selectionFrameTextureSize, selectionFrameTextureSize)
        ctx.fillStyle = '#0f0'
        const strength = Math.round(50 / pickSphereDiameter)
        const length = selectionFrameTextureSize / 6
        ctx.fillRect(0, 0, length, strength)
        ctx.fillRect(0, 0, strength, length)
        ctx.fillRect(selectionFrameTextureSize - length, 0, length, strength)
        ctx.fillRect(selectionFrameTextureSize - strength, 0, strength, length)
        ctx.fillRect(selectionFrameTextureSize - strength, selectionFrameTextureSize - length, strength, length)
        ctx.fillRect(selectionFrameTextureSize - length, selectionFrameTextureSize - strength, length, strength)
        ctx.fillRect(0, selectionFrameTextureSize - strength, length, strength)
        ctx.fillRect(0, selectionFrameTextureSize - length, strength, length)
        const selectionFrameTexture = new CanvasTexture(ctx.canvas as HTMLCanvasElement)
        const selectionMaterial = new SpriteMaterial({map: selectionFrameTexture, depthTest: false})
        this.selectionFrame = new Sprite(selectionMaterial)
        this.selectionFrame.position.copy(pickSphereCenter)
        const selectionFrameSize = pickSphereDiameter * 3 / 4
        this.selectionFrame.scale.set(selectionFrameSize, selectionFrameSize, selectionFrameSize)
        this.selectionFrame.visible = false
        this.add(this.selectionFrame)
    }

}
