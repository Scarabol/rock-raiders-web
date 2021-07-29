export class ObjectiveImageCfg {
    filename: string
    x: number
    y: number

    constructor(cfgValue: any) {
        [this.filename, this.x, this.y] = cfgValue
    }
}
