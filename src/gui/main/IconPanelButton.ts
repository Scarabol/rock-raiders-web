import { MenuItemCfg } from '../../cfg/ButtonCfg'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { ChangeTooltip } from '../../event/GuiCommand'
import { Sample } from '../../audio/Sample'

export class IconPanelButton extends Button {
    tooltipDisabled: string = null
    tooltipDisabledSfx: string = null
    hotkey: string = null
    isDisabled: () => boolean = () => this.disabled

    constructor(parent: BaseElement, menuItemCfg: MenuItemCfg, itemKey: string, parentWidth: number, menuIndex: number) {
        super(parent, menuItemCfg)
        this.buttonType = itemKey
        this.relX = parentWidth - 59
        this.relY = 9 + this.height * menuIndex
        this.hoverFrame = true
        this.tooltipDisabled = menuItemCfg.tooltipDisabled
        this.tooltipDisabledSfx = menuItemCfg.tooltipDisabledSfx
        this.hotkey = menuItemCfg.hotkey
        this.disabled = true
        this.onClick = () => console.log(`menu item pressed: ${this.buttonType}`)
    }

    showTooltipDisabled() {
        super.showTooltipDisabled()
        if (this.tooltipDisabled || this.tooltipDisabledSfx) {
            this.publishEvent(new ChangeTooltip(this.tooltipDisabled, this.tooltipDisabledSfx))
        }
    }

    reset() {
        super.reset()
        this.disabled = true
        this.updateState(false)
    }

    updateState(autoRedraw: boolean = true) {
        const targetState = !!this.isDisabled()
        const stateChanged = this.disabled !== targetState
        this.disabled = targetState
        if (stateChanged && autoRedraw) this.notifyRedraw()
        return stateChanged
    }
}
