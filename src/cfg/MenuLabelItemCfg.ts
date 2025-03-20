import { CfgHelper } from './CfgHelper'

export class MenuLabelItemCfg {
    actionName: string = ''
    x: number = 0
    y: number = 0
    label: string = ''
    imgNormal: string = ''
    imgHover: string = ''
    imgPressed: string = ''
    tooltipKey: string = ''
    target: string = ''
    flag: string = ''

    constructor(cfgObj: any) {
        if (cfgObj.length === 5 || cfgObj.length === 6) {
            this.actionName = CfgHelper.assertString(cfgObj[0])
            this.x = CfgHelper.assertNumber(cfgObj[1])
            this.y = CfgHelper.assertNumber(cfgObj[2])
            this.label = CfgHelper.parseLabel(cfgObj[3])
            if (this.actionName.toLowerCase() === 'next') {
                this.target = CfgHelper.assertString(cfgObj[4])
            }
            this.flag = CfgHelper.assertString(cfgObj[5] || '')
            if (this.flag && this.flag !== 'NotInTuto') console.warn(`Unexpected menu label flag (${this.flag}) given`)
        } else if (cfgObj.length === 8) {
            this.actionName = CfgHelper.assertString(cfgObj[0])
            this.x = CfgHelper.assertNumber(cfgObj[1])
            this.y = CfgHelper.assertNumber(cfgObj[2])
            this.imgNormal = CfgHelper.assertString(cfgObj[3])
            this.imgHover = CfgHelper.assertString(cfgObj[4])
            this.imgPressed = CfgHelper.assertString(cfgObj[5])
            this.tooltipKey = CfgHelper.assertString(cfgObj[6])
            if (this.actionName.toLowerCase() === 'next') {
                this.target = CfgHelper.assertString(cfgObj[7])
            }
        } else {
            throw new Error(`Unexpected cfg object length: ${cfgObj.length}`)
        }
    }
}
