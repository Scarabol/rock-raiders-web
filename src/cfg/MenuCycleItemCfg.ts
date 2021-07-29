export class MenuCycleItemCfg {
    actionName: string
    x: number
    y: number
    width: number
    height: number
    description: string
    two: number // usage unclear
    labelOff: string
    labelOn: string

    constructor(cfgObj: any) {
        [this.actionName, this.x, this.y, this.width, this.height, this.description, this.two, this.labelOff, this.labelOn] = cfgObj
        this.description = this.description.replace(/_/g, ' ')
    }
}
