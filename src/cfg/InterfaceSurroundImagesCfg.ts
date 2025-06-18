import { ConfigSetFromEntryValue } from './Configurable'
import { CfgEntryValue } from './CfgEntry'

export class InterfaceSurroundImagesEntryCfg implements ConfigSetFromEntryValue {
    imgName: string = ''
    val1: number = 0 // XXX clarify usage
    val2: number = 0 // XXX clarify usage
    val3: number = 0 // XXX clarify usage
    val4: number = 0 // XXX clarify usage
    imgNameWoBackName: string = ''
    woBack1: number = 0 // XXX clarify usage
    woBack2: number = 0 // XXX clarify usage

    setFromValue(cfgValue: CfgEntryValue): this {
        const array = cfgValue.toArray(':', 8)
        this.imgName = array[0].toFileName()
        this.val1 = array[1].toNumber()
        this.val2 = array[2].toNumber()
        this.val3 = array[3].toNumber()
        this.val4 = array[4].toNumber()
        this.imgNameWoBackName = array[5].toFileName()
        this.woBack1 = array[6].toNumber()
        this.woBack2 = array[7].toNumber()
        return this
    }
}
