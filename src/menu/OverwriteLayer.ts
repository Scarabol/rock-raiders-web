import { MainMenuLayer } from './MainMenuLayer'
import { MenuEntryCfg } from '../cfg/MenuEntryCfg'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { POINTER_EVENT } from '../event/EventTypeEnum'
import { MainMenuLabelButton } from './MainMenuLabelButton'
import { MainMenuOverwritePanel } from './MainMenuOverwritePanel'
import { MenuLabelItemCfg } from '../cfg/MenuLabelItemCfg'
import { GameConfig } from '../cfg/GameConfig'

export class OverwriteLayer extends MainMenuLayer {
    overwritePanel: MainMenuOverwritePanel
    yesBtn: MainMenuLabelButton

    constructor() {
        const dialogCfg = GameConfig.instance.dialog
        const layerCfg = {...(new MenuEntryCfg()), menuImage: dialogCfg.contrastOverlay, loFont: 'Interface/Fonts/MbriefFont.bmp', hiFont: 'Interface/Fonts/MbriefFont2.bmp'} as MenuEntryCfg
        super(layerCfg)
        this.overwritePanel = new MainMenuOverwritePanel(this.fixedWidth, this.fixedHeight)
        this.items.push(this.overwritePanel)
        const overwriteCfg = GameConfig.instance.menu.overwrite
        const panelX = (this.fixedWidth - this.overwritePanel.width) / 2
        const panelY = (this.fixedHeight - this.overwritePanel.height) / 2
        this.yesBtn = new MainMenuLabelButton(this, {
            x: panelX + dialogCfg.okWindow.x + 16, // XXX Why offset needed?
            y: panelY + dialogCfg.okWindow.y,
            label: overwriteCfg.ok,
        } as MenuLabelItemCfg)
        this.yesBtn.onPressed = () => this.hide()
        this.items.push(this.yesBtn)
        const noBtn = new MainMenuLabelButton(this, {
            x: panelX + dialogCfg.cancelWindow.x + 20, // XXX Why offset needed?
            y: panelY + dialogCfg.cancelWindow.y,
            label: overwriteCfg.cancel,
        } as MenuLabelItemCfg)
        noBtn.onPressed = () => this.hide()
        this.items.push(noBtn)
    }

    override handlePointerEvent(event: GamePointerEvent): boolean {
        super.handlePointerEvent(event)
        return event.eventEnum !== POINTER_EVENT.leave
    }
}
