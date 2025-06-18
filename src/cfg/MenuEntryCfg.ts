import { MenuCycleItemCfg } from './MenuCycleItemCfg'
import { MenuLabelItemCfg } from './MenuLabelItemCfg'
import { MenuSliderItemCfg } from './MenuSliderItemCfg'
import { ConfigSetFromEntryValue, ConfigSetFromRecord } from './Configurable'
import { CfgEntry, CfgEntryValue } from './CfgEntry'

export class MenuEntryCfg implements ConfigSetFromRecord {
    fullName: string = ''
    title: string = ''
    position: { x: number, y: number } = {x: 0, y: 0}
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
    anchored: { x: number, y: number } = {x: 0, y: 0}
    canScroll: boolean = false

    setFromRecord(cfgValue: CfgEntry): this {
        this.fullName = cfgValue.getValue('FullName').toLabel()
        this.title = cfgValue.getValue('Title').toLabel()
        this.position = cfgValue.getValue('Position').toPos(':')
        this.menuFont = cfgValue.getValue('MenuFont').toFileName()
        this.loFont = cfgValue.getValue('LoFont').toFileName()
        this.hiFont = cfgValue.getValue('HiFont').toFileName()
        this.itemCount = cfgValue.getValue('ItemCount').toNumber()
        const menuImgVal = cfgValue.getValue('MenuImage')
        this.menuImage = menuImgVal.toArray(':', undefined)[0].toFileName()
        this.autoCenter = cfgValue.getValue('AutoCenter').toBoolean()
        this.displayTitle = cfgValue.getValue('DisplayTitle').toBoolean()
        cfgValue.forEachCfgEntryValue((value, key) => {
            if (key.match(/Overlay\d+/i)) {
                this.overlays.push(new MenuEntryOverlayCfg().setFromValue(value))
            }
        })
        this.playRandom = cfgValue.getValue('PlayRandom').toBoolean()
        cfgValue.forEachCfgEntryValue((value, key) => {
            if (!key.match(/Item\d+/i)) return
            if (value.toArray(':', undefined)[0].toString().match(/Next|Trigger/i)) {
                this.itemsLabel.push(new MenuLabelItemCfg().setFromValue(value))
            } else if (value.toArray(':', undefined)[0].toString().match(/Slider/i)) {
                this.itemsSlider.push(new MenuSliderItemCfg().setFromValue(value))
            } else if (value.toArray(':', undefined)[0].toString().match(/Cycle/i)) {
                this.itemsCycle.push(new MenuCycleItemCfg().setFromValue(value))
            }
        })
        this.anchored = cfgValue.getValue('Anchored').toPos(':')
        this.canScroll = cfgValue.getValue('CanScroll').toBoolean()
        return this
    }
}

export class MenuEntryOverlayCfg implements ConfigSetFromEntryValue {
    flhFilepath: string = ''
    sfxName: string = ''
    x: number = 0
    y: number = 0

    setFromValue(cfgValue: CfgEntryValue): this {
        const value = cfgValue.toArray(':', 4)
        this.flhFilepath = `Data/${(value[0].toFileName())}`
        this.sfxName = value[1].toString()
        if (this.sfxName.equalsIgnoreCase('SFX_NULL')) this.sfxName = ''
        this.x = value[2].toNumber()
        this.y = value[3].toNumber()
        return this
    }
}
