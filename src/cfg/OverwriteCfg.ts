import { CfgHelper } from './CfgHelper'

export class OverwriteCfg {
    title: string = ''
    text: string = ''
    ok: string = ''
    cancel: string = ''

    setFromValue(cfgValue: Record<string, string>): void {
        this.title = CfgHelper.parseLabel(CfgHelper.getValue(cfgValue, 'title'))
        this.text = CfgHelper.parseLabel(CfgHelper.getValue(cfgValue, 'text'))
        this.ok = CfgHelper.parseLabel(CfgHelper.getValue(cfgValue, 'ok'))
        this.cancel = CfgHelper.parseLabel(CfgHelper.getValue(cfgValue, 'cancel'))
    }
}
