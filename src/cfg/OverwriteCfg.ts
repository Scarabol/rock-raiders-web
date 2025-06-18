import { ConfigSetFromRecord } from './Configurable'
import { CfgEntry } from './CfgEntry'

export class OverwriteCfg implements ConfigSetFromRecord {
    title: string = ''
    text: string = ''
    ok: string = ''
    cancel: string = ''

    setFromRecord(cfgValue: CfgEntry): this {
        this.title = cfgValue.getValue('title').toLabel()
        this.text = cfgValue.getValue('text').toLabel()
        this.ok = cfgValue.getValue('ok').toLabel()
        this.cancel = cfgValue.getValue('cancel').toLabel()
        return this
    }
}
