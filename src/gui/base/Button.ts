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
    buttonType: string
    imgNormal: SpriteImage | undefined
    imgHover: SpriteImage | undefined
    imgPressed: SpriteImage | undefined
    imgDisabled: SpriteImage | undefined
    tooltip: string
    tooltipSfx: string
    hoverFrame: boolean = false
    blink: boolean = false
    blinkInterval: NodeJS.Timeout | undefined

    constructor(btnCfgPart: Partial<BaseButtonCfg>, readonly blinkingByDefault: boolean = false) {
        super()
        const btnCfg = Object.assign(new BaseButtonCfg(), btnCfgPart)
        this.buttonType = btnCfg.buttonType
        if (btnCfg.normalFile) this.imgNormal = ResourceManager.getImageOptional(btnCfg.normalFile)
        if (btnCfg.highlightFile) this.imgHover = ResourceManager.getImageOptional(btnCfg.highlightFile)
        if (btnCfg.pressedFile) this.imgPressed = ResourceManager.getImageOptional(btnCfg.pressedFile)
        if (btnCfg.disabledFile) this.imgDisabled = ResourceManager.getImageOptional(btnCfg.disabledFile)
        this.relX = btnCfg.relX
        this.relY = btnCfg.relY
        this.width = Button.ignoreUndefinedMax(btnCfg.width, this.imgNormal?.width, this.imgPressed?.width, this.imgHover?.width)
        this.height = Button.ignoreUndefinedMax(btnCfg.height, this.imgNormal?.height, this.imgPressed?.height, this.imgHover?.height)
        this.tooltip = GameConfig.instance.getTooltipText(btnCfg.tooltipKey) || btnCfg.tooltipText
        this.tooltipSfx = btnCfg.tooltipSfx
        this.updatePosition()
        this.onClick = () => console.log(`button pressed: ${this.buttonType}`)
        if (blinkingByDefault) this.startBlinking()
        EventBroker.subscribe(EventKey.GUI_BUTTON_BLINK, (event: GuiButtonBlinkEvent) => {
            if (this.buttonType.toLowerCase() !== event.buttonType.toLowerCase()) return
            if (event.blinking) {
                if (!this.blinkInterval) this.startBlinking()
            } else {
                if (this.blinkInterval) this.stopBlinking()
            }
        })
    }

    private static ignoreUndefinedMax(...numbers: (number | undefined)[]): number {
        return Math.max(...numbers.map((n) => n || 0))
    }

    startBlinking() {
        this.stopBlinking()
        this.blinkInterval = setInterval(() => {
            this.blink = !this.blink
            this.notifyRedraw()
        }, 500)
    }

    private stopBlinking() {
        this.blinkInterval = clearIntervalSafe(this.blinkInterval)
        this.blink = false
        this.notifyRedraw()
    }

    override reset() {
        super.reset()
        if (this.blinkingByDefault) {
            this.startBlinking()
        } else {
            this.stopBlinking()
        }
    }

    override onHoverStart(): void {
        super.onHoverStart()
        if (this.isInactive()) {
            this.showTooltipDisabled()
        } else if (this.tooltip || this.tooltipSfx) {
            this.showTooltip()
        }
    }

    override onHoverEnd() {
        super.onHoverEnd()
        this.publishEvent(new HideTooltip(this.tooltip))
    }

    showTooltip() {
        this.publishEvent(new ChangeTooltip(this.tooltip, 0, this.tooltipSfx, TOOLTIP_DELAY_SFX))
    }

    showTooltipDisabled() {
    }

    override onPointerMove(event: GuiHoverEvent): void {
        super.onPointerMove(event)
        if (event.hoverStateChanged) this.notifyRedraw()
    }

    override onPointerDown(event: GuiPointerDownEvent): boolean {
        const stateChanged = super.onPointerDown(event)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    override onPointerUp(event: GuiPointerUpEvent): boolean {
        const stateChanged = super.onPointerUp(event)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    override clicked(event: GuiPointerDownEvent) {
        super.clicked(event)
        this.publishEvent(new HideTooltip(this.tooltip))
    }

    override onPointerLeave(): boolean {
        const stateChanged = super.onPointerLeave()
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    override onRedraw(context: SpriteContext) {
        if (this.hidden) return
        let img = this.imgNormal
        if (this.disabled) {
            img = this.imgDisabled || this.imgPressed || this.imgNormal
        } else if (this.pressed) {
            img = this.imgPressed || this.imgNormal
        } else if (this.hover || this.blinkInterval) {
            img = this.imgHover || this.imgNormal
        }
        if (img && !this.blink) context.drawImage(img, this.x, this.y)
        super.onRedraw(context)
    }

    override drawHover(context: SpriteContext) {
        super.drawHover(context)
        if (!this.disabled && this.hover && this.hoverFrame) {
            context.strokeStyle = '#0f0'
            context.lineWidth = 2
            context.strokeRect(this.x - context.lineWidth / 2, this.y - context.lineWidth / 2, this.width + context.lineWidth - 1, this.height + context.lineWidth - 1)
        }
    }
}
