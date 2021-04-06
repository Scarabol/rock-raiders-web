import { ScaledLayer } from '../../screen/ScreenLayer'
import { ResourceManager } from '../../resource/ResourceManager'
import { Panel } from '../gui/ingame/panel/Panel'
import { BaseElement } from '../gui/base/BaseElement'
import { RadarPanel } from '../gui/ingame/panel/RadarPanel'
import { MessagePanel } from '../gui/ingame/panel/MessagePanel'
import { PanelCrystalSideBar } from '../gui/ingame/panel/PanelCrystalSideBar'
import { MainPanel } from '../gui/ingame/panel/MainPanel'
import { POINTER_EVENT } from '../../event/EventManager'
import { TopPanel } from '../gui/ingame/panel/TopPanel'
import { InfoDockPanel } from '../gui/ingame/infodock/InfoDockPanel'
import { PanelsCfg } from '../../cfg/PanelsCfg'
import { ButtonsCfg } from '../../cfg/ButtonsCfg'
import { PriorityButtonsConfig, PriorityListPanel, PriorityPositionsEntry } from '../gui/ingame/panel/PriorityListPanel'
import { InfoMessagesConfig } from '../gui/ingame/infodock/InfoMessagesConfig'
import { InformationPanel } from '../gui/ingame/infodock/InformationPanel'

export class GuiLayer extends ScaledLayer {

    rootElement: BaseElement = new BaseElement()
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
        const panelsCfg = new PanelsCfg(ResourceManager.cfg('Panels640x480'))
        const buttonsCfg = new ButtonsCfg(ResourceManager.cfg('Buttons640x480'))
        const layer = this
        this.rootElement.notifyRedraw = () => layer.redraw()
        // created in reverse order compared to cfg, earlier in cfg means higher z-value // TODO add some z layering at least to panels
        this.panelEncyclopedia = this.addPanel(new Panel(panelsCfg.panelEncyclopedia))
        this.panelInformation = this.addPanel(new InformationPanel(panelsCfg.panelInformation))
        this.panelInfoDock = this.addPanel(new InfoDockPanel(panelsCfg.panelInfoDock, buttonsCfg.panelInfoDock, new InfoMessagesConfig(ResourceManager.cfg('InfoMessages')), this.panelInformation))
        this.panelCameraControl = this.addPanel(new Panel(panelsCfg.panelCameraControl))
        const priorityButtonsConfig = new PriorityButtonsConfig(ResourceManager.cfg('PriorityImages'))
        const priorityPositionsConfig = Object.values(ResourceManager.cfg('PrioritiesImagePositions')).map(cfgValue => new PriorityPositionsEntry(cfgValue))
        this.panelPriorityList = this.addPanel(new PriorityListPanel(panelsCfg.panelPriorityList, buttonsCfg.panelPriorityList, priorityPositionsConfig, priorityButtonsConfig))
        this.panelTopPanel = this.addPanel(new TopPanel(panelsCfg.panelTopPanel, buttonsCfg.panelTopPanel))
        this.panelMain = this.addPanel(new MainPanel())
        this.panelCrystalSideBar = this.addPanel(new PanelCrystalSideBar(panelsCfg.panelCrystalSideBar, buttonsCfg.panelCrystalSideBar))
        this.panelMessagesSide = this.addPanel(new Panel(panelsCfg.panelMessagesSide))
        this.panelMessages = this.addPanel(new MessagePanel(panelsCfg.panelMessages))
        this.panelRadar = this.addPanel(new RadarPanel(panelsCfg.panelRadar, panelsCfg.panelRadarFill, panelsCfg.panelRadarOverlay, buttonsCfg.panelRadar))
        // link panels
        this.panelTopPanel.btnPriorities.onClick = () => {
            const toggleState = this.panelTopPanel.btnPriorities.toggleState
            this.panelMain.setMovedIn(toggleState, () => this.panelPriorityList.setMovedIn(!toggleState))
        }
        this.onRedraw = (context: CanvasRenderingContext2D) => {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height)
            this.rootElement.onRedraw(context)
        }
    }

    setup() {
        // FIXME reset GUI including all panels
        this.panelPriorityList.reset()
    }

    addPanel<T extends Panel>(panel: T): T {
        return this.rootElement.addChild(panel)
    }

    handlePointerEvent(eventEnum: POINTER_EVENT, event: PointerEvent): boolean {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        const [sx, sy] = this.toScaledCoords(event.clientX, event.clientY)
        const hit = this.context && this.context.getImageData(cx, cy, 1, 1).data[3] > 0
        let needsRedraw = false
        if (hit) {
            event.preventDefault()
            if (eventEnum === POINTER_EVENT.MOVE) {
                needsRedraw = this.rootElement.checkHover(sx, sy) || needsRedraw
            } else if (eventEnum === POINTER_EVENT.DOWN) {
                needsRedraw = this.rootElement.checkClick(sx, sy) || needsRedraw
            } else if (eventEnum === POINTER_EVENT.UP) {
                needsRedraw = this.rootElement.checkRelease(sx, sy) || needsRedraw
            }
        } else if (eventEnum === POINTER_EVENT.MOVE) {
            needsRedraw = this.rootElement.release() || needsRedraw
        }
        if (needsRedraw) this.redraw()
        return hit
    }

    handleWheelEvent(event: WheelEvent): boolean {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        return !this.context || this.context.getImageData(cx, cy, 1, 1).data[3] > 0
    }

}
