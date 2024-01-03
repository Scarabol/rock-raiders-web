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
        this.show()
    }

    playOnce() {
        const group = new AnimationGroup('Interface/FrontEnd/Rock_Wipe/RockWipe.lws', () => {
            this.scene.remove(group)
            group.dispose()
            if (this.scene.children.length < 2) this.stopRendering() // ambient light is always a child
        }, null).start(null)
        this.scene.add(group)
        SoundManager.playSample(Sample.SFX_RockWipe, false)
        this.renderInterval = setInterval(() => {
            group.update(NATIVE_UPDATE_INTERVAL)
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
        this.stopRendering()
        this.scene.clear()
        this.renderer.dispose()
    }

    hide() {
        super.hide()
        this.stopRendering()
    }

    private stopRendering() {
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
    }
}
