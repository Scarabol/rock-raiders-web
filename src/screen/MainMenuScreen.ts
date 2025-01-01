import { LevelSelectLayer } from '../menu/LevelSelectLayer'
import { LoadSaveLayer } from '../menu/LoadSaveLayer'
import { MainMenuBaseItem } from '../menu/MainMenuBaseItem'
import { MainMenuLayer } from '../menu/MainMenuLayer'
import { MainMenuLevelButton } from '../menu/MainMenuLevelButton'
import { SaveGameManager } from '../resource/SaveGameManager'
import { ScreenMaster } from './ScreenMaster'
import { EventKey } from '../event/EventKeyEnum'
import { LevelSelectedEvent, MaterialAmountChanged } from '../event/WorldEvents'
import { MainMenuCreditsLayer } from '../menu/MainMenuCreditsLayer'
import { ScaledLayer } from './layer/ScreenLayer'
import { RockWipeLayer } from '../menu/RockWipeLayer'
import { GameConfig } from '../cfg/GameConfig'
import { EventBroker } from '../event/EventBroker'
import { LevelLoader } from '../game/LevelLoader'
import { SoundManager } from '../audio/SoundManager'
import { SAMPLE } from '../audio/Sample'

export class MainMenuScreen {
    readonly menuLayers: ScaledLayer[] = []
    readonly creditsLayer: MainMenuCreditsLayer
    readonly rockWipeLayer: RockWipeLayer
    sfxAmbientLoop?: AudioBufferSourceNode

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
                layer = new LoadSaveLayer(menuCfg, true)
            } else if (menuCfg.title.equalsIgnoreCase('ARE YOU SURE?')) {
                layer = new MainMenuLayer(menuCfg)
            } else {
                console.warn('Unexpected menu title in cfg', menuCfg)
                layer = new MainMenuLayer(menuCfg)
            }
            layer.onItemAction = (item: MainMenuBaseItem) => {
                if (menuCfg.title.equalsIgnoreCase('Levels') && item.actionName?.equalsIgnoreCase('Next') && item.targetIndex === 0) SaveGameManager.startNewGame()
                this.onItemAction(item)
            }
            this.menuLayers.push(screenMaster.addLayer(layer, 200 + this.menuLayers.length * 10))
        })
        this.creditsLayer = screenMaster.addLayer(new MainMenuCreditsLayer(), 200 + this.menuLayers.length * 10)
        this.creditsLayer.onExitCredits = () => this.showMainMenu()
        this.menuLayers.push(this.creditsLayer)
        this.rockWipeLayer = screenMaster.addLayer(new RockWipeLayer(), 200 + this.menuLayers.length * 10)
        EventBroker.subscribe(EventKey.ADVANCE_AFTER_REWARDS, () => {
            if (GameConfig.instance.getAllLevels().every((l) => SaveGameManager.getLevelCompleted(l.levelName))) {
                // TODO Show EndGameAVI1 from config, requires Indeo5 video decoder
                this.showCredits()
            } else {
                // TODO If tutorial was started from tutorial screen go back there
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
        this.sfxAmbientLoop?.stop()
        this.sfxAmbientLoop = undefined
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
        if (!this.sfxAmbientLoop) {
            this.sfxAmbientLoop = SoundManager.playSound(SAMPLE.SFX_AmbientMusicLoop, false)
            this.sfxAmbientLoop.loop = true
        }
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
        const allLevels = GameConfig.instance.getAllLevels()
        const unlockedLevels = allLevels.filter((levelConf) => !levelConf.isLocked())
        const incompleteLevels = unlockedLevels.filter((levelConf) => !SaveGameManager.getLevelCompleted(levelConf.levelName))
        const levelName = incompleteLevels.random()?.levelName || unlockedLevels.random()?.levelName || allLevels.random()?.levelName
        this.selectLevel(levelName)
    }

    selectLevel(levelName: string | undefined) {
        try {
            if (!levelName) return
            this.sfxAmbientLoop?.stop()
            this.sfxAmbientLoop = undefined
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
