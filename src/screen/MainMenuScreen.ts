import { LevelSelectLayer } from '../menu/LevelSelectLayer'
import { LoadSaveLayer } from '../menu/LoadSaveLayer'
import { MainMenuBaseItem } from '../menu/MainMenuBaseItem'
import { MainMenuLayer } from '../menu/MainMenuLayer'
import { MainMenuLevelButton } from '../menu/MainMenuLevelButton'
import { ResourceManager } from '../resource/ResourceManager'
import { SaveGameManager } from '../resource/SaveGameManager'
import { ScreenMaster } from './ScreenMaster'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { ShowGameResultEvent } from '../event/LocalEvents'
import { LevelSelectedEvent, MaterialAmountChanged } from '../event/WorldEvents'
import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { SoundManager } from '../audio/SoundManager'
import { Sample } from '../audio/Sample'
import { MainMenuCreditsLayer } from '../menu/MainMenuCreditsLayer'
import { ScaledLayer } from './layer/ScreenLayer'

export class MainMenuScreen {
    menuLayers: ScaledLayer[] = []
    loadSaveLayer: LoadSaveLayer
    creditsLayer: MainMenuCreditsLayer

    constructor(readonly screenMaster: ScreenMaster) {
        ResourceManager.configuration.menu.mainMenuFull.menus.forEach((menuCfg) => {
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
        EventBus.registerEventListener(EventKey.SHOW_GAME_RESULT, (event: ShowGameResultEvent) => {
            if (!event.result) this.showLevelSelection()
        })
    }

    dispose() {
        this.menuLayers.forEach((l) => this.screenMaster.removeLayer(l))
        this.menuLayers.length = 0
        // TODO remove event listener on hot reload?
    }

    private onItemAction(item: MainMenuBaseItem) {
        if (item.actionName.equalsIgnoreCase('next')) {
            this.showMainMenu(item.targetIndex)
        } else if (item.actionName.equalsIgnoreCase('selectlevel')) {
            this.selectLevel((item as MainMenuLevelButton).levelName)
        } else if (item.actionName.toLowerCase().startsWith('load_game')) {
            SaveGameManager.loadGame(item.targetIndex)
            this.showLevelSelection()
        } else if (item.actionName.equalsIgnoreCase('selectrandomlevel')) { // TODO make sure that target level is unlocked?
            const allLevelNames = Array.from(Array(24).keys()).map((n) => `Level${(n + 1).toPadded()}`)
            const unScoredLevels = allLevelNames.filter((levelName) => !SaveGameManager.getLevelScoreString(levelName))
            if (unScoredLevels.length > 0) {
                this.selectLevel(unScoredLevels.random())
            } else {
                this.selectLevel(`Level${Math.randomInclusive(1, 25).toPadded()}`)
            }
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
        if (oldIndex === 0) {
            SoundManager.playSample(Sample.SFX_RockWipe, false)
            // TODO play MenuWipe (rockwipe.lws) animation, too
        }
        this.menuLayers.forEach((m, i) => i === index ? m.show() : m.hide())
    }

    showLevelSelection() {
        this.showMainMenu(1)
    }

    showCredits() {
        this.menuLayers.forEach((l) => l === this.creditsLayer ? l.show() : l.hide())
    }

    selectLevel(levelName: string) {
        let levelConf: LevelEntryCfg = null
        try {
            levelConf = ResourceManager.getLevelEntryCfg(levelName)
        } catch (e) {
            console.error(`Could not load level: ${levelName}`, e)
            return
        }
        this.screenMaster.loadingLayer.show()
        this.menuLayers.forEach((m) => m.hide())
        EventBus.publishEvent(new LevelSelectedEvent(levelName, levelConf))
        EventBus.publishEvent(new MaterialAmountChanged()) // XXX Remove workaround for UI redraw
    }
}
