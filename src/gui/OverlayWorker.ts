import { MenuCfg } from '../cfg/MenuCfg'
import { ObjectiveImageCfg } from '../cfg/ObjectiveImageCfg'
import { EventKey } from '../event/EventKeyEnum'
import { KEY_EVENT } from '../event/EventTypeEnum'
import { GameKeyboardEvent } from '../event/GameKeyboardEvent'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { LocalEvent } from '../event/LocalEvents'
import { DEV_MODE } from '../params'
import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'
import { Panel } from './base/Panel'
import { BriefingPanel } from './briefing/BriefingPanel'
import { GuiResourceCache } from './GuiResourceCache'
import { GuiWorker } from './GuiWorker'
import { GuiWorkerMessage } from './GuiWorkerMessage'
import { OptionsPanel } from './overlay/OptionsPanel'
import { PausePanel } from './overlay/PausePanel'

export class OverlayWorker extends GuiWorker {

    panelBriefing: BriefingPanel
    panelOptions: OptionsPanel
    panelPause: PausePanel

    constructor(worker: Worker) {
        super(worker)
    }

    init() {
        this.panelPause = this.addPanel(new PausePanel(this.rootElement, GuiResourceCache.getResource('PausedMenu') as MenuCfg))
        this.panelOptions = this.addPanel(new OptionsPanel(this.rootElement, GuiResourceCache.getResource('OptionsMenu') as MenuCfg))
        this.panelBriefing = this.addPanel(new BriefingPanel(this.rootElement))
        // link items
        this.panelPause.onContinueGame = () => this.setActivePanel(null)
        this.panelPause.onRepeatBriefing = () => this.setActivePanel(this.panelBriefing)
        this.panelPause.onAbortGame = () => this.sendResponse({type: WorkerMessageType.GAME_ABORT})
        this.panelPause.onRestartGame = () => this.sendResponse({type: WorkerMessageType.GAME_RESTART})
        this.panelOptions.onRepeatBriefing = () => this.setActivePanel(this.panelBriefing)
        this.panelOptions.onContinueMission = () => this.setActivePanel(null)
        this.panelBriefing.onSetSpaceToContinue = (state: boolean) => this.sendResponse({
            type: WorkerMessageType.SPACE_TO_CONINUE,
            messageState: state,
        })
        this.panelBriefing.onStartMission = () => this.setActivePanel(null)
    }

    setCanvas(canvas: OffscreenCanvas) {
        super.setCanvas(canvas)
        this.panelPause.width = this.canvas.width
        this.panelPause.height = this.canvas.height
        this.panelOptions.width = this.canvas.width
        this.panelOptions.height = this.canvas.height
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

    setActivePanel(panel: Panel) {
        this.panels.forEach(p => p !== panel && p.hide())
        panel?.show()
        this.publishEvent(new LocalEvent(panel ? EventKey.PAUSE_GAME : EventKey.UNPAUSE_GAME))
        this.redraw()
    }

    setup(objectiveText: string, objectiveBackImgCfg: ObjectiveImageCfg) {
        this.panelBriefing.setup(objectiveText, objectiveBackImgCfg)
        this.setActivePanel(DEV_MODE ? null : this.panelBriefing)
    }

    reset() {
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
                if (this.panelBriefing.hidden && this.panelOptions.hidden) {
                    this.setActivePanel(this.panelPause.hidden ? this.panelPause : null)
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
const workerInstance = new OverlayWorker(worker)
worker.addEventListener('message', (event) => workerInstance.processMessage(event.data))
