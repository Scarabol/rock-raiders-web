export class ButtonCfg {

    buttonType?: string
    normalFile?: string
    highlightFile?: string
    pressedFile?: string
    relX?: number
    relY?: number
    width?: number
    height?: number
    tooltip?: string

    constructor(cfg: any) {
        if (cfg.length === 9) {
            [this.buttonType, this.normalFile, this.highlightFile, this.pressedFile, this.relX, this.relY, this.width, this.height, this.tooltip] = cfg
        } else if (cfg.length === 5) {
            [this.width, this.height, this.highlightFile, this.pressedFile, this.tooltip] = cfg
        } else {
            throw 'Invalid number of arguments (' + cfg.length + ') given for button configuration expected 9 or 5'
        }
    }

}
