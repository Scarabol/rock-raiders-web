import { BaseConfig } from './BaseConfig'
import { MenuEntryCfg } from './MenuEntryCfg'

export class MenuCfg extends BaseConfig {
    menuCount: number = 0
    menus: MenuEntryCfg[] = []

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    assignValue(objKey, lCfgKeyName, cfgValue): boolean {
        if (lCfgKeyName.match(/menu\d+/i)) {
            this.menus.push(new MenuEntryCfg(cfgValue))
            return true
        }
        return super.assignValue(objKey, lCfgKeyName, cfgValue)
    }
}
