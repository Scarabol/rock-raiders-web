import { ScreenLayer } from './ScreenLayer'
import { AmbientLight, Camera, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { cancelAnimationFrameSafe, clearIntervalSafe } from '../../core/Util'
import { CAMERA_FOV, NATIVE_UPDATE_INTERVAL } from '../../params'
import { AnimationLoopGroup } from '../../scene/AnimationLoopGroup'
import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { ShowMissionBriefingEvent } from '../../event/LocalEvents'
import { GameConfig } from '../../cfg/GameConfig'

export class AdvisorLayer extends ScreenLayer { // TODO Almost same as RockWipeLayer
    readonly renderer: WebGLRenderer
    readonly scene: Scene
    readonly camera: Camera
    readonly group: AnimationLoopGroup
    renderInterval: NodeJS.Timeout
    lastAnimationRequest: number

    constructor() {
        super()
        this.renderer = new WebGLRenderer({canvas: this.canvas, alpha: true})
        this.renderer.setSize(this.canvas.width, this.canvas.height)
        this.scene = new Scene()
        this.scene.add(new AmbientLight(0xffffff, 1)) // XXX read from LWS file
        this.camera = new PerspectiveCamera(CAMERA_FOV, 4 / 3, 0.1, 100)

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

        // 510 -> 510 / 640 = 0.80 -> ... => 7.25 // XXX How to derive from numbers in cfg?
        // 340 -> 340 / 480 = 0.71 -> ... => 3.8 // XXX How to derive from numbers in cfg?
        this.camera.position.set(7.25, 3.8, -25)
        this.camera.lookAt(7.25, 3.8, 0)

        this.group = new AnimationLoopGroup(advisorCfg.animFileName, () => {
            this.renderInterval = clearIntervalSafe(this.renderInterval)
            this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
        }).setLoop(advisorCfg.loopStart, advisorCfg.loopEnd).setup()
        this.group.meshList.forEach((m) => m.geometry.scale(-1, 1, 1)) // flip normals
        this.group.scale.x = -1
        this.scene.add(this.group)
        EventBus.registerEventListener(EventKey.SHOW_MISSION_BRIEFING, (event: ShowMissionBriefingEvent) => {
            if (event.isShowing) {
                this.startRendering()
            } else {
                this.group.interruptLoop()
            }
        })
    }

    startRendering() {
        if (!this.group) return
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
        this.group.play()
        // XXX Play SFX for advisor, which seems always null
        this.renderInterval = setInterval(() => {
            this.group.update(NATIVE_UPDATE_INTERVAL)
            this.lastAnimationRequest = requestAnimationFrame(() => {
                this.renderer.render(this.scene, this.camera)
            })
        }, NATIVE_UPDATE_INTERVAL) // XXX Use FPS from LWS data
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.renderer.setSize(width, height)
    }

    dispose() {
        this.hide()
        this.scene.clear()
        this.renderer.dispose()
    }

    hide() {
        super.hide()
        this.group?.stop()
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
    }
}
