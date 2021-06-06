import { AudioListener, Group, PositionalAudio } from 'three'
import { SoundManager } from '../../../audio/SoundManager'
import { getPath } from '../../../core/Util'
import { TILESIZE } from '../../../params'
import { LWSCLoader } from '../../../resource/LWSCLoader'
import { ResourceManager } from '../../../resource/ResourceManager'
import { AnimClip } from './AnimClip'

export class AnimationGroup extends Group {

    animation: AnimClip

    constructor(lwsFilepath: string, audioListener: AudioListener) {
        super()
        const content = ResourceManager.getResource(lwsFilepath)
        this.animation = new LWSCLoader(getPath(lwsFilepath), false).parse(content)
        this.animation.bodies.forEach((body) => {
            const polyModel = body.model.clone()
            this.animation.polyList.push(polyModel)
            if (body.lowerName && body.isNull) {
                this.animation.nullJoints.getOrUpdate(body.lowerName.toLowerCase(), () => []).push(polyModel)
            }
            if (body.sfxName) {
                const audio = new PositionalAudio(audioListener)
                audio.setRefDistance(TILESIZE * 6) // TODO optimize ref distance for SFX sounds
                audio.loop = false
                polyModel.add(audio)
                SoundManager.getSoundBuffer(body.sfxName).then((audioBuffer) => audio.setBuffer(audioBuffer))
                body.sfxFrames.forEach((frame) => this.animation.sfxAudioByFrame.getOrUpdate(frame, () => []).push(audio))
            }
        })

        this.animation.bodies.forEach((body, index) => { // not all bodies may have been added in first iteration
            const polyPart = this.animation.polyList[index]
            const parentInd = body.parentObjInd
            if (parentInd !== undefined && parentInd !== null) { // can be 0
                this.animation.polyList[parentInd].add(polyPart)
            } else {
                this.animation.polyModel.add(polyPart)
            }
        })

        this.add(this.animation.polyModel)
    }

    startAnimation(onAnimationDone) {
        this.animation.start(onAnimationDone, null)
    }

    update(elapsedMs: number) {
        this.animation.update(elapsedMs)
    }

}
