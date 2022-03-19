import { MainMenuLayer } from './MainMenuLayer'
import { MenuEntryCfg } from '../cfg/MenuEntryCfg'
import { MainMenuLoadSaveButton } from './MainMenuLoadSaveButton'
import { MainMenuWindow } from './MainMenuWindow'
import { ResourceManager } from '../resource/ResourceManager'
import { GameMenuCfg } from '../cfg/MenuCfg'

export class LoadSaveLayer extends MainMenuLayer {

    menuCfg: GameMenuCfg
    buttons: MainMenuLoadSaveButton[] = []
    loadSaveTextWindow: MainMenuWindow

    constructor(menuCfg: MenuEntryCfg, loading: boolean) {
        super(menuCfg)
        this.menuCfg = ResourceManager.configuration.menu
        const saveImage = this.menuCfg.saveImage
        this.addButton(1, saveImage.Pos1[0], saveImage.Pos1[1])
        this.addButton(2, saveImage.Pos2[0], saveImage.Pos2[1])
        this.addButton(3, saveImage.Pos3[0], saveImage.Pos3[1])
        this.addButton(4, saveImage.Pos4[0], saveImage.Pos4[1])
        this.addButton(5, saveImage.Pos5[0], saveImage.Pos5[1])
        this.loadSaveTextWindow = new MainMenuWindow(ResourceManager.getDefaultFont(), this.menuCfg.saveText.window)
        this.items.push(this.loadSaveTextWindow)
        this.setMode(loading)
    }

    private addButton(index: number, x: number, y: number) {
        const btn = new MainMenuLoadSaveButton(this, index, x, y)
        btn.onHoverChange = () => {
            const percent = index * 11 // TODO get game completion from save by index
            if (btn.hover) {
                const slotText = this.menuCfg.saveText.slot
                this.loadSaveTextWindow.setSecondLine(slotText.replace('%d%', String(percent)))
            } else {
                this.loadSaveTextWindow.setSecondLine('')
            }
        }
        this.buttons.add(btn)
        this.items.add(btn)
    }

    setMode(loading: boolean) {
        this.buttons.forEach((b) => b.setMode(loading))
        if (loading) {
            this.loadSaveTextWindow.setFirstLine(this.menuCfg.saveText.load)
        } else {
            this.loadSaveTextWindow.setFirstLine(this.menuCfg.saveText.save)
        }
    }
}
