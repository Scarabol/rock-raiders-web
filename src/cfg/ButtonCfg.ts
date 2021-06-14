import { BaseButtonCfg } from './BaseButtonCfg'

export class ButtonCfg extends BaseButtonCfg {

    constructor(cfgValue: any) {
        super()
        if (cfgValue.length === 9) {
            [this.buttonType, this.normalFile, this.highlightFile, this.pressedFile, this.relX, this.relY, this.width, this.height, this.tooltip] = cfgValue
        } else {
            throw new Error('Invalid number of arguments (' + cfgValue.length + ') given for button configuration expected 9 or 5')
        }
    }

}
