import { Box3, CanvasTexture, Matrix4, Mesh, MeshBasicMaterial, MeshPhongMaterial, Object3D, PositionalAudio, Sphere, SphereGeometry, Sprite, SpriteMaterial, Vector3 } from 'three'
import { Sample } from '../../../audio/Sample'
import { SoundManager } from '../../../audio/SoundManager'
import { createContext } from '../../../core/ImageHelper'
import { clearTimeoutSafe } from '../../../core/Util'
import { EventBus } from '../../../event/EventBus'
import { SelectionChanged } from '../../../event/LocalEvents'
import { NATIVE_FRAMERATE, TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { BaseActivity } from '../activities/BaseActivity'
import { BaseEntity } from '../BaseEntity'
import { EntitySuperType, EntityType } from '../EntityType'
import { AnimationEntityType } from './AnimationEntityType'
import { AnimClip } from './AnimClip'
import { AnimSubObj } from './AnimSubObj'

export abstract class AnimEntity extends BaseEntity {

    animationEntityType: AnimationEntityType = null
    poly: Object3D[] = []
    animation: AnimClip = null
    animationTimeout: NodeJS.Timeout = null
    selectionFrame: Sprite = null
    pickSphere: Mesh = null
    carryJoint: Object3D = null
    depositJoint: Object3D = null
    getToolJoint: Object3D = null
    activity: BaseActivity = null
    radiusSq: number = 0

    protected constructor(worldMgr: WorldManager, sceneMgr: SceneManager, superType: EntitySuperType, entityType: EntityType, aeFilename: string) {
        super(worldMgr, sceneMgr, superType, entityType)
        if (aeFilename) this.animationEntityType = ResourceManager.getAnimationEntityType(aeFilename)
    }

    beamUp() {
        EventBus.publishEvent(new SelectionChanged())
        this.changeActivity()
        // TODO insert beam animation
        AnimEntity.moveUp(this, 6 * TILESIZE)
        this.playPositionalSample(Sample.SND_TeleUp)
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

    changeActivity(activity: AnimEntityActivity = this.getDefaultActivity(), onAnimationDone: () => any = null, durationTimeMs: number = null) {
        if (this.activity === activity || this.animationEntityType === null) return
        this.activity = activity
        const lActivityKey = activity.activityKey.toLowerCase()
        let animation = this.animationEntityType.animations.get(lActivityKey)
        if (!animation) { // find by prefix
            this.animationEntityType.animations.forEach((a, key) => {
                if (!animation && lActivityKey.startsWith(key)) animation = a
            })
        }
        if (!animation) {
            console.warn('Activity ' + activity.activityKey + ' unknown or has no animation defined')
            console.log(this.animationEntityType.animations)
            return
        }
        if (onAnimationDone) onAnimationDone.bind(this)
        this.animation = animation
        this.animationTimeout = clearTimeoutSafe(this.animationTimeout)
        this.group.remove(...this.poly)
        this.poly = []
        const carries = (this.carryJoint && this.carryJoint.children) || []
        this.carryJoint = null
        // bodies are defined in animation and second in high/medium/low poly groups
        this.animation.bodies.forEach((body) => { // TODO this can be prepared before animation.bodies and joints are part of animationEntityType
            let model: Object3D = this.animationEntityType.highPolyBodies.get(body.lowerName)
            if (!model) model = this.animationEntityType.mediumPolyBodies.get(body.lowerName)
            if (!model) model = body.model
            const polyModel = model.clone(true)
            this.poly.push(polyModel)
            if (body.lowerName) {
                if (body.lowerName.equalsIgnoreCase(this.animationEntityType.carryNullName)) {
                    this.carryJoint = polyModel
                    if (carries.length > 0) this.carryJoint.add(...carries)
                } else if (body.lowerName.equalsIgnoreCase(this.animationEntityType.depositNullName)) {
                    this.depositJoint = polyModel
                } else if (body.lowerName.equalsIgnoreCase(this.animationEntityType.toolNullName)) {
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

    private animate(frameIndex: number, onAnimationDone: () => any, durationTimeMs: number) {
        if (this.poly.length !== this.animation.bodies.length) throw 'Cannot animate poly. Length differs from bodies length'
        this.animation.bodies.forEach((body: AnimSubObj, index) => {
            const p = this.poly[index]
            p.position.copy(body.relPos[frameIndex]).sub(body.pivot)
            p.rotation.copy(body.relRot[frameIndex])
            p.scale.copy(body.relScale[frameIndex])
            if (p.hasOwnProperty('material')) {
                const material = p['material']
                const opacity = body.opacity[frameIndex]
                if (material && opacity !== undefined) {
                    const matArr = Array.isArray(material) ? material : [material]
                    matArr.forEach((mat: MeshPhongMaterial) => {
                        mat.opacity = opacity
                        mat.transparent = mat.transparent || mat.opacity < 1
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

    createPickSphere() { // TODO move trigger into changeActivity?
        if (this.pickSphere) return
        const pickSphereDiameter = this.stats.PickSphere
        const pickSphereRadius = pickSphereDiameter / 2
        const geometry = new SphereGeometry(pickSphereRadius, pickSphereRadius, pickSphereRadius)
        const material = new MeshBasicMaterial({color: 0xffff00, visible: false}) // change visible to true for debugging
        this.pickSphere = new Mesh(geometry, material)
        this.pickSphere.userData = {selectable: this}
        const pickSphereCenter = this.getPickSphereCenter()
        this.pickSphere.position.copy(pickSphereCenter)
        this.group.add(this.pickSphere)
        this.createSelectionFrame(pickSphereDiameter, pickSphereCenter)
    }

    getPickSphereCenter(): Vector3 {
        const center = new Vector3()
        new Box3().setFromObject(this.group).getCenter(center)
        center.sub(this.group.position)
        center.applyMatrix4(new Matrix4().makeScale(-1, 1, 1))
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
        this.group.add(this.selectionFrame)
    }

    playPositionalSample(sample: Sample, loop: boolean = false): PositionalAudio { // TODO duplicate code (see below)
        const audio = new PositionalAudio(this.sceneMgr.listener)
        audio.setRefDistance(TILESIZE * 2)
        audio.loop = loop // TODO retry playing sound for looped ones, when audio context fails
        this.group.add(audio)
        SoundManager.getSampleBuffer(sample).then((audioBuffer) => {
            audio.setBuffer(audioBuffer).play()
            // TODO if (!loop) remove audio node from group, when done
        })
        return audio
    }

    playPositionalSfxName(sfxName: string, loop: boolean = false): PositionalAudio { // TODO duplicate code (see above)
        const audio = new PositionalAudio(this.sceneMgr.listener)
        audio.setRefDistance(TILESIZE * 2)
        audio.loop = loop // TODO retry playing sound for looped ones, when audio context fails
        this.group.add(audio)
        SoundManager.getSound(sfxName).then((audioBuffer) => {
            audio.setBuffer(audioBuffer).play()
            // TODO if (!loop) remove audio node from group, when done
        })
        return audio
    }

    removeFromScene() {
        super.removeFromScene()
        this.animationTimeout = clearTimeoutSafe(this.animationTimeout)
    }

}
