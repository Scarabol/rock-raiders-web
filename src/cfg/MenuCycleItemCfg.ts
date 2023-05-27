export class MenuCycleItemCfg {
    actionName: string
    x: number
    y: number
    width: number
    height: number
    description: string
    two: number // usage unclear
    labelOn: string
    labelOff: string

    constructor(cfgObj: any) {
        [this.actionName, this.x, this.y, this.width, this.height, this.description, this.two, this.labelOn, this.labelOff] = cfgObj
        this.description = this.description.replace(/_/g, ' ')
    }
}
