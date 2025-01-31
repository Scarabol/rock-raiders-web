import { LevelConfData } from '../../game/LevelLoader'
import { EventKey } from '../../event/EventKeyEnum'
import { ScaledLayer } from './ScreenLayer'
import { BriefingPanel } from '../../gui/briefing/BriefingPanel'
import { OptionsPanel } from '../../gui/overlay/OptionsPanel'
import { PausePanel } from '../../gui/overlay/PausePanel'
import { ChangeCursor, HideTooltip } from '../../event/GuiCommand'
import { Panel } from '../../gui/base/Panel'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { CURSOR } from '../../resource/Cursor'
import { POINTER_EVENT } from '../../event/EventTypeEnum'
import { GuiHoverEvent, GuiPointerDownEvent, GuiPointerUpEvent } from '../../gui/event/GuiEvent'
import { BaseElement } from '../../gui/base/BaseElement'
import { GameResultState } from '../../game/model/GameResult'
import { GameResultEvent, RestartGameEvent } from '../../event/WorldEvents'
import { GameConfig } from '../../cfg/GameConfig'
import { EventBroker } from '../../event/EventBroker'
import { BaseEvent, EventTypeMap } from '../../event/EventTypeMap'
import { SaveGameManager } from '../../resource/SaveGameManager'

export class OverlayLayer extends ScaledLayer {
    rootElement: BaseElement
    panels: Panel[] = []
    panelBriefing: BriefingPanel
    panelOptions: OptionsPanel
    panelPause: PausePanel

    constructor() {
        super()
        this.rootElement = new BaseElement()
        this.rootElement.notifyRedraw = () => this.animationFrame.notifyRedraw()
        this.rootElement.publishEvent = (event: BaseEvent) => {
            EventBroker.publish(event)
        }
        this.rootElement.registerEventListener = <Type extends keyof EventTypeMap>(eventType: Type, callback: (event: EventTypeMap[Type]) => void) => {
            EventBroker.subscribe(eventType, callback)
        }
        this.panelPause = this.addPanel(new PausePanel(GameConfig.instance.menu.pausedMenu, this.canvas.width, this.canvas.height))
        this.panelOptions = this.addPanel(new OptionsPanel(GameConfig.instance.menu.optionsMenu, this.canvas.width, this.canvas.height))
        this.panelBriefing = this.addPanel(new BriefingPanel())
        // link items
        this.panelPause.onContinueGame = () => this.setActivePanel(null)
        this.panelPause.onRepeatBriefing = () => this.setActivePanel(this.panelBriefing)
        this.panelPause.onAbortGame = () => {
            this.setActivePanel(null)
            EventBroker.publish(new GameResultEvent(GameResultState.QUIT))
        }
        this.panelPause.onRestartGame = () => EventBroker.publish(new RestartGameEvent())
        this.panelOptions.onRepeatBriefing = () => this.setActivePanel(this.panelBriefing)
        this.panelOptions.onContinueMission = () => this.setActivePanel(null)
        this.panelBriefing.onContinueMission = () => this.setActivePanel(null)
        this.animationFrame.onRedraw = (context) => {
            context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            this.rootElement.onRedraw(context)
        }
        this.animationFrame.notifyRedraw()
        EventBroker.subscribe(EventKey.SHOW_OPTIONS, () => this.setActivePanel(this.panelOptions))
        new Map<keyof HTMLElementEventMap, POINTER_EVENT>([
            ['pointermove', POINTER_EVENT.MOVE],
            ['pointerdown', POINTER_EVENT.DOWN],
            ['pointerup', POINTER_EVENT.UP],
            ['pointerleave', POINTER_EVENT.LEAVE],
        ]).forEach((eventEnum, eventType) => {
            this.addEventListener(eventType, (event): boolean => {
                const gameEvent = new GamePointerEvent(eventEnum, event as PointerEvent)
                ;[gameEvent.canvasX, gameEvent.canvasY] = this.transformCoords(gameEvent.clientX, gameEvent.clientY)
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

    showBriefing(levelConf: LevelConfData) {
        const objectiveSfx = `Stream_Objective_Levels::${levelConf.levelName}`.toLowerCase()
        this.panelBriefing.setup(GameConfig.instance.main.missionBriefingText, levelConf.objectiveTextCfg.objective, levelConf.objectiveImage640x480, objectiveSfx)
        this.panelBriefing.onContinueMission = () => this.setActivePanel(null)
        this.setActivePanel(SaveGameManager.currentPreferences.skipBriefings ? null : this.panelBriefing)
    }

    showResultBriefing(result: GameResultState, levelConf: LevelConfData, onContinue: () => void) {
        const mainCfg = GameConfig.instance.main
        let title = ''
        let text = ''
        let sfx = ''
        if (result === GameResultState.COMPLETE) {
            title = mainCfg.missionCompletedText
            text = levelConf.objectiveTextCfg.completion
            sfx = `Stream_ObjectiveAcheived_Levels::${levelConf.levelName}`.toLowerCase()
        } else if (result === GameResultState.FAILED) {
            title = mainCfg.missionFailedText
            text = levelConf.objectiveTextCfg.failure
            sfx = `Stream_ObjectiveFailed_Levels::${levelConf.levelName}`.toLowerCase()
        } else if (result === GameResultState.CRYSTAL_FAILURE) {
            title = mainCfg.missionFailedText
            text = levelConf.objectiveTextCfg.crystalFailure
            sfx = 'Stream_ObjectiveFailedCrystals'
        } else { // GameResultState.QUIT
            onContinue()
            return
        }
        this.panelBriefing.setup(title, text, levelConf.objectiveImage640x480, sfx)
        this.setActivePanel(this.panelBriefing)
        this.panelBriefing.onContinueMission = onContinue
        this.active = true
    }

    setActivePanel(panel: Panel) {
        this.panels.forEach(p => p !== panel && p.hide())
        if (panel) {
            panel.show()
            EventBroker.publish(new ChangeCursor(CURSOR.STANDARD))
            EventBroker.publish(new HideTooltip())
        }
        EventBroker.publish(new BaseEvent(panel ? EventKey.PAUSE_GAME : EventKey.UNPAUSE_GAME))
        this.animationFrame.notifyRedraw()
    }

    reset(): void {
        this.rootElement.reset()
        this.panels.forEach((p) => p.reset())
        this.setActivePanel(SaveGameManager.currentPreferences.skipBriefings ? null : this.panelBriefing)
    }

    addPanel<T extends Panel>(panel: T): T {
        this.rootElement.addChild(panel)
        this.panels.push(panel)
        return panel
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        if (this.panels.every(p => p.hidden)) return false
        if (event.eventEnum === POINTER_EVENT.MOVE) {
            this.rootElement.onPointerMove(new GuiHoverEvent(event.canvasX, event.canvasY))
        } else if (event.eventEnum === POINTER_EVENT.DOWN) {
            this.rootElement.onPointerDown(new GuiPointerDownEvent(event.canvasX, event.canvasY, event.button))
        } else if (event.eventEnum === POINTER_EVENT.UP) {
            this.rootElement.onPointerUp(new GuiPointerUpEvent(event.canvasX, event.canvasY, event.button))
        } else if (event.eventEnum === POINTER_EVENT.LEAVE) {
            this.rootElement.onPointerLeave()
        }
        return true
    }
}
