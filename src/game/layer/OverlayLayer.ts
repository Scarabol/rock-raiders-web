import { BriefingPanel } from '../gui/briefing/BriefingPanel'
import { OptionsPanel } from '../gui/overlay/OptionsPanel'
import { PausePanel } from '../gui/overlay/PausePanel'
import { ResourceManager } from '../../resource/ResourceManager'
import { MenuCfg } from '../../cfg/MenuCfg'
import { BriefingPanelCfg } from '../../cfg/BriefingPanelCfg'
import { KEY_EVENT, POINTER_EVENT } from '../../event/EventManager'
import { Panel } from '../gui/base/Panel'
import { GuiBaseLayer } from './GuiBaseLayer'
import { ObjectiveImageCfg } from '../../cfg/ObjectiveImageCfg'
import { DEV_MODE } from '../../main'

export class OverlayLayer extends GuiBaseLayer {

    panelBriefing: BriefingPanel
    panelOptions: OptionsPanel
    panelPause: PausePanel

    constructor() {
        super()
        this.panelPause = this.addPanel(new PausePanel(this, ResourceManager.getResource('PausedMenu') as MenuCfg))
        this.panelOptions = this.addPanel(new OptionsPanel(this, ResourceManager.getResource('OptionsMenu') as MenuCfg))
        this.panelBriefing = this.addPanel(new BriefingPanel(new BriefingPanelCfg()))
        // link items
        this.panelPause.onRepeatBriefing = () => this.setActivePanel(this.panelBriefing)
        this.panelPause.onAbortGame = () => {
            console.log('TODO abort game here') // TODO abort game
        }
        this.panelPause.onRestartGame = () => {
            console.log('TODO restart game here') // TODO restart game
        }
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

    handlePointerEvent(eventEnum: POINTER_EVENT, event: PointerEvent): boolean {
        if (this.panels.every(p => p.hidden)) return false
        return super.handlePointerEvent(eventEnum, event) || this.isActive() // catch em all
    }

    handleKeyEvent(eventEnum: KEY_EVENT, event: KeyboardEvent): boolean {
        let result = false
        const lEventKey = event.key.toLowerCase()
        if (eventEnum === KEY_EVENT.UP) {
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
        return result || this.isActive() // catch em all
    }

}
