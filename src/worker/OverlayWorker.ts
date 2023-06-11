import '../core'
import { TypedWorkerThreaded } from './TypedWorker'
import { AbstractGuiSystem } from '../gui/AbstractGuiSystem'
import { BriefingPanel } from '../gui/briefing/BriefingPanel'
import { OptionsPanel } from '../gui/overlay/OptionsPanel'
import { PausePanel } from '../gui/overlay/PausePanel'
import { OffscreenCache } from './OffscreenCache'
import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'
import { GuiWorkerMessage } from '../gui/GuiWorkerMessage'
import { ObjectiveImageCfg } from '../cfg/LevelsCfg'
import { DEV_MODE } from '../params'
import { Panel } from '../gui/base/Panel'
import { GuiCommand } from '../event/GuiCommand'
import { EventKey } from '../event/EventKeyEnum'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { GameKeyboardEvent } from '../event/GameKeyboardEvent'
import { KEY_EVENT } from '../event/EventTypeEnum'

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

const worker: Worker = self as any
new OverlaySystem(new TypedWorkerThreaded(worker))
