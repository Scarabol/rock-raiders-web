import { Camera, Scene, WebGLRenderer, WebGLRendererParameters } from 'three'
import { cancelAnimationFrameSafe, clearIntervalSafe } from '../core/Util'

export class BaseRenderer {
    renderer?: WebGLRenderer
    renderInterval: NodeJS.Timeout
    lastAnimationRequest: number

    constructor(readonly redrawMs: number, readonly canvas: HTMLCanvasElement, readonly parameters: WebGLRendererParameters) {
        this.parameters.canvas = canvas
    }

    startRendering(scene: Scene, camera: Camera) {
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
        this.renderInterval = setInterval(() => {
            if (!this.renderer) {
                this.renderer = new WebGLRenderer({canvas: this.canvas, alpha: true})
                this.renderer.setSize(this.canvas.width, this.canvas.height)
            }
            this.lastAnimationRequest = requestAnimationFrame(() => {
                this.renderer.render(scene, camera)
            })
        }, this.redrawMs)
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
