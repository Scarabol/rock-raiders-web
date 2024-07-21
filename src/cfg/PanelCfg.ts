import { BaseConfig } from './BaseConfig'

export class PanelCfg extends BaseConfig {
    filename?: string
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
    panelRadar?: PanelCfg
    panelRadarFill?: PanelCfg
    panelRadarOverlay?: PanelCfg
    panelMessages?: PanelCfg
    panelMessagesSide?: PanelCfg
    panelCrystalSideBar?: PanelCfg
    panelTopPanel?: PanelCfg
    panelInformation?: PanelCfg
    panelPriorityList?: PanelCfg
    panelCameraControl?: PanelCfg
    panelInfoDock?: PanelCfg
    panelEncyclopedia?: PanelCfg

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new PanelCfg().setFromCfgObj(cfgValue)
    }
}
