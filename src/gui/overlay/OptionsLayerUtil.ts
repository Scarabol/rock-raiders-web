import { ChangePreferences } from '../../event/GuiCommand'
import { MenuLayer } from './MenuLayer'
import { EventKey } from '../../event/EventKeyEnum'
import { SaveGameManager } from '../../resource/SaveGameManager'

export function setupOptionsLayer(optionsLayer: MenuLayer, onRepeatBriefing: () => unknown) {
    const gameSpeedSlider = optionsLayer.itemsSlider[0]
    gameSpeedSlider.disabled = true // TODO Implement adjustable game speed
    gameSpeedSlider.onValueChanged = (value) => {
        SaveGameManager.currentPreferences.gameSpeed = value
        optionsLayer.publishEvent(new ChangePreferences())
    }
    const volumeSfxSlider = optionsLayer.itemsSlider[1]
    volumeSfxSlider.onValueChanged = (value) => {
        SaveGameManager.currentPreferences.volumeSfx = value
        optionsLayer.publishEvent(new ChangePreferences())
    }
    const volumeMusicSlider = optionsLayer.itemsSlider[2]
    volumeMusicSlider.disabled = true // TODO Implement background music
    volumeMusicSlider.onValueChanged = (value) => {
        SaveGameManager.currentPreferences.volumeMusic = value
        optionsLayer.publishEvent(new ChangePreferences())
    }
    const gameBrightnessSlider = optionsLayer.itemsSlider[3]
    gameBrightnessSlider.onValueChanged = (value) => {
        SaveGameManager.currentPreferences.gameBrightness = value
        optionsLayer.publishEvent(new ChangePreferences())
    }
    const showHelpWindowCycle = optionsLayer.itemsCycle[0]
    showHelpWindowCycle.disabled = true // TODO Implement help window
    showHelpWindowCycle.onStateChanged = (state) => {
        SaveGameManager.currentPreferences.showHelpWindow = state
        optionsLayer.publishEvent(new ChangePreferences())
    }
    optionsLayer.itemsTrigger[0].onClick = () => onRepeatBriefing()

    function updateAllValues() {
        gameSpeedSlider.setValue(SaveGameManager.currentPreferences.gameSpeed)
        volumeSfxSlider.setValue(SaveGameManager.currentPreferences.volumeSfx)
        volumeMusicSlider.setValue(SaveGameManager.currentPreferences.volumeMusic)
        gameBrightnessSlider.setValue(SaveGameManager.currentPreferences.gameBrightness)
        showHelpWindowCycle.setState(SaveGameManager.currentPreferences.showHelpWindow)
    }

    updateAllValues()

    optionsLayer.registerEventListener(EventKey.COMMAND_CHANGE_PREFERENCES, () => updateAllValues())

    const show = optionsLayer.show.bind(optionsLayer)
    optionsLayer.show = () => {
        show()
        updateAllValues()
    }
}
