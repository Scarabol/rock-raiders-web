export class PanelCfg {

    filename: string
    xOut: number
    yOut: number
    xIn: number
    yIn: number

    constructor(cfgValue: any) {
        [this.filename, this.xOut, this.yOut, this.xIn, this.yIn] = cfgValue
    }

}
