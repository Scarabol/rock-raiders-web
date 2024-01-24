import { Camera, Scene, WebGLRenderer } from 'three'
import { DebugHelper } from '../screen/DebugHelper'
import { SpriteImage } from '../core/Sprite'
import { cancelAnimationFrameSafe, clearIntervalSafe } from '../core/Util'
import { cloneContext } from '../core/ImageHelper'

export class SceneRenderer extends WebGLRenderer {
    readonly debugHelper: DebugHelper
    readonly maxFps: number = 30 // animations and videos have 25 fps (PAL)
    camera: Camera
    renderInterval: NodeJS.Timeout
    lastAnimationRequest: number
    screenshotCallback: (canvas: HTMLCanvasElement) => any

    constructor(canvas: SpriteImage) {
        super({antialias: true, canvas: canvas, powerPreference: 'high-performance'})
        // this.shadowMap.enabled = true // XXX enable shadows here
        // this.shadowMap.type = PCFSoftShadowMap // XXX set shadow quality here
        this.debugHelper = new DebugHelper()
    }

    async startRendering(scene: Scene): Promise<void> {
        return new Promise<void>((resolve) => {
            this.debugHelper.show()
            this.renderInterval = clearIntervalSafe(this.renderInterval)
            this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
            this.renderInterval = setInterval(() => {
                this.lastAnimationRequest = requestAnimationFrame(() => {
                    this.debugHelper.onRenderStart()
                    this.render(scene, this.camera)
                    this.debugHelper.onRenderDone()
                    resolve()
                    this.checkForScreenshot()
                })
            }, 1000 / this.maxFps)
        })
    }

    private checkForScreenshot() {
        if (!this.screenshotCallback) return
        const callback = this.screenshotCallback
        this.screenshotCallback = null
        this.domElement.toBlob((blob) => {
            const img = document.createElement('img')
            img.onload = () => {
                const context = cloneContext(this.domElement)
                context.drawImage(img, 0, 0)
                callback(context.canvas)
            }
            img.src = URL.createObjectURL(blob)
        })
    }

    stopRendering() {
        this.dispose()
        this.debugHelper.hide()
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
    }
}
