import { GameMenuCfg } from '../cfg/MenuCfg'
import { MenuEntryCfg } from '../cfg/MenuEntryCfg'
import { SaveGameManager } from '../resource/SaveGameManager'
import { MainMenuLayer } from './MainMenuLayer'
import { MainMenuLoadSaveButton } from './MainMenuLoadSaveButton'
import { MainMenuWindow } from './MainMenuWindow'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GameConfig } from '../cfg/GameConfig'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { FlicAnimOverlay } from './FlicAnimOverlay'

export class LoadSaveLayer extends MainMenuLayer {
    menuCfg: GameMenuCfg
    buttons: MainMenuLoadSaveButton[] = []
    loadSaveTextWindow: MainMenuWindow
    activeOverlay?: FlicAnimOverlay

    constructor(menuCfg: MenuEntryCfg, loading: boolean) {
        super(menuCfg)
        this.menuCfg = GameConfig.instance.menu
        const saveImage = this.menuCfg.saveImage
        this.addButton(0, saveImage.pos1.x, saveImage.pos1.y, loading)
        this.addButton(1, saveImage.pos2.x, saveImage.pos2.y, loading)
        this.addButton(2, saveImage.pos3.x, saveImage.pos3.y, loading)
        this.addButton(3, saveImage.pos4.x, saveImage.pos4.y, loading)
        this.addButton(4, saveImage.pos5.x, saveImage.pos5.y, loading)
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

    set onItemAction(callback: (item: MainMenuBaseItem) => void) {
        super.onItemAction = async (item) => {
            if (this.activeOverlay) return // Overlay in progress
            if (LoadSaveLayer.hasOverlay(item)) {
                this.activeOverlay = item.overlay
                await this.activeOverlay.play()
                this.activeOverlay = undefined
            }
            callback(item)
        }
    }

    private static hasOverlay(item: MainMenuBaseItem): item is (MainMenuBaseItem & { overlay: FlicAnimOverlay }) {
        return !!((item as { overlay?: FlicAnimOverlay }).overlay)
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
