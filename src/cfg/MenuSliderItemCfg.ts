export class MenuSliderItemCfg {

    actionName: string
    x: number
    y: number
    width: number
    height: number
    description: string
    min: number
    max: number
    imgOff: string
    imgOn: string
    imgLeft: string
    imgRight: string
    btnLeftNormal: string
    btnRightNormal: string
    btnLeftHover: string
    btnRightHover: string

    constructor(cfgObj: any) {
        [this.actionName, this.x, this.y, this.width, this.height, this.description, this.min, this.max, this.imgOff, this.imgOn,
            this.imgLeft, this.imgRight, this.btnRightNormal, this.btnLeftNormal, this.btnRightHover, this.btnLeftHover] = cfgObj
    }

}
