import { Box3, CanvasTexture, Mesh, MeshBasicMaterial, PositionalAudio, Sphere, SphereGeometry, Sprite, SpriteMaterial, Vector3 } from 'three'
import { Sample } from '../../../audio/Sample'
import { SoundManager } from '../../../audio/SoundManager'
import { createContext } from '../../../core/ImageHelper'
import { EventBus } from '../../../event/EventBus'
import { SelectionChanged } from '../../../event/LocalEvents'
import { NATIVE_FRAMERATE, TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { BaseActivity } from '../activities/BaseActivity'
import { BaseEntity } from '../BaseEntity'
import { EntityType } from '../EntityType'
import { AnimationEntityType } from './AnimationEntityType'
import { AnimClip } from './AnimClip'

export abstract class AnimEntity extends BaseEntity {

    animationEntityType: AnimationEntityType = null
    animation: AnimClip = null
    selectionFrame: Sprite = null
    pickSphere: Mesh = null
    activity: BaseActivity = null
    boundingSphere: Sphere = new Sphere()

    protected constructor(worldMgr: WorldManager, sceneMgr: SceneManager, entityType: EntityType, aeFilename: string) {
        super(worldMgr, sceneMgr, entityType)
        if (aeFilename) this.animationEntityType = ResourceManager.getAnimationEntityType(aeFilename, sceneMgr.listener)
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
        if (this.animation) {
            this.group.remove(this.animation.polyModel)
            this.animation.stop()
        }
        const carriedChildren = this.animation?.carryJoint?.children
        if (carriedChildren && carriedChildren.length > 0 && animation.carryJoint) {
            animation.carryJoint.add(...carriedChildren) // keep carried children
        }
        this.animation = animation
        this.sceneEntity.add(this.animation.polyModel)
        this.animation.animate(0, onAnimationDone, durationTimeMs)
    }

    getDefaultActivity(): AnimEntityActivity {
        return AnimEntityActivity.Stand
    }

    createPickSphere(pickSphereDiameter: number) { // TODO Refactor this is always triggered after changeActivity is called for the first time
        if (this.pickSphere) return
        const pickSphereRadius = pickSphereDiameter / 2
        const geometry = new SphereGeometry(pickSphereRadius, pickSphereRadius, pickSphereRadius)
        const material = new MeshBasicMaterial({color: 0xffff00, visible: false}) // change visible to true for debugging
        this.pickSphere = new Mesh(geometry, material)
        this.pickSphere.userData = {selectable: this}
        this.pickSphere.position.y = this.getPickSphereHeightOffset()
        this.group.add(this.pickSphere)
        this.createSelectionFrame(pickSphereDiameter, this.pickSphere.position)
    }

    getPickSphereHeightOffset(): number {
        const center = new Vector3()
        new Box3().setFromObject(this.group).getCenter(center)
        return center.y - this.group.position.y
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
        if (!sfxName) return null
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
        this.animation?.stop()
    }

    getSpeed(): number {
        return this.animation?.transcoef || 1
    }

}
