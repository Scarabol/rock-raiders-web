import { ConfigSetFromEntryValue } from './Configurable'
import { CfgEntryValue } from './CfgEntry'

export class RockFallStyle implements ConfigSetFromEntryValue {
    itemNull: string = '' // XXX Usage unclear
    threeSides: string = ''
    outsideCorner: string = ''
    tunnel: string = ''

    setFromValue(cfgValue: CfgEntryValue): this {
        const array = cfgValue.toArray(',', 4)
        this.itemNull = array[0].toString()
        this.threeSides = array[1].toFileName()
        this.outsideCorner = array[2].toFileName()
        this.tunnel = array[3].toFileName()
        return this
    }
}
