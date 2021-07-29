import { BaseButtonCfg } from './BaseButtonCfg'

export class IconPanelBackButtonCfg extends BaseButtonCfg {
    constructor(cfgValue: any) {
        super();
        [this.width, this.height, this.highlightFile, this.pressedFile, this.tooltip] = cfgValue // Interface back button
        this.relX = 4
        this.relY = 14
    }
}
