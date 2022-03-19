import { LevelSelectLayer } from '../menu/LevelSelectLayer'
import { MainMenuLayer } from '../menu/MainMenuLayer'
import { ResourceManager } from '../resource/ResourceManager'
import { ScreenMaster } from './ScreenMaster'

export class MainMenuScreen {
    onLevelSelected: (levelName: string) => void = null
    menus: MainMenuLayer[] = []

    constructor(screenMaster: ScreenMaster) {
        ResourceManager.configuration.menu.mainMenuFull.menus.forEach((menuCfg) => {
            let layer
            if (menuCfg.title === 'Levels') {
                layer = new LevelSelectLayer(this, menuCfg, true)
            } else if (menuCfg.title === 'Tutorials') {
                layer = new LevelSelectLayer(this, menuCfg, false)
            } else {
                layer = new MainMenuLayer(this, menuCfg)
            }
            this.menus.push(layer)
            screenMaster.addLayer(layer)
        })
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
