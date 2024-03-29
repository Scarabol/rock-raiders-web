import { ScreenLayer } from '../screen/layer/ScreenLayer'
import { SoundManager } from '../audio/SoundManager'
import { Sample } from '../audio/Sample'
import { AmbientLight, OrthographicCamera, Scene } from 'three'
import { clearIntervalSafe } from '../core/Util'
import { NATIVE_UPDATE_INTERVAL } from '../params'
import { AnimationGroup } from '../scene/AnimationGroup'
import { BaseRenderer } from '../screen/BaseRenderer'

export class RockWipeLayer extends ScreenLayer {
    readonly renderer: BaseRenderer
    readonly scene: Scene
    readonly camera: OrthographicCamera
    readonly group: AnimationGroup
    groupUpdateInterval: NodeJS.Timeout

    constructor() {
        super()
        this.renderer = new BaseRenderer(NATIVE_UPDATE_INTERVAL, this.canvas, {alpha: true})
        this.scene = new Scene()
        this.scene.add(new AmbientLight(0xffffff, 0.25)) // XXX read from LWS file
        this.scene.scale.setScalar(1 / 4)
        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
        this.camera.position.set(0, 0, 10)
        this.camera.lookAt(0, 0, 0)
        this.group = new AnimationGroup('Interface/FrontEnd/Rock_Wipe/RockWipe.lws', () => {
            this.hide()
        }).setup()
        this.scene.add(this.group)
    }

    show() {
        super.show()
        this.group.resetAnimation()
        SoundManager.playSample(Sample.SFX_RockWipe, false)
        this.renderer.startRendering(this.scene, this.camera)
        this.groupUpdateInterval = clearIntervalSafe(this.groupUpdateInterval)
        this.groupUpdateInterval = setInterval(() => {
            this.group.update(NATIVE_UPDATE_INTERVAL)
        }, NATIVE_UPDATE_INTERVAL) // XXX Use FPS from LWS data
        return this.group.maxDurationMs
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.renderer.setSize(width, height)
    }

    hide() {
        super.hide()
        this.groupUpdateInterval = clearIntervalSafe(this.groupUpdateInterval)
        this.group.resetAnimation()
        this.renderer.stopRendering()
    }

    dispose() {
        this.hide()
        this.scene.clear()
        this.renderer.dispose()
    }
}
