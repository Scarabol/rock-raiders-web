import { EventKey } from '../../event/EventKeyEnum'
import { ChangeTooltip, HideTooltip } from '../../event/GuiCommand'
import { SaveScreenshot } from '../../event/LocalEvents'
import { TooltipSpriteBuilder } from '../../resource/TooltipSpriteBuilder'
import { ScreenLayer } from './ScreenLayer'
import { CURSOR_MAX_HEIGHT } from '../../params'
import { clearTimeoutSafe } from '../../core/Util'
import { SoundManager } from '../../audio/SoundManager'
import { EventBroker } from '../../event/EventBroker'

export class TooltipLayer extends ScreenLayer {
    readonly gameCanvasContainer: HTMLElement
    readonly lastCursorPos: { x: number, y: number } = {x: 0, y: 0}
    tooltipTimeoutText: NodeJS.Timeout = null
    tooltipTimeoutSfx: NodeJS.Timeout = null
    cursorLeft: boolean = false
    tooltipCanvas: HTMLCanvasElement = null
    lastTooltipText: string = null
    lastTooltipSfx: string = null

    constructor() {
        super()
        this.gameCanvasContainer = document.getElementById('game-canvas-container')
        EventBroker.subscribe(EventKey.COMMAND_TOOLTIP_CHANGE, (event: ChangeTooltip) => {
            if (this.cursorLeft || !this.active || event.tooltipText === this.lastTooltipText) return
            this.lastTooltipText = event.tooltipText
            this.lastTooltipSfx = event.tooltipSfx
            this.tooltipTimeoutText = clearTimeoutSafe(this.tooltipTimeoutText)
            this.tooltipTimeoutSfx = clearTimeoutSafe(this.tooltipTimeoutSfx)
            if (this.tooltipCanvas) {
                this.gameCanvasContainer.removeChild(this.tooltipCanvas)
                this.tooltipCanvas = null
            }
            if (event.tooltipText) {
                this.tooltipTimeoutText = setTimeout(() => this.getTooltipImg(event).then((tooltipImg) => {
                    this.changeTooltipImage(tooltipImg)
                }), event.timeoutText)
            }
            if (event.tooltipSfx) {
                this.tooltipTimeoutSfx = setTimeout(() => SoundManager.playSound(event.tooltipSfx, true), event.timeoutSfx)
            }
        })
        EventBroker.subscribe(EventKey.COMMAND_TOOLTIP_HIDE, (event: HideTooltip) => {
            if (!(this.lastTooltipText === event.tooltipText || this.lastTooltipSfx === event.tooltipSfx)) return
            this.removeTooltip()
        })
        this.addEventListener('pointermove', (event: PointerEvent): boolean => {
            this.cursorLeft = false
            const clientRect = this.gameCanvasContainer.getBoundingClientRect()
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
                EventBroker.publish(new SaveScreenshot())
                return true
            }
            return false
        })
    }

    private removeTooltip() {
        this.tooltipTimeoutText = clearTimeoutSafe(this.tooltipTimeoutText)
        this.tooltipTimeoutSfx = clearTimeoutSafe(this.tooltipTimeoutSfx)
        if (this.tooltipCanvas) {
            this.gameCanvasContainer.removeChild(this.tooltipCanvas)
            this.tooltipCanvas = null
        }
        this.lastTooltipText = null
        this.lastTooltipSfx = null
    }

    private changeTooltipImage(tooltipImg: HTMLCanvasElement | OffscreenCanvas) {
        if (this.tooltipCanvas) this.gameCanvasContainer.removeChild(this.tooltipCanvas)
        if (this.cursorLeft) return
        this.tooltipCanvas = document.createElement('canvas')
        this.gameCanvasContainer.appendChild(this.tooltipCanvas)
        const scale = this.gameCanvasContainer.getBoundingClientRect().width / 640
        this.tooltipCanvas.width = Math.round(tooltipImg.width * scale)
        this.tooltipCanvas.height = Math.round(tooltipImg.height * scale)
        this.tooltipCanvas.style.position = 'absolute'
        this.tooltipCanvas.style.zIndex = `${this.zIndex + 10}`
        this.tooltipCanvas.getContext('2d').drawImage(tooltipImg, 0, 0, this.tooltipCanvas.width, this.tooltipCanvas.height)
        this.updateTooltipCanvasPosition()
    }

    private updateTooltipCanvasPosition() {
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
    }

    private async getTooltipImg(event: ChangeTooltip) { // XXX cache tooltip images
        if (event.numToolSlots || event.tools || event.trainings) {
            return await TooltipSpriteBuilder.getRaiderTooltipSprite(event.tooltipText || '',
                event.numToolSlots || 0, event.tools || [], event.trainings || [])
        } else if (event.crystals || event.ores || event.bricks) {
            return await TooltipSpriteBuilder.getBuildingSiteTooltipSprite(event.tooltipText, event.crystals, event.ores, event.bricks)
        } else if (event.buildingMissingOreForUpgrade) {
            return await TooltipSpriteBuilder.getBuildingMissingOreForUpgradeTooltipSprite(event.tooltipText, event.buildingMissingOreForUpgrade)
        } else if (event.tooltipText) {
            return await TooltipSpriteBuilder.getTooltipSprite(event.tooltipText, event.energy)
        }
        return null
    }
}
