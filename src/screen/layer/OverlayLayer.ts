import { ObjectiveImageCfg } from '../../cfg/LevelsCfg'
import { EventKey } from '../../event/EventKeyEnum'
import { ScaledLayer } from './ScreenLayer'
import { BriefingPanel } from '../../gui/briefing/BriefingPanel'
import { OptionsPanel } from '../../gui/overlay/OptionsPanel'
import { PausePanel } from '../../gui/overlay/PausePanel'
import { DEV_MODE } from '../../params'
import { ChangeCursor, GuiCommand } from '../../event/GuiCommand'
import { GameEvent } from '../../event/GameEvent'
import { Panel } from '../../gui/base/Panel'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { Cursor } from '../../resource/Cursor'
import { KEY_EVENT, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GuiClickEvent, GuiHoverEvent, GuiReleaseEvent } from '../../gui/event/GuiEvent'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GameWheelEvent } from '../../event/GameWheelEvent'
import { BaseElement } from '../../gui/base/BaseElement'
import { EventBus } from '../../event/EventBus'
import { GameResultState } from '../../game/model/GameResult'
import { GameResultEvent, RestartGameEvent } from '../../event/WorldEvents'
import { SetSpaceToContinueEvent } from '../../event/LocalEvents'
import { ResourceManager } from '../../resource/ResourceManager'

export class OverlayLayer extends ScaledLayer {
    rootElement: BaseElement = new BaseElement(null)
    panels: Panel[] = []
    panelBriefing: BriefingPanel
    panelOptions: OptionsPanel
    panelPause: PausePanel

    constructor() {
        super()
        Promise.all([
            ResourceManager.addFont('interface/fonts/MbriefFont2.bmp'),
            ResourceManager.addFont('interface/fonts/MbriefFont.bmp'),
        ]).then(() => {
            this.panelPause = this.addPanel(new PausePanel(this.rootElement, ResourceManager.configuration.menu.pausedMenu, this.canvas.width, this.canvas.height))
            this.panelOptions = this.addPanel(new OptionsPanel(this.rootElement, ResourceManager.configuration.menu.optionsMenu, this.canvas.width, this.canvas.height))
            this.panelBriefing = this.addPanel(new BriefingPanel(this.rootElement))
            // link items
            this.panelPause.onContinueGame = () => this.setActivePanel(null)
            this.panelPause.onRepeatBriefing = () => this.setActivePanel(this.panelBriefing)
            this.panelPause.onAbortGame = () => EventBus.publishEvent(new GameResultEvent(GameResultState.QUIT))
            this.panelPause.onRestartGame = () => EventBus.publishEvent(new RestartGameEvent())
            this.panelOptions.onRepeatBriefing = () => this.setActivePanel(this.panelBriefing)
            this.panelOptions.onContinueMission = () => this.setActivePanel(null)
            this.panelBriefing.onSetSpaceToContinue = (state: boolean) => EventBus.publishEvent(new SetSpaceToContinueEvent(state))
            this.panelBriefing.onStartMission = () => this.setActivePanel(null)
        })
        this.animationFrame.onRedraw = (context) => {
            context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            this.rootElement.onRedraw(context)
        }
        this.rootElement.notifyRedraw = () => this.animationFrame.notifyRedraw()
        this.rootElement.publishEvent = (event: GuiCommand) => {
            EventBus.publishEvent(event)
        }
        this.rootElement.registerEventListener = (eventKey: EventKey, callback: (event: GameEvent) => any) => {
            EventBus.registerEventListener(eventKey, callback)
        }
        this.animationFrame.notifyRedraw()
        EventBus.registerEventListener(EventKey.SHOW_OPTIONS, () => this.setActivePanel(this.panelOptions))
    }

    setup(objectiveText: string, objectiveBackImgCfg: ObjectiveImageCfg) {
        this.panelBriefing.setup(objectiveText, objectiveBackImgCfg)
        this.setActivePanel(DEV_MODE ? null : this.panelBriefing)
    }

    setActivePanel(panel: Panel) {
        this.panels.forEach(p => p !== panel && p.hide())
        panel?.show()
        EventBus.publishEvent(new GuiCommand(panel ? EventKey.PAUSE_GAME : EventKey.UNPAUSE_GAME))
        this.animationFrame.notifyRedraw()
    }

    reset(): void {
        this.rootElement.reset()
        this.panels.forEach((p) => p.reset())
        this.setActivePanel(DEV_MODE ? null : this.panelBriefing)
    }

    addPanel<T extends Panel>(panel: T): T {
        this.rootElement.addChild(panel)
        this.panels.push(panel)
        return panel
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        if (this.panels.every(p => p.hidden)) return false
        const hit = this.animationFrame.context.getImageData(event.clientX, event.clientY, 1, 1).data[3] > 0
        if (hit) {
            EventBus.publishEvent(new ChangeCursor(Cursor.STANDARD)) // TODO don't spam so many events?!
            if (event.eventEnum === POINTER_EVENT.MOVE) {
                this.rootElement.checkHover(new GuiHoverEvent(event.canvasX, event.canvasY))
            } else if (event.eventEnum === POINTER_EVENT.DOWN) {
                this.rootElement.checkClick(new GuiClickEvent(event.canvasX, event.canvasY, event.button))
            } else if (event.eventEnum === POINTER_EVENT.UP) {
                this.rootElement.checkRelease(new GuiReleaseEvent(event.canvasX, event.canvasY, event.button))
            }
        } else if (event.eventEnum === POINTER_EVENT.MOVE || event.eventEnum === POINTER_EVENT.LEAVE) {
            this.rootElement.release()
        }
        return hit
    }

    handleKeyEvent(event: GameKeyboardEvent): boolean {
        if (event.eventEnum === KEY_EVENT.UP) {
            if (event.key === 'Escape') {
                if (this.panelBriefing.hidden) {
                    this.setActivePanel(this.panelPause.hidden && this.panelOptions.hidden ? this.panelPause : null)
                    return true
                }
            } else if (event.key === ' ') { // space
                if (!this.panelBriefing.hidden) {
                    this.panelBriefing.nextParagraph()
                    return true
                }
            }
        }
        return false
    }

    handleWheelEvent(event: GameWheelEvent): boolean {
        return this.animationFrame.context.getImageData(event.clientX, event.clientY, 1, 1).data[3] > 0
    }
}
