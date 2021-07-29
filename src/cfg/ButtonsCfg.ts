import { ButtonInfoDockCfg } from '../gui/infodock/ButtonInfoDockCfg'
import { ButtonRadarCfg } from '../gui/radar/RadarPanel'
import { ButtonCrystalSideBarCfg } from '../gui/sidebar/PanelCrystalSideBar'
import { ButtonPriorityListCfg } from '../gui/toppanel/ButtonPriorityListCfg'
import { ButtonTopCfg } from '../gui/toppanel/ButtonTopCfg'
import { BaseConfig } from './BaseConfig'
import { ButtonCameraControlCfg } from './ButtonCameraControlCfg'
import { ButtonInformationCfg } from './ButtonInformationCfg'

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
