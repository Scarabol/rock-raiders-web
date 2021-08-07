import { BaseConfig } from '../../cfg/BaseConfig'
import { TextInfoMessageEntryConfig } from './TextInfoMessageEntryConfig'

export class TextInfoMessageCfg extends BaseConfig {
    textCrystalFound: TextInfoMessageEntryConfig = null
    textSpaceToContinue: TextInfoMessageEntryConfig = null
    textCavernDiscovered: TextInfoMessageEntryConfig = null
    textOreFound: TextInfoMessageEntryConfig = null
    textAirSupplyLow: TextInfoMessageEntryConfig = null
    textAirSupplyRunningOut: TextInfoMessageEntryConfig = null
    textGameCompleted: TextInfoMessageEntryConfig = null
    textManTrained: TextInfoMessageEntryConfig = null
    textUnitUpgraded: TextInfoMessageEntryConfig = null

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new TextInfoMessageEntryConfig(cfgValue)
    }
}
