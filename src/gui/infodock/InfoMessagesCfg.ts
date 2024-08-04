import { BaseConfig } from '../../cfg/BaseConfig'
import { InfoMessagesEntryConfig } from './InfoMessagesEntryConfig'

export class InfoMessagesCfg extends BaseConfig {
    infoGenericDeath: InfoMessagesEntryConfig
    infoGenericMonster: InfoMessagesEntryConfig
    infoCrystalFound: InfoMessagesEntryConfig
    infoUnderAttack: InfoMessagesEntryConfig
    infoLandslide: InfoMessagesEntryConfig
    infoPowerDrain: InfoMessagesEntryConfig
    infoSlugEmerge: InfoMessagesEntryConfig
    infoFoundMinifigure: InfoMessagesEntryConfig

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new InfoMessagesEntryConfig(cfgValue)
    }
}
