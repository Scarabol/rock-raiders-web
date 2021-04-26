import { Rect } from '../core/Rect'
import { BaseConfig } from './BaseConfig'

export class DialogCfg extends BaseConfig {

    image: string = null
    titleWindow: Rect = null
    textWindow: Rect = null
    okWindow: Rect = null
    cancelWindow: Rect = null
    contrastOverlay: string = null // not used in the game

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        if (lCfgKeyName.endsWith('window')) {
            return new Rect(cfgValue)
        }
        return super.parseValue(lCfgKeyName, cfgValue)
    }

}
