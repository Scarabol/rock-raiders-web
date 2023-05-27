import { MenuCfg } from '../../cfg/MenuCfg'
import { BaseElement } from '../base/BaseElement'
import { MenuBasePanel } from './MenuBasePanel'
import { OffscreenCache } from '../../worker/OffscreenCache'
import { ChangePreferences } from '../../event/GuiCommand'

export class OptionsPanel extends MenuBasePanel {
    onRepeatBriefing: () => any = () => console.log('repeat mission briefing')
    onContinueMission: () => any = () => console.log('continue mission')

    constructor(parent: BaseElement, cfg: MenuCfg, width: number, height: number) {
        super(parent, cfg)
        this.width = width
        this.height = height
        const menu1 = this.layersByKey.get('menu1')
        const gameSpeedSlider = menu1.itemsSlider[0]
        gameSpeedSlider.setValue(OffscreenCache.offscreenPreferences.gameSpeed)
        gameSpeedSlider.onValueChanged = (value) => {
            OffscreenCache.offscreenPreferences.gameSpeed = value
            this.publishEvent(new ChangePreferences(OffscreenCache.offscreenPreferences))
        }
        const volumeSfxSlider = menu1.itemsSlider[1]
        volumeSfxSlider.setValue(OffscreenCache.offscreenPreferences.volumeSfx)
        volumeSfxSlider.onValueChanged = (value) => {
            OffscreenCache.offscreenPreferences.volumeSfx = value
            this.publishEvent(new ChangePreferences(OffscreenCache.offscreenPreferences))
        }
        const volumeMusicSlider = menu1.itemsSlider[2]
        volumeMusicSlider.disabled = true // TODO Implement background music
        volumeMusicSlider.setValue(OffscreenCache.offscreenPreferences.volumeMusic)
        volumeMusicSlider.onValueChanged = (value) => {
            OffscreenCache.offscreenPreferences.volumeMusic = value
            this.publishEvent(new ChangePreferences(OffscreenCache.offscreenPreferences))
        }
        const gameBrightnessSlider = menu1.itemsSlider[3]
        gameBrightnessSlider.setValue(OffscreenCache.offscreenPreferences.gameBrightness)
        gameBrightnessSlider.onValueChanged = (value) => {
            OffscreenCache.offscreenPreferences.gameBrightness = value
            this.publishEvent(new ChangePreferences(OffscreenCache.offscreenPreferences))
        }
        const showHelpWindowCycle = menu1.itemsCycle[0]
        showHelpWindowCycle.disabled = true // TODO Implement help window
        showHelpWindowCycle.setState(OffscreenCache.offscreenPreferences.showHelpWindow)
        showHelpWindowCycle.onStateChanged = (state) => {
            OffscreenCache.offscreenPreferences.showHelpWindow = state
            this.publishEvent(new ChangePreferences(OffscreenCache.offscreenPreferences))
        }
        menu1.itemsTrigger[0].onClick = () => this.onRepeatBriefing()
        menu1.itemsTrigger[1].onClick = () => this.onContinueMission()
    }
}
