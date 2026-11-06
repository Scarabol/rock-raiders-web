import { Material, Mesh, PCFShadowMap, Scene, WebGLRenderer } from 'three'
import { SaveGameManager } from '../resource/SaveGameManager'
import { DebugHelper } from '../screen/DebugHelper'
import { createContext } from '../core/ImageHelper'
import { BaseRenderer } from '../screen/BaseRenderer'
import { SpriteImage } from '../core/Sprite'

export class SceneRenderer extends BaseRenderer {
    static readonly MAX_FPS = 30 // animations and videos have 25 fps (PAL)
    readonly debugHelper: DebugHelper
    screenshotCallback: ((canvas: SpriteImage | undefined) => void) | undefined

    constructor(canvas: SpriteImage) {
        super(1000 / SceneRenderer.MAX_FPS, canvas, { antialias: true, powerPreference: 'high-performance' })
        this.debugHelper = new DebugHelper()
    }

    protected override onRendererCreated(renderer: WebGLRenderer) {
        renderer.shadowMap.enabled = SaveGameManager.preferences.shadows
        renderer.shadowMap.type = PCFShadowMap
    }

    override async startRendering(scene: Scene): Promise<void> {
        this.debugHelper.show()
        return super.startRendering(scene)
    }

    override render() {
        this.updateShadowsEnabled()
        this.debugHelper.onRenderStart()
        super.render()
        this.debugHelper.onRenderDone()
        this.checkForScreenshot()
    }

    private updateShadowsEnabled() {
        const enabled = SaveGameManager.preferences.shadows
        if (!this.renderer || this.renderer.shadowMap.enabled === enabled) return
        this.renderer.shadowMap.enabled = enabled
        // materials must be recompiled for the shadow change to take effect
        this.scene?.traverse((o) => {
            const material = (o as Mesh).material as Material | Material[] | undefined
            if (Array.isArray(material)) material.forEach((m) => m.needsUpdate = true)
            else if (material) material.needsUpdate = true
        })
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

    override stopRendering() {
        this.debugHelper.hide()
        super.stopRendering()
    }
}
