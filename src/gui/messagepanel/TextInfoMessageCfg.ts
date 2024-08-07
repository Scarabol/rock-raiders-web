import { BaseConfig } from '../../cfg/BaseConfig'
import { TextInfoMessageEntryCfg } from '../../cfg/TextInfoMessageEntryCfg'

export class TextInfoMessageCfg extends BaseConfig {
    textCrystalFound: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg(['', '', ''])
    textSpaceToContinue: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg(['', '', ''])
    textCavernDiscovered: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg(['', '', ''])
    textOreFound: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg(['', '', ''])
    textAirSupplyLow: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg(['', '', ''])
    textAirSupplyRunningOut: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg(['', '', ''])
    textGameCompleted: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg(['', '', ''])
    textManTrained: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg(['', '', ''])
    textUnitUpgraded: TextInfoMessageEntryCfg = new TextInfoMessageEntryCfg(['', '', ''])

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new TextInfoMessageEntryCfg(cfgValue)
    }
}
