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
    overlays: MenuEntryOverlayCfg[] = []
    playRandom: boolean = false
    itemsLabel: MenuLabelItemCfg[] = []
    itemsSlider: MenuSliderItemCfg[] = []
    itemsCycle: MenuCycleItemCfg[] = []
    anchored: number[] = [0, 0]
    canScroll: boolean = false

    assignValue(objKey: string, unifiedKey: string, cfgValue: any): boolean {
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
            this.overlays.push(new MenuEntryOverlayCfg(cfgValue))
            return true
        }
        return super.assignValue(objKey, unifiedKey, cfgValue)
    }

    parseValue(unifiedKey: string, cfgValue: any): any {
        if (unifiedKey === 'fullname' || unifiedKey === 'title') {
            return cfgValue.replace(/_/g, ' ')
        } else if (unifiedKey === 'menuimage') { // XXX What mean numbers behind the image file name? Like: ...bmp,0,0,1
            return (Array.isArray(cfgValue) ? cfgValue[0] : cfgValue)?.toLowerCase()
        } else {
            return super.parseValue(unifiedKey, cfgValue)
        }
    }
}

export class MenuEntryOverlayCfg {
    flhFilepath: string
    sfxName: string
    x: number
    y: number

    constructor(cfgValue: any) {
        [this.flhFilepath, this.sfxName, this.x, this.y] = cfgValue
        this.flhFilepath = `Program Data Files/Data/${this.flhFilepath}`
        if (this.sfxName.equalsIgnoreCase('SFX_NULL')) this.sfxName = ''
    }
}
