import { MenuEntryCfg } from '../cfg/MenuEntryCfg'
import { SaveGameManager } from '../resource/SaveGameManager'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { MainMenuLayer } from './MainMenuLayer'
import { MainMenuLevelButton } from './MainMenuLevelButton'
import { MainMenuPanel } from './MainMenuPanel'
import { MainMenuWindow } from './MainMenuWindow'
import { SoundManager } from '../audio/SoundManager'
import { GameConfig } from '../cfg/GameConfig'

export class LevelSelectLayer extends MainMenuLayer {
    constructor(menuCfg: MenuEntryCfg, allLevels: boolean) {
        super(menuCfg)
        const levelTextCfg = GameConfig.instance.menu.levelText
        this.items.push(new MainMenuPanel(levelTextCfg.panel))
        const levelTextWindow = new MainMenuWindow(levelTextCfg.window)
        levelTextWindow.setFirstLine(allLevels ? levelTextCfg.level : levelTextCfg.tutorial)
        levelTextWindow.setSecondLine(' ')
        this.items.push(levelTextWindow)
        GameConfig.instance.levels.levelCfgByName.forEach((level, levelName) => {
            const levelButton = new MainMenuLevelButton(this, levelName, level)
            levelButton.onHoverChange = () => {
                if (levelButton.isLocked()) return
                const levelScore = SaveGameManager.getLevelScoreString(levelName)
                levelTextWindow.setSecondLine(levelButton.hover ? level.fullName + levelScore : ' ')
            }
            levelButton.onShowTooltip = () => {
                const levelNum = parseInt(levelName.slice(-2))
                const tutPrefix = levelName.toLowerCase().startsWith('tutorial') ? 'T' : ''
                const swapped = levelNum === 2 ? 5 : (levelNum === 5 ? 2 : levelNum) // XXX read from config
                const tooltipName = `Stream_LevelName_${tutPrefix}Level${!!tutPrefix ? levelNum : swapped}`
                SoundManager.playSound(tooltipName, true)
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
