import { OffscreenCache } from '../../worker/OffscreenCache'
import { ChangePreferences } from '../../event/GuiCommand'
import { MenuLayer } from './MenuLayer'
import { EventKey } from '../../event/EventKeyEnum'

export function setupOptionsLayer(optionsLayer: MenuLayer, onRepeatBriefing: () => unknown) {
    const gameSpeedSlider = optionsLayer.itemsSlider[0]
    gameSpeedSlider.onValueChanged = (value) => {
        OffscreenCache.offscreenPreferences.gameSpeed = value
        optionsLayer.publishEvent(new ChangePreferences(OffscreenCache.offscreenPreferences))
    }
    const volumeSfxSlider = optionsLayer.itemsSlider[1]
    volumeSfxSlider.onValueChanged = (value) => {
        OffscreenCache.offscreenPreferences.volumeSfx = value
        optionsLayer.publishEvent(new ChangePreferences(OffscreenCache.offscreenPreferences))
    }
    const volumeMusicSlider = optionsLayer.itemsSlider[2]
    volumeMusicSlider.disabled = true // TODO Implement background music
    volumeMusicSlider.onValueChanged = (value) => {
        OffscreenCache.offscreenPreferences.volumeMusic = value
        optionsLayer.publishEvent(new ChangePreferences(OffscreenCache.offscreenPreferences))
    }
    const gameBrightnessSlider = optionsLayer.itemsSlider[3]
    gameBrightnessSlider.onValueChanged = (value) => {
        OffscreenCache.offscreenPreferences.gameBrightness = value
        optionsLayer.publishEvent(new ChangePreferences(OffscreenCache.offscreenPreferences))
    }
    const showHelpWindowCycle = optionsLayer.itemsCycle[0]
    showHelpWindowCycle.disabled = true // TODO Implement help window
    showHelpWindowCycle.onStateChanged = (state) => {
        OffscreenCache.offscreenPreferences.showHelpWindow = state
        optionsLayer.publishEvent(new ChangePreferences(OffscreenCache.offscreenPreferences))
    }
    optionsLayer.itemsTrigger[0].onClick = () => onRepeatBriefing()

    function updateAllValues() {
        gameSpeedSlider.setValue(OffscreenCache.offscreenPreferences.gameSpeed)
        volumeSfxSlider.setValue(OffscreenCache.offscreenPreferences.volumeSfx)
        volumeMusicSlider.setValue(OffscreenCache.offscreenPreferences.volumeMusic)
        gameBrightnessSlider.setValue(OffscreenCache.offscreenPreferences.gameBrightness)
        showHelpWindowCycle.setState(OffscreenCache.offscreenPreferences.showHelpWindow)
    }

    updateAllValues()

    optionsLayer.registerEventListener(EventKey.COMMAND_CHANGE_PREFERENCES, (event: ChangePreferences) => {
        OffscreenCache.offscreenPreferences = event.preferences
        updateAllValues()
    })

    const show = optionsLayer.show.bind(optionsLayer)
    optionsLayer.show = () => {
        show()
        updateAllValues()
    }
}
