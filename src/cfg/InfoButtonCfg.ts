import { BaseButtonCfg } from './BaseButtonCfg'

export class InfoButtonCfg extends BaseButtonCfg {

    constructor(buttonImageFilename: string) {
        super()
        this.normalFile = buttonImageFilename
        this.highlightFile = buttonImageFilename
        this.pressedFile = buttonImageFilename
        this.disabledFile = buttonImageFilename
        this.relX = 0
        this.relY = 0
    }

}
