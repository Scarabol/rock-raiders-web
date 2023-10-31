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

export class MainMenuScreen {
    menuLayers: MainMenuLayer[] = []
    loadSaveLayer: LoadSaveLayer

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
        EventBus.registerEventListener(EventKey.SHOW_GAME_RESULT, (event: ShowGameResultEvent) => {
            if (!event.result) this.showLevelSelection()
        })
    }

    private onItemAction(item: MainMenuBaseItem) {
        if (item.actionName.equalsIgnoreCase('next')) {
            this.showMainMenu(item.targetIndex)
        } else if (item.actionName.equalsIgnoreCase('selectlevel')) {
            this.selectLevel((item as MainMenuLevelButton).levelKey)
        } else if (item.actionName.toLowerCase().startsWith('load_game')) {
            if (SaveGameManager.loadGame(item.targetIndex)) {
                this.showMainMenu()
            }
        } else if (item.actionName.equalsIgnoreCase('selectrandomlevel')) { // TODO make sure that target level is unlocked?
            const allLevelKeys = Array.from(Array(24).keys()).map((n) => `Level${(n + 1).toPadded()}`)
            const unScoredLevels = allLevelKeys.filter((levelKey) => !SaveGameManager.getLevelScoreString(levelKey))
            if (unScoredLevels.length > 0) {
                this.selectLevel(unScoredLevels.random())
            } else {
                this.selectLevel(`Level${Math.randomInclusive(1, 25).toPadded()}`)
            }
        } else if (item.actionName) {
            console.warn(`not implemented: ${item.actionName} - ${item.targetIndex}`)
        } else {
            console.warn('Item has no action name', item)
        }
    }

    showMainMenu(index: number = 0) {
        this.menuLayers.forEach((m, i) => i === index ? m.show() : m.hide())
    }

    showLevelSelection() {
        this.showMainMenu(1)
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
        EventBus.publishEvent(new MaterialAmountChanged())
    }
}
