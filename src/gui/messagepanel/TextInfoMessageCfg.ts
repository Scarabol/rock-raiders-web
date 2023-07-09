import { BaseConfig } from '../../cfg/BaseConfig'
import { TextInfoMessageEntryCfg } from '../../cfg/TextInfoMessageEntryCfg'

export class TextInfoMessageCfg extends BaseConfig {
    textCrystalFound: TextInfoMessageEntryCfg = null
    textSpaceToContinue: TextInfoMessageEntryCfg = null
    textCavernDiscovered: TextInfoMessageEntryCfg = null
    textOreFound: TextInfoMessageEntryCfg = null
    textAirSupplyLow: TextInfoMessageEntryCfg = null
    textAirSupplyRunningOut: TextInfoMessageEntryCfg = null
    textGameCompleted: TextInfoMessageEntryCfg = null
    textManTrained: TextInfoMessageEntryCfg = null
    textUnitUpgraded: TextInfoMessageEntryCfg = null

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new TextInfoMessageEntryCfg(cfgValue)
    }
}
