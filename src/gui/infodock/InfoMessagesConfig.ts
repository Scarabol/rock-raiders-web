import { BaseConfig } from '../../cfg/BaseConfig'
import { InfoMessagesEntryConfig } from './InfoMessagesEntryConfig'

export class InfoMessagesConfig extends BaseConfig {

    infoGenericDeath: InfoMessagesEntryConfig = null
    infoGenericMonster: InfoMessagesEntryConfig = null
    infoCrystalFound: InfoMessagesEntryConfig = null
    infoUnderAttack: InfoMessagesEntryConfig = null
    infoLandslide: InfoMessagesEntryConfig = null
    infoPowerDrain: InfoMessagesEntryConfig = null
    infoSlugEmerge: InfoMessagesEntryConfig = null
    infoFoundMinifigure: InfoMessagesEntryConfig = null

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        return new InfoMessagesEntryConfig(cfgValue)
    }

}
