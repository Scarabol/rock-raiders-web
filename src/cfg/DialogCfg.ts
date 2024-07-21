import { Rect } from '../core/Rect'
import { BaseConfig } from './BaseConfig'

export class DialogCfg extends BaseConfig {
    image?: string
    titleWindow?: Rect
    textWindow?: Rect
    okWindow?: Rect
    cancelWindow?: Rect
    contrastOverlay?: string

    parseValue(unifiedKey: string, cfgValue: any): any {
        if (unifiedKey.endsWith('window')) {
            return Rect.fromArray(cfgValue)
        }
        return super.parseValue(unifiedKey, cfgValue)
    }
}
