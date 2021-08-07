import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'
import { Panel } from './base/Panel'
import { CameraControlPanel } from './cameracontrol/CameraControlPanel'
import { GuiResourceCache } from './GuiResourceCache'
import { GuiWorker } from './GuiWorker'
import { GuiWorkerMessage } from './GuiWorkerMessage'
import { InfoDockPanel } from './infodock/InfoDockPanel'
import { InformationPanel } from './infodock/InformationPanel'
import { MainPanel } from './main/MainPanel'
import { MessagePanel } from './messagepanel/MessagePanel'
import { RadarPanel } from './radar/RadarPanel'
import { PanelCrystalSideBar } from './sidebar/PanelCrystalSideBar'
import { PriorityListPanel } from './toppanel/PriorityListPanel'
import { TopPanel } from './toppanel/TopPanel'

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
    }

    init(): void {
        const panelsCfg = GuiResourceCache.configuration.panels
        const buttonsCfg = GuiResourceCache.configuration.buttons
        // created in reverse order compared to cfg, earlier in cfg means higher z-value // TODO add some z layering at least to panels
        this.panelEncyclopedia = this.addPanel(new Panel(this.rootElement, panelsCfg.panelEncyclopedia))
        this.panelInformation = this.addPanel(new InformationPanel(this.rootElement, panelsCfg.panelInformation))
        this.panelInfoDock = this.addPanel(new InfoDockPanel(this.rootElement, panelsCfg.panelInfoDock, buttonsCfg.panelInfoDock, GuiResourceCache.configuration.infoMessages, this.panelInformation))
        this.panelCameraControl = this.addPanel(new CameraControlPanel(this.rootElement, panelsCfg.panelCameraControl, buttonsCfg.panelCameraControl, GuiResourceCache.configuration.panelRotationControl))
        this.panelPriorityList = this.addPanel(new PriorityListPanel(this.rootElement, panelsCfg.panelPriorityList, buttonsCfg.panelPriorityList, GuiResourceCache.configuration.prioritiesImagePositions, GuiResourceCache.configuration.priorityImages))
        this.panelTopPanel = this.addPanel(new TopPanel(this.rootElement, panelsCfg.panelTopPanel, buttonsCfg.panelTopPanel))
        this.panelMain = this.addPanel(new MainPanel(this.rootElement))
        this.panelCrystalSideBar = this.addPanel(new PanelCrystalSideBar(this.rootElement, panelsCfg.panelCrystalSideBar, buttonsCfg.panelCrystalSideBar))
        this.panelMessagesSide = this.addPanel(new Panel(this.rootElement, panelsCfg.panelMessagesSide))
        this.panelMessages = this.addPanel(new MessagePanel(this.rootElement, panelsCfg.panelMessages, GuiResourceCache.configuration.textMessagesWithImages))
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

const worker: Worker = self as any
const workerInstance = new GuiMainWorker(worker)
worker.addEventListener('message', (event) => workerInstance.processMessage(event.data))
