import { MenuEntryCfg } from '../cfg/MenuEntryCfg'
import { ResourceManager } from '../resource/ResourceManager'
import { MainMenuScreen } from '../screen/MainMenuScreen'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { MainMenuLayer } from './MainMenuLayer'
import { MainMenuLevelButton } from './MainMenuLevelButton'
import { MainMenuPanel } from './MainMenuPanel'
import { MainMenuWindow } from './MainMenuWindow'

export class LevelSelectLayer extends MainMenuLayer {
    constructor(screen: MainMenuScreen, menuCfg: MenuEntryCfg, modeLevel: boolean) {
        super(screen, menuCfg)
        const levelTextCfg = ResourceManager.configuration.menu.levelText
        this.items.push(new MainMenuPanel(levelTextCfg.panel))
        const levelTextWindow = new MainMenuWindow(ResourceManager.getDefaultFont(), levelTextCfg.window)
        levelTextWindow.setFirstLine(modeLevel ? levelTextCfg.level : levelTextCfg.tutorial)
        this.items.push(levelTextWindow)
        ResourceManager.configuration.levels.levelCfgByName.forEach((level, levelKey) => {
            const levelButton = new MainMenuLevelButton(this, levelKey, level)
            levelButton.onHoverChange = () => levelTextWindow.setSecondLine(levelButton.hover ? level.fullName : '')
            this.items.push(levelButton)
        })
        this.items.sort((a, b) => MainMenuBaseItem.compareZ(a, b))
    }

    reset() {
        super.reset()
    }

    show() {
        this.reset()
        super.show()
    }
}
