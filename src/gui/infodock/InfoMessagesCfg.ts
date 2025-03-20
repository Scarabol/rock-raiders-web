import { CfgHelper } from '../../cfg/CfgHelper'
import { InfoMessagesEntryConfig } from './InfoMessagesEntryConfig'

export class InfoMessagesCfg {
    readonly infoGenericDeath: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()
    readonly infoGenericMonster: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()
    readonly infoCrystalFound: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()
    readonly infoUnderAttack: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()
    readonly infoLandslide: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()
    readonly infoPowerDrain: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()
    readonly infoSlugEmerge: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()
    readonly infoFoundMiniFigure: InfoMessagesEntryConfig = new InfoMessagesEntryConfig()

    setFromValue(cfgValue: any): void {
        this.infoGenericDeath.setFromValue(CfgHelper.getValue(cfgValue, 'infoGenericDeath'))
        this.infoGenericMonster.setFromValue(CfgHelper.getValue(cfgValue, 'infoGenericMonster'))
        this.infoCrystalFound.setFromValue(CfgHelper.getValue(cfgValue, 'infoCrystalFound'))
        this.infoUnderAttack.setFromValue(CfgHelper.getValue(cfgValue, 'infoUnderAttack'))
        this.infoLandslide.setFromValue(CfgHelper.getValue(cfgValue, 'infoLandslide'))
        this.infoPowerDrain.setFromValue(CfgHelper.getValue(cfgValue, 'infoPowerDrain'))
        this.infoSlugEmerge.setFromValue(CfgHelper.getValue(cfgValue, 'infoSlugEmerge'))
        this.infoFoundMiniFigure.setFromValue(CfgHelper.getValue(cfgValue, 'infoFoundMiniFigure'))
    }
}
