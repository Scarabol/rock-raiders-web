import { MenuCfg } from '../../cfg/MenuCfg'
import { MenuBasePanel } from './MenuBasePanel'
import { ChangePreferences } from '../../event/GuiCommand'
import { setupOptionsLayer } from './OptionsLayerUtil'
import { SaveGameManager } from '../../resource/SaveGameManager'

export class PausePanel extends MenuBasePanel {
    onContinueGame: () => void = () => console.log('continue mission')
    onRepeatBriefing: () => void = () => console.log('repeat mission briefing')
    onAbortGame: () => void = () => console.log('abort mission')
    onRestartGame: () => void = () => console.log('restart mission')

    constructor(cfg: MenuCfg, width: number, height: number) {
        super(cfg)
        this.width = width
        this.height = height
        this.layersByKey.get('menu1').itemsTrigger[0].onClick = () => this.onContinueGame()
        setupOptionsLayer(this.layersByKey.get('menu2'), () => this.onRepeatBriefing())
        this.layersByKey.get('menu3').itemsTrigger[0].onClick = () => this.onAbortGame()
        this.layersByKey.get('menu4').itemsTrigger[0].onClick = () => this.onRestartGame()
        const advOptions = this.layersByKey.get('menu5')
        const wallDetailsToggle = advOptions.itemsCycle[0]
        wallDetailsToggle.disabled = true // TODO Implement wall details with pro meshes
        wallDetailsToggle.setState(SaveGameManager.currentPreferences.wallDetails)
        const musicToggle = advOptions.itemsCycle[1]
        musicToggle.setState(SaveGameManager.currentPreferences.toggleMusic)
        musicToggle.onStateChanged = (state) => {
            SaveGameManager.currentPreferences.toggleMusic = state
            this.publishEvent(new ChangePreferences())
        }
        const sfxToggle = advOptions.itemsCycle[2]
        sfxToggle.setState(SaveGameManager.currentPreferences.toggleSfx)
        sfxToggle.onStateChanged = (state) => {
            SaveGameManager.currentPreferences.toggleSfx = state
            this.publishEvent(new ChangePreferences())
        }
        const autoGameSpeedToggle = advOptions.itemsCycle[3]
        autoGameSpeedToggle.disabled = true // TODO Implement auto game speed
        autoGameSpeedToggle.setState(SaveGameManager.currentPreferences.autoGameSpeed)
    }
}
