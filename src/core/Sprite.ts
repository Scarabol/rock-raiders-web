export type SpriteImage = HTMLCanvasElement | OffscreenCanvas

export type SpriteContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export function getSpriteContext(canvas: SpriteImage | undefined, contextAttributes?: CanvasRenderingContext2DSettings): SpriteContext {
    if (!canvas) throw new Error('No canvas given')
    const context = canvas.getContext('2d', contextAttributes)
    if (!context) throw new Error('Could not get context')
    return context as SpriteContext
}
