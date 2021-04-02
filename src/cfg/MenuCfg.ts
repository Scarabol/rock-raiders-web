import { MainMenuItemCfg } from './MainMenuItemCfg'
import { BaseConfig } from './BaseConfig'

export class MenuCfg extends BaseConfig {

    fullName: string = ''
    title: string = ''
    position: [number, number] = [0, 0]
    menuFont: string = ''
    loFont: string = ''
    hiFont: string = ''
    itemCount: number = 0
    menuImage: string = ''
    autoCenter: boolean = false
    displayTitle: boolean = false
    overlays: any[] = []
    playRandom: boolean = false
    items: MainMenuItemCfg[] = []
    anchored: boolean = false
    canScroll: boolean = false

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    assignValue(objKey, lCfgKeyName, cfgValue): boolean {
        if (lCfgKeyName.match(/item\d+/i)) {
            this.items.push(new MainMenuItemCfg(cfgValue))
            return true
        } else if (lCfgKeyName.match(/overlay\d+/i)) {
            this.overlays.push(cfgValue)
            return true
        }
        return super.assignValue(objKey, lCfgKeyName, cfgValue)
    }

}
