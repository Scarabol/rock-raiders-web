import { MenuCfg } from '../../cfg/MenuCfg'
import { ObjectiveImageCfg } from '../../cfg/ObjectiveImageCfg'
import { KEY_EVENT } from '../../event/EventTypeEnum'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { Panel } from '../../gui/base/Panel'
import { BriefingPanel } from '../../gui/briefing/BriefingPanel'
import { OptionsPanel } from '../../gui/overlay/OptionsPanel'
import { PausePanel } from '../../gui/overlay/PausePanel'
import { DEV_MODE } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'
import { GuiBaseLayer } from './GuiBaseLayer'

export class OverlayLayer extends GuiBaseLayer {

    panelBriefing: BriefingPanel
    panelOptions: OptionsPanel
    panelPause: PausePanel

    constructor() {
        super()
        this.panelPause = this.addPanel(new PausePanel(this, ResourceManager.getResource('PausedMenu') as MenuCfg))
        this.panelOptions = this.addPanel(new OptionsPanel(this, ResourceManager.getResource('OptionsMenu') as MenuCfg))
        this.panelBriefing = this.addPanel(new BriefingPanel())
        // link items
        this.panelPause.onRepeatBriefing = () => this.setActivePanel(this.panelBriefing)
        this.panelOptions.onRepeatBriefing = () => this.setActivePanel(this.panelBriefing)
    }

    setActivePanel(panel: Panel) {
        this.panels.forEach(p => p !== panel && p.hide())
        panel.show()
        this.redraw()
    }

    setup(objectiveText: string, objectiveBackImgCfg: ObjectiveImageCfg) {
        this.panelBriefing.setup(objectiveText, objectiveBackImgCfg)
        if (!DEV_MODE) this.setActivePanel(this.panelBriefing)
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

}
