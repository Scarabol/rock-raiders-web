import { MenuCfg } from '../cfg/MenuCfg'
import { ObjectiveImageCfg } from '../cfg/ObjectiveImageCfg'
import { KEY_EVENT } from '../event/EventTypeEnum'
import { GameKeyboardEvent } from '../event/GameKeyboardEvent'
import { GamePointerEvent } from '../event/GamePointerEvent'
import { Panel } from '../gui/base/Panel'
import { BriefingPanel } from '../gui/briefing/BriefingPanel'
import { GuiResourceCache } from '../gui/GuiResourceCache'
import { OptionsPanel } from '../gui/overlay/OptionsPanel'
import { PausePanel } from '../gui/overlay/PausePanel'
import { DEV_MODE } from '../params'
import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'
import { GuiWorker } from './GuiWorker'
import { GuiWorkerMessage } from './GuiWorkerMessage'

export class OverlayWorker extends GuiWorker {

    panelBriefing: BriefingPanel
    panelOptions: OptionsPanel
    panelPause: PausePanel

    constructor(worker: Worker) {
        super(worker)
        this.panelPause = this.addPanel(new PausePanel(this.rootElement, GuiResourceCache.getResource('PausedMenu') as MenuCfg))
        this.panelOptions = this.addPanel(new OptionsPanel(this.rootElement, GuiResourceCache.getResource('OptionsMenu') as MenuCfg))
        this.panelBriefing = this.addPanel(new BriefingPanel(this.rootElement))
        // link items
        this.panelPause.onRepeatBriefing = () => this.setActivePanel(this.panelBriefing)
        this.panelOptions.onRepeatBriefing = () => this.setActivePanel(this.panelBriefing)
        this.panelBriefing.onSetSpaceToContinue = (state: boolean) => this.sendResponse({
            type: WorkerMessageType.SPACE_TO_CONINUE,
            messageState: state,
        })
        this.panelPause.onAbortGame = () => this.sendResponse({type: WorkerMessageType.GAME_ABORT})
        this.panelPause.onRestartGame = () => this.sendResponse({type: WorkerMessageType.GAME_RESTART})
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
            this.panelOptions.show()
        } else {
            return false
        }
        return true
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

let workerInstance: GuiWorker = null

const worker: Worker = self as any

worker.addEventListener('message', (event) => {
    const msg: GuiWorkerMessage = event.data
    if (msg.type === WorkerMessageType.INIT) {
        GuiResourceCache.resourceByName = msg.resourceByName
        GuiResourceCache.configuration = msg.cfg
        GuiResourceCache.stats = msg.stats
        workerInstance = new OverlayWorker(worker)
    } else {
        workerInstance.processMessage(msg)
    }
})
