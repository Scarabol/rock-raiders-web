import { ConfigSetFromEntryValue, ConfigSetFromRecord } from './Configurable'
import { CfgEntry, CfgEntryValue } from './CfgEntry'

export class PanelCfg implements ConfigSetFromEntryValue {
    filename: string = ''
    xOut: number = 0
    yOut: number = 0
    xIn: number = 0
    yIn: number = 0

    setFromValue(cfgValue: CfgEntryValue): this {
        const array = cfgValue.toArray(',', 5)
        this.filename = array[0].toFileName()
        this.xOut = array[1].toNumber()
        this.yOut = array[2].toNumber()
        this.xIn = array[3].toNumber()
        this.yIn = array[4].toNumber()
        if (!this.filename) throw new Error(`No filename given in ${array}`)
        return this
    }
}

export class PanelsCfg implements ConfigSetFromRecord {
    panelRadar: PanelCfg = new PanelCfg()
    panelRadarFill: PanelCfg = new PanelCfg()
    panelRadarOverlay: PanelCfg = new PanelCfg()
    panelMessages: PanelCfg = new PanelCfg()
    panelMessagesSide: PanelCfg = new PanelCfg()
    panelCrystalSideBar: PanelCfg = new PanelCfg()
    panelTopPanel: PanelCfg = new PanelCfg()
    panelInformation: PanelCfg = new PanelCfg()
    panelPriorityList: PanelCfg = new PanelCfg()
    panelCameraControl: PanelCfg = new PanelCfg()
    panelInfoDock: PanelCfg = new PanelCfg()
    panelEncyclopedia: PanelCfg = new PanelCfg()

    setFromRecord(cfgValue: CfgEntry): this {
        this.panelRadar.setFromValue(cfgValue.getValue('Panel_Radar'))
        this.panelRadarFill.setFromValue(cfgValue.getValue('Panel_RadarFill'))
        this.panelRadarOverlay.setFromValue(cfgValue.getValue('Panel_RadarOverlay'))
        this.panelMessages.setFromValue(cfgValue.getValue('Panel_Messages'))
        this.panelMessagesSide.setFromValue(cfgValue.getValue('Panel_MessagesSide'))
        this.panelCrystalSideBar.setFromValue(cfgValue.getValue('Panel_CrystalSideBar'))
        this.panelTopPanel.setFromValue(cfgValue.getValue('Panel_TopPanel'))
        this.panelInformation.setFromValue(cfgValue.getValue('Panel_Information'))
        this.panelPriorityList.setFromValue(cfgValue.getValue('Panel_PriorityList'))
        this.panelCameraControl.setFromValue(cfgValue.getValue('Panel_CameraControl'))
        this.panelInfoDock.setFromValue(cfgValue.getValue('Panel_InfoDock'))
        this.panelEncyclopedia.setFromValue(cfgValue.getValue('Panel_Encyclopedia'))
        return this
    }
}
