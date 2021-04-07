import { BaseButtonCfg } from '../../../cfg/ButtonsCfg'

export class InterfaceBackButtonCfg extends BaseButtonCfg {

    constructor(cfgValue: any) {
        super();
        [this.width, this.height, this.highlightFile, this.pressedFile, this.tooltip] = cfgValue // Interface back button
    }

}
