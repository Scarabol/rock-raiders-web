import { Camera, Scene, WebGLRenderer } from 'three'
import { DebugHelper } from '../screen/DebugHelper'
import { SpriteImage } from '../core/Sprite'
import { cancelAnimationFrameSafe, clearIntervalSafe } from '../core/Util'
import { cloneContext } from '../core/ImageHelper'

export class SceneRenderer extends WebGLRenderer {
    readonly debugHelper: DebugHelper = new DebugHelper()
    readonly maxFps: number = 30 // animations have only 25 fps
    renderInterval: NodeJS.Timeout
    lastAnimationRequest: number
    screenshotCallback: (canvas: HTMLCanvasElement) => any

    constructor(canvas: SpriteImage, readonly camera: Camera) {
        super({antialias: true, canvas: canvas})
    }

    startRendering(scene: Scene) {
        this.debugHelper.show()
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
        this.renderInterval = setInterval(() => {
            this.lastAnimationRequest = requestAnimationFrame(() => {
                this.debugHelper.renderStart()
                this.render(scene, this.camera)
                this.debugHelper.renderDone()
                this.checkForScreenshot()
            })
        }, 1000 / this.maxFps)
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

    dispose() {
        super.dispose()
        this.debugHelper.hide()
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
    }
}
