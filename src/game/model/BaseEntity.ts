import { PositionalAudio, Vector2 } from 'three'
import { Sample } from '../../audio/Sample'
import { SoundManager } from '../../audio/SoundManager'
import { EventBus } from '../../event/EventBus'
import { DeselectAll } from '../../event/LocalEvents'
import { NATIVE_FRAMERATE, TILESIZE } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'
import { SceneEntity } from '../../scene/SceneEntity'
import { SceneManager } from '../SceneManager'
import { WorldManager } from '../WorldManager'
import { AnimEntityActivity } from './activities/AnimEntityActivity'
import { BaseActivity } from './activities/BaseActivity'
import { AnimationEntityType } from './anim/AnimationEntityType'
import { AnimClip } from './anim/AnimClip'
import { EntityType } from './EntityType'
import { Surface } from './map/Surface'

export abstract class BaseEntity {

    worldMgr: WorldManager
    sceneMgr: SceneManager

    sceneEntity: SceneEntity = new SceneEntity()

    entityType: EntityType = null
    floorOffset: number = 0.1

    animationEntityType: AnimationEntityType = null
    animation: AnimClip = null
    activity: BaseActivity = null

    protected constructor(worldMgr: WorldManager, sceneMgr: SceneManager, entityType: EntityType, aeFilename: string) {
        this.worldMgr = worldMgr
        this.sceneMgr = sceneMgr
        this.entityType = entityType
        if (aeFilename) this.animationEntityType = ResourceManager.getAnimationEntityType(aeFilename, sceneMgr.listener)
    }

    getPosition() {
        return this.sceneEntity.position.clone()
    }

    getPosition2D() {
        return new Vector2(this.sceneEntity.position.x, this.sceneEntity.position.z)
    }

    getHeading(): number {
        return this.sceneEntity.getHeading()
    }

    onDiscover() {
        this.sceneEntity.visible = true
    }

    addToScene(worldPosition: Vector2, radHeading: number) {
        if (worldPosition) {
            this.sceneEntity.position.copy(this.sceneMgr.getFloorPosition(worldPosition))
            this.sceneEntity.position.y += this.floorOffset
        }
        if (radHeading !== undefined && radHeading !== null) {
            this.sceneEntity.setHeading(radHeading)
        }
        this.sceneEntity.visible = this.surfaces.some((s) => s.discovered)
        this.sceneMgr.scene.add(this.sceneEntity.group)
    }

    removeFromScene() {
        this.sceneMgr.scene.remove(this.sceneEntity.group)
        this.animation?.stop()
    }

    get surfaces(): Surface[] {
        return [this.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position)]
    }

    beamUp() {
        EventBus.publishEvent(new DeselectAll())
        this.changeActivity()
        // TODO insert beam animation
        BaseEntity.moveUp(this, 6 * TILESIZE)
        this.playPositionalAudio(Sample[Sample.SND_TeleUp], false)
    }

    private static moveUp(entity: BaseEntity, counter: number) {
        if (counter > 0) {
            counter--
            entity.sceneEntity.position.y += (TILESIZE / NATIVE_FRAMERATE) / 2
            setTimeout(() => BaseEntity.moveUp(entity, counter), 1000 / NATIVE_FRAMERATE)
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

    playPositionalAudio(sfxName: string, loop: boolean): PositionalAudio {
        const audio = new PositionalAudio(this.sceneMgr.listener)
        audio.setRefDistance(TILESIZE * 2)
        audio.loop = loop
        this.sceneEntity.add(audio)
        SoundManager.getSoundBuffer(sfxName).then((audioBuffer) => {
            audio.setBuffer(audioBuffer).play() // TODO retry playing sound for looped ones, when audio context fails
            if (!audio.loop) audio.onEnded = () => this.sceneEntity.remove(audio)
        }).catch(() => {
            this.sceneEntity.remove(audio)
        })
        return audio
    }

    getSpeed(): number {
        return this.animation?.transcoef || 1
    }
}
