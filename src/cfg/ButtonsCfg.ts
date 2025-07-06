import { ButtonCfg } from './ButtonCfg'
import { ConfigSetFromRecord } from './Configurable'
import { CfgEntry } from './CfgEntry'

export class ButtonsCfg implements ConfigSetFromRecord {
    panelRadar: ButtonRadarCfg = new ButtonRadarCfg()
    panelCrystalSideBar: ButtonCrystalSideBarCfg = new ButtonCrystalSideBarCfg()
    panelTopPanel: ButtonTopCfg = new ButtonTopCfg()
    panelInformation: ButtonInformationCfg = new ButtonInformationCfg()
    panelPriorityList: ButtonPriorityListCfg = new ButtonPriorityListCfg()
    panelCameraControl: ButtonCameraControlCfg = new ButtonCameraControlCfg()
    panelInfoDock: ButtonInfoDockCfg = new ButtonInfoDockCfg()

    setFromRecord(cfgValue: CfgEntry): this {
        this.panelRadar.setFromRecord(cfgValue)
        this.panelCrystalSideBar.setFromRecord(cfgValue)
        this.panelTopPanel.setFromRecord(cfgValue)
        this.panelInformation.setFromRecord(cfgValue)
        this.panelPriorityList.setFromRecord(cfgValue)
        this.panelCameraControl.setFromRecord(cfgValue)
        this.panelInfoDock.setFromRecord(cfgValue)
        return this
    }
}

export class ButtonRadarCfg implements ConfigSetFromRecord {
    panelButtonRadarToggle: ButtonCfg = new ButtonCfg()
    panelButtonRadarTaggedObjectView: ButtonCfg = new ButtonCfg()
    panelButtonRadarZoomIn: ButtonCfg = new ButtonCfg()
    panelButtonRadarZoomOut: ButtonCfg = new ButtonCfg()
    panelButtonRadarMapView: ButtonCfg = new ButtonCfg()

    setFromRecord(cfgValue: CfgEntry): this {
        this.panelButtonRadarToggle.setFromValue(cfgValue.findValueByPrefix('PanelButton_Radar_Toggle'))
        this.panelButtonRadarTaggedObjectView.setFromValue(cfgValue.findValueByPrefix('PanelButton_Radar_TaggedObjectView'))
        this.panelButtonRadarZoomIn.setFromValue(cfgValue.findValueByPrefix('PanelButton_Radar_ZoomIn'))
        this.panelButtonRadarZoomOut.setFromValue(cfgValue.findValueByPrefix('PanelButton_Radar_ZoomOut'))
        this.panelButtonRadarMapView.setFromValue(cfgValue.findValueByPrefix('PanelButton_Radar_MapView'))
        return this
    }
}

export class ButtonCrystalSideBarCfg implements ConfigSetFromRecord {
    panelButtonCrystalSideBarOre: ButtonCfg = new ButtonCfg()
    panelButtonCrystalSideBarCrystals: ButtonCfg = new ButtonCfg()

    setFromRecord(cfgValue: CfgEntry): this {
        this.panelButtonCrystalSideBarOre.setFromValue(cfgValue.findValueByPrefix('PanelButton_CrystalSideBar_Ore'))
        this.panelButtonCrystalSideBarCrystals.setFromValue(cfgValue.findValueByPrefix('PanelButton_CrystalSideBar_Crystals'))
        return this
    }
}

export class ButtonTopCfg implements ConfigSetFromRecord {
    panelButtonTopPanelCallToArms: ButtonCfg = new ButtonCfg()
    panelButtonTopPanelOptions: ButtonCfg = new ButtonCfg()
    panelButtonTopPanelPriorities: ButtonCfg = new ButtonCfg()

    setFromRecord(cfgValue: CfgEntry): this {
        this.panelButtonTopPanelCallToArms.setFromValue(cfgValue.findValueByPrefix('PanelButton_TopPanel_CallToArms'))
        this.panelButtonTopPanelOptions.setFromValue(cfgValue.findValueByPrefix('PanelButton_TopPanel_Options'))
        this.panelButtonTopPanelPriorities.setFromValue(cfgValue.findValueByPrefix('PanelButton_TopPanel_Priorities'))
        return this
    }
}

export class ButtonInformationCfg implements ConfigSetFromRecord {
    panelButtonInformationToggle: ButtonCfg = new ButtonCfg()
    panelButtonInformationFunction: ButtonCfg = new ButtonCfg()

    setFromRecord(cfgValue: CfgEntry): this {
        this.panelButtonInformationToggle.setFromValue(cfgValue.findValueByPrefix('PanelButton_Information_Toggle'))
        this.panelButtonInformationFunction.setFromValue(cfgValue.findValueByPrefix('PanelButton_Information_Function'))
        return this
    }
}

export class ButtonPriorityListCfg implements ConfigSetFromRecord {
    panelButtonPriorityListDisable: ButtonCfg[] = []
    panelButtonPriorityListUpOne: ButtonCfg[] = []
    panelButtonPriorityListClose: ButtonCfg = new ButtonCfg() // not used in the game
    panelButtonPriorityListReset: ButtonCfg = new ButtonCfg()

    setFromRecord(cfgValue: CfgEntry): this {
        cfgValue.forEachCfgEntryValue((value) => {
            if (value.toArray(',', undefined)[0].toString().match(/PanelButton_PriorityList_Disable\d+/i)) {
                this.panelButtonPriorityListDisable.push(new ButtonCfg().setFromValue(value))
            }
        })
        cfgValue.forEachCfgEntryValue((value) => {
            if (value.toArray(',', undefined)[0].toString().match(/PanelButton_PriorityList_UpOne\d+/i)) {
                this.panelButtonPriorityListUpOne.push(new ButtonCfg().setFromValue(value))
            }
        })
        this.panelButtonPriorityListClose.setFromValue(cfgValue.findValueByPrefix('PanelButton_PriorityList_Close'))
        this.panelButtonPriorityListReset.setFromValue(cfgValue.findValueByPrefix('PanelButton_PriorityList_Reset'))
        return this
    }
}

export class ButtonCameraControlCfg implements ConfigSetFromRecord {
    panelButtonCameraControlZoomIn: ButtonCfg = new ButtonCfg()
    panelButtonCameraControlZoomOut: ButtonCfg = new ButtonCfg()
    panelButtonCameraControlCycleBuildings: ButtonCfg = new ButtonCfg()
    panelButtonCameraControlRotate: ButtonCfg = new ButtonCfg()

    setFromRecord(cfgValue: CfgEntry): this {
        this.panelButtonCameraControlZoomIn.setFromValue(cfgValue.findValueByPrefix('PanelButton_CameraControl_ZoomIn'))
        this.panelButtonCameraControlZoomOut.setFromValue(cfgValue.findValueByPrefix('PanelButton_CameraControl_ZoomOut'))
        this.panelButtonCameraControlCycleBuildings.setFromValue(cfgValue.findValueByPrefix('PanelButton_CameraControl_CycleBuildings'))
        this.panelButtonCameraControlRotate.setFromValue(cfgValue.findValueByPrefix('PanelButton_CameraControl_Rotate'))
        return this
    }
}

export class ButtonInfoDockCfg implements ConfigSetFromRecord {
    panelButtonInfoDockGoto: ButtonCfg = new ButtonCfg()
    panelButtonInfoDockClose: ButtonCfg = new ButtonCfg()

    setFromRecord(cfgValue: CfgEntry): this {
        this.panelButtonInfoDockGoto.setFromValue(cfgValue.findValueByPrefix('PanelButton_InfoDock_Goto'))
        this.panelButtonInfoDockClose.setFromValue(cfgValue.findValueByPrefix('PanelButton_InfoDock_Close'))
        return this
    }
}
