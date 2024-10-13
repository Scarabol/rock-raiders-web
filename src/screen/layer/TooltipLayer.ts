import { EventKey } from '../../event/EventKeyEnum'
import { ChangeTooltip, HideTooltip } from '../../event/GuiCommand'
import { ScreenLayer } from './ScreenLayer'
import { CURSOR_MAX_HEIGHT, DEV_MODE, NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../../params'
import { clearTimeoutSafe } from '../../core/Util'
import { SoundManager } from '../../audio/SoundManager'
import { EventBroker } from '../../event/EventBroker'
import { SaveGameManager } from '../../resource/SaveGameManager'
import { SpriteImage } from '../../core/Sprite'
import { HTML_GAME_CANVAS_CONTAINER } from '../../core'

export class TooltipLayer extends ScreenLayer {
    readonly lastCursorPos: { x: number, y: number } = {x: 0, y: 0}
    tooltipTimeoutText?: NodeJS.Timeout
    tooltipTimeoutSfx?: NodeJS.Timeout
    cursorLeft: boolean = false
    tooltipCanvas?: HTMLCanvasElement
    lastTooltipKey: string = ''

    constructor() {
        super()
        this.ratio = SaveGameManager.currentPreferences.screenRatioFixed
        EventBroker.subscribe(EventKey.COMMAND_TOOLTIP_CHANGE, (event: ChangeTooltip) => {
            if (this.cursorLeft || !this.active || event.tooltipKey === this.lastTooltipKey) return
            this.lastTooltipKey = event.tooltipKey
            this.tooltipTimeoutText = clearTimeoutSafe(this.tooltipTimeoutText)
            this.tooltipTimeoutSfx = clearTimeoutSafe(this.tooltipTimeoutSfx)
            if (this.tooltipCanvas) {
                HTML_GAME_CANVAS_CONTAINER.removeChild(this.tooltipCanvas)
                this.tooltipCanvas = undefined
            }
            this.tooltipTimeoutText = setTimeout(async () => {
                this.changeTooltipImage(await event.getTooltipTextImg())
            }, event.timeoutText)
            const tooltipSfx = event.tooltipSfx
            if (!DEV_MODE && tooltipSfx) {
                this.tooltipTimeoutSfx = setTimeout(() => SoundManager.playSound(tooltipSfx, true), event.timeoutSfx)
            }
        })
        EventBroker.subscribe(EventKey.COMMAND_TOOLTIP_HIDE, (event: HideTooltip) => {
            if (event.tooltipText && event.tooltipText !== this.lastTooltipKey) return
            this.removeTooltip()
        })
        this.addEventListener('pointermove', (event: PointerEvent): boolean => {
            this.cursorLeft = false
            const clientRect = HTML_GAME_CANVAS_CONTAINER.getBoundingClientRect()
            this.lastCursorPos.x = event.clientX - clientRect.left
            this.lastCursorPos.y = event.clientY - clientRect.top + CURSOR_MAX_HEIGHT
            if (this.tooltipCanvas) this.updateTooltipCanvasPosition()
            return false
        })
        this.addEventListener('pointerleave', (): boolean => {
            this.cursorLeft = true
            this.removeTooltip()
            return false
        })
        this.addEventListener('keyup', (event: KeyboardEvent): boolean => {
            if (event.key === 'p') {
                this.screenMaster.saveScreenshot()
                return true
            }
            return false
        })
        this.show()
    }

    private removeTooltip() {
        this.tooltipTimeoutText = clearTimeoutSafe(this.tooltipTimeoutText)
        this.tooltipTimeoutSfx = clearTimeoutSafe(this.tooltipTimeoutSfx)
        if (this.tooltipCanvas) {
            HTML_GAME_CANVAS_CONTAINER.removeChild(this.tooltipCanvas)
            this.tooltipCanvas = undefined
        }
        this.lastTooltipKey = ''
    }

    private changeTooltipImage(tooltipImg: SpriteImage) {
        if (this.tooltipCanvas) HTML_GAME_CANVAS_CONTAINER.removeChild(this.tooltipCanvas)
        if (this.cursorLeft) return
        this.tooltipCanvas = document.createElement('canvas')
        HTML_GAME_CANVAS_CONTAINER.appendChild(this.tooltipCanvas)
        const rect = HTML_GAME_CANVAS_CONTAINER.getBoundingClientRect()
        const scale = Math.min(rect.width / NATIVE_SCREEN_WIDTH, rect.height / NATIVE_SCREEN_HEIGHT)
        this.tooltipCanvas.width = Math.round(tooltipImg.width * scale)
        this.tooltipCanvas.height = Math.round(tooltipImg.height * scale)
        this.tooltipCanvas.style.position = 'absolute'
        this.tooltipCanvas.style.zIndex = `${this.zIndex + 10}`
        const context = this.tooltipCanvas.getContext('2d')
        if (!context) {
            console.warn('Could not get context for tooltip canvas')
        } else {
            context.drawImage(tooltipImg, 0, 0, this.tooltipCanvas.width, this.tooltipCanvas.height)
        }
        this.updateTooltipCanvasPosition()
    }

    private updateTooltipCanvasPosition() {
        if (!this.tooltipCanvas) return
        const posX = Math.min(this.lastCursorPos.x + this.tooltipCanvas.width, this.canvas.width) - this.tooltipCanvas.width
        let posY: number
        if (this.lastCursorPos.y + this.tooltipCanvas.height < this.canvas.height) {
            posY = this.lastCursorPos.y
        } else {
            posY = this.lastCursorPos.y - CURSOR_MAX_HEIGHT - this.tooltipCanvas.height
        }
        this.tooltipCanvas.style.left = `${posX}px`
        this.tooltipCanvas.style.top = `${posY}px`
    }

    show() {
        this.reset()
        super.show()
    }

    hide() {
        super.hide()
        this.tooltipTimeoutText = clearTimeoutSafe(this.tooltipTimeoutText)
        this.tooltipTimeoutSfx = clearTimeoutSafe(this.tooltipTimeoutSfx)
        this.cursorLeft = false
        if (this.tooltipCanvas) HTML_GAME_CANVAS_CONTAINER.removeChild(this.tooltipCanvas)
        this.tooltipCanvas = undefined
    }
}
