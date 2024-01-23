import { ScaledLayer } from './ScreenLayer'
import { RadarPanel } from '../../gui/radar/RadarPanel'
import { MessagePanel } from '../../gui/messagepanel/MessagePanel'
import { Panel } from '../../gui/base/Panel'
import { PanelCrystalSideBar } from '../../gui/sidebar/PanelCrystalSideBar'
import { MainPanel } from '../../gui/main/MainPanel'
import { TopPanel } from '../../gui/toppanel/TopPanel'
import { InformationPanel } from '../../gui/infodock/InformationPanel'
import { PriorityListPanel } from '../../gui/toppanel/PriorityListPanel'
import { InfoDockPanel } from '../../gui/infodock/InfoDockPanel'
import { BaseElement } from '../../gui/base/BaseElement'
import { ChangeCursor, GuiCommand, PlaySoundEvent } from '../../event/GuiCommand'
import { EventKey } from '../../event/EventKeyEnum'
import { GameEvent } from '../../event/GameEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { USE_KEYBOARD_SHORTCUTS } from '../../params'
import { Cursor } from '../../resource/Cursor'
import { KEY_EVENT, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GuiClickEvent, GuiHoverEvent, GuiReleaseEvent } from '../../gui/event/GuiEvent'
import { EventBus } from '../../event/EventBus'
import { CameraControlPanel } from '../../gui/cameracontrol/CameraControlPanel'
import { ToggleAlarmEvent } from '../../event/WorldEvents'
import { ShowOptionsEvent } from '../../event/LocalEvents'
import { ResourceManager } from '../../resource/ResourceManager'
import { GameWheelEvent } from '../../event/GameWheelEvent'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { Sample } from '../../audio/Sample'

export class GuiMainLayer extends ScaledLayer {
    rootElement: BaseElement
    panels: Panel[] = []
    panelRadar: RadarPanel
    panelMessages: MessagePanel
    panelMessagesSide: Panel
    panelCrystalSideBar: PanelCrystalSideBar
    panelMain: MainPanel
    panelTopPanel: TopPanel
    panelInformation: InformationPanel
    panelPriorityList: PriorityListPanel
    panelCameraControl: Panel
    panelInfoDock: InfoDockPanel
    panelEncyclopedia: Panel

    constructor() {
        super()
        ResourceManager.startDependencySpriteRenderPool()
        const panelsCfg = ResourceManager.configuration.panels
        const buttonsCfg = ResourceManager.configuration.buttons
        this.rootElement = new BaseElement(null)
        this.rootElement.notifyRedraw = () => this.animationFrame.notifyRedraw()
        this.rootElement.publishEvent = (event: GuiCommand) => {
            EventBus.publishEvent(event)
        }
        this.rootElement.registerEventListener = <T extends GameEvent>(eventKey: EventKey, callback: (event: T) => void) => {
            EventBus.registerEventListener(eventKey, callback)
        }
        // created in reverse order compared to cfg, earlier in cfg means higher z-value // TODO add some z layering at least to panels
        this.panelEncyclopedia = this.addPanel(new Panel(this.rootElement, panelsCfg.panelEncyclopedia))
        this.panelInformation = this.addPanel(new InformationPanel(this.rootElement, panelsCfg.panelInformation))
        this.panelInfoDock = this.addPanel(new InfoDockPanel(this.rootElement, panelsCfg.panelInfoDock, buttonsCfg.panelInfoDock, ResourceManager.configuration.infoMessages, this.panelInformation))
        this.panelCameraControl = this.addPanel(new CameraControlPanel(this.rootElement, panelsCfg.panelCameraControl, buttonsCfg.panelCameraControl, ResourceManager.configuration.panelRotationControl))
        this.panelPriorityList = this.addPanel(new PriorityListPanel(this.rootElement, panelsCfg.panelPriorityList, buttonsCfg.panelPriorityList, ResourceManager.configuration.prioritiesImagePositions, ResourceManager.configuration.priorityImages))
        this.panelTopPanel = this.addPanel(new TopPanel(this.rootElement, panelsCfg.panelTopPanel, buttonsCfg.panelTopPanel))
        this.panelMain = this.addPanel(new MainPanel(this.rootElement))
        this.panelCrystalSideBar = this.addPanel(new PanelCrystalSideBar(this.rootElement, panelsCfg.panelCrystalSideBar, buttonsCfg.panelCrystalSideBar))
        this.panelMessagesSide = this.addPanel(new Panel(this.rootElement, panelsCfg.panelMessagesSide))
        this.panelMessages = this.addPanel(new MessagePanel(this.rootElement, panelsCfg.panelMessages, ResourceManager.configuration.textMessagesWithImages))
        this.panelRadar = this.addPanel(new RadarPanel(this.rootElement, panelsCfg.panelRadar, panelsCfg.panelRadarFill, panelsCfg.panelRadarOverlay, buttonsCfg.panelRadar))
        // link panels
        this.panelTopPanel.btnCallToArms.onClick = () => {
            EventBus.publishEvent(new ToggleAlarmEvent(this.panelTopPanel.btnCallToArms.toggleState))
        }
        EventBus.registerEventListener(EventKey.TOGGLE_ALARM, (event: ToggleAlarmEvent) => {
            this.panelTopPanel.btnCallToArms.setToggleState(event.alarmState)
        })
        this.panelTopPanel.btnOptions.onClick = () => {
            EventBus.publishEvent(new ShowOptionsEvent())
        }
        this.panelTopPanel.btnPriorities.onClick = () => {
            if (this.panelTopPanel.btnPriorities.toggleState) {
                this.panelMain.setMovedIn(true, () => this.panelPriorityList.setMovedIn(false))
            } else {
                this.panelPriorityList.setMovedIn(true, () => this.panelMain.setMovedIn(false))
            }
        }
        this.animationFrame.onRedraw = (context) => {
            context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            this.rootElement.onRedraw(context)
        }
        this.animationFrame.notifyRedraw()
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
        new Map<keyof HTMLElementEventMap, KEY_EVENT>([
            ['keydown', KEY_EVENT.DOWN],
            ['keyup', KEY_EVENT.UP],
        ]).forEach((eventEnum, eventType) => {
            this.addEventListener(eventType, (event): boolean => {
                const gameEvent = new GameKeyboardEvent(eventEnum, event as KeyboardEvent)
                return this.handleKeyEvent(gameEvent)
            })
        })
        this.addEventListener('wheel', (event: WheelEvent): boolean => {
            const gameEvent = new GameWheelEvent(event)
            ;[gameEvent.canvasX, gameEvent.canvasY] = this.transformCoords(gameEvent.clientX, gameEvent.clientY)
            return this.animationFrame.isOpaque(gameEvent.canvasX, gameEvent.canvasY)
        })
    }

    reset() {
        super.reset()
        this.rootElement.reset()
        this.panels.forEach((p) => p.reset())
    }

    addPanel<T extends Panel>(panel: T): T {
        this.rootElement.addChild(panel)
        this.panels.push(panel)
        return panel
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        const hit = this.animationFrame.isOpaque(event.canvasX, event.canvasY)
        if (hit) {
            EventBus.publishEvent(new ChangeCursor(Cursor.STANDARD)) // TODO don't spam so many events?!
            if (event.eventEnum === POINTER_EVENT.MOVE) {
                this.rootElement.checkHover(new GuiHoverEvent(event.canvasX, event.canvasY))
            } else if (event.eventEnum === POINTER_EVENT.DOWN) {
                this.rootElement.checkClick(new GuiClickEvent(event.canvasX, event.canvasY, event.button))
            } else if (event.eventEnum === POINTER_EVENT.UP) {
                const stateChanged = this.rootElement.checkRelease(new GuiReleaseEvent(event.canvasX, event.canvasY, event.button))
                if (!stateChanged) {
                    this.rootElement.publishEvent(new ChangeCursor(Cursor.NOT_OKAY, 1000))
                    this.rootElement.publishEvent(new PlaySoundEvent(Sample.SFX_NotOkay, false))
                }
            }
        } else if (event.eventEnum === POINTER_EVENT.MOVE || event.eventEnum === POINTER_EVENT.LEAVE) {
            this.rootElement.release()
        }
        return hit
    }

    handleKeyEvent(event: GameKeyboardEvent): boolean {
        if (this.panelMain.movedIn) return false
        const activeSubPanels = this.panelMain.subPanels.filter((p) => !p.movedIn)
        const activeIconPanelButtons = activeSubPanels.flatMap((p) => p.iconPanelButtons)
        if (USE_KEYBOARD_SHORTCUTS) {
            const buttonWithKey = activeIconPanelButtons.find((b) => b.hotkey === event.key)
            if (buttonWithKey && !buttonWithKey.isInactive()) {
                if (event.eventEnum === KEY_EVENT.UP) buttonWithKey.onClick()
                return true
            }
        }
        return false
    }
}
