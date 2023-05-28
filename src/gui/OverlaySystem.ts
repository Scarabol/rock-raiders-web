import { ObjectiveImageCfg } from '../cfg/LevelsCfg'
import '../core'
import { EventKey } from '../event/EventKeyEnum'
import { KEY_EVENT } from '../event/EventTypeEnum'
import { GameKeyboardEvent } from '../event/GameKeyboardEvent'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GuiCommand } from '../event/GuiCommand'
import { DEV_MODE } from '../params'
import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'
import { OffscreenCache } from '../worker/OffscreenCache'
import { AbstractGuiSystem } from './AbstractGuiSystem'
import { Panel } from './base/Panel'
import { BriefingPanel } from './briefing/BriefingPanel'
import { GuiWorkerMessage } from './GuiWorkerMessage'
import { OptionsPanel } from './overlay/OptionsPanel'
import { PausePanel } from './overlay/PausePanel'

export class OverlaySystem extends AbstractGuiSystem {
    panelBriefing: BriefingPanel
    panelOptions: OptionsPanel
    panelPause: PausePanel

    onCacheReady(): void {
        super.onCacheReady()
        this.panelPause = this.addPanel(new PausePanel(this.rootElement, OffscreenCache.configuration.menu.pausedMenu, this.canvas.width, this.canvas.height))
        this.panelOptions = this.addPanel(new OptionsPanel(this.rootElement, OffscreenCache.configuration.menu.optionsMenu, this.canvas.width, this.canvas.height))
        this.panelBriefing = this.addPanel(new BriefingPanel(this.rootElement))
        // link items
        this.panelPause.onContinueGame = () => this.setActivePanel(null)
        this.panelPause.onRepeatBriefing = () => this.setActivePanel(this.panelBriefing)
        this.panelPause.onAbortGame = () => this.sendResponse({type: WorkerMessageType.GAME_ABORT})
        this.panelPause.onRestartGame = () => this.sendResponse({type: WorkerMessageType.GAME_RESTART})
        this.panelOptions.onRepeatBriefing = () => this.setActivePanel(this.panelBriefing)
        this.panelOptions.onContinueMission = () => this.setActivePanel(null)
        this.panelBriefing.onSetSpaceToContinue = (state: boolean) => this.sendResponse({
            type: WorkerMessageType.SPACE_TO_CONTINUE,
            messageState: state,
        })
        this.panelBriefing.onStartMission = () => this.setActivePanel(null)
    }

    onProcessMessage(msg: GuiWorkerMessage): boolean {
        if (msg.type === WorkerMessageType.OVERLAY_SETUP) {
            this.setup(msg.objectiveText, msg.objectiveBackImgCfg)
        } else if (msg.type === WorkerMessageType.SHOW_OPTIONS) {
            this.setActivePanel(this.panelOptions)
        } else {
            return false
        }
        return true
    }

    setup(objectiveText: string, objectiveBackImgCfg: ObjectiveImageCfg) {
        this.panelBriefing.setup(objectiveText, objectiveBackImgCfg)
        this.setActivePanel(DEV_MODE ? null : this.panelBriefing)
    }

    setActivePanel(panel: Panel) {
        this.panels.forEach(p => p !== panel && p.hide())
        panel?.show()
        this.publishEvent(new GuiCommand(panel ? EventKey.PAUSE_GAME : EventKey.UNPAUSE_GAME))
        this.animationFrame.redraw()
    }

    reset(): void {
        super.reset()
        this.setActivePanel(DEV_MODE ? null : this.panelBriefing)
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
                if (this.panelBriefing.hidden) {
                    this.setActivePanel(this.panelPause.hidden && this.panelOptions.hidden ? this.panelPause : null)
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
