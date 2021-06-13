import { parseLabel } from '../cfg/CfgHelper'
import { MenuEntryCfg } from '../cfg/MenuEntryCfg'
import { iGet } from '../core/Util'
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
        const levelTextCfg = new LevelTextCfg()
        this.items.push(new MainMenuPanel(levelTextCfg.panelImgData, levelTextCfg.panelPos))
        const levelTextWindow = new MainMenuWindow(ResourceManager.getDefaultFont(), levelTextCfg.window)
        levelTextWindow.setFirstLine(modeLevel ? levelTextCfg.level : levelTextCfg.tutorial)
        this.items.push(levelTextWindow)
        ResourceManager.getLevelConfig().levelCfgByName.forEach((level, levelKey) => {
            const levelButton = new MainMenuLevelButton(this, levelKey, level)
            levelButton.onHoverChange = () => levelTextWindow.setSecondLine(levelButton.hover ? level.fullName : '')
            this.items.push(levelButton)
        })
        this.items.sort((a, b) => MainMenuBaseItem.compareZ(a, b))
    }

}

class LevelTextCfg {

    window = {x: 0, y: 0, w: 0, h: 0}
    panelImgData: ImageData
    panelPos = {x: 0, y: 0, w: 0, h: 0}
    level: string = ''
    tutorial: string = ''

    constructor() {
        const cfg = ResourceManager.cfg('Menu', 'LevelText')
        const winCfg = iGet(cfg, 'Window')
        this.window = {x: winCfg[0], y: winCfg[1], w: winCfg[2], h: winCfg[3]}
        const panelCfg = iGet(cfg, 'Panel')
        this.panelImgData = ResourceManager.getImageData(panelCfg[0])
        this.panelPos = {x: panelCfg[1], y: panelCfg[2], w: panelCfg[3], h: panelCfg[4]}
        this.level = parseLabel(iGet(cfg, 'Level'))
        this.tutorial = parseLabel(iGet(cfg, 'Tutorial'))
    }

}
