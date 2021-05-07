import { MenuCfg } from '../../cfg/MenuCfg'
import { ObjectiveImageCfg } from '../../cfg/ObjectiveImageCfg'
import { KEY_EVENT } from '../../event/EventTypeEnum'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { IEventHandler } from '../../event/IEventHandler'
import { ChangeCursor } from '../../event/LocalEvents'
import { Panel } from '../../gui/base/Panel'
import { BriefingPanel } from '../../gui/briefing/BriefingPanel'
import { OptionsPanel } from '../../gui/overlay/OptionsPanel'
import { PausePanel } from '../../gui/overlay/PausePanel'
import { DEV_MODE } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'
import { Cursors } from '../Cursors'
import { GuiBaseLayer } from './GuiBaseLayer'

export class OverlayLayer extends GuiBaseLayer {

    panelBriefing: BriefingPanel
    panelOptions: OptionsPanel
    panelPause: PausePanel

    constructor(parent: IEventHandler) {
        super(parent)
        this.panelPause = this.addPanel(new PausePanel(this.rootElement, this.fixedWidth, this.fixedHeight, ResourceManager.getResource('PausedMenu') as MenuCfg))
        this.panelOptions = this.addPanel(new OptionsPanel(this.rootElement, this.fixedWidth, this.fixedHeight, ResourceManager.getResource('OptionsMenu') as MenuCfg))
        this.panelBriefing = this.addPanel(new BriefingPanel(this.rootElement))
        // link items
        this.panelPause.onRepeatBriefing = () => this.setActivePanel(this.panelBriefing)
        this.panelOptions.onRepeatBriefing = () => this.setActivePanel(this.panelBriefing)
    }

    reset() {
        super.reset()
        if (!DEV_MODE) this.setActivePanel(this.panelBriefing)
    }

    setup(objectiveText: string, objectiveBackImgCfg: ObjectiveImageCfg) {
        this.panelBriefing.setup(objectiveText, objectiveBackImgCfg)
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        if (this.panels.every(p => p.hidden)) return false
        return super.handlePointerEvent(event) || true // catch em all
    }

    handleKeyEvent(event: GameKeyboardEvent): boolean {
        let result = false
        const lEventKey = event.key.toLowerCase()
        if (event.eventEnum === KEY_EVENT.UP) {
            if (lEventKey === 'escape') {
                if (this.panelBriefing.hidden && this.panelOptions.hidden) {
                    if (this.panelPause.hidden) {
                        // TODO actually pause the game
                        this.setActivePanel(this.panelPause)
                    } else {
                        // TODO actually unpause the game
                        this.panelPause.hide()
                    }
                    result = true
                }
            } else if (lEventKey === ' ') { // space
                if (!this.panelBriefing.hidden) {
                    this.panelBriefing.nextParagraph()
                    result = true
                }
            }
        }
        return result
    }

    setActivePanel(panel: Panel) {
        this.publishEvent(new ChangeCursor(Cursors.Pointer_Standard))
        this.panels.forEach(p => p !== panel && p.hide())
        panel.show()
        this.redraw()
    }

}
