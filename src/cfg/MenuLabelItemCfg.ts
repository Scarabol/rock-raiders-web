import { ConfigSetFromEntryValue } from './Configurable'
import { CfgEntryValue } from './CfgEntry'

export class MenuLabelItemCfg implements ConfigSetFromEntryValue {
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

    setFromValue(cfgValue: CfgEntryValue): this {
        const array = cfgValue.toArray(':', undefined)
        if (array.length === 5 || array.length === 6) {
            this.actionName = array[0].toString()
            this.x = array[1].toNumber()
            this.y = array[2].toNumber()
            this.label = array[3].toLabel()
            if (this.actionName.toLowerCase() === 'next') {
                this.target = array[4].toString()
            }
            this.flag = (array[5] || '').toString()
            if (this.flag && this.flag !== 'NotInTuto') console.warn(`Unexpected menu label flag (${this.flag}) given`)
        } else if (array.length === 8) {
            this.actionName = array[0].toString()
            this.x = array[1].toNumber()
            this.y = array[2].toNumber()
            this.imgNormal = array[3].toFileName()
            this.imgHover = array[4].toFileName()
            this.imgPressed = array[5].toFileName()
            this.tooltipKey = array[6].toFileName()
            if (this.actionName.toLowerCase() === 'next') {
                this.target = array[7].toString()
            }
        } else {
            throw new Error(`Unexpected cfg value length: ${array.length}`)
        }
        return this
    }
}
