import { ScreenLayer } from '../screen/layer/ScreenLayer'
import { SoundManager } from '../audio/SoundManager'
import { Sample } from '../audio/Sample'
import { AmbientLight, OrthographicCamera, Scene, WebGLRenderer } from 'three'
import { cancelAnimationFrameSafe, clearIntervalSafe } from '../core/Util'
import { NATIVE_UPDATE_INTERVAL } from '../params'
import { AnimationGroup } from '../scene/AnimationGroup'

export class RockWipeLayer extends ScreenLayer {
    readonly renderer: WebGLRenderer
    readonly scene: Scene
    readonly camera: OrthographicCamera
    readonly group: AnimationGroup
    renderInterval: NodeJS.Timeout
    lastAnimationRequest: number

    constructor() {
        super()
        this.renderer = new WebGLRenderer({canvas: this.canvas, alpha: true})
        this.renderer.setSize(this.canvas.width, this.canvas.height)
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
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
        this.group.play()
        SoundManager.playSample(Sample.SFX_RockWipe, false)
        this.renderInterval = setInterval(() => {
            this.group.update(NATIVE_UPDATE_INTERVAL)
            this.lastAnimationRequest = requestAnimationFrame(() => {
                this.renderer.render(this.scene, this.camera)
            })
        }, NATIVE_UPDATE_INTERVAL) // XXX Use FPS from LWS data
        return this.group.maxDurationMs
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
        this.group.stop()
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
    }
}
