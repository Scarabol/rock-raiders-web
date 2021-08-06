import { BaseConfig } from './BaseConfig'
import { ButtonCfg } from './ButtonCfg'

export class ButtonCameraControlCfg extends BaseConfig {
    panelButtonCameraControlZoomIn: ButtonCfg = null
    panelButtonCameraControlZoomOut: ButtonCfg = null
    panelButtonCameraControlCycleBuildings: ButtonCfg = null
    panelButtonCameraControlRotate: ButtonCfg = null

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}
