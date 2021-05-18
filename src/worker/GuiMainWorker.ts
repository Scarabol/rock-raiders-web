import { ButtonsCfg } from '../cfg/ButtonsCfg'
import { PanelsCfg } from '../cfg/PanelsCfg'
import { Panel } from '../gui/base/Panel'
import { GuiResourceCache } from '../gui/GuiResourceCache'
import { InfoDockPanel } from '../gui/infodock/InfoDockPanel'
import { InfoMessagesConfig } from '../gui/infodock/InfoMessagesConfig'
import { InformationPanel } from '../gui/infodock/InformationPanel'
import { MainPanel } from '../gui/main/MainPanel'
import { MessagePanel } from '../gui/messagepanel/MessagePanel'
import { TextInfoMessageConfig } from '../gui/messagepanel/TextInfoMessageConfig'
import { RadarPanel } from '../gui/radar/RadarPanel'
import { PanelCrystalSideBar } from '../gui/sidebar/PanelCrystalSideBar'
import { PriorityButtonsConfig } from '../gui/toppanel/PriorityButtonsConfig'
import { PriorityListPanel } from '../gui/toppanel/PriorityListPanel'
import { PriorityPositionsEntry } from '../gui/toppanel/PriorityPositionsEntry'
import { TopPanel } from '../gui/toppanel/TopPanel'
import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'
import { GuiWorker } from './GuiWorker'
import { GuiWorkerMessage } from './GuiWorkerMessage'

export class GuiMainWorker extends GuiWorker {

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

    constructor(worker: Worker) {
        super(worker)
        const panelsCfg = new PanelsCfg(GuiResourceCache.cfg('Panels640x480'))
        const buttonsCfg = new ButtonsCfg(GuiResourceCache.cfg('Buttons640x480'))
        // created in reverse order compared to cfg, earlier in cfg means higher z-value // TODO add some z layering at least to panels
        this.panelEncyclopedia = this.addPanel(new Panel(this.rootElement, panelsCfg.panelEncyclopedia))
        this.panelInformation = this.addPanel(new InformationPanel(this.rootElement, panelsCfg.panelInformation))
        this.panelInfoDock = this.addPanel(new InfoDockPanel(this.rootElement, panelsCfg.panelInfoDock, buttonsCfg.panelInfoDock, new InfoMessagesConfig(GuiResourceCache.cfg('InfoMessages')), this.panelInformation))
        this.panelCameraControl = this.addPanel(new Panel(this.rootElement, panelsCfg.panelCameraControl))
        const priorityPositionsConfig = Object.values(GuiResourceCache.cfg('PrioritiesImagePositions')).map(cfgValue => new PriorityPositionsEntry(cfgValue))
        const priorityButtonsConfig = new PriorityButtonsConfig(GuiResourceCache.cfg('PriorityImages'))
        this.panelPriorityList = this.addPanel(new PriorityListPanel(this.rootElement, panelsCfg.panelPriorityList, buttonsCfg.panelPriorityList, priorityPositionsConfig, priorityButtonsConfig))
        this.panelTopPanel = this.addPanel(new TopPanel(this.rootElement, panelsCfg.panelTopPanel, buttonsCfg.panelTopPanel))
        this.panelMain = this.addPanel(new MainPanel(this.rootElement))
        this.panelCrystalSideBar = this.addPanel(new PanelCrystalSideBar(this.rootElement, panelsCfg.panelCrystalSideBar, buttonsCfg.panelCrystalSideBar))
        this.panelMessagesSide = this.addPanel(new Panel(this.rootElement, panelsCfg.panelMessagesSide))
        this.panelMessages = this.addPanel(new MessagePanel(this.rootElement, panelsCfg.panelMessages, new TextInfoMessageConfig(GuiResourceCache.cfg('TextMessagesWithImages'))))
        this.panelRadar = this.addPanel(new RadarPanel(this.rootElement, panelsCfg.panelRadar, panelsCfg.panelRadarFill, panelsCfg.panelRadarOverlay, buttonsCfg.panelRadar))
        // link panels
        this.panelTopPanel.btnOptions.onClick = () => {
            this.sendResponse({type: WorkerMessageType.SHOW_OPTIONS})
        }
        this.panelTopPanel.btnPriorities.onClick = () => {
            if (this.panelTopPanel.btnPriorities.toggleState) {
                this.panelMain.setMovedIn(true, () => this.panelPriorityList.setMovedIn(false))
            } else {
                this.panelPriorityList.setMovedIn(true, () => this.panelMain.setMovedIn(false))
            }
        }
    }

    onProcessMessage(msg: GuiWorkerMessage): boolean {
        if (msg.type === WorkerMessageType.SPACE_TO_CONINUE) {
            if (msg.messageState) {
                this.panelMessages.setMessage(this.panelMessages.msgSpaceToContinue, 0)
            } else {
                this.panelMessages.unsetMessage(this.panelMessages.msgSpaceToContinue)
            }
        } else {
            return false
        }
        return true
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
        workerInstance = new GuiMainWorker(worker)
    } else {
        workerInstance.processMessage(msg)
    }
})
