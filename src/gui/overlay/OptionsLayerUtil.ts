import { ChangePreferences } from '../../event/GuiCommand'
import { MenuLayer } from './MenuLayer'
import { EventKey } from '../../event/EventKeyEnum'
import { SaveGameManager } from '../../resource/SaveGameManager'

export function setupOptionsLayer(optionsLayer: MenuLayer, onRepeatBriefing: () => unknown) {
    const gameSpeedSlider = optionsLayer.itemsSlider[0]
    gameSpeedSlider.onValueChanged = (value) => {
        SaveGameManager.preferences.gameSpeed = value
        optionsLayer.publishEvent(new ChangePreferences())
    }
    const volumeSfxSlider = optionsLayer.itemsSlider[1]
    volumeSfxSlider.onValueChanged = (value) => {
        SaveGameManager.preferences.volumeSfx = value
        optionsLayer.publishEvent(new ChangePreferences())
    }
    const volumeMusicSlider = optionsLayer.itemsSlider[2]
    volumeMusicSlider.onValueChanged = (value) => {
        SaveGameManager.preferences.volumeMusic = value
        optionsLayer.publishEvent(new ChangePreferences())
    }
    const gameBrightnessSlider = optionsLayer.itemsSlider[3]
    gameBrightnessSlider.onValueChanged = (value) => {
        SaveGameManager.preferences.gameBrightness = value
        optionsLayer.publishEvent(new ChangePreferences())
    }
    const showHelpWindowCycle = optionsLayer.itemsCycle[0]
    showHelpWindowCycle.disabled = true // TODO Implement help window
    showHelpWindowCycle.onStateChanged = (state) => {
        SaveGameManager.preferences.showHelpWindow = state
        optionsLayer.publishEvent(new ChangePreferences())
    }
    optionsLayer.itemsTrigger[0].onClick = () => onRepeatBriefing()

    function updateAllValues() {
        gameSpeedSlider.setValue(SaveGameManager.preferences.gameSpeed)
        volumeSfxSlider.setValue(SaveGameManager.preferences.volumeSfx)
        volumeMusicSlider.setValue(SaveGameManager.preferences.volumeMusic)
        gameBrightnessSlider.setValue(SaveGameManager.preferences.gameBrightness)
        showHelpWindowCycle.setState(SaveGameManager.preferences.showHelpWindow)
    }

    updateAllValues()

    optionsLayer.registerEventListener(EventKey.COMMAND_CHANGE_PREFERENCES, () => updateAllValues())

    const show = optionsLayer.show.bind(optionsLayer)
    optionsLayer.show = () => {
        show()
        updateAllValues()
    }
}
