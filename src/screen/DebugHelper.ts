import { SpriteContext } from '../core/Sprite'
import { cancelAnimationFrameSafe, clearIntervalSafe } from '../core/Util'
import { HTML_GAME_CANVAS_CONTAINER } from '../core'

export class DebugHelper {
    static readonly element: HTMLElement = HTML_GAME_CANVAS_CONTAINER.appendChild(document.createElement('div'))
    static readonly messageContainer: HTMLElement = this.element.appendChild(document.createElement('div'))
    static readonly maxNumFpsValues = 150
    static {
        DebugHelper.element.classList.add('game-debug-layer')
        DebugHelper.element.style.display = 'none'
        DebugHelper.messageContainer.style.overflowWrap = 'break-word'
    }

    readonly context: SpriteContext
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
        const fpsCanvas = DebugHelper.element.appendChild(document.createElement('canvas'))
        fpsCanvas.style.width = '160px'
        fpsCanvas.style.height = '80px'
        fpsCanvas.style.position = 'absolute'
        fpsCanvas.style.left = '50%'
        fpsCanvas.style.top = '0'
        fpsCanvas.style.scale = '1'
        fpsCanvas.style.marginLeft = '-80px'
        const context = fpsCanvas.getContext('2d')
        if (!context) throw new Error('Could not get context for fps rendering')
        this.context = context
        const copyToClipboard = DebugHelper.element.appendChild(document.createElement('button'))
        copyToClipboard.innerText = 'Copy to clipboard'
        copyToClipboard.style.width = '120px'
        copyToClipboard.style.height = '50px'
        copyToClipboard.style.position = 'absolute'
        copyToClipboard.style.top = '0'
        copyToClipboard.style.right = '0'
        copyToClipboard.onclick = () => {
            navigator.clipboard.writeText(Array.from(DebugHelper.messageContainer.children).map((e) => (e as HTMLElement).innerText).join('\n')).then()
        }
    }

    static intersectConsoleLogging() {
        const nativeLog = console.log
        const nativeWarn = console.warn
        const nativeError = console.error
        console.log = (message?: any, ...optionalParams: any[]): void => {
            nativeLog(message, ...optionalParams)
            this.addDebugMessage(message, optionalParams, '#ffffff')
        }
        console.warn = (message?: any, ...optionalParams: any[]): void => {
            nativeWarn(message, ...optionalParams)
            this.addDebugMessage(message, optionalParams, '#ffff00')
        }
        console.error = (message?: any, ...optionalParams: any[]) => {
            nativeError(message, ...optionalParams)
            this.addDebugMessage(message, optionalParams, '#ff0000')
        }
    }

    static addDebugMessage(message: any, optionalParams: any[], color: string) {
        try {
            if (DebugHelper.messageContainer.children.length > 100 && DebugHelper.messageContainer.lastChild) DebugHelper.messageContainer.removeChild(DebugHelper.messageContainer.lastChild)
            const msg = DebugHelper.messageContainer.insertBefore(document.createElement('DIV'), DebugHelper.messageContainer.firstChild)
            msg.innerText = message
            optionalParams.forEach((p) => msg.innerText += `\n${JSON.stringify(p)}`)
            msg.style.padding = '0.1em'
            msg.style.color = color
            msg.style.userSelect = 'none'
        } catch (e) {
            // do nothing to avoid circular calls
        }
    }

    show() {
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        this.renderInterval = setInterval(() => {
            this.animationFrame = cancelAnimationFrameSafe(this.animationFrame)
            this.animationFrame = requestAnimationFrame(() => {
                this.context.clearRect(0, 0, 300, 150)
                this.drawFpsDiagram(0, 0, 300, 150)
            })
        }, 1000 / 60)
    }

    hide() {
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        this.context.clearRect(0, 0, 300, 150)
    }

    drawFpsDiagram(x: number, y: number, w: number, h: number) {
        this.context.fillStyle = '#069'
        this.context.fillRect(x, y, w, h)
        this.context.fillStyle = '#0ff'
        this.context.font = `bold 32px Helvetica,Arial,sans-serif`
        this.context.textBaseline = 'top'
        this.context.fillText(`FPS: ${this.fps} (${this.usage}%)`, x + 1, y + 1)
        const right = x + w - 1
        const bottom = y + h
        for (let c = 0; c < this.fpsValues.length; c++) {
            const index = (DebugHelper.maxNumFpsValues + this.fpsIndex - c) % DebugHelper.maxNumFpsValues
            const barHeight = Math.round(Math.min(150, this.fpsValues[index] ?? 0) / 150 * 120)
            this.context.fillRect(right - c * 2, bottom - barHeight, 2, barHeight)
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
