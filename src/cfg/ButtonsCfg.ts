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

    parseValue(unifiedKey: string, cfgValue: any): any {
        const btnCfgValue = {}
        cfgValue.forEach(arr => btnCfgValue[arr[0]] = arr)
        if (unifiedKey === 'panelRadar'.toLowerCase()) {
            return new ButtonRadarCfg().setFromCfgObj(btnCfgValue)
        } else if (unifiedKey === 'panelCrystalSideBar'.toLowerCase()) {
            return new ButtonCrystalSideBarCfg().setFromCfgObj(btnCfgValue)
        } else if (unifiedKey === 'panelTopPanel'.toLowerCase()) {
            return new ButtonTopCfg().setFromCfgObj(btnCfgValue)
        } else if (unifiedKey === 'panelInformation'.toLowerCase()) {
            return new ButtonInformationCfg().setFromCfgObj(btnCfgValue)
        } else if (unifiedKey === 'panelPriorityList'.toLowerCase()) {
            return new ButtonPriorityListCfg().setFromCfgObj(btnCfgValue)
        } else if (unifiedKey === 'panelCameraControl'.toLowerCase()) {
            return new ButtonCameraControlCfg().setFromCfgObj(btnCfgValue)
        } else if (unifiedKey === 'panelInfoDock'.toLowerCase()) {
            return new ButtonInfoDockCfg().setFromCfgObj(btnCfgValue)
        } else if (unifiedKey === 'panelEncyclopedia'.toLowerCase()) {
            return null // not used in the game
        } else {
            return btnCfgValue
        }
    }
}
