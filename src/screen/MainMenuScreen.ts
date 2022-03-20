import { LevelSelectLayer } from '../menu/LevelSelectLayer'
import { MainMenuLayer } from '../menu/MainMenuLayer'
import { ResourceManager } from '../resource/ResourceManager'
import { ScreenMaster } from './ScreenMaster'
import { MainMenuLevelButton } from '../menu/MainMenuLevelButton'
import { MainMenuBaseItem } from '../menu/MainMenuBaseItem'

export class MainMenuScreen {
    onLevelSelected: (levelName: string) => void = null
    menus: MainMenuLayer[] = []

    constructor(screenMaster: ScreenMaster) {
        ResourceManager.configuration.menu.mainMenuFull.menus.forEach((menuCfg) => {
            let layer: MainMenuLayer
            if (menuCfg.title === 'Levels') {
                layer = new LevelSelectLayer(menuCfg, true)
            } else if (menuCfg.title === 'Tutorials') {
                layer = new LevelSelectLayer(menuCfg, false)
            } else {
                layer = new MainMenuLayer(menuCfg)
            }
            layer.onItemAction = (item: MainMenuBaseItem) => this.onItemAction(item)
            this.menus.push(layer)
            screenMaster.addLayer(layer)
        })
    }

    private onItemAction(item: MainMenuBaseItem) {
        if (item.actionName.equalsIgnoreCase('next')) {
            this.showMainMenu(item.targetIndex)
        } else if (item.actionName.equalsIgnoreCase('selectlevel')) {
            this.selectLevel((item as MainMenuLevelButton).levelKey)
        } else if (item.actionName) {
            console.warn(`not implemented: ${item.actionName} - ${item.targetIndex}`)
        }
    }

    showMainMenu(index: number = 0) {
        this.menus.forEach((menu, i) => i === index ? menu.show() : menu.hide())
    }

    showLevelSelection() {
        this.showMainMenu(1)
    }

    selectLevel(levelName: string) {
        this.menus.forEach((m) => m.hide())
        this.onLevelSelected(levelName)
    }
}
