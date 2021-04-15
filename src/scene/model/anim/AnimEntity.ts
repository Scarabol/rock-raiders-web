import { Box3, CanvasTexture, Matrix4, Mesh, MeshBasicMaterial, MeshPhongMaterial, Object3D, SphereGeometry, Sprite, SpriteMaterial, Vector3 } from 'three'
import { AnimClip } from './AnimClip'
import { clearTimeoutSafe, iGet } from '../../../core/Util'
import { AnimationEntityType } from './AnimationEntityType'
import { BaseEntity } from '../BaseEntity'
import { AnimSubObj } from './AnimSubObj'
import { createContext } from '../../../core/ImageHelper'
import { BaseActivity } from '../activities/BaseActivity'
import { BuildingActivity } from '../activities/BuildingActivity'
import { NATIVE_FRAMERATE, TILESIZE } from '../../../main'
import { EventBus } from '../../../event/EventBus'
import { EntityDeselected } from '../../../event/LocalEvents'

export abstract class AnimEntity extends BaseEntity {

    entityType: AnimationEntityType = null
    poly: Object3D[] = []
    animation: AnimClip = null
    animationTimeout: NodeJS.Timeout = null
    selectionFrame: Sprite = null
    pickSphere: Mesh = null
    pickSphereRadius: number = 10 / 2
    carryJoint: Object3D = null
    activity: BaseActivity = null

    protected constructor(entityType: AnimationEntityType) {
        super()
        this.entityType = entityType
    }

    beamUp() {
        // TODO avoid all further state changes and mark as unavailable here
        // TODO publish event: check jobs with this target, update power state...
        EventBus.publishEvent(new EntityDeselected())
        this.setActivity(BuildingActivity.Stand, () => { // TODO drop stuff, resources in process, ect.
            // TODO insert beam animation
            AnimEntity.moveUp(this, 6 * TILESIZE)
        })
    }

    private static moveUp(entity: AnimEntity, counter: number) {
        if (counter > 0) {
            counter--
            entity.group.position.y += (TILESIZE / NATIVE_FRAMERATE) / 2
            setTimeout(() => AnimEntity.moveUp(entity, counter), 1000 / NATIVE_FRAMERATE)
        } else {
            entity.removeFromScene()
        }
    }

    removeFromScene() {
        this.worldMgr.sceneManager.scene.remove(this.group)
    }

    changeActivity(activity: BaseActivity, onChangeDone = null, durationTimeMs: number = null) {
        if (onChangeDone) onChangeDone.bind(this)
        if (this.activity !== activity) {
            this.activity = activity
            this.setActivity(this.activity, onChangeDone, durationTimeMs)
        }
    }

    setActivity(activity: BaseActivity, onAnimationDone = null, durationTimeMs = null) {
        let activityKey = activity.activityKey
        let act = this.entityType.activities.get(activityKey.toLowerCase())
        if (!act) { // find by prefix
            this.entityType.activities.forEach((a, key) => {
                if (activityKey.toLowerCase().startsWith(key)) {
                    act = a
                }
            })
        }
        if (!act?.animation) {
            console.warn('Activity ' + activityKey + ' unknown or has no animation defined yet')
            console.log(this.entityType.activities)
            return
        }
        this.setAnimation(act?.animation, onAnimationDone, durationTimeMs)
    }

    setAnimation(animation: AnimClip, onAnimationDone = null, durationTimeMs = null) {
        this.animation = animation
        this.animation.looping = true
        this.animationTimeout = clearTimeoutSafe(this.animationTimeout)
        this.group.remove(...this.poly)
        this.poly = []
        const carries = (this.carryJoint && this.carryJoint.children) || []
        this.carryJoint = null
        // bodies are defined in animation and second in high/medium/low poly groups
        this.animation.bodies.forEach((body) => {
            let model: Object3D = iGet(this.entityType.highPoly, body.name)
            if (!model) model = iGet(this.entityType.mediumPoly, body.name)
            if (!model) model = body.model
            const polyModel = model.clone(true)
            this.poly.push(polyModel)
            if (this.entityType.carryNullName && body.name && this.entityType.carryNullName.toLowerCase() === body.name.toLowerCase()) {
                this.carryJoint = polyModel
                if (carries.length > 0) this.carryJoint.add(...carries)
            }
        })
        this.animation.bodies.forEach((body, index) => { // not all bodies may have been added in first iteration
            const polyPart = this.poly[index]
            const parentInd = body.parentObjInd
            if (parentInd !== undefined && parentInd !== null) { // can be 0
                this.poly[parentInd].add(polyPart)
            } else {
                this.group.add(polyPart)
            }
        })
        this.animate(0, onAnimationDone, durationTimeMs)
    }

    animate(frameIndex, onAnimationDone, durationTimeMs) {
        if (this.poly.length !== this.animation.bodies.length) throw 'Cannot animate poly. Length differs from bodies length'
        this.animation.bodies.forEach((body: AnimSubObj, index) => {
            const p = this.poly[index]
            p.position.copy(body.relPos[frameIndex])
            p.rotation.copy(body.relRot[frameIndex])
            p.scale.copy(body.relScale[frameIndex])
            if (p.hasOwnProperty('material')) {
                const material = p['material']
                const opacity = body.opacity[frameIndex]
                if (material && opacity !== undefined) {
                    const matArr = Array.isArray(material) ? material : [material]
                    matArr.forEach((mat: MeshPhongMaterial) => {
                        mat.opacity = opacity
                        mat.transparent = true
                        mat.alphaTest = 0
                    })
                }
            }
        })
        this.animationTimeout = clearTimeoutSafe(this.animationTimeout)
        let nextFrame = frameIndex + 1
        if (nextFrame <= this.animation.lastFrame || (!onAnimationDone || (durationTimeMs !== null && durationTimeMs > 0))) {
            if (nextFrame > this.animation.lastFrame) {
                nextFrame = this.animation.firstFrame
            }
            const standardDurationTimeMs = 1000 / this.animation.framesPerSecond * this.animation.transcoef
            if (durationTimeMs !== null) durationTimeMs -= standardDurationTimeMs
            const that = this
            const timeoutTimeMs = durationTimeMs !== null ? Math.max(0, Math.min(durationTimeMs, standardDurationTimeMs)) : standardDurationTimeMs
            this.animationTimeout = setTimeout(() => that.animate(nextFrame, onAnimationDone, durationTimeMs), timeoutTimeMs) // TODO get this in sync with threejs
        } else if (onAnimationDone) {
            onAnimationDone()
        }
    }

    createPickSphere() {
        if (this.pickSphere) return
        const pickSphereCenter = this.getPickSphereCenter()
        const geometry = new SphereGeometry(this.pickSphereRadius, this.pickSphereRadius, this.pickSphereRadius)
        const material = new MeshBasicMaterial({color: 0xffff00, visible: false}) // change visible to true for debugging
        this.pickSphere = new Mesh(geometry, material)
        this.pickSphere.userData = {selectable: this}
        this.pickSphere.position.copy(pickSphereCenter)
        this.group.add(this.pickSphere)
        this.createSelectionFrame(pickSphereCenter)
    }

    getPickSphereCenter(): Vector3 {
        return this.getBoundingBoxCenter()
    }

    getBoundingBoxCenter() {
        const center = new Vector3()
        new Box3().setFromObject(this.group).getCenter(center)
        center.sub(this.group.position)
        center.applyMatrix4(new Matrix4().makeScale(-1, 1, 1))
        return center
    }

    private createSelectionFrame(pickSphereCenter: Vector3) {
        const selectionFrameTextureSize = 128
        const ctx = createContext(selectionFrameTextureSize, selectionFrameTextureSize)
        ctx.fillStyle = '#0f0'
        const strength = Math.round(25 / this.pickSphereRadius)
        const length = selectionFrameTextureSize / 6
        ctx.fillRect(0, 0, length, strength)
        ctx.fillRect(0, 0, strength, length)
        ctx.fillRect(selectionFrameTextureSize - length, 0, length, strength)
        ctx.fillRect(selectionFrameTextureSize - strength, 0, strength, length)
        ctx.fillRect(selectionFrameTextureSize - strength, selectionFrameTextureSize - length, strength, length)
        ctx.fillRect(selectionFrameTextureSize - length, selectionFrameTextureSize - strength, length, strength)
        ctx.fillRect(0, selectionFrameTextureSize - strength, length, strength)
        ctx.fillRect(0, selectionFrameTextureSize - length, strength, length)
        const selectionFrameTexture = new CanvasTexture(ctx.canvas)
        const selectionMaterial = new SpriteMaterial({map: selectionFrameTexture, depthTest: false})
        this.selectionFrame = new Sprite(selectionMaterial)
        this.selectionFrame.position.copy(pickSphereCenter)
        const selectionFrameSize = this.pickSphereRadius * 2
        this.selectionFrame.scale.set(selectionFrameSize, selectionFrameSize, selectionFrameSize)
        this.selectionFrame.visible = false
        this.group.add(this.selectionFrame)
    }

}
