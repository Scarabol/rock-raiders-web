import { Camera, Scene, WebGLRenderer, WebGLRendererParameters } from 'three'
import { cancelAnimationFrameSafe, clearIntervalSafe } from '../core/Util'
import { SpriteImage } from '../core/Sprite'

export class BaseRenderer {
    renderer?: WebGLRenderer
    renderInterval: NodeJS.Timeout
    lastAnimationRequest: number
    scene: Scene
    camera: Camera

    constructor(readonly redrawMs: number, readonly canvas: SpriteImage, readonly parameters: WebGLRendererParameters) {
        this.parameters.canvas = canvas
    }

    async startRendering(scene: Scene): Promise<void> {
        this.scene = scene
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        return new Promise<void>((resolve) => {
            this.renderInterval = setInterval(() => {
                if (!this.renderer) {
                    this.renderer = new WebGLRenderer(this.parameters)
                    this.renderer.setSize(this.canvas.width, this.canvas.height)
                }
                this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
                this.lastAnimationRequest = requestAnimationFrame(() => {
                    this.render()
                    resolve()
                })
            }, this.redrawMs)
        })
    }

    render() {
        this.renderer.render(this.scene, this.camera)
    }

    setSize(width: number, height: number) {
        this.canvas.width = width
        this.canvas.height = height
        this.renderer?.setSize(this.canvas.width, this.canvas.height)
    }

    stopRendering() {
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
        this.renderer?.clear()
    }

    dispose() {
        this.stopRendering()
        this.renderer?.dispose()
    }
}
