import { BaseButtonCfg } from './ButtonsCfg'

export class MenuItemCfg extends BaseButtonCfg {

    tooltipDisabled: string
    hotkey: string

    constructor(cfgValue: any) {
        super();
        [this.normalFile, this.disabledFile, this.pressedFile, this.tooltip, this.tooltipDisabled, this.hotkey] = cfgValue
        this.width = 40
        this.height = 40
    }

}
