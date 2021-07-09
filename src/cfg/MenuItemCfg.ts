import { BaseButtonCfg } from './BaseButtonCfg'
import { parseLabel } from './CfgHelper'

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
            this.tooltip = parseLabel(tooltip)
            this.tooltipDisabled = parseLabel(tooltipDisabled)
        } else {
            console.error(`Unexpected menu item cfg value length: ${cfgValue.length}`)
        }
        this.width = 40
        this.height = 40
    }

}
