import { Box3, CanvasTexture, Matrix4, Mesh, MeshBasicMaterial, MeshPhongMaterial, Object3D, Sphere, SphereGeometry, Sprite, SpriteMaterial, Vector3 } from 'three'
import { AnimClip } from './AnimClip'
import { clearTimeoutSafe, iGet } from '../../../core/Util'
import { AnimationEntityType } from './AnimationEntityType'
import { BaseEntity } from '../BaseEntity'
import { AnimSubObj } from './AnimSubObj'
import { createContext } from '../../../core/ImageHelper'
import { BaseActivity } from '../activities/BaseActivity'
import { NATIVE_FRAMERATE, TILESIZE } from '../../../main'
import { EventBus } from '../../../event/EventBus'
import { EntityDeselected } from '../../../event/LocalEvents'
import { AnimEntityActivity } from '../activities/AnimEntityActivity'

export abstract class AnimEntity extends BaseEntity {

    entityType: AnimationEntityType = null
    poly: Object3D[] = []
    animation: AnimClip = null
    animationTimeout: NodeJS.Timeout = null
    selectionFrame: Sprite = null
    pickSphere: Mesh = null
    pickSphereRadius: number = 10 / 2
    carryJoint: Object3D = null
    depositJoint: Object3D = null
    getToolJoint: Object3D = null
    activity: BaseActivity = null
    radiusSq: number = 0

    protected constructor(entityType: AnimationEntityType) {
        super()
        this.entityType = entityType
    }

    beamUp() {
        // TODO avoid all further state changes and mark as unavailable here
        // TODO publish event: check jobs with this target, update power state...
        EventBus.publishEvent(new EntityDeselected())
        this.changeActivity()
        // TODO insert beam animation
        AnimEntity.moveUp(this, 6 * TILESIZE)
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

    changeActivity(activity: AnimEntityActivity = this.getDefaultActivity(), onAnimationDone = null, durationTimeMs: number = null) {
        if (this.activity === activity) return
        this.activity = activity
        let lActivityKey = activity.activityKey.toLowerCase()
        let anim = this.entityType.activities.get(lActivityKey)
        if (!anim) { // find by prefix
            this.entityType.activities.forEach((a, key) => {
                if (!anim && lActivityKey.startsWith(key)) anim = a
            })
        }
        if (!anim?.animation) {
            console.warn('Activity ' + activity.activityKey + ' unknown or has no animation defined')
            console.log(this.entityType.activities)
            return
        }
        this.setAnimation(anim?.animation, onAnimationDone, durationTimeMs)
    }

    private setAnimation(animation: AnimClip, onAnimationDone = null, durationTimeMs = null) {
        if (onAnimationDone) onAnimationDone.bind(this)
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
            if (body.name) {
                const lBodyName = body.name.toLowerCase()
                if (lBodyName === this.entityType.carryNullName?.toLowerCase()) {
                    this.carryJoint = polyModel
                    if (carries.length > 0) this.carryJoint.add(...carries)
                } else if (lBodyName === this.entityType.depositNullName?.toLowerCase()) {
                    this.depositJoint = polyModel
                } else if (lBodyName === this.entityType.toolNullName?.toLowerCase()) {
                    this.getToolJoint = polyModel
                }
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
        const sphere = new Sphere()
        new Box3().setFromObject(this.group).getBoundingSphere(sphere)
        this.radiusSq = sphere.radius * sphere.radius
        this.animate(0, onAnimationDone, durationTimeMs)
    }

    private animate(frameIndex, onAnimationDone, durationTimeMs) {
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
                        mat.transparent = material.opacity < 1
                    })
                }
            }
        })
        this.animationTimeout = clearTimeoutSafe(this.animationTimeout)
        let nextFrame = frameIndex + 1
        if (nextFrame <= this.animation.lastFrame || !onAnimationDone || (durationTimeMs !== null && durationTimeMs > 0)) {
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

    getDefaultActivity(): AnimEntityActivity {
        return AnimEntityActivity.Stand
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
