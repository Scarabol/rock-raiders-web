import { BaseConfig } from './BaseConfig'
import { ButtonCfg } from './ButtonCfg'

export class ButtonsCfg extends BaseConfig {
    panelRadar?: ButtonRadarCfg
    panelCrystalSideBar?: ButtonCrystalSideBarCfg
    panelTopPanel?: ButtonTopCfg
    panelInformation?: ButtonInformationCfg
    panelPriorityList?: ButtonPriorityListCfg
    panelCameraControl?: ButtonCameraControlCfg
    panelInfoDock?: ButtonInfoDockCfg
    panelEncyclopedia?: any  // not used in the game

    parseValue(unifiedKey: string, cfgValue: any[]): any {
        const btnCfgValue: any = {}
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
    panelButtonRadarToggle?: ButtonCfg
    panelButtonRadarTaggedObjectView?: ButtonCfg
    panelButtonRadarZoomIn?: ButtonCfg
    panelButtonRadarZoomOut?: ButtonCfg
    panelButtonRadarMapView?: ButtonCfg

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}

export class ButtonCrystalSideBarCfg extends BaseConfig {
    panelButtonCrystalSideBarOre?: ButtonCfg
    panelButtonCrystalSideBarCrystals?: ButtonCfg

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}

export class ButtonTopCfg extends BaseConfig {
    panelButtonTopPanelCallToArms?: ButtonCfg
    panelButtonTopPanelOptions?: ButtonCfg
    panelButtonTopPanelPriorities?: ButtonCfg

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}

export class ButtonInformationCfg extends BaseConfig {
    panelButtonInformationToggle?: ButtonCfg
    panelButtonInformationFunction?: ButtonCfg

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}

export class ButtonPriorityListCfg extends BaseConfig {
    panelButtonPriorityListDisable: ButtonCfg[] = []
    panelButtonPriorityListUpOne: ButtonCfg[] = []
    panelButtonPriorityListClose?: ButtonCfg  // not used in the game
    panelButtonPriorityListReset?: ButtonCfg

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
    panelButtonCameraControlZoomIn?: ButtonCfg
    panelButtonCameraControlZoomOut?: ButtonCfg
    panelButtonCameraControlCycleBuildings?: ButtonCfg
    panelButtonCameraControlRotate?: ButtonCfg

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}

export class ButtonInfoDockCfg extends BaseConfig {
    panelButtonInfoDockGoto?: ButtonCfg
    panelButtonInfoDockClose?: ButtonCfg

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}
