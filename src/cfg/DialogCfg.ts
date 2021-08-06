import { Rect } from '../core/Rect'
import { BaseConfig } from './BaseConfig'

export class DialogCfg extends BaseConfig {
    image: string = null
    titleWindow: Rect = null
    textWindow: Rect = null
    okWindow: Rect = null
    cancelWindow: Rect = null
    contrastOverlay: string = null // not used in the game

    parseValue(unifiedKey: string, cfgValue: any): any {
        if (unifiedKey.endsWith('window')) {
            return Rect.fromArray(cfgValue)
        }
        return super.parseValue(unifiedKey, cfgValue)
    }
}
