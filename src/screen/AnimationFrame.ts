type AnimationFrameRedrawCallback = (context: SpriteContext) => any

export class AnimationFrame {
    readonly context: SpriteContext = null
    private lastAnimationRequest: number = null
    private redrawCallback: AnimationFrameRedrawCallback = null

    constructor(canvas: HTMLCanvasElement | OffscreenCanvas) {
        this.context = canvas.getContext('2d')
    }

    set onRedraw(callback: AnimationFrameRedrawCallback) {
        this.redrawCallback = callback
    }

    redraw() {
        if (!this.redrawCallback) return
        if (this.lastAnimationRequest) cancelAnimationFrame(this.lastAnimationRequest)
        this.lastAnimationRequest = requestAnimationFrame(() => this.redrawCallback(this.context))
    }
}

export class AnimationFrameScaled extends AnimationFrame {
    scale(scaleX: number, scaleY: number) {
        this.context.scale(scaleX, scaleY)
    }
}
