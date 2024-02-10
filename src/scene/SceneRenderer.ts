import { Scene } from 'three'
import { DebugHelper } from '../screen/DebugHelper'
import { cloneContext } from '../core/ImageHelper'
import { BaseRenderer } from '../screen/BaseRenderer'
import { SpriteImage } from '../core/Sprite'

export class SceneRenderer extends BaseRenderer {
    static readonly MAX_FPS = 30 // animations and videos have 25 fps (PAL)
    readonly debugHelper: DebugHelper
    screenshotCallback: (canvas: HTMLCanvasElement) => any

    constructor(canvas: SpriteImage) {
        super(1000 / SceneRenderer.MAX_FPS, canvas, {antialias: true, powerPreference: 'high-performance'})
        // this.shadowMap.enabled = true // XXX enable shadows here
        // this.shadowMap.type = PCFSoftShadowMap // XXX set shadow quality here
        this.debugHelper = new DebugHelper()
    }

    async startRendering(scene: Scene): Promise<void> {
        this.debugHelper.show()
        return super.startRendering(scene)
    }

    render() {
        this.debugHelper.onRenderStart()
        super.render()
        this.debugHelper.onRenderDone()
        this.checkForScreenshot()
    }

    private checkForScreenshot() {
        if (!this.screenshotCallback) return
        const callback = this.screenshotCallback
        this.screenshotCallback = null
        this.renderer?.domElement.toBlob((blob) => {
            const img = document.createElement('img')
            img.onload = () => {
                const context = cloneContext(this.renderer.domElement)
                context.drawImage(img, 0, 0)
                callback(context.canvas)
            }
            img.src = URL.createObjectURL(blob)
        })
    }

    stopRendering() {
        this.debugHelper.hide()
        super.stopRendering()
    }
}
