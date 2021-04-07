export class MainMenuItemCfg {

    actionName: string
    x: number
    y: number
    label: string
    imgNormal: string
    imgHover: string
    imgPressed: string
    tooltip: string
    target: string
    flag: string

    constructor(cfgObj: any) {
        this.actionName = cfgObj[0]
        this.x = Number(cfgObj[1])
        this.y = Number(cfgObj[2])
        if (cfgObj.length === 5 || cfgObj.length === 6) {
            this.label = (Array.isArray(cfgObj[3]) ? cfgObj[3].join(',') : cfgObj[3]).replace(/_/g, ' ') // TODO improve cfg handling, remove join
            this.target = cfgObj[4]
            this.flag = cfgObj[5] || ''
        } else if (cfgObj.length === 8) {
            this.imgNormal = cfgObj[3]
            this.imgHover = cfgObj[4]
            this.imgPressed = cfgObj[5]
            this.tooltip = cfgObj[6]
        } else {
            console.warn('Unexpected cfg object length: ' + cfgObj.length)
        }
        this.target = cfgObj[cfgObj.length - 1]
    }

}
