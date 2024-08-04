import { BaseConfig } from '../../cfg/BaseConfig'
import { TextInfoMessageEntryCfg } from '../../cfg/TextInfoMessageEntryCfg'

export class TextInfoMessageCfg extends BaseConfig {
    textCrystalFound: TextInfoMessageEntryCfg
    textSpaceToContinue: TextInfoMessageEntryCfg
    textCavernDiscovered: TextInfoMessageEntryCfg
    textOreFound: TextInfoMessageEntryCfg
    textAirSupplyLow: TextInfoMessageEntryCfg
    textAirSupplyRunningOut: TextInfoMessageEntryCfg
    textGameCompleted: TextInfoMessageEntryCfg
    textManTrained: TextInfoMessageEntryCfg
    textUnitUpgraded: TextInfoMessageEntryCfg

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new TextInfoMessageEntryCfg(cfgValue)
    }
}
