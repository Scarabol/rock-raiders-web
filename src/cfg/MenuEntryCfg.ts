import { BaseConfig } from './BaseConfig'
import { MenuCycleItemCfg } from './MenuCycleItemCfg'
import { MenuLabelItemCfg } from './MenuLabelItemCfg'
import { MenuSliderItemCfg } from './MenuSliderItemCfg'

export class MenuEntryCfg extends BaseConfig {

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
    itemsLabel: MenuLabelItemCfg[] = []
    itemsSlider: MenuSliderItemCfg[] = []
    itemsCycle: MenuCycleItemCfg[] = []
    anchored: boolean = false
    canScroll: boolean = false

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    assignValue(objKey, lCfgKeyName, cfgValue): boolean {
        if (lCfgKeyName.match(/item\d+/i)) {
            const lActionName = cfgValue[0].toLowerCase()
            if (lActionName === 'next' || lActionName === 'trigger') {
                this.itemsLabel.push(new MenuLabelItemCfg(cfgValue))
            } else if (lActionName === 'slider') {
                this.itemsSlider.push(new MenuSliderItemCfg(cfgValue))
            } else if (lActionName === 'cycle') {
                this.itemsCycle.push(new MenuCycleItemCfg(cfgValue))
            } else {
                console.warn(`Unexpected item action name: ${cfgValue[0]}`)
                return false
            }
            return true
        } else if (lCfgKeyName.match(/overlay\d+/i)) {
            this.overlays.push(cfgValue)
            return true
        }
        return super.assignValue(objKey, lCfgKeyName, cfgValue)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        if (lCfgKeyName === 'fullName'.toLowerCase() || lCfgKeyName === 'title') {
            return cfgValue.replace(/_/g, ' ')
        } else {
            return super.parseValue(lCfgKeyName, cfgValue)
        }
    }

}
