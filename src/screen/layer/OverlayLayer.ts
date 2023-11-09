import { ObjectiveImageCfg } from '../../cfg/LevelsCfg'
import { EventKey } from '../../event/EventKeyEnum'
import { ScaledLayer } from './ScreenLayer'
import { BriefingPanel } from '../../gui/briefing/BriefingPanel'
import { OptionsPanel } from '../../gui/overlay/OptionsPanel'
import { PausePanel } from '../../gui/overlay/PausePanel'
import { DEV_MODE } from '../../params'
import { ChangeCursor, ChangeTooltip, GuiCommand } from '../../event/GuiCommand'
import { GameEvent } from '../../event/GameEvent'
import { Panel } from '../../gui/base/Panel'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { Cursor } from '../../resource/Cursor'
import { POINTER_EVENT } from '../../event/EventTypeEnum'
import { GuiClickEvent, GuiHoverEvent, GuiReleaseEvent } from '../../gui/event/GuiEvent'
import { BaseElement } from '../../gui/base/BaseElement'
import { EventBus } from '../../event/EventBus'
import { GameResultState } from '../../game/model/GameResult'
import { GameResultEvent, RestartGameEvent } from '../../event/WorldEvents'
import { ResourceManager } from '../../resource/ResourceManager'

export class OverlayLayer extends ScaledLayer {
    rootElement: BaseElement
    panels: Panel[] = []
    panelBriefing: BriefingPanel
    panelOptions: OptionsPanel
    panelPause: PausePanel

    constructor() {
        super()
        this.rootElement = new BaseElement(null)
        this.rootElement.notifyRedraw = () => this.animationFrame.notifyRedraw()
        this.rootElement.publishEvent = (event: GuiCommand) => {
            EventBus.publishEvent(event)
        }
        this.rootElement.registerEventListener = (eventKey: EventKey, callback: (event: GameEvent) => any) => {
            EventBus.registerEventListener(eventKey, callback)
        }
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
        this.panelBriefing.onContinueMission = () => this.setActivePanel(null)
        this.animationFrame.onRedraw = (context) => {
            context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            this.rootElement.onRedraw(context)
        }
        this.animationFrame.notifyRedraw()
        EventBus.registerEventListener(EventKey.SHOW_OPTIONS, () => this.setActivePanel(this.panelOptions))
        new Map<keyof HTMLElementEventMap, POINTER_EVENT>([
            ['pointermove', POINTER_EVENT.MOVE],
            ['pointerdown', POINTER_EVENT.DOWN],
            ['pointerup', POINTER_EVENT.UP],
            ['pointerleave', POINTER_EVENT.LEAVE],
        ]).forEach((eventEnum, eventType) => {
            this.addEventListener(eventType, (event: PointerEvent): boolean => {
                const gameEvent = new GamePointerEvent(eventEnum, event)
                ;[gameEvent.canvasX, gameEvent.canvasY] = this.transformCoords(event.clientX, event.clientY)
                return this.handlePointerEvent(gameEvent)
            })
        })
        this.addEventListener('keyup', (event: KeyboardEvent): boolean => {
            if (event.key === 'Escape' && this.panelBriefing.hidden) {
                this.setActivePanel(this.panelPause.hidden && this.panelOptions.hidden ? this.panelPause : null)
                return true
            } else if (event.key === ' ' && !this.panelBriefing.hidden) { // space
                this.panelBriefing.nextParagraph()
                return true
            }
            return false
        })
        this.addEventListener('wheel', (): boolean => this.panels.some((p) => !p.hidden))
    }

    setup(dialogTitle: string, objectiveText: string, objectiveBackImgCfg: ObjectiveImageCfg) {
        if (!this.panelBriefing) { // TODO Method setup may be called before briefing panel is initialized
            console.warn('Briefing panel not yet initialized and will not work in the future')
        } else {
            this.panelBriefing.setup(dialogTitle, objectiveText, objectiveBackImgCfg)
        }
        this.setActivePanel(DEV_MODE ? null : this.panelBriefing)
    }

    setActivePanel(panel: Panel) {
        this.panels.forEach(p => p !== panel && p.hide())
        if (panel) {
            panel.show()
            EventBus.publishEvent(new ChangeCursor(Cursor.STANDARD))
            EventBus.publishEvent(new ChangeTooltip('', 0, '', 0))
        }
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
        if (event.eventEnum === POINTER_EVENT.MOVE) {
            this.rootElement.checkHover(new GuiHoverEvent(event.canvasX, event.canvasY))
        } else if (event.eventEnum === POINTER_EVENT.DOWN) {
            this.rootElement.checkClick(new GuiClickEvent(event.canvasX, event.canvasY, event.button))
        } else if (event.eventEnum === POINTER_EVENT.UP) {
            this.rootElement.checkRelease(new GuiReleaseEvent(event.canvasX, event.canvasY, event.button))
        } else if (event.eventEnum === POINTER_EVENT.LEAVE) {
            this.rootElement.release()
        }
        return true
    }
}
