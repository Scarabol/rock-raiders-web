import { ButtonCameraControlCfg } from '../../cfg/ButtonCameraControlCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { CameraControl } from '../../event/GuiCommand'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'

export class CameraControlPanel extends Panel {

    constructor(parent: BaseElement, panelCfg: PanelCfg, buttonsCfg: ButtonCameraControlCfg) {
        super(parent, panelCfg)
        this.addChild(new Button(this, buttonsCfg.panelButtonCameraControlZoomIn)).onClick = () => {
            this.publishEvent(new CameraControl(true, false, false))
        }
        this.addChild(new Button(this, buttonsCfg.panelButtonCameraControlZoomOut)).onClick = () => {
            this.publishEvent(new CameraControl(false, true, false))
        }
        this.addChild(new Button(this, buttonsCfg.panelButtonCameraControlCycleBuildings)).onClick = () => {
            this.publishEvent(new CameraControl(false, false, true))
        }
    }

}
