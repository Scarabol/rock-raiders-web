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
import { ChangeCursor, PlaySoundEvent } from '../../event/GuiCommand'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { USE_KEYBOARD_SHORTCUTS } from '../../params'
import { Cursor } from '../../resource/Cursor'
import { KEY_EVENT, MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GuiHoverEvent, GuiPointerDownEvent, GuiPointerUpEvent } from '../../gui/event/GuiEvent'
import { CameraControlPanel } from '../../gui/cameracontrol/CameraControlPanel'
import { GameWheelEvent } from '../../event/GameWheelEvent'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { SAMPLE } from '../../audio/Sample'
import { GameConfig } from '../../cfg/GameConfig'
import { EventBroker } from '../../event/EventBroker'
import { BaseEvent, EventTypeMap } from '../../event/EventTypeMap'

export class GuiBaseLayer extends ScaledLayer {
    readonly rootElement: BaseElement
    readonly panels: Panel[] = []
    layerScale = 1 // XXX Scaled panel crystal side bar does not fit

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
        this.animationFrame.onRedraw = (context) => {
            context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            this.rootElement.onRedraw(context)
        }
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

    resize(width: number, height: number) {
        super.resize(width * this.layerScale, height * this.layerScale)
    }

    addPanel<T extends Panel>(panel: T): T {
        this.rootElement.addChild(panel)
        this.panels.push(panel)
        return panel
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        const hit = this.animationFrame.isOpaque(event.canvasX, event.canvasY)
        if (hit) {
            EventBroker.publish(new ChangeCursor(Cursor.STANDARD)) // TODO don't spam so many events?!
            if (event.eventEnum === POINTER_EVENT.MOVE) {
                this.rootElement.onPointerMove(new GuiHoverEvent(event.canvasX, event.canvasY))
            } else if (event.eventEnum === POINTER_EVENT.DOWN) {
                if (event.button === MOUSE_BUTTON.MAIN) {
                    this.rootElement.onPointerDown(new GuiPointerDownEvent(event.canvasX, event.canvasY, event.button))
                }
            } else if (event.eventEnum === POINTER_EVENT.UP) {
                if (event.button === MOUSE_BUTTON.MAIN) {
                    const stateChanged = this.rootElement.onPointerUp(new GuiPointerUpEvent(event.canvasX, event.canvasY, event.button))
                    if (!stateChanged) {
                        this.rootElement.publishEvent(new ChangeCursor(Cursor.NOT_OKAY, 1000))
                        this.rootElement.publishEvent(new PlaySoundEvent(SAMPLE.SFX_NotOkay, false))
                    }
                }
            }
        } else if (event.eventEnum === POINTER_EVENT.MOVE || event.eventEnum === POINTER_EVENT.LEAVE) {
            this.rootElement.onPointerLeave()
        }
        return hit
    }
}

export class GuiTopLeftLayer extends GuiBaseLayer {
    readonly panelRadar: RadarPanel

    constructor() {
        super()
        this.canvas.style.justifySelf = 'start'
        this.canvas.style.alignSelf = 'start'
        this.panelRadar = this.addPanel(new RadarPanel(GameConfig.instance.panels.panelRadar, GameConfig.instance.panels.panelRadarFill, GameConfig.instance.panels.panelRadarOverlay, GameConfig.instance.buttons.panelRadar))
        this.animationFrame.notifyRedraw()
    }
}

export class GuiTopRightLayer extends GuiBaseLayer {
    readonly panelMain: MainPanel
    readonly panelTopPanel: TopPanel
    readonly panelPriorityList: PriorityListPanel

    constructor() {
        super()
        this.canvas.style.justifySelf = 'end'
        this.canvas.style.alignSelf = 'start'
        this.panelPriorityList = this.addPanel(new PriorityListPanel(GameConfig.instance.panels.panelPriorityList, GameConfig.instance.buttons.panelPriorityList, GameConfig.instance.prioritiesImagePositions, GameConfig.instance.priorityImages))
        this.panelTopPanel = this.addPanel(new TopPanel(GameConfig.instance.panels.panelTopPanel, GameConfig.instance.buttons.panelTopPanel))
        this.panelMain = this.addPanel(new MainPanel())
        this.animationFrame.notifyRedraw()
        // link panels
        this.panelTopPanel.btnPriorities.onClick = () => {
            if (this.panelTopPanel.btnPriorities.toggleState) {
                this.panelMain.setMovedIn(true, () => this.panelPriorityList.setMovedIn(false))
            } else {
                this.panelPriorityList.setMovedIn(true, () => this.panelMain.setMovedIn(false))
            }
        }
        new Map<keyof HTMLElementEventMap, KEY_EVENT>([
            ['keydown', KEY_EVENT.DOWN],
            ['keyup', KEY_EVENT.UP],
        ]).forEach((eventEnum, eventType) => {
            this.addEventListener(eventType, (event): boolean => {
                const gameEvent = new GameKeyboardEvent(eventEnum, event as KeyboardEvent)
                return this.handleKeyEvent(gameEvent)
            })
        })
    }

    handleKeyEvent(event: GameKeyboardEvent): boolean {
        if (this.panelMain.movedIn || !USE_KEYBOARD_SHORTCUTS) return false
        const activeSubPanels = this.panelMain.subPanels.filter((p) => !p.movedIn)
        const activeIconPanelButtons = activeSubPanels.flatMap((p) => p.iconPanelButtons)
        const buttonWithKey = activeIconPanelButtons.find((b) => b.hotkey === event.key)
        if (buttonWithKey && !buttonWithKey.isInactive()) {
            if (event.eventEnum === KEY_EVENT.UP) {
                const bx = buttonWithKey.x + buttonWithKey.width / 2
                const by = buttonWithKey.y + buttonWithKey.height / 2
                buttonWithKey.onClick(bx, by)
            }
            return true
        }
        return false
    }
}

export class GuiBottomRightLayer extends GuiBaseLayer {
    readonly panelCrystalSideBar: PanelCrystalSideBar
    readonly panelCameraControl: Panel

    constructor() {
        super()
        this.canvas.style.justifySelf = 'end'
        this.canvas.style.alignSelf = 'end'
        this.panelCameraControl = this.addPanel(new CameraControlPanel(GameConfig.instance.panels.panelCameraControl, GameConfig.instance.buttons.panelCameraControl, GameConfig.instance.panelRotationControl))
        this.panelCrystalSideBar = this.addPanel(new PanelCrystalSideBar(GameConfig.instance.panels.panelCrystalSideBar, GameConfig.instance.buttons.panelCrystalSideBar))
        this.animationFrame.notifyRedraw()
    }
}

export class GuiBottomLeftLayer extends GuiBaseLayer {
    readonly panelMessages: MessagePanel
    readonly panelMessagesSide: Panel
    readonly panelInformation: InformationPanel
    readonly panelInfoDock: InfoDockPanel

    constructor() {
        super()
        this.canvas.style.justifySelf = 'start'
        this.canvas.style.alignSelf = 'end'
        this.panelInformation = this.addPanel(new InformationPanel(GameConfig.instance.panels.panelInformation))
        this.panelInfoDock = this.addPanel(new InfoDockPanel(GameConfig.instance.panels.panelInfoDock, GameConfig.instance.buttons.panelInfoDock, GameConfig.instance.infoMessages, this.panelInformation))
        this.panelMessagesSide = this.addPanel(new Panel(GameConfig.instance.panels.panelMessagesSide))
        this.panelMessages = this.addPanel(new MessagePanel(GameConfig.instance.panels.panelMessages, GameConfig.instance.textMessagesWithImages))
        this.animationFrame.notifyRedraw()
    }
}
