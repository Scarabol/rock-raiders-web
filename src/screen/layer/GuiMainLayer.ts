import { ButtonsCfg } from '../../cfg/ButtonsCfg'
import { PanelsCfg } from '../../cfg/PanelsCfg'
import { Panel } from '../../gui/base/Panel'
import { InfoDockPanel } from '../../gui/infodock/InfoDockPanel'
import { InfoMessagesConfig } from '../../gui/infodock/InfoMessagesConfig'
import { InformationPanel } from '../../gui/infodock/InformationPanel'
import { MainPanel } from '../../gui/main/MainPanel'
import { MessagePanel } from '../../gui/messagepanel/MessagePanel'
import { TextInfoMessageConfig } from '../../gui/messagepanel/TextInfoMessageConfig'
import { RadarPanel } from '../../gui/radar/RadarPanel'
import { PanelCrystalSideBar } from '../../gui/sidebar/PanelCrystalSideBar'
import { PriorityButtonsConfig } from '../../gui/toppanel/PriorityButtonsConfig'
import { PriorityListPanel } from '../../gui/toppanel/PriorityListPanel'
import { PriorityPositionsEntry } from '../../gui/toppanel/PriorityPositionsEntry'
import { TopPanel } from '../../gui/toppanel/TopPanel'
import { ResourceManager } from '../../resource/ResourceManager'
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
            if (this.panelTopPanel.btnPriorities.toggleState) {
                this.panelMain.setMovedIn(true, () => this.panelPriorityList.setMovedIn(false))
            } else {
                this.panelPriorityList.setMovedIn(true, () => this.panelMain.setMovedIn(false))
            }
        }
    }

}
