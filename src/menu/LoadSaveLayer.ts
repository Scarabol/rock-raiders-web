import { GameMenuCfg } from '../cfg/MenuCfg'
import { MenuEntryCfg } from '../cfg/MenuEntryCfg'
import { SaveGameManager } from '../resource/SaveGameManager'
import { MainMenuLayer } from './MainMenuLayer'
import { MainMenuLoadSaveButton } from './MainMenuLoadSaveButton'
import { MainMenuWindow } from './MainMenuWindow'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GameConfig } from '../cfg/GameConfig'

export class LoadSaveLayer extends MainMenuLayer {
    menuCfg: GameMenuCfg
    buttons: MainMenuLoadSaveButton[] = []
    loadSaveTextWindow: MainMenuWindow

    constructor(menuCfg: MenuEntryCfg, loading: boolean) {
        super(menuCfg)
        this.menuCfg = GameConfig.instance.menu
        const saveImage = this.menuCfg.saveImage
        this.addButton(0, saveImage.Pos1[0], saveImage.Pos1[1], loading)
        this.addButton(1, saveImage.Pos2[0], saveImage.Pos2[1], loading)
        this.addButton(2, saveImage.Pos3[0], saveImage.Pos3[1], loading)
        this.addButton(3, saveImage.Pos4[0], saveImage.Pos4[1], loading)
        this.addButton(4, saveImage.Pos5[0], saveImage.Pos5[1], loading)
        this.loadSaveTextWindow = new MainMenuWindow(this.menuCfg.saveText.window)
        this.items.push(this.loadSaveTextWindow)
        if (loading) {
            this.loadSaveTextWindow.setFirstLine(this.menuCfg.saveText.load)
        } else {
            this.loadSaveTextWindow.setFirstLine(this.menuCfg.saveText.save)
        }
        this.loadSaveTextWindow.setSecondLine(' ')
    }

    private addButton(index: number, x: number, y: number, loading: boolean) {
        const btn = new MainMenuLoadSaveButton(this, index, x, y, loading)
        btn.onHoverChange = () => {
            const percent = SaveGameManager.getOverallGameProgress(index)
            if (btn.hover && percent) {
                const slotText = this.menuCfg.saveText.slot
                this.loadSaveTextWindow.setSecondLine(slotText.replace('%d%', String(percent)))
            } else {
                this.loadSaveTextWindow.setSecondLine(' ')
            }
        }
        this.buttons.add(btn)
        this.items.add(btn)
    }

    show() {
        Promise.all(SaveGameManager.screenshots).then((screenshots) => {
            this.buttons.forEach((btn) => {
                btn.saveGameImg = screenshots[btn.targetIndex]
            })
            this.animationFrame.notifyRedraw()
        })
        super.show()
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        return super.handlePointerEvent(event) || true
    }
}
