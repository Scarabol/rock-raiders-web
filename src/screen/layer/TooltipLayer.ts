import { clearTimeoutSafe } from '../../core/Util'
import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { POINTER_EVENT } from '../../event/EventTypeEnum'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { ChangeTooltip } from '../../event/GuiCommand'
import { SaveScreenshot } from '../../event/LocalEvents'
import { CURSOR_MAX_HEIGHT, NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'
import { AnimationFrame } from '../AnimationFrame'
import { ScreenLayer } from './ScreenLayer'
import { SoundManager } from '../../audio/SoundManager'
import { SpriteImage } from '../../core/Sprite'

export class TooltipLayer extends ScreenLayer {
    readonly animationFrame: AnimationFrame
    cursorCanvasPos: { x: number, y: number } = {x: 0, y: 0}
    tooltipTimeoutText: NodeJS.Timeout = null
    tooltipTimeoutSfx: NodeJS.Timeout = null
    cursorLeft: boolean = false

    constructor() {
        super()
        this.animationFrame = new AnimationFrame(this.canvas)
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
        this.addEventListener('pointermove', (event: PointerEvent): boolean => {
            this.cursorLeft = false
            const gameEvent = new GamePointerEvent(POINTER_EVENT.MOVE, event)
            ;[gameEvent.canvasX, gameEvent.canvasY] = this.transformCoords(event.clientX, event.clientY)
            this.tooltipTimeoutText = clearTimeoutSafe(this.tooltipTimeoutText)
            this.tooltipTimeoutSfx = clearTimeoutSafe(this.tooltipTimeoutSfx)
            this.cursorCanvasPos = {x: gameEvent.canvasX, y: gameEvent.canvasY}
            this.animationFrame.onRedraw = (context) => {
                context.clearRect(0, 0, context.canvas.width, context.canvas.height)
                this.animationFrame.onRedraw = null
            }
            this.animationFrame.notifyRedraw()
            return false
        })
        this.addEventListener('pointerleave', (): boolean => {
            this.cursorLeft = true
            this.tooltipTimeoutText = clearTimeoutSafe(this.tooltipTimeoutText)
            this.tooltipTimeoutSfx = clearTimeoutSafe(this.tooltipTimeoutSfx)
            return false
        })
        this.addEventListener('keyup', (event: KeyboardEvent): boolean => {
            if (event.key === 'p') {
                EventBus.publishEvent(new SaveScreenshot())
                return true
            }
            return false
        })
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
        const posY = Math.min(this.cursorCanvasPos.y + CURSOR_MAX_HEIGHT + tooltipHeight, this.canvas.height) - tooltipHeight
        this.animationFrame.onRedraw = (context) => context.drawImage(tooltipImg, posX, posY, tooltipWidth, tooltipHeight)
        this.animationFrame.notifyRedraw()
    }
}
