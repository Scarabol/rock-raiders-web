import { ConfigSetFromEntryValue } from './Configurable'
import { CfgEntryValue } from './CfgEntry'

export class MenuSliderItemCfg implements ConfigSetFromEntryValue {
    actionName: string = ''
    x: number = 0
    y: number = 0
    width: number = 0
    height: number = 0
    description: string = ''
    min: number = 0
    max: number = 0
    imgOff: string = ''
    imgOn: string = ''
    imgLeft: string = ''
    imgRight: string = ''
    btnLeftNormal: string = ''
    btnRightNormal: string = ''
    btnLeftHover: string = ''
    btnRightHover: string = ''

    setFromValue(cfgValue: CfgEntryValue): this {
        const array = cfgValue.toArray(':', 16)
        this.actionName = array[0].toString()
        this.x = array[1].toNumber()
        this.y = array[2].toNumber()
        this.width = array[3].toNumber()
        this.height = array[4].toNumber()
        this.description = array[5].toLabel()
        this.min = array[6].toNumber()
        this.max = array[7].toNumber()
        this.imgOff = array[8].toFileName()
        this.imgOn = array[9].toFileName()
        this.imgLeft = array[10].toFileName()
        this.imgRight = array[11].toFileName()
        this.btnRightNormal = array[12].toFileName()
        this.btnLeftNormal = array[13].toFileName()
        this.btnRightHover = array[14].toFileName()
        this.btnLeftHover = array[15].toFileName()
        return this
    }
}
