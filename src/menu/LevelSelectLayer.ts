import { MenuEntryCfg } from '../cfg/MenuEntryCfg'
import { ResourceManager } from '../resource/ResourceManager'
import { SaveGameManager } from '../resource/SaveGameManager'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { MainMenuLayer } from './MainMenuLayer'
import { MainMenuLevelButton } from './MainMenuLevelButton'
import { MainMenuPanel } from './MainMenuPanel'
import { MainMenuWindow } from './MainMenuWindow'

export class LevelSelectLayer extends MainMenuLayer {
    constructor(menuCfg: MenuEntryCfg, allLevels: boolean) {
        super(menuCfg)
        const levelTextCfg = ResourceManager.configuration.menu.levelText
        this.items.push(new MainMenuPanel(levelTextCfg.panel))
        const levelTextWindow = new MainMenuWindow(levelTextCfg.window)
        levelTextWindow.setFirstLine(allLevels ? levelTextCfg.level : levelTextCfg.tutorial)
        levelTextWindow.setSecondLine(' ')
        this.items.push(levelTextWindow)
        ResourceManager.configuration.levels.levelCfgByName.forEach((level, levelKey) => {
            const levelButton = new MainMenuLevelButton(this, levelKey, level)
            levelButton.onHoverChange = () => {
                const levelScore = SaveGameManager.getLevelScoreString(levelKey)
                levelTextWindow.setSecondLine(levelButton.hover ? level.fullName + levelScore : ' ')
            }
            this.items.push(levelButton)
        })
        this.items.push(new MainMenuBaseItem(517, 11, 36, 36, 'selectrandomlevel'))
    }

    show() {
        this.reset()
        super.show()
    }
}
