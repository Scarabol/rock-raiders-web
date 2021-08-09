import { BaseConfig } from './BaseConfig'
import { MenuEntryCfg } from './MenuEntryCfg'

export class MenuCfg extends BaseConfig {
    // noinspection JSUnusedGlobalSymbols
    menuCount: number = 0
    menus: MenuEntryCfg[] = []

    assignValue(objKey: string, unifiedKey: string, cfgValue: any): boolean {
        if (unifiedKey.match(/menu\d+/i)) {
            this.menus.push(new MenuEntryCfg().setFromCfgObj(cfgValue))
            return true
        }
        return super.assignValue(objKey, unifiedKey, cfgValue)
    }
}
