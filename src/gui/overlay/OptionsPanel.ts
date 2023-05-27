import { MenuCfg } from '../../cfg/MenuCfg'
import { BaseElement } from '../base/BaseElement'
import { MenuBasePanel } from './MenuBasePanel'
import { OffscreenCache } from '../../worker/OffscreenCache'
import { ChangePreferences } from '../../event/GuiCommand'
import { MenuSliderItem } from './MenuSliderItem'
import { MenuCycleItem } from './MenuCycleItem'
import { EventKey } from '../../event/EventKeyEnum'

export class OptionsPanel extends MenuBasePanel {
    readonly gameSpeedSlider: MenuSliderItem
    readonly volumeSfxSlider: MenuSliderItem
    readonly volumeMusicSlider: MenuSliderItem
    readonly gameBrightnessSlider: MenuSliderItem
    readonly showHelpWindowCycle: MenuCycleItem

    onRepeatBriefing: () => any = () => console.log('repeat mission briefing')
    onContinueMission: () => any = () => console.log('continue mission')

    constructor(parent: BaseElement, cfg: MenuCfg, width: number, height: number) {
        super(parent, cfg)
        this.width = width
        this.height = height
        const menu1 = this.layersByKey.get('menu1')
        this.gameSpeedSlider = menu1.itemsSlider[0]
        this.gameSpeedSlider.onValueChanged = (value) => {
            OffscreenCache.offscreenPreferences.gameSpeed = value
            this.publishEvent(new ChangePreferences(OffscreenCache.offscreenPreferences))
        }
        this.volumeSfxSlider = menu1.itemsSlider[1]
        this.volumeSfxSlider.onValueChanged = (value) => {
            OffscreenCache.offscreenPreferences.volumeSfx = value
            this.publishEvent(new ChangePreferences(OffscreenCache.offscreenPreferences))
        }
        this.volumeMusicSlider = menu1.itemsSlider[2]
        this.volumeMusicSlider.disabled = true // TODO Implement background music
        this.volumeMusicSlider.onValueChanged = (value) => {
            OffscreenCache.offscreenPreferences.volumeMusic = value
            this.publishEvent(new ChangePreferences(OffscreenCache.offscreenPreferences))
        }
        this.gameBrightnessSlider = menu1.itemsSlider[3]
        this.gameBrightnessSlider.onValueChanged = (value) => {
            OffscreenCache.offscreenPreferences.gameBrightness = value
            this.publishEvent(new ChangePreferences(OffscreenCache.offscreenPreferences))
        }
        this.showHelpWindowCycle = menu1.itemsCycle[0]
        this.showHelpWindowCycle.disabled = true // TODO Implement help window
        this.showHelpWindowCycle.onStateChanged = (state) => {
            OffscreenCache.offscreenPreferences.showHelpWindow = state
            this.publishEvent(new ChangePreferences(OffscreenCache.offscreenPreferences))
        }
        menu1.itemsTrigger[0].onClick = () => this.onRepeatBriefing()
        menu1.itemsTrigger[1].onClick = () => this.onContinueMission()
        this.registerEventListener(EventKey.COMMAND_CHANGE_PREFERENCES, (event: ChangePreferences) => {
            OffscreenCache.offscreenPreferences = event.preferences
            this.setAllValues()
        })
    }

    show() {
        super.show()
        this.setAllValues()
    }

    private setAllValues() {
        this.gameSpeedSlider.setValue(OffscreenCache.offscreenPreferences.gameSpeed)
        this.volumeSfxSlider.setValue(OffscreenCache.offscreenPreferences.volumeSfx)
        this.volumeMusicSlider.setValue(OffscreenCache.offscreenPreferences.volumeMusic)
        this.gameBrightnessSlider.setValue(OffscreenCache.offscreenPreferences.gameBrightness)
        this.showHelpWindowCycle.setState(OffscreenCache.offscreenPreferences.showHelpWindow)
    }
}
