import { ButtonCameraControlCfg } from '../../cfg/ButtonCameraControlCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { CameraControl } from '../../event/GuiCommand'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'

export class CameraControlPanel extends Panel {

    constructor(parent: BaseElement, panelCfg: PanelCfg, buttonsCfg: ButtonCameraControlCfg, panelRotationControlCfg: any) {
        super(parent, panelCfg)
        this.addChild(new Button(this, buttonsCfg.panelButtonCameraControlZoomIn)).onClick = () => {
            this.publishEvent(new CameraControl(-1, false, -1))
        }
        this.addChild(new Button(this, buttonsCfg.panelButtonCameraControlZoomOut)).onClick = () => {
            this.publishEvent(new CameraControl(1, false, -1))
        }
        this.addChild(new Button(this, buttonsCfg.panelButtonCameraControlCycleBuildings)).onClick = () => {
            this.publishEvent(new CameraControl(0, true, -1))
        }
        ['LeftImage', 'UpImage', 'RightImage', 'DownImage'].forEach((name, index) => {
            const cfg = panelRotationControlCfg[name]
            this.addChild(new Button(this, {
                highlightFile: cfg[0],
                relX: cfg[1] - this.relX,
                relY: cfg[2] - this.relY,
            })).onClick = () => {
                this.publishEvent(new CameraControl(0, false, index))
            }
        })
    }

}
