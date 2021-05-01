import { BaseButtonCfg } from './BaseButtonCfg'

export class MenuItemCfg extends BaseButtonCfg {

    tooltipSfx: string = null
    tooltipDisabled: string = null
    tooltipDisabledSfx: string = null
    hotkey: string = null

    constructor(cfgValue: any) {
        super()
        if (cfgValue.length === 4) {
            [this.normalFile, this.disabledFile, this.pressedFile, this.hotkey] = cfgValue
        } else if (cfgValue.length === 6 || cfgValue.length === 7) { // XXX 7th element is boolean, but usage unknown
            let tooltip, tooltipDisabled
            [this.normalFile, this.disabledFile, this.pressedFile, tooltip, tooltipDisabled, this.hotkey] = cfgValue
            if (tooltip) {
                if (Array.isArray(tooltip)) {
                    [this.tooltip, this.tooltipSfx] = tooltip
                } else {
                    this.tooltip = tooltip
                }
            }
            if (tooltipDisabled) {
                if (Array.isArray(tooltipDisabled)) {
                    [this.tooltipDisabled, this.tooltipDisabledSfx] = tooltipDisabled
                } else {
                    this.tooltipDisabled = tooltipDisabled
                }
            }
        } else {
            console.error('Unexpected menu item cfg value length: ' + cfgValue.length)
        }
        this.tooltip?.replace(/_/g, ' ') // TODO refactor cfg handling
        this.tooltipDisabled?.replace(/_/g, ' ') // TODO refactor cfg handling
        this.width = 40
        this.height = 40
    }

}
