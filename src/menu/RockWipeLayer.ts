import { ScreenLayer } from '../screen/layer/ScreenLayer'
import { SoundManager } from '../audio/SoundManager'
import { AmbientLight, DirectionalLight, OrthographicCamera, Scene } from 'three'
import { degToRad } from 'three/src/math/MathUtils'
import { clearIntervalSafe } from '../core/Util'
import { NATIVE_UPDATE_INTERVAL } from '../params'
import { AnimationGroup } from '../scene/AnimationGroup'
import { BaseRenderer } from '../screen/BaseRenderer'

export class RockWipeLayer extends ScreenLayer {
    readonly renderer: BaseRenderer
    readonly scene: Scene
    readonly group: AnimationGroup
    readonly camera: OrthographicCamera
    groupUpdateInterval?: NodeJS.Timeout

    constructor() {
        super()
        this.renderer = new BaseRenderer(NATIVE_UPDATE_INTERVAL, this.canvas, {alpha: true})
        // Camera
        const aspect = this.canvas.width / this.canvas.height
        this.camera = new OrthographicCamera(-aspect, aspect, 1, -1, 0, 10)
        this.camera.rotateY(Math.PI)
        this.renderer.camera = this.camera
        this.scene = new Scene()
        // Lights
        // XXX read from LWS file (the original game does not)
        this.scene.add(new AmbientLight(0xffffff, 0.25))
        const light = new DirectionalLight(0xffffff, 1)
        light.position.set(2, 2, -2)
        light.rotation.set(degToRad(35), -degToRad(45), -degToRad(0), 'YXZ')
        this.scene.add(light)
        this.scene.scale.setScalar(1 / 4)
        this.group = new AnimationGroup('Interface/FrontEnd/Rock_Wipe/RockWipe.lws', () => {
            this.hide()
        }).setup()
        this.scene.add(this.group)
    }

    show() {
        super.show()
        this.group.resetAnimation()
        SoundManager.playSfxSound('SFX_RockWipe')
        this.renderer.startRendering(this.scene).then()
        this.groupUpdateInterval = clearIntervalSafe(this.groupUpdateInterval)
        this.groupUpdateInterval = setInterval(() => {
            this.group.update(NATIVE_UPDATE_INTERVAL)
        }, NATIVE_UPDATE_INTERVAL) // XXX Use FPS from LWS data
        return this.group.maxDurationMs
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.renderer.setSize(width, height)
        const aspect = this.canvas.width / this.canvas.height
        this.camera.left = -aspect
        this.camera.right = aspect
        this.camera.updateProjectionMatrix()
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
