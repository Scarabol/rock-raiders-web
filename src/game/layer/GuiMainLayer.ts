import { ResourceManager } from '../../resource/ResourceManager'
import { Panel } from '../gui/base/Panel'
import { RadarPanel } from '../gui/radar/RadarPanel'
import { MessagePanel } from '../gui/messagepanel/MessagePanel'
import { PanelCrystalSideBar } from '../gui/sidebar/PanelCrystalSideBar'
import { MainPanel } from '../gui/main/MainPanel'
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
import { GuiBaseLayer } from './GuiBaseLayer'

export class GuiMainLayer extends GuiBaseLayer {

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
    onOptionsShow: () => any = () => console.log('show options triggered')

    constructor() {
        super()
        const panelsCfg = new PanelsCfg(ResourceManager.cfg('Panels640x480'))
        const buttonsCfg = new ButtonsCfg(ResourceManager.cfg('Buttons640x480'))
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
        // link panels
        this.panelTopPanel.btnOptions.onClick = () => this.onOptionsShow()
        this.panelTopPanel.btnPriorities.onClick = () => {
            const toggleState = this.panelTopPanel.btnPriorities.toggleState
            this.panelMain.setMovedIn(toggleState, () => this.panelPriorityList.setMovedIn(!toggleState))
        }
    }

    reset() {
        // FIXME reset GUI including all panels
        this.panelPriorityList.reset()
    }

}
