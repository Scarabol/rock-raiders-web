import { LevelSelectLayer } from '../menu/LevelSelectLayer'
import { MainMenuLayer } from '../menu/MainMenuLayer'
import { ResourceManager } from '../resource/ResourceManager'
import { ScreenMaster } from './ScreenMaster'
import { MainMenuLevelButton } from '../menu/MainMenuLevelButton'
import { MainMenuBaseItem } from '../menu/MainMenuBaseItem'
import { LoadSaveLayer } from '../menu/LoadSaveLayer'
import { SaveGameManager } from '../resource/SaveGameManager'

export class MainMenuScreen {
    onLevelSelected: (levelName: string) => void = null
    menuLayers: MainMenuLayer[] = []
    loadSaveLayer: LoadSaveLayer

    constructor(screenMaster: ScreenMaster) {
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
            this.menuLayers.push(screenMaster.addLayer(layer))
        })
    }

    private onItemAction(item: MainMenuBaseItem) {
        if (item.actionName.equalsIgnoreCase('next')) {
            this.showMainMenu(item.targetIndex)
        } else if (item.actionName.equalsIgnoreCase('selectlevel')) {
            this.selectLevel((item as MainMenuLevelButton).levelKey)
        } else if (item.actionName.toLowerCase().startsWith('load_game')) {
            SaveGameManager.loadGame(item.targetIndex)
            this.showMainMenu()
        } else if (item.actionName) {
            console.warn(`not implemented: ${item.actionName} - ${item.targetIndex}`)
        }
    }

    showMainMenu(index: number = 0, loading: boolean = true) {
        if (index === 3) this.loadSaveLayer.setMode(loading)
        this.menuLayers.forEach((m, i) => i === index ? m.show() : m.hide())
    }

    showLevelSelection() {
        this.showMainMenu(1)
    }

    selectLevel(levelName: string) {
        this.menuLayers.forEach((m) => m.hide())
        this.onLevelSelected(levelName)
    }
}
