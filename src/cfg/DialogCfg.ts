import { Rect } from '../core/Rect'
import { BaseConfig } from './BaseConfig'

export class DialogCfg extends BaseConfig {
    image: string = ''
    titleWindow: Rect = new Rect()
    textWindow: Rect = new Rect()
    okWindow: Rect = new Rect()
    cancelWindow: Rect = new Rect()
    contrastOverlay: string = ''

    parseValue(unifiedKey: string, cfgValue: any): any {
        if (unifiedKey.endsWith('window')) {
            return Rect.fromArray(cfgValue)
        }
        return super.parseValue(unifiedKey, cfgValue)
    }
}
