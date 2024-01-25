import { BaseButtonCfg } from '../../cfg/ButtonCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { ChangeTooltip, HideTooltip } from '../../event/GuiCommand'
import { GuiClickEvent, GuiHoverEvent, GuiReleaseEvent } from '../event/GuiEvent'
import { BaseElement } from './BaseElement'
import { TOOLTIP_DELAY_SFX } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'
import { GameConfig } from '../../cfg/GameConfig'

export class Button extends BaseElement {
    buttonType: string = null
    imgNormal: SpriteImage = null
    imgHover: SpriteImage = null
    imgPressed: SpriteImage = null
    imgDisabled: SpriteImage = null
    tooltip: string = null
    tooltipSfx: string = null
    hoverFrame: boolean = false

    constructor(parent: BaseElement, btnCfg: BaseButtonCfg) {
        super(parent)
        this.buttonType = btnCfg.buttonType
        this.imgNormal = ResourceManager.getImageOrNull(btnCfg.normalFile)
        this.imgHover = ResourceManager.getImageOrNull(btnCfg.highlightFile)
        this.imgPressed = ResourceManager.getImageOrNull(btnCfg.pressedFile)
        this.imgDisabled = ResourceManager.getImageOrNull(btnCfg.disabledFile)
        this.relX = btnCfg.relX
        this.relY = btnCfg.relY
        this.width = Button.ignoreUndefinedMax(btnCfg.width, this.imgNormal?.width, this.imgPressed?.width, this.imgHover?.width)
        this.height = Button.ignoreUndefinedMax(btnCfg.height, this.imgNormal?.height, this.imgPressed?.height, this.imgHover?.height)
        this.tooltip = GameConfig.instance.getTooltipText(btnCfg.tooltipKey) || btnCfg.tooltipText
        this.tooltipSfx = btnCfg.tooltipSfx
        this.updatePosition()
        this.onClick = () => console.log(`button pressed: ${this.buttonType}`)
    }

    private static ignoreUndefinedMax(...numbers: number[]): number {
        return Math.max(...numbers.map((n) => n || 0))
    }

    onHoverStart(): void {
        super.onHoverStart()
        if (this.isInactive()) {
            this.showTooltipDisabled()
        } else if (this.tooltip || this.tooltipSfx) {
            this.showTooltip()
        }
    }

    onHoverEnd() {
        super.onHoverEnd()
        this.publishEvent(new HideTooltip(this.tooltip, this.tooltipSfx))
    }

    showTooltip() {
        this.publishEvent(new ChangeTooltip(this.tooltip, 0, this.tooltipSfx, TOOLTIP_DELAY_SFX))
    }

    showTooltipDisabled() {
    }

    checkHover(event: GuiHoverEvent): void {
        super.checkHover(event)
        if (event.hoverStateChanged) this.notifyRedraw()
    }

    checkClick(event: GuiClickEvent): boolean {
        const stateChanged = super.checkClick(event)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    checkRelease(event: GuiReleaseEvent): boolean {
        const stateChanged = super.checkRelease(event)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    release(): boolean {
        const stateChanged = super.release()
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        let img = this.imgNormal
        if (this.disabled) {
            img = this.imgDisabled || this.imgPressed || this.imgNormal
        } else if (this.pressedByButton !== null) {
            img = this.imgPressed || this.imgNormal
        } else if (this.hover) {
            img = this.imgHover || this.imgNormal
        }
        if (img) context.drawImage(img, this.x, this.y)
        super.onRedraw(context)
    }

    drawHover(context: SpriteContext) {
        super.drawHover(context)
        if (!this.disabled && this.hover && this.hoverFrame) {
            context.strokeStyle = '#0f0'
            context.lineWidth = 2
            context.strokeRect(this.x - context.lineWidth / 2, this.y - context.lineWidth / 2, this.width + context.lineWidth - 1, this.height + context.lineWidth - 1)
        }
    }
}
