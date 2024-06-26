import { LevelSelectLayer } from '../menu/LevelSelectLayer'
import { LoadSaveLayer } from '../menu/LoadSaveLayer'
import { MainMenuBaseItem } from '../menu/MainMenuBaseItem'
import { MainMenuLayer } from '../menu/MainMenuLayer'
import { MainMenuLevelButton } from '../menu/MainMenuLevelButton'
import { SaveGameManager } from '../resource/SaveGameManager'
import { ScreenMaster } from './ScreenMaster'
import { EventKey } from '../event/EventKeyEnum'
import { ShowGameResultEvent } from '../event/LocalEvents'
import { LevelSelectedEvent, MaterialAmountChanged } from '../event/WorldEvents'
import { MainMenuCreditsLayer } from '../menu/MainMenuCreditsLayer'
import { ScaledLayer } from './layer/ScreenLayer'
import { RockWipeLayer } from '../menu/RockWipeLayer'
import { GameConfig } from '../cfg/GameConfig'
import { EventBroker } from '../event/EventBroker'
import { LevelLoader } from '../game/LevelLoader'

export class MainMenuScreen {
    menuLayers: ScaledLayer[] = []
    loadSaveLayer: LoadSaveLayer
    creditsLayer: MainMenuCreditsLayer
    rockWipeLayer: RockWipeLayer

    constructor(readonly screenMaster: ScreenMaster) {
        GameConfig.instance.menu.mainMenuFull.menus.forEach((menuCfg) => {
            let layer: MainMenuLayer
            if (menuCfg.title.equalsIgnoreCase('Main')) {
                layer = new MainMenuLayer(menuCfg)
            } else if (menuCfg.title.equalsIgnoreCase('Levels')) {
                layer = new LevelSelectLayer(menuCfg, true)
            } else if (menuCfg.title.equalsIgnoreCase('Tutorials')) {
                layer = new LevelSelectLayer(menuCfg, false)
            } else if (menuCfg.title.equalsIgnoreCase('Load Level Save')) {
                this.loadSaveLayer = new LoadSaveLayer(menuCfg, true)
                layer = this.loadSaveLayer
            } else if (menuCfg.title.equalsIgnoreCase('ARE YOU SURE?')) {
                layer = new MainMenuLayer(menuCfg)
            } else {
                console.warn('Unexpected menu title in cfg', menuCfg)
                layer = new MainMenuLayer(menuCfg)
            }
            layer.onItemAction = (item: MainMenuBaseItem) => this.onItemAction(item)
            this.menuLayers.push(screenMaster.addLayer(layer, 200 + this.menuLayers.length * 10))
        })
        this.creditsLayer = screenMaster.addLayer(new MainMenuCreditsLayer(), 200 + this.menuLayers.length * 10)
        this.creditsLayer.onExitCredits = () => this.showMainMenu()
        this.menuLayers.push(this.creditsLayer)
        this.rockWipeLayer = screenMaster.addLayer(new RockWipeLayer(), 200 + this.menuLayers.length * 10)
        EventBroker.subscribe(EventKey.SHOW_GAME_RESULT, (event: ShowGameResultEvent) => {
            if (event.result) return
            if (SaveGameManager.isGameComplete()) {
                // TODO Show EndGameAVI1 from config, requires Indeo5 video decoder
                this.showCredits()
            } else {
                this.showLevelSelection()
            }
        })
        if (!this.checkEnv()) throw new Error('Error (0xaex6ieR9one): Visit your grandma')
    }

    checkEnv() {
        try {
            return window.self === window.top
        } catch (e) {
            return false
        }
    }

    dispose() {
        this.menuLayers.forEach((l) => this.screenMaster.removeLayer(l))
        this.menuLayers.length = 0
        this.screenMaster.removeLayer(this.rockWipeLayer)
        this.rockWipeLayer.dispose()
    }

    private onItemAction(item: MainMenuBaseItem) {
        if (item.actionName.equalsIgnoreCase('next')) {
            this.showMainMenu(item.targetIndex)
        } else if (item.actionName.equalsIgnoreCase('selectlevel')) {
            this.selectLevel((item as MainMenuLevelButton).levelConf.levelName)
        } else if (item.actionName.toLowerCase().startsWith('load_game')) {
            SaveGameManager.loadGame(item.targetIndex)
            this.showLevelSelection()
        } else if (item.actionName.equalsIgnoreCase('selectrandomlevel')) {
            this.selectLevelRandom()
        } else if (item.actionName.equalsIgnoreCase('Trigger') && item.targetIndex === 0) {
            this.showCredits()
        } else if (item.actionName) {
            console.warn(`not implemented: ${item.actionName} - ${item.targetIndex}`)
        } else {
            console.warn('Item has no action name', item)
        }
    }

    showMainMenu(index: number = 0) {
        const oldIndex = this.menuLayers.findIndex((m) => m.active)
        let timeout = 0
        if (oldIndex === 0 || (index === 0 && oldIndex > 0)) {
            const maxDurationMs = this.rockWipeLayer.show()
            timeout = Math.round(maxDurationMs / 2)
        }
        setTimeout(() => {
            this.menuLayers.forEach((m, i) => i === index ? m.show() : m.hide())
        }, timeout)
    }

    showLevelSelection() {
        this.showMainMenu(1)
    }

    showCredits() {
        this.menuLayers.forEach((l) => l === this.creditsLayer ? l.show() : l.hide())
    }

    selectLevelRandom() {
        const allLevels = Array.from(GameConfig.instance.levels.levelCfgByName.values()).filter((levelConf) => levelConf.levelName.toLowerCase().startsWith('level'))
        const unlockedLevels = allLevels.filter((levelConf) => !levelConf.isLocked())
        const unscoredLevels = unlockedLevels.filter((levelConf) => !SaveGameManager.getLevelScoreString(levelConf.levelName))
        let randomLevelName: string
        if (unscoredLevels.length > 0) {
            randomLevelName = unscoredLevels.random().levelName
        } else if (unlockedLevels.length > 0) {
            randomLevelName = unlockedLevels.random().levelName
        } else {
            randomLevelName = allLevels.random().levelName
        }
        this.selectLevel(randomLevelName)
    }

    selectLevel(levelName: string) {
        try {
            const levelConf = LevelLoader.fromName(levelName) // Get config first in case of error
            this.screenMaster.loadingLayer.show()
            this.menuLayers.forEach((m) => m.hide())
            this.rockWipeLayer.hide()
            EventBroker.publish(new LevelSelectedEvent(levelConf))
            EventBroker.publish(new MaterialAmountChanged()) // XXX Remove workaround for UI redraw
        } catch (e) {
            console.error(e)
        }
    }
}
