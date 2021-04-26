import { BaseConfig } from '../../cfg/BaseConfig'
import { TextInfoMessageEntryConfig } from './TextInfoMessageEntryConfig'

export class TextInfoMessageConfig extends BaseConfig {

    textCrystalFound: TextInfoMessageEntryConfig = null
    textSpaceToContinue: TextInfoMessageEntryConfig = null
    textCavernDiscovered: TextInfoMessageEntryConfig = null
    textOreFound: TextInfoMessageEntryConfig = null
    textAirSupplyLow: TextInfoMessageEntryConfig = null
    textAirSupplyRunningOut: TextInfoMessageEntryConfig = null
    textGameCompleted: TextInfoMessageEntryConfig = null
    textManTrained: TextInfoMessageEntryConfig = null
    textUnitUpgraded: TextInfoMessageEntryConfig = null

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        return new TextInfoMessageEntryConfig(cfgValue)
    }

}
