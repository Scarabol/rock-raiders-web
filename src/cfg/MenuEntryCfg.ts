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
    anchored: number[] = [0, 0]
    canScroll: boolean = false

    assignValue(objKey, unifiedKey, cfgValue): boolean {
        if (unifiedKey.match(/item\d+/i)) {
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
        } else if (unifiedKey.match(/overlay\d+/i)) {
            this.overlays.push(cfgValue)
            return true
        }
        return super.assignValue(objKey, unifiedKey, cfgValue)
    }

    parseValue(unifiedKey: string, cfgValue: any): any {
        if (unifiedKey === 'fullName'.toLowerCase() || unifiedKey === 'title') {
            return cfgValue.replace(/_/g, ' ')
        } else {
            return super.parseValue(unifiedKey, cfgValue)
        }
    }
}
