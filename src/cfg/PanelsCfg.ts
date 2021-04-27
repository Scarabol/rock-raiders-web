import { BaseConfig } from './BaseConfig'
import { PanelCfg } from './PanelCfg'

export class PanelsCfg extends BaseConfig {

    panelRadar: PanelCfg = null
    panelRadarFill: PanelCfg = null
    panelRadarOverlay: PanelCfg = null
    panelMessages: PanelCfg = null
    panelMessagesSide: PanelCfg = null
    panelCrystalSideBar: PanelCfg = null
    panelTopPanel: PanelCfg = null
    panelInformation: PanelCfg = null
    panelPriorityList: PanelCfg = null
    panelCameraControl: PanelCfg = null
    panelInfoDock: PanelCfg = null
    panelEncyclopedia: PanelCfg = null

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        return new PanelCfg(cfgValue)
    }
}

