import { MenuCfg } from '../../cfg/MenuCfg'
import { BaseElement } from '../base/BaseElement'
import { MenuBasePanel } from './MenuBasePanel'
import { SaveGameManager } from "../../resource/SaveGameManager"

export class OptionsPanel extends MenuBasePanel {
    onRepeatBriefing: () => any = () => console.log('repeat mission briefing')
    onContinueMission: () => any = () => console.log('continue mission')

    constructor(parent: BaseElement, cfg: MenuCfg, width: number, height: number) {
        super(parent, cfg)
        this.width = width
        this.height = height
        const menu1 = this.layersByKey.get('menu1')
        const gameSpeedSlider = menu1.itemsSlider[0]
        gameSpeedSlider.setValue(SaveGameManager.currentPreferences.gameSpeed)
        gameSpeedSlider.onValueChanged = (value) => {
            // TODO Actually change game speed
            console.error(`TODO Implement change game speed to ${value}`)
            SaveGameManager.currentPreferences.gameSpeed = value
        }
        const volumeSfxSlider = menu1.itemsSlider[1]
        volumeSfxSlider.setValue(SaveGameManager.currentPreferences.volumeSfx)
        volumeSfxSlider.onValueChanged = (value) => {
            // TODO Actually change SFX volume
            console.error(`TODO Implement change sfx volume to ${value}`)
            SaveGameManager.currentPreferences.volumeSfx = value
        }
        const volumeMusicSlider = menu1.itemsSlider[2]
        volumeMusicSlider.setValue(SaveGameManager.currentPreferences.volumeMusic)
        volumeMusicSlider.onValueChanged = (value) => {
            // TODO Actually change music volume
            console.error(`TODO Implement change music volume to ${value}`)
            SaveGameManager.currentPreferences.volumeMusic = value
        }
        const gameBrightnessSlider = menu1.itemsSlider[3]
        gameBrightnessSlider.setValue(SaveGameManager.currentPreferences.gameBrightness)
        gameBrightnessSlider.onValueChanged = (value) => {
            // TODO Actually change game brightness
            console.error(`TODO Implement change game brightness to ${value}`)
            SaveGameManager.currentPreferences.gameBrightness = value
        }
        const showHelpWindowCycle = menu1.itemsCycle[0]
        showHelpWindowCycle.setState(SaveGameManager.currentPreferences.showHelpWindow)
        showHelpWindowCycle.onStateChanged = (state) => {
            // TODO Actually change help window setting
            console.error(`TODO Implement change show help window to ${state}`)
            SaveGameManager.currentPreferences.showHelpWindow = state
        }
        menu1.itemsTrigger[0].onClick = () => this.onRepeatBriefing()
        menu1.itemsTrigger[1].onClick = () => this.onContinueMission()
    }
}
