import { parseLabel } from './CfgHelper'

export class MenuLabelItemCfg {
    actionName: string
    x: number
    y: number
    label: string
    imgNormal: string
    imgHover: string
    imgPressed: string
    tooltip: string
    target: string
    flag: string // usage unclear

    constructor(cfgObj: any) {
        if (cfgObj.length === 5 || cfgObj.length === 6) {
            [this.actionName, this.x, this.y, this.label, this.target, this.flag] = cfgObj
            this.label = parseLabel(this.label)
        } else if (cfgObj.length === 8) {
            [this.actionName, this.x, this.y, this.imgNormal, this.imgHover, this.imgPressed, this.tooltip, this.target] = cfgObj
        } else {
            console.warn(`Unexpected cfg object length: ${cfgObj.length}`)
            console.log(cfgObj)
        }
    }
}
