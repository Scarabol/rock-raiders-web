import { parseLabel } from './CfgHelper'

export class MenuLabelItemCfg {
    actionName?: string
    x?: number
    y?: number
    label?: string
    imgNormal?: string
    imgHover?: string
    imgPressed?: string
    tooltipKey?: string
    target?: string
    flag?: string

    constructor(cfgObj: any) {
        if (cfgObj.length === 5 || cfgObj.length === 6) {
            [this.actionName, this.x, this.y, this.label, this.target, this.flag] = cfgObj
            this.label = parseLabel(this.label)
            if (this.flag && this.flag !== 'NotInTuto') console.warn('Unexpected menu label flag given', this.flag)
        } else if (cfgObj.length === 8) {
            [this.actionName, this.x, this.y, this.imgNormal, this.imgHover, this.imgPressed, this.tooltipKey, this.target] = cfgObj
        } else {
            console.warn(`Unexpected cfg object length: ${cfgObj.length}`)
            console.log(cfgObj)
        }
    }
}
