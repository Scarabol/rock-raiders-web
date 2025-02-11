import { Scene } from 'three'
import { DebugHelper } from '../screen/DebugHelper'
import { createContext } from '../core/ImageHelper'
import { BaseRenderer } from '../screen/BaseRenderer'
import { SpriteImage } from '../core/Sprite'

export class SceneRenderer extends BaseRenderer {
    static readonly MAX_FPS = 30 // animations and videos have 25 fps (PAL)
    readonly debugHelper: DebugHelper
    screenshotCallback?: (canvas: SpriteImage | undefined) => void

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
        const callback = this.screenshotCallback
        if (!callback) return
        this.screenshotCallback = undefined
        this.renderer?.domElement.toBlob((blob) => {
            if (!blob) {
                console.error('Creating blob for screenshot failed. No blob created')
                callback(undefined)
                return
            }
            const img = document.createElement('img')
            img.onload = () => {
                if (!this.renderer) {
                    console.error('Renderer is not ready for screenshot')
                    callback(undefined)
                    return
                }
                const context = createContext(this.renderer.domElement.width, this.renderer.domElement.height)
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
