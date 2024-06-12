import { BaseButtonCfg } from '../../cfg/ButtonCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { ChangeTooltip, HideTooltip } from '../../event/GuiCommand'
import { GuiHoverEvent, GuiPointerDownEvent, GuiPointerUpEvent } from '../event/GuiEvent'
import { BaseElement } from './BaseElement'
import { TOOLTIP_DELAY_SFX } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'
import { GameConfig } from '../../cfg/GameConfig'
import { clearIntervalSafe } from '../../core/Util'
import { EventBroker } from '../../event/EventBroker'
import { EventKey } from '../../event/EventKeyEnum'
import { GuiButtonBlinkEvent } from '../../event/LocalEvents'

export class Button extends BaseElement {
    buttonType: string = null
    imgNormal: SpriteImage = null
    imgHover: SpriteImage = null
    imgPressed: SpriteImage = null
    imgDisabled: SpriteImage = null
    tooltip: string = null
    tooltipSfx: string = null
    hoverFrame: boolean = false
    render: boolean = true
    blinkInterval: NodeJS.Timeout = null

    constructor(btnCfg: BaseButtonCfg, blinking: boolean = false) {
        super()
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
        if (blinking) this.startBlinking()
        EventBroker.subscribe(EventKey.GUI_BUTTON_BLINK, (event: GuiButtonBlinkEvent) => {
            if (this.buttonType !== event.buttonType) return
            if (event.blinking) {
                if (!this.blinkInterval) this.startBlinking()
            } else {
                if (this.blinkInterval) this.stopBlinking()
            }
        })
    }

    private startBlinking() {
        this.stopBlinking()
        this.blinkInterval = setInterval(() => {
            this.render = !this.render
            this.notifyRedraw()
        }, 500)
    }

    private stopBlinking() {
        this.blinkInterval = clearIntervalSafe(this.blinkInterval)
        this.render = true
        this.notifyRedraw()
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
        this.publishEvent(new HideTooltip(this.tooltip))
    }

    showTooltip() {
        this.publishEvent(new ChangeTooltip(this.tooltip, 0, this.tooltipSfx, TOOLTIP_DELAY_SFX))
    }

    showTooltipDisabled() {
    }

    onPointerMove(event: GuiHoverEvent): void {
        super.onPointerMove(event)
        if (event.hoverStateChanged) this.notifyRedraw()
    }

    onPointerDown(event: GuiPointerDownEvent): boolean {
        const stateChanged = super.onPointerDown(event)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    onPointerUp(event: GuiPointerUpEvent): boolean {
        const stateChanged = super.onPointerUp(event)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    clicked(event: GuiPointerDownEvent) {
        super.clicked(event)
        this.publishEvent(new HideTooltip(this.tooltip))
    }

    onPointerLeave(): boolean {
        const stateChanged = super.onPointerLeave()
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        let img = this.imgNormal
        if (this.disabled) {
            img = this.imgDisabled || this.imgPressed || this.imgNormal
        } else if (this.pressed) {
            img = this.imgPressed || this.imgNormal
        } else if (this.hover) {
            img = this.imgHover || this.imgNormal
        }
        if (img && this.render) context.drawImage(img, this.x, this.y)
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
