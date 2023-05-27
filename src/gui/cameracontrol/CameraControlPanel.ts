import { ButtonCameraControlCfg } from '../../cfg/ButtonsCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { PanelRotationControlCfg, PanelRotationControlImageCfg } from '../../cfg/PanelRotationControlCfg'
import { CameraControl } from '../../event/GuiCommand'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'

export class CameraControlPanel extends Panel {
    constructor(parent: BaseElement, panelCfg: PanelCfg, buttonsCfg: ButtonCameraControlCfg, panelRotationControlCfg: PanelRotationControlCfg) {
        super(parent, panelCfg)
        this.addChild(new Button(this, buttonsCfg.panelButtonCameraControlZoomIn)).onClick = () => {
            this.publishEvent(new CameraControl(-1, false, -1, null))
        }
        this.addChild(new Button(this, buttonsCfg.panelButtonCameraControlZoomOut)).onClick = () => {
            this.publishEvent(new CameraControl(1, false, -1, null))
        }
        this.addChild(new Button(this, buttonsCfg.panelButtonCameraControlCycleBuildings)).onClick = () => {
            this.publishEvent(new CameraControl(0, true, -1, null))
        }
        this.addControlImage(panelRotationControlCfg.leftImage, 0)
        this.addControlImage(panelRotationControlCfg.upImage, 1)
        this.addControlImage(panelRotationControlCfg.rightImage, 2)
        this.addControlImage(panelRotationControlCfg.downImage, 3)
    }

    private addControlImage(cfg: PanelRotationControlImageCfg, index: number) { // TODO replace index with enum
        this.addChild(new Button(this, {
            highlightFile: cfg.imgHighlight,
            relX: cfg.x - this.relX,
            relY: cfg.y - this.relY,
        })).onClick = () => {
            this.publishEvent(new CameraControl(0, false, index, null))
        }
    }
}
