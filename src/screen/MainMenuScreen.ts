import { MenuCfg } from '../cfg/MenuCfg'
import { LevelSelectLayer } from '../menu/LevelSelectLayer'
import { MainMenuLayer } from '../menu/MainMenuLayer'
import { ResourceManager } from '../resource/ResourceManager'
import { BaseScreen } from './BaseScreen'

export class MainMenuScreen extends BaseScreen {
    onLevelSelected: (levelName: string) => void = null
    menus: MainMenuLayer[] = []

    constructor() {
        super()
        const mainMenuFullCfg = ResourceManager.getResource('MainMenuFull') as MenuCfg
        mainMenuFullCfg.menus.forEach((menuCfg) => {
            let layer
            if (menuCfg.title === 'Levels') {
                layer = new LevelSelectLayer(this, menuCfg, true)
            } else if (menuCfg.title === 'Tutorials') {
                layer = new LevelSelectLayer(this, menuCfg, false)
            } else {
                layer = new MainMenuLayer(this, menuCfg)
            }
            this.menus.push(layer)
            this.addLayer(layer)
        })
    }

    showMainMenu(index: number = 0) {
        this.menus.forEach((menu, i) => i === index ? menu.show() : menu.hide())
        this.cursorLayer.show()
    }

    showLevelSelection() {
        this.showMainMenu(1)
    }

    selectLevel(levelName: string) {
        this.hide()
        this.onLevelSelected(levelName)
    }
}
