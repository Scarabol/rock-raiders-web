import { Cursor } from '../../resource/Cursor'
import { cloneContext } from '../../core/ImageHelper'
import { clearTimeoutSafe } from '../../core/Util'
import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { KEY_EVENT, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { ChangeCursor, ChangeTooltip } from '../../event/GuiCommand'
import { TakeScreenshot } from '../../event/LocalEvents'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'
import { AnimatedCursor } from '../AnimatedCursor'
import { AnimationFrame } from '../AnimationFrame'
import { ScreenLayer } from './ScreenLayer'
import { SoundManager } from '../../audio/SoundManager'
import { SpriteImage } from '../../core/Sprite'

export class CursorLayer extends ScreenLayer {
    readonly animationFrame: AnimationFrame
    currentCursor: Cursor = null
    timedCursor: Cursor = null
    cursorTimeout: NodeJS.Timeout = null
    activeCursor: AnimatedCursor = null
    cursorCanvasPos: { x: number, y: number } = {x: 0, y: 0}
    tooltipTimeoutText: NodeJS.Timeout = null
    tooltipTimeoutSfx: NodeJS.Timeout = null
    cursorLeft: boolean = false

    constructor() {
        super()
        this.animationFrame = new AnimationFrame(this.canvas)
        EventBus.registerEventListener(EventKey.COMMAND_CHANGE_CURSOR, (event: ChangeCursor) => {
            if (this.active) this.changeCursor(event.cursor, event.timeout)
        })
        EventBus.registerEventListener(EventKey.COMMAND_CHANGE_TOOLTIP, (event: ChangeTooltip) => {
            this.tooltipTimeoutText = clearTimeoutSafe(this.tooltipTimeoutText)
            this.tooltipTimeoutSfx = clearTimeoutSafe(this.tooltipTimeoutSfx)
            if (this.cursorLeft || !this.active) return
            if (event.tooltipText && event.timeoutText > 0) {
                this.tooltipTimeoutText = setTimeout(() => this.changeTooltipImg(event), event.timeoutText)
            }
            if (event.tooltipSfx && event.timeoutSfx > 0) {
                this.tooltipTimeoutSfx = setTimeout(() => SoundManager.playSound(event.tooltipSfx), event.timeoutSfx)
            }
        })
    }

    reset() {
        this.changeCursor(Cursor.STANDARD)
    }

    show() {
        this.reset()
        super.show()
    }

    hide() {
        super.hide()
        this.canvas.style.cursor = null
        this.currentCursor = null
        this.timedCursor = null
        this.cursorTimeout = clearTimeoutSafe(this.cursorTimeout)
        this.activeCursor?.disableAnimation()
        this.activeCursor = null
        this.tooltipTimeoutText = clearTimeoutSafe(this.tooltipTimeoutText)
        this.tooltipTimeoutSfx = clearTimeoutSafe(this.tooltipTimeoutSfx)
        this.cursorLeft = false
    }

    handleKeyEvent(event: GameKeyboardEvent): boolean {
        if (event.key === 'p') {
            if (event.eventEnum === KEY_EVENT.DOWN) EventBus.publishEvent(new TakeScreenshot())
            return true
        } else {
            return super.handleKeyEvent(event)
        }
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        this.cursorLeft = false
        if (event.eventEnum === POINTER_EVENT.MOVE) {
            this.tooltipTimeoutText = clearTimeoutSafe(this.tooltipTimeoutText)
            this.tooltipTimeoutSfx = clearTimeoutSafe(this.tooltipTimeoutSfx)
            this.cursorCanvasPos = {x: event.canvasX, y: event.canvasY}
            this.animationFrame.onRedraw = (context) => {
                context.clearRect(0, 0, context.canvas.width, context.canvas.height)
                this.animationFrame.onRedraw = null
            }
            this.animationFrame.redraw()
        } else if (event.eventEnum === POINTER_EVENT.LEAVE) {
            this.cursorLeft = true
            this.tooltipTimeoutText = clearTimeoutSafe(this.tooltipTimeoutText)
            this.tooltipTimeoutSfx = clearTimeoutSafe(this.tooltipTimeoutSfx)
        }
        return super.handlePointerEvent(event)
    }

    private changeCursor(cursor: Cursor, timeout: number = null) {
        if (timeout) {
            this.cursorTimeout = clearTimeoutSafe(this.cursorTimeout)
            if (this.timedCursor !== cursor) this.setCursor(cursor)
            const that = this
            this.cursorTimeout = setTimeout(() => {
                that.cursorTimeout = null
                that.setCursor(that.currentCursor)
            }, timeout)
        } else if (this.currentCursor !== cursor) {
            this.currentCursor = cursor
            if (this.cursorTimeout) return
            this.setCursor(cursor)
        }
    }

    private setCursor(cursor: Cursor) {
        this.activeCursor?.disableAnimation()
        this.activeCursor = ResourceManager.getCursor(cursor)
        this.activeCursor.enableAnimation(this.canvas.style)
    }

    private async changeTooltipImg(event: ChangeTooltip) {
        let tooltipImg: SpriteImage = null
        if (event.numToolSlots || event.tools || event.trainings) {
            tooltipImg = await ResourceManager.getRaiderTooltipSprite(event.tooltipText || '',
                event.numToolSlots || 0, event.tools || [], event.trainings || [])
        } else if (event.crystals || event.ores || event.bricks) {
            tooltipImg = await ResourceManager.getBuildingSiteTooltipSprite(event.tooltipText, event.crystals, event.ores, event.bricks)
        } else if (event.buildingMissingOreForUpgrade) {
            tooltipImg = await ResourceManager.getBuildingMissingOreForUpgradeTooltipSprite(event.tooltipText, event.buildingMissingOreForUpgrade)
        } else if (event.tooltipText) {
            tooltipImg = await ResourceManager.getTooltipSprite(event.tooltipText)
        }
        if (tooltipImg) this.setTooltipImg(tooltipImg)
    }

    private setTooltipImg(tooltipImg: SpriteImage) {
        const tooltipWidth = Math.round(tooltipImg.width * this.canvas.width / NATIVE_SCREEN_WIDTH)
        const tooltipHeight = Math.round(tooltipImg.height * this.canvas.height / NATIVE_SCREEN_HEIGHT)
        const posX = Math.min(this.cursorCanvasPos.x + tooltipWidth, this.canvas.width) - tooltipWidth
        const posY = Math.min(this.cursorCanvasPos.y + this.activeCursor.maxHeight + tooltipHeight, this.canvas.height) - tooltipHeight
        this.animationFrame.onRedraw = (context) => context.drawImage(tooltipImg, posX, posY, tooltipWidth, tooltipHeight)
        this.animationFrame.redraw()
    }

    takeScreenshotFromLayer(): Promise<HTMLCanvasElement> {
        const cx = this.cursorCanvasPos.x
        const cy = this.cursorCanvasPos.y
        const encoded = this.canvas.style.cursor.match(/"(.+)"/)?.[1]
        if (!encoded) throw new Error('Could not extract encoded url from layer style attributes')
        return new Promise<HTMLCanvasElement>((resolve) => {
            const context = cloneContext(this.canvas)
            const img = document.createElement('img')
            img.onload = () => {
                context.drawImage(img, cx, cy)
                resolve(context.canvas)
            }
            img.onerror = () => {
                throw new Error('Could decode image for screenshot')
            }
            img.src = encoded
        })
    }
}
