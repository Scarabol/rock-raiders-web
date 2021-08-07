import { BaseConfig } from './BaseConfig'
import { ButtonCfg } from './ButtonCfg'

export class ButtonsCfg extends BaseConfig {
    panelRadar: ButtonRadarCfg = null
    panelCrystalSideBar: ButtonCrystalSideBarCfg = null
    panelTopPanel: ButtonTopCfg = null
    panelInformation: ButtonInformationCfg = null
    panelPriorityList: ButtonPriorityListCfg = null
    panelCameraControl: ButtonCameraControlCfg = null
    panelInfoDock: ButtonInfoDockCfg = null
    panelEncyclopedia: any = null // not used in the game

    parseValue(unifiedKey: string, cfgValue: any[]): any {
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

export class ButtonRadarCfg extends BaseConfig {
    panelButtonRadarToggle: ButtonCfg = null
    panelButtonRadarTaggedObjectView: ButtonCfg = null
    panelButtonRadarZoomIn: ButtonCfg = null
    panelButtonRadarZoomOut: ButtonCfg = null
    panelButtonRadarMapView: ButtonCfg = null

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}

export class ButtonCrystalSideBarCfg extends BaseConfig {
    panelButtonCrystalSideBarOre: ButtonCfg = null
    panelButtonCrystalSideBarCrystals: ButtonCfg = null

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}

export class ButtonTopCfg extends BaseConfig {
    panelButtonTopPanelCallToArms: ButtonCfg = null
    panelButtonTopPanelOptions: ButtonCfg = null
    panelButtonTopPanelPriorities: ButtonCfg = null

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}

export class ButtonInformationCfg extends BaseConfig {
    panelButtonInformationToggle: ButtonCfg = null
    panelButtonInformationFunction: ButtonCfg = null

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}

export class ButtonPriorityListCfg extends BaseConfig {
    panelButtonPriorityListDisable: ButtonCfg[] = []
    panelButtonPriorityListUpOne: ButtonCfg[] = []
    panelButtonPriorityListClose: ButtonCfg = null // not used in the game
    panelButtonPriorityListReset: ButtonCfg = null

    assignValue(objKey: string, unifiedKey: string, cfgValue: any): boolean {
        if (unifiedKey.match(/panelButtonPriorityListDisable\d+/i)) {
            this.panelButtonPriorityListDisable.push(this.parseValue(unifiedKey, cfgValue))
            return true
        } else if (unifiedKey.match(/panelButtonPriorityListUpOne\d+/i)) {
            this.panelButtonPriorityListUpOne.push(this.parseValue(unifiedKey, cfgValue))
            return true
        } else {
            return super.assignValue(objKey, unifiedKey, cfgValue)
        }
    }

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}

export class ButtonCameraControlCfg extends BaseConfig {
    panelButtonCameraControlZoomIn: ButtonCfg = null
    panelButtonCameraControlZoomOut: ButtonCfg = null
    panelButtonCameraControlCycleBuildings: ButtonCfg = null
    panelButtonCameraControlRotate: ButtonCfg = null

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}

export class ButtonInfoDockCfg extends BaseConfig {
    panelButtonInfoDockGoto: ButtonCfg = null
    panelButtonInfoDockClose: ButtonCfg = null

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}
