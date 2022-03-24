type AnimationFrameRedrawCallback = (context: SpriteContext) => any

export class AnimationFrame {
    private lastAnimationRequest: number = null
    private redrawCallback: AnimationFrameRedrawCallback = null

    constructor(readonly context: SpriteContext) {
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
