import { SpriteContext } from '../core/Sprite'
import { cancelAnimationFrameSafe, clearIntervalSafe } from '../core/Util'
import { HTML_GAME_CONTAINER } from '../core'

export class DebugHelper {
    static readonly element: HTMLElement = HTML_GAME_CONTAINER.querySelector('div.game-debug-layer')!
    static readonly messageContainer: HTMLElement = this.element.querySelector('div.game-debug-message-container')!
    static readonly maxNumFpsValues = 150
    static readonly nativeLog = console.log
    static readonly nativeWarn = console.warn
    static readonly nativeError = console.error

    readonly fpsContext: SpriteContext
    readonly fpsValues: number[] = []
    readonly useValues: number[] = []
    renderStartTimestampMs: number = 0
    renderEndTimestampMs: number = 0
    fpsIndex: number = 0
    fps: number = 0
    usage: number = 0
    renderInterval?: NodeJS.Timeout
    animationFrame?: number

    constructor() {
        const context = DebugHelper.element.querySelector<HTMLCanvasElement>('canvas.game-debug-fps-canvas')?.getContext('2d')
        if (!context) throw new Error('Could not get context for fps rendering')
        this.fpsContext = context
    }

    static intersectConsoleLogging() {
        console.log = (message?: any, ...optionalParams: any[]): void => {
            this.nativeLog(message, ...optionalParams)
            this.addDebugMessage(message, optionalParams, '#ffffff')
        }
        console.warn = (message?: any, ...optionalParams: any[]): void => {
            this.nativeWarn(message, ...optionalParams)
            this.addDebugMessage(message, optionalParams, '#ffff00')
        }
        console.error = (message?: any, ...optionalParams: any[]) => {
            this.nativeError(message, ...optionalParams)
            this.addDebugMessage(message, optionalParams, '#ff0000')
        }
    }

    static addDebugMessage(message: any, optionalParams: any[], color: string) {
        try {
            if (DebugHelper.messageContainer.children.length > 100 && DebugHelper.messageContainer.lastChild) DebugHelper.messageContainer.removeChild(DebugHelper.messageContainer.lastChild)
            const msg = DebugHelper.messageContainer.insertBefore(document.createElement('div'), DebugHelper.messageContainer.firstChild)
            msg.innerText = message
            optionalParams.forEach((p) => msg.innerText += `\n${JSON.stringify(p)}`)
            msg.style.padding = '0.1em'
            msg.style.color = color
            msg.style.userSelect = 'none'
        } catch (e) {
            this.nativeError(e)
        }
    }

    static toggleDisplay(): void {
        if (!this.element) return
        this.element.style.display = this.element.style.display === 'none' ? 'block' : 'none'
    }

    show() {
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        this.renderInterval = setInterval(() => {
            this.animationFrame = cancelAnimationFrameSafe(this.animationFrame)
            this.animationFrame = requestAnimationFrame(() => {
                this.fpsContext.clearRect(0, 0, 300, 150)
                this.drawFpsDiagram(0, 0, 300, 150)
            })
        }, 1000 / 60)
    }

    hide() {
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        this.fpsContext.clearRect(0, 0, 300, 150)
    }

    drawFpsDiagram(x: number, y: number, w: number, h: number) {
        this.fpsContext.fillStyle = '#069'
        this.fpsContext.fillRect(x, y, w, h)
        this.fpsContext.fillStyle = '#0ff'
        this.fpsContext.font = `bold 32px Helvetica,Arial,sans-serif`
        this.fpsContext.textBaseline = 'top'
        this.fpsContext.fillText(`FPS: ${this.fps} (${this.usage}%)`, x + 1, y + 1)
        const right = x + w - 1
        const bottom = y + h
        for (let c = 0; c < this.fpsValues.length; c++) {
            const index = (DebugHelper.maxNumFpsValues + this.fpsIndex - c) % DebugHelper.maxNumFpsValues
            const barHeight = Math.round(Math.min(150, this.fpsValues[index] ?? 0) / 150 * 120)
            this.fpsContext.fillRect(right - c * 2, bottom - barHeight, 2, barHeight)
        }
    }

    onRenderStart() {
        this.renderStartTimestampMs = performance.now()
    }

    onRenderDone() {
        const now = performance.now()
        const fpsDeltaMs = now - this.renderEndTimestampMs
        const useDeltaMs = now - this.renderStartTimestampMs
        this.renderEndTimestampMs = now
        this.fpsValues[this.fpsIndex] = fpsDeltaMs > 0 ? Math.round(1000 / fpsDeltaMs) : 0
        this.useValues[this.fpsIndex] = useDeltaMs > 0 ? Math.round(1000 / useDeltaMs) : 0
        this.fpsIndex = (this.fpsIndex + 1) % DebugHelper.maxNumFpsValues
        this.fps = Math.round(this.fpsValues.reduce((prev, val) => prev + val, 0) / this.fpsValues.length)
        this.usage = Math.round(useDeltaMs / fpsDeltaMs * 100)
    }
}
