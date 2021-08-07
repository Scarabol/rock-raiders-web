import { BaseConfig } from './BaseConfig'

export class PanelCfg extends BaseConfig {
    filename: string = null
    xOut: number = 0
    yOut: number = 0
    xIn: number = 0
    yIn: number = 0

    setFromCfgObj(cfgValue: any, createMissing: boolean = false): this {
        if (!Array.isArray(cfgValue) || cfgValue.length !== 5) {
            throw new Error(`Invalid config value given: ${cfgValue}`)
        }
        [this.filename, this.xOut, this.yOut, this.xIn, this.yIn] = cfgValue
        return this
    }
}

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

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new PanelCfg().setFromCfgObj(cfgValue)
    }
}
