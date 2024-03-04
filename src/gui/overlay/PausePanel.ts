import { MenuCfg } from '../../cfg/MenuCfg'
import { BaseElement } from '../base/BaseElement'
import { MenuBasePanel } from './MenuBasePanel'
import { ChangePreferences } from '../../event/GuiCommand'
import { setupOptionsLayer } from './OptionsLayerUtil'
import { SaveGameManager } from '../../resource/SaveGameManager'

export class PausePanel extends MenuBasePanel {
    onContinueGame: () => any = () => console.log('continue mission')
    onRepeatBriefing: () => any = () => console.log('repeat mission briefing')
    onAbortGame: () => any = () => console.log('abort mission')
    onRestartGame: () => any = () => console.log('restart mission')

    constructor(parent: BaseElement, cfg: MenuCfg, width: number, height: number) {
        super(parent, cfg)
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
        musicToggle.disabled = true // TODO Implement background music
        musicToggle.setState(SaveGameManager.currentPreferences.toggleMusic)
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
