import { ConfigSetFromEntryValue, ConfigSetFromRecord } from './Configurable'
import { CfgEntry, CfgEntryValue } from './CfgEntry'

export class InfoMessagesCfg implements ConfigSetFromRecord {
    readonly infoGenericDeath: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()
    readonly infoGenericMonster: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()
    readonly infoCrystalFound: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()
    readonly infoUnderAttack: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()
    readonly infoLandslide: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()
    readonly infoPowerDrain: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()
    readonly infoSlugEmerge: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()
    readonly infoFoundMiniFigure: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()

    setFromRecord(cfgValue: CfgEntry): this {
        this.infoGenericDeath.setFromValue(cfgValue.getValue('Info_GenericDeath'))
        this.infoGenericMonster.setFromValue(cfgValue.getValue('Info_GenericMonster'))
        this.infoCrystalFound.setFromValue(cfgValue.getValue('Info_CrystalFound'))
        this.infoUnderAttack.setFromValue(cfgValue.getValue('Info_UnderAttack'))
        this.infoLandslide.setFromValue(cfgValue.getValue('Info_Landslide'))
        this.infoPowerDrain.setFromValue(cfgValue.getValue('Info_PowerDrain'))
        this.infoSlugEmerge.setFromValue(cfgValue.getValue('Info_SlugEmerge'))
        this.infoFoundMiniFigure.setFromValue(cfgValue.getValue('Info_FoundMiniFigure'))
        return this
    }
}

export class InfoMessagesEntryConfig implements ConfigSetFromEntryValue {
    message: string = ''
    buttonImageFilename: string = ''
    sfxName: string = ''
    timing: string = ''
    flag: string = ''

    setFromValue(cfgValue: CfgEntryValue): this {
        const array = cfgValue.toArray(':', undefined)
        if (array.length !== 4 && array.length !== 5) throw new Error(`Invalid array value (${array}) given; expected length of 4 or 5`)
        this.message = array[0].toLabel()
        this.buttonImageFilename = array[1].toFileName()
        this.sfxName = array[2].toString()
        this.timing = array[3].toString()
        this.flag = (array[4] || '').toString()
        return this
    }
}
