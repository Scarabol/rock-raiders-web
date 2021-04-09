import { ScaledLayer } from '../../screen/ScreenLayer'
import { ResourceManager } from '../../resource/ResourceManager'
import { Panel } from '../gui/base/Panel'
import { BaseElement } from '../gui/base/BaseElement'
import { RadarPanel } from '../gui/radar/RadarPanel'
import { MessagePanel } from '../gui/messagepanel/MessagePanel'
import { PanelCrystalSideBar } from '../gui/sidebar/PanelCrystalSideBar'
import { MainPanel } from '../gui/main/MainPanel'
import { KEY_EVENT, POINTER_EVENT } from '../../event/EventManager'
import { TopPanel } from '../gui/toppanel/TopPanel'
import { InfoDockPanel } from '../gui/infodock/InfoDockPanel'
import { PanelsCfg } from '../../cfg/PanelsCfg'
import { ButtonsCfg } from '../../cfg/ButtonsCfg'
import { PriorityListPanel } from '../gui/toppanel/PriorityListPanel'
import { InfoMessagesConfig } from '../gui/infodock/InfoMessagesConfig'
import { InformationPanel } from '../gui/infodock/InformationPanel'
import { PriorityButtonsConfig } from '../gui/toppanel/PriorityButtonsConfig'
import { PriorityPositionsEntry } from '../gui/toppanel/PriorityPositionsEntry'
import { TextInfoMessageConfig } from '../gui/messagepanel/TextInfoMessageConfig'
import { PausePanel } from '../gui/overlay/PausePanel'
import { MenuCfg } from '../../cfg/MenuCfg'
import { OptionsPanel } from '../gui/overlay/OptionsPanel'
import { BriefingPanel } from '../gui/briefing/BriefingPanel'
import { BriefingPanelCfg } from '../../cfg/BriefingPanelCfg'

export class GuiLayer extends ScaledLayer {

    rootElement: BaseElement = new BaseElement()
    panelBriefing: BriefingPanel
    panelOptions: OptionsPanel
    panelPause: PausePanel
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
    needsRedraw: boolean = false

    constructor() {
        super()
        const panelsCfg = new PanelsCfg(ResourceManager.cfg('Panels640x480'))
        const buttonsCfg = new ButtonsCfg(ResourceManager.cfg('Buttons640x480'))
        const layer = this
        this.rootElement.notifyRedraw = () => layer.needsRedraw = true
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
        this.panelMessages = this.addPanel(new MessagePanel(panelsCfg.panelMessages, new TextInfoMessageConfig(ResourceManager.cfg('TextMessagesWithImages'))))
        this.panelRadar = this.addPanel(new RadarPanel(panelsCfg.panelRadar, panelsCfg.panelRadarFill, panelsCfg.panelRadarOverlay, buttonsCfg.panelRadar))
        this.panelPause = this.addPanel(new PausePanel(this, ResourceManager.getResource('PausedMenu') as MenuCfg))
        this.panelOptions = this.addPanel(new OptionsPanel(this, ResourceManager.getResource('OptionsMenu') as MenuCfg))
        this.panelBriefing = this.addPanel(new BriefingPanel(this.panelMessages, new BriefingPanelCfg()))
        this.onRedraw = (context: CanvasRenderingContext2D) => {
            this.needsRedraw = false
            context.clearRect(0, 0, context.canvas.width, context.canvas.height)
            this.rootElement.onRedraw(context)
        }
        // link panels
        this.panelTopPanel.btnOptions.onClick = () => {
            this.panelOptions.show()
        }
        this.panelTopPanel.btnPriorities.onClick = () => {
            const toggleState = this.panelTopPanel.btnPriorities.toggleState
            this.panelMain.setMovedIn(toggleState, () => this.panelPriorityList.setMovedIn(!toggleState))
        }
        this.panelPause.onRepeatBriefing = () => {
            this.panelPause.hide()
            this.panelBriefing.show()
        }
        this.panelPause.onAbortGame = () => {
            console.log('TODO abort game here') // TODO abort game
        }
        this.panelPause.onRestartGame = () => {
            console.log('TODO restart game here') // TODO restart game
        }
        this.panelOptions.onRepeatBriefing = () => {
            this.panelOptions.hide()
            this.panelBriefing.show()
        }
    }

    setup(objectiveText: string, objectiveBackImgCfg: { filename: string, x: number, y: number }) {
        // FIXME reset GUI including all panels
        this.panelPriorityList.reset()
        this.panelBriefing.setup(objectiveText, objectiveBackImgCfg)
    }

    addPanel<T extends Panel>(panel: T): T {
        return this.rootElement.addChild(panel)
    }

    handlePointerEvent(eventEnum: POINTER_EVENT, event: PointerEvent): boolean {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        const [sx, sy] = this.toScaledCoords(event.clientX, event.clientY)
        const hit = this.context && this.context.getImageData(cx, cy, 1, 1).data[3] > 0
        if (hit) {
            event.preventDefault()
            if (eventEnum === POINTER_EVENT.MOVE) {
                this.rootElement.checkHover(sx, sy)
            } else if (eventEnum === POINTER_EVENT.DOWN) {
                this.rootElement.checkClick(sx, sy)
            } else if (eventEnum === POINTER_EVENT.UP) {
                this.rootElement.checkRelease(sx, sy)
            }
        } else if (eventEnum === POINTER_EVENT.MOVE) {
            this.rootElement.release()
        }
        if (this.needsRedraw) this.redraw()
        return hit
    }

    handleWheelEvent(event: WheelEvent): boolean {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        return !this.context || this.context.getImageData(cx, cy, 1, 1).data[3] > 0
    }

    handleKeyEvent(eventEnum: KEY_EVENT, event: KeyboardEvent): boolean {
        let result: boolean
        const lEventKey = event.key.toLowerCase()
        if (eventEnum === KEY_EVENT.UP) {
            if (lEventKey === 'escape') {
                if (this.panelPause.hidden) {
                    // TODO actually pause the game
                    this.panelPause.show()
                } else {
                    // TODO actually unpause the game
                    this.panelPause.hide()
                }
                result = true
            } else if (lEventKey === ' ') { // space
                if (!this.panelBriefing.hidden) {
                    this.panelBriefing.nextParagraph()
                    result = true
                }
            }
        }
        if (this.needsRedraw) this.redraw()
        return result
    }

}
