import { PositionalAudio } from 'three'
import { Sample } from '../../../audio/Sample'
import { SoundManager } from '../../../audio/SoundManager'
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
    activity: BaseActivity = null

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
            entity.sceneEntity.position.y += (TILESIZE / NATIVE_FRAMERATE) / 2
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
            this.sceneEntity.remove(this.animation.polyModel)
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

    playPositionalSample(sample: Sample, loop: boolean = false): PositionalAudio { // TODO duplicate code (see below)
        const audio = new PositionalAudio(this.sceneMgr.listener)
        audio.setRefDistance(TILESIZE * 2)
        audio.loop = loop // TODO retry playing sound for looped ones, when audio context fails
        this.sceneEntity.add(audio)
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
        this.sceneEntity.add(audio)
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
