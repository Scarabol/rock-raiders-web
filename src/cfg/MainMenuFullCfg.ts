import { MenuCfg } from './MenuCfg'
import { BaseConfig } from './BaseConfig'

export class MainMenuFullCfg extends BaseConfig {

    menuCount: number = 0
    menus: MenuCfg[] = []

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    assignValue(objKey, lCfgKeyName, cfgValue): boolean {
        if (lCfgKeyName.match(/menu\d+/i)) {
            this.menus.push(new MenuCfg(cfgValue))
            return true
        }
        return super.assignValue(objKey, lCfgKeyName, cfgValue)
    }

}
