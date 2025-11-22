import { ConfigSetFromEntryValue, ConfigSetFromRecord } from './Configurable'
import { CfgEntry, CfgEntryValue } from './CfgEntry'

export class TextInfoMessageCfg implements ConfigSetFromRecord {
    textCrystalFound: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg()
    textSpaceToContinue: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg()
    textCavernDiscovered: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg()
    textOreFound: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg()
    textAirSupplyLow: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg()
    textAirSupplyRunningOut: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg()
    textGameCompleted: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg()
    textManTrained: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg()
    textUnitUpgraded: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg()

    setFromRecord(cfgValue: CfgEntry): this {
        this.textCrystalFound.setFromValue(cfgValue.getValue('Text_CrystalFound'))
        this.textSpaceToContinue.setFromValue(cfgValue.getValue('Text_SpaceToContinue'))
        this.textCavernDiscovered.setFromValue(cfgValue.getValue('Text_CavernDiscovered'))
        this.textOreFound.setFromValue(cfgValue.getValue('Text_OreFound'))
        this.textAirSupplyLow.setFromValue(cfgValue.getValue('Text_AirSupplyLow'))
        this.textAirSupplyRunningOut.setFromValue(cfgValue.getValue('Text_AirSupplyRunningOut'))
        this.textGameCompleted.setFromValue(cfgValue.getValue('Text_GameCompleted'))
        this.textManTrained.setFromValue(cfgValue.getValue('Text_ManTrained'))
        this.textUnitUpgraded.setFromValue(cfgValue.getValue('Text_UnitUpgraded'))
        return this
    }
}

export class TextInfoMessageEntryCfg implements ConfigSetFromEntryValue {
    text: string = ''
    imageFilename: string = ''
    sfxName: string = ''

    setFromValue(cfgValue: CfgEntryValue): this {
        const array = cfgValue.toArray(':', 3)
        this.text = array[0].toLabel()
        this.imageFilename = array[1].toFileName()
        this.sfxName = array[2].toString()
        return this
    }
}
