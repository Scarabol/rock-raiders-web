import { ConfigSetFromEntryValue } from './Configurable'
import { CfgEntryValue } from './CfgEntry'

export class MenuCycleItemCfg implements ConfigSetFromEntryValue {
    actionName: string = ''
    x: number = 0
    y: number = 0
    width: number = 0
    height: number = 0
    description: string = ''
    two: number = 2 // XXX usage unclear
    labelOn: string = ''
    labelOff: string = ''

    setFromValue(cfgValue: CfgEntryValue): this {
        const array = cfgValue.toArray(':', 9)
        this.actionName = array[0].toString()
        this.x = array[1].toNumber()
        this.y = array[2].toNumber()
        this.width = array[3].toNumber()
        this.height = array[4].toNumber()
        this.description = array[5].toLabel()
        this.two = array[6].toNumber()
        this.labelOn = array[7].toLabel()
        this.labelOff = array[8].toLabel()
        return this
    }
}
