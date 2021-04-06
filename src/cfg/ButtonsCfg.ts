import { BaseConfig } from './BaseConfig'
import { ButtonRadarCfg } from '../game/gui/ingame/panel/RadarPanel'
import { ButtonCrystalSideBarCfg } from '../game/gui/ingame/panel/PanelCrystalSideBar'
import { ButtonTopCfg } from '../game/gui/ingame/panel/TopPanel'
import { ButtonInfoDockCfg } from '../game/gui/ingame/panel/InfoDockPanel'
import { ButtonPriorityListCfg } from '../game/gui/ingame/panel/PriorityListPanel'

export class ButtonsCfg extends BaseConfig {

    panelRadar: ButtonRadarCfg = null
    panelCrystalSideBar: ButtonCrystalSideBarCfg = null
    panelTopPanel: ButtonTopCfg = null
    panelInformation: ButtonInformationCfg = null
    panelPriorityList: ButtonPriorityListCfg = null
    panelCameraControl: ButtonCameraControlCfg = null
    panelInfoDock: ButtonInfoDockCfg = null
    panelEncyclopedia: any = null // not used in the game

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        const btnCfgValue = {}
        cfgValue.forEach(arr => btnCfgValue[arr[0]] = arr)
        if (lCfgKeyName === 'panelRadar'.toLowerCase()) {
            return new ButtonRadarCfg(btnCfgValue)
        } else if (lCfgKeyName === 'panelCrystalSideBar'.toLowerCase()) {
            return new ButtonCrystalSideBarCfg(btnCfgValue)
        } else if (lCfgKeyName === 'panelTopPanel'.toLowerCase()) {
            return new ButtonTopCfg(btnCfgValue)
        } else if (lCfgKeyName === 'panelInformation'.toLowerCase()) {
            return new ButtonInformationCfg(btnCfgValue)
        } else if (lCfgKeyName === 'panelPriorityList'.toLowerCase()) {
            return new ButtonPriorityListCfg(btnCfgValue)
        } else if (lCfgKeyName === 'panelCameraControl'.toLowerCase()) {
            return new ButtonCameraControlCfg(btnCfgValue)
        } else if (lCfgKeyName === 'panelInfoDock'.toLowerCase()) {
            return new ButtonInfoDockCfg(btnCfgValue)
        } else if (lCfgKeyName === 'panelEncyclopedia'.toLowerCase()) {
            return null // not used in the game
        } else {
            return btnCfgValue
        }
    }

}

export class ButtonInformationCfg extends BaseConfig {

    panelButtonInformationToggle: ButtonCfg = null
    panelButtonInformationFunction: ButtonCfg = null

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }

}

export class ButtonCameraControlCfg extends BaseConfig {

    panelButtonCameraControlZoomIn: ButtonCfg = null
    panelButtonCameraControlZoomOut: ButtonCfg = null
    panelButtonCameraControlCycleBuildings: ButtonCfg = null
    panelButtonCameraControlRotate: ButtonCfg = null

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }

}

export class BaseButtonCfg {

    buttonType?: string
    normalFile?: string
    highlightFile?: string
    pressedFile?: string
    disabledFile?: string
    relX?: number
    relY?: number
    width?: number
    height?: number
    tooltip?: string
}

    export class ButtonCfg extends BaseButtonCfg {

    constructor(cfgValue: any) {
        super()
        if (cfgValue.length === 9) {
            [this.buttonType, this.normalFile, this.highlightFile, this.pressedFile, this.relX, this.relY, this.width, this.height, this.tooltip] = cfgValue
        } else {
            throw 'Invalid number of arguments (' + cfgValue.length + ') given for button configuration expected 9 or 5'
        }
    }

}
