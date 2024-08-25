import { BaseConfig } from './BaseConfig'

export class PanelCfg extends BaseConfig {
    filename: string = ''
    xOut: number = 0
    yOut: number = 0
    xIn: number = 0
    yIn: number = 0

    setFromCfgObj(cfgValue: any, createMissing: boolean = false): this {
        if (!Array.isArray(cfgValue) || cfgValue.length !== 5) {
            throw new Error(`Invalid config value given: ${cfgValue}`)
        }
        [this.filename, this.xOut, this.yOut, this.xIn, this.yIn] = cfgValue
        if (!this.filename) throw new Error(`No filename given in ${cfgValue}`)
        return this
    }
}

export class PanelsCfg extends BaseConfig {
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

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new PanelCfg().setFromCfgObj(cfgValue)
    }
}
