import { Cursor } from '../../cfg/PointerCfg'
import { cloneContext } from '../../core/ImageHelper'
import { Rect } from '../../core/Rect'
import { clearTimeoutSafe } from '../../core/Util'
import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { KEY_EVENT, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { ChangeCursor, ChangeTooltip } from '../../event/GuiCommand'
import { TakeScreenshot } from '../../event/LocalEvents'
import { EntityManager } from '../../game/EntityManager'
import { SceneManager } from '../../game/SceneManager'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH, TOOLTIP_DELAY } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'
import { AnimatedCursor } from '../AnimatedCursor'
import { AnimationFrame } from '../AnimationFrame'
import { ScreenLayer } from './ScreenLayer'
import { SoundManager } from '../../audio/SoundManager'

export class CursorLayer extends ScreenLayer {
    readonly animationFrame: AnimationFrame
    sceneMgr: SceneManager
    entityMgr: EntityManager
    currentCursor: Cursor = null
    timedCursor: Cursor = null
    cursorTimeout: NodeJS.Timeout = null
    activeCursor: AnimatedCursor = null
    cursorCanvasPos: { x: number, y: number } = {x: 0, y: 0}
    tooltipRect: Rect = null
    tooltipTimeout: NodeJS.Timeout = null
    cursorLeft: boolean = false

    constructor() {
        super()
        this.animationFrame = new AnimationFrame(this.canvas)
        EventBus.registerEventListener(EventKey.COMMAND_CHANGE_CURSOR, (event: ChangeCursor) => {
            if (this.active) this.changeCursor(event.cursor, event.timeout)
        })
        EventBus.registerEventListener(EventKey.COMMAND_CHANGE_TOOLTIP, (event: ChangeTooltip) => {
            if (this.cursorLeft) return
            this.tooltipTimeout = clearTimeoutSafe(this.tooltipTimeout)
            if (this.active && (event.tooltipText || event.tooltipSfx)) {
                this.tooltipTimeout = setTimeout(() => {
                    if (event.tooltipText) this.changeTooltip(event.tooltipText)
                    if (event.tooltipSfx) SoundManager.playSound(event.tooltipSfx)
                }, TOOLTIP_DELAY)
            }
        })
    }

    reset() {
        this.changeCursor('pointerStandard')
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
        this.tooltipTimeout = clearTimeoutSafe(this.tooltipTimeout)
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
            this.tooltipTimeout = clearTimeoutSafe(this.tooltipTimeout)
            this.cursorCanvasPos = {x: event.canvasX, y: event.canvasY}
            this.animationFrame.onRedraw = (context) => {
                if (this.tooltipRect) context.clearRect(this.tooltipRect.x, this.tooltipRect.y, this.tooltipRect.w, this.tooltipRect.h)
                this.tooltipRect = null
                this.animationFrame.onRedraw = null
            }
            this.animationFrame.redraw()
        } else if (event.eventEnum === POINTER_EVENT.LEAVE) {
            this.cursorLeft = true
            this.tooltipTimeout = clearTimeoutSafe(this.tooltipTimeout)
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

    private changeTooltip(tooltipText: string) {
        const tooltipImg = ResourceManager.getTooltipSprite(tooltipText)
        if (!tooltipImg) return
        const tooltipWidth = Math.round(tooltipImg.width * this.canvas.width / NATIVE_SCREEN_WIDTH)
        const tooltipHeight = Math.round(tooltipImg.height * this.canvas.height / NATIVE_SCREEN_HEIGHT)
        const posX = Math.min(this.cursorCanvasPos.x + tooltipWidth, this.canvas.width) - tooltipWidth
        const posY = Math.min(this.cursorCanvasPos.y + this.activeCursor.maxHeight + tooltipHeight, this.canvas.height) - tooltipHeight
        this.tooltipRect = new Rect(posX, posY, tooltipWidth, tooltipHeight)
        this.animationFrame.onRedraw = (context) => context.drawImage(tooltipImg, this.tooltipRect.x, this.tooltipRect.y, this.tooltipRect.w, this.tooltipRect.h)
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
