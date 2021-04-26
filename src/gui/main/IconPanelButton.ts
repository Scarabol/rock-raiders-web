import { MenuItemCfg } from '../../cfg/MenuItemCfg'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'

export class IconPanelButton extends Button {

    tooltipSfx: string = null
    tooltipDisabled: string = null
    tooltipDisabledSfx: string = null
    hotkey: string = null
    isDisabled: () => boolean = () => this.disabled

    constructor(parent: BaseElement, menuItemCfg: MenuItemCfg, itemKey: string, parentWidth: number, menuIndex: number) {
        super(parent, menuItemCfg)
        this.buttonType = itemKey
        this.relX = parentWidth - 59
        this.relY = 9 + this.height * menuIndex
        this.tooltipSfx = menuItemCfg.tooltipSfx
        this.tooltipDisabled = menuItemCfg.tooltipDisabled
        this.tooltipDisabledSfx = menuItemCfg.tooltipDisabledSfx
        this.hotkey = menuItemCfg.hotkey
        this.disabled = true
    }

    reset() {
        super.reset()
        this.disabled = true
        this.updateState(false)
    }

    onClick() {
        console.log('menu item pressed: ' + this.buttonType)
    }

    updateState(autoRedraw: boolean = true) {
        const targetState = !!this.isDisabled()
        const stateChanged = this.disabled !== targetState
        this.disabled = targetState
        if (stateChanged && autoRedraw) this.notifyRedraw()
        return stateChanged
    }

    drawHover(context: CanvasRenderingContext2D) {
        super.drawHover(context)
        if (!this.disabled && this.hover) {
            context.strokeStyle = '#0f0'
            context.lineWidth = 2
            context.strokeRect(this.x - context.lineWidth / 2, this.y - context.lineWidth / 2, this.width + context.lineWidth - 1, this.height + context.lineWidth - 1)
        }
    }

}
