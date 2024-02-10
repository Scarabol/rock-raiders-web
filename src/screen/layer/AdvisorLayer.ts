import { ScreenLayer } from './ScreenLayer'
import { AmbientLight, DoubleSide, PerspectiveCamera, Scene } from 'three'
import { CAMERA_FOV, NATIVE_UPDATE_INTERVAL } from '../../params'
import { AnimationLoopGroup } from '../../scene/AnimationLoopGroup'
import { EventKey } from '../../event/EventKeyEnum'
import { ShowMissionAdvisorEvent, ShowMissionBriefingEvent } from '../../event/LocalEvents'
import { GameConfig } from '../../cfg/GameConfig'
import { EventBroker } from '../../event/EventBroker'
import { BaseRenderer } from '../BaseRenderer'
import { clearIntervalSafe } from '../../core/Util'
import { SaveGameManager } from '../../resource/SaveGameManager'

export class AdvisorLayer extends ScreenLayer {
    readonly renderer: BaseRenderer
    readonly scene: Scene
    readonly group: AnimationLoopGroup
    groupUpdateInterval: NodeJS.Timeout

    constructor() {
        super()
        this.ratio = SaveGameManager.currentPreferences.screenRatioFixed
        this.renderer = new BaseRenderer(NATIVE_UPDATE_INTERVAL, this.canvas, {alpha: true})
        this.renderer.camera = new PerspectiveCamera(CAMERA_FOV, 4 / 3, 0.1, 100)
        // 510 -> 510 / 640 = 0.80 -> ... => 7.25 // XXX How to derive from numbers in cfg?
        // 340 -> 340 / 480 = 0.71 -> ... => 3.8 // XXX How to derive from numbers in cfg?
        this.renderer.camera.position.set(7.25, 3.8, -25)
        this.renderer.camera.lookAt(7.25, 3.8, 0)
        this.scene = new Scene()
        this.scene.add(new AmbientLight(0xffffff, 1)) // XXX read from LWS file

        const advisorPosCfg = GameConfig.instance.advisorPositions640x480.get('Advisor_Objective'.toLowerCase())
        if (!advisorPosCfg) {
            console.warn('Advisor position config for mission objective not found')
            return
        }
        const advisorCfg = GameConfig.instance.advisor.get(advisorPosCfg.advisorType.toLowerCase())
        if (!advisorCfg) {
            console.warn('Advisor config for mission objective not found', advisorPosCfg)
            return
        }

        this.group = new AnimationLoopGroup(advisorCfg.animFileName, () => {
            this.renderer.stopRendering()
        }).setLoop(advisorCfg.loopStart, advisorCfg.loopEnd).setup()
        this.group.meshList.forEach((m) => m.getMaterials().forEach((m) => m.side = DoubleSide)) // otherwise flipped normals
        this.scene.add(this.group)
        EventBroker.subscribe(EventKey.SHOW_MISSION_BRIEFING, (event: ShowMissionBriefingEvent) => {
            if (event.isShowing) {
                this.startRendering()
            } else {
                this.group.interruptLoop()
            }
        })
        EventBroker.subscribe(EventKey.SHOW_MISSION_ADVISOR, (event: ShowMissionAdvisorEvent) => {
            if (event.showAdvisor) {
                this.startRendering()
            } else {
                this.group.interruptLoop()
            }
        })
    }

    startRendering() {
        if (!this.group) return
        this.group.play()
        // XXX Play SFX for advisor, which seems always null
        this.renderer.startRendering(this.scene).then()
        this.groupUpdateInterval = clearIntervalSafe(this.groupUpdateInterval)
        this.groupUpdateInterval = setInterval(() => {
            this.group.update(NATIVE_UPDATE_INTERVAL)
        }, NATIVE_UPDATE_INTERVAL)
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.renderer.setSize(width, height)
    }

    hide() {
        super.hide()
        this.groupUpdateInterval = clearIntervalSafe(this.groupUpdateInterval)
        this.group?.resetAnimation()
        this.renderer.stopRendering()
    }

    dispose() {
        this.hide()
        this.scene.clear()
        this.renderer.dispose()
    }
}
