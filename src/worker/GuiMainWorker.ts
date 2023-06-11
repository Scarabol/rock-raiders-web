import '../core'
import { TypedWorkerThreaded } from './TypedWorker'
import { AbstractGuiSystem } from '../gui/AbstractGuiSystem'
import { RadarPanel } from '../gui/radar/RadarPanel'
import { MessagePanel } from '../gui/messagepanel/MessagePanel'
import { Panel } from '../gui/base/Panel'
import { PanelCrystalSideBar } from '../gui/sidebar/PanelCrystalSideBar'
import { MainPanel } from '../gui/main/MainPanel'
import { TopPanel } from '../gui/toppanel/TopPanel'
import { InformationPanel } from '../gui/infodock/InformationPanel'
import { PriorityListPanel } from '../gui/toppanel/PriorityListPanel'
import { InfoDockPanel } from '../gui/infodock/InfoDockPanel'
import { OffscreenCache } from './OffscreenCache'
import { CameraControlPanel } from '../gui/cameracontrol/CameraControlPanel'
import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'
import { GuiWorkerMessage } from '../gui/GuiWorkerMessage'

export class GuiMainSystem extends AbstractGuiSystem {
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

    onCacheReady(): void {
        super.onCacheReady()
        const panelsCfg = OffscreenCache.configuration.panels
        const buttonsCfg = OffscreenCache.configuration.buttons
        // created in reverse order compared to cfg, earlier in cfg means higher z-value // TODO add some z layering at least to panels
        this.panelEncyclopedia = this.addPanel(new Panel(this.rootElement, panelsCfg.panelEncyclopedia))
        this.panelInformation = this.addPanel(new InformationPanel(this.rootElement, panelsCfg.panelInformation))
        this.panelInfoDock = this.addPanel(new InfoDockPanel(this.rootElement, panelsCfg.panelInfoDock, buttonsCfg.panelInfoDock, OffscreenCache.configuration.infoMessages, this.panelInformation))
        this.panelCameraControl = this.addPanel(new CameraControlPanel(this.rootElement, panelsCfg.panelCameraControl, buttonsCfg.panelCameraControl, OffscreenCache.configuration.panelRotationControl))
        this.panelPriorityList = this.addPanel(new PriorityListPanel(this.rootElement, panelsCfg.panelPriorityList, buttonsCfg.panelPriorityList, OffscreenCache.configuration.prioritiesImagePositions, OffscreenCache.configuration.priorityImages))
        this.panelTopPanel = this.addPanel(new TopPanel(this.rootElement, panelsCfg.panelTopPanel, buttonsCfg.panelTopPanel))
        this.panelMain = this.addPanel(new MainPanel(this.rootElement))
        this.panelCrystalSideBar = this.addPanel(new PanelCrystalSideBar(this.rootElement, panelsCfg.panelCrystalSideBar, buttonsCfg.panelCrystalSideBar))
        this.panelMessagesSide = this.addPanel(new Panel(this.rootElement, panelsCfg.panelMessagesSide))
        this.panelMessages = this.addPanel(new MessagePanel(this.rootElement, panelsCfg.panelMessages, OffscreenCache.configuration.textMessagesWithImages))
        this.panelRadar = this.addPanel(new RadarPanel(this.rootElement, panelsCfg.panelRadar, panelsCfg.panelRadarFill, panelsCfg.panelRadarOverlay, buttonsCfg.panelRadar))
        // link panels
        this.panelTopPanel.btnCallToArms.onClick = () => {
            this.sendResponse({type: WorkerMessageType.TOGGLE_ALARM, messageState: this.panelTopPanel.btnCallToArms.toggleState})
        }
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
        if (msg.type === WorkerMessageType.SPACE_TO_CONTINUE) {
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
new GuiMainSystem(new TypedWorkerThreaded(worker))
