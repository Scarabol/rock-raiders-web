import { Rect } from '../core/Rect'
import { ConfigSetFromRecord } from './Configurable'
import { CfgEntry } from './CfgEntry'

export class DialogCfg implements ConfigSetFromRecord {
    image: string = ''
    titleWindow: Rect = new Rect()
    textWindow: Rect = new Rect()
    okWindow: Rect = new Rect()
    cancelWindow: Rect = new Rect()
    contrastOverlay: string = ''

    setFromRecord(cfgValue: CfgEntry): this {
        this.image = cfgValue.getValue('Image').toFileName()
        this.titleWindow = Rect.fromArray(cfgValue.getValue('TitleWindow').toArray('|', 4).map((v) => v.toNumber()))
        this.textWindow = Rect.fromArray(cfgValue.getValue('TextWindow').toArray('|', 4).map((v) => v.toNumber()))
        this.okWindow = Rect.fromArray(cfgValue.getValue('OkWindow').toArray('|', 4).map((v) => v.toNumber()))
        this.cancelWindow = Rect.fromArray(cfgValue.getValue('CancelWindow').toArray('|', 4).map((v) => v.toNumber()))
        this.contrastOverlay = cfgValue.getValue('ContrastOverlay').toFileName()
        return this
    }
}
