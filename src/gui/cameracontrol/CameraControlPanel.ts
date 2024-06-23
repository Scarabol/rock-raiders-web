import { ButtonCameraControlCfg } from '../../cfg/ButtonsCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { PanelRotationControlCfg, PanelRotationControlImageCfg } from '../../cfg/PanelRotationControlCfg'
import { CameraControl } from '../../event/GuiCommand'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { CameraRotation } from '../../scene/BirdViewControls'

export class CameraControlPanel extends Panel {
    constructor(panelCfg: PanelCfg, buttonsCfg: ButtonCameraControlCfg, panelRotationControlCfg: PanelRotationControlCfg) {
        super(panelCfg)
        this.addChild(new Button(buttonsCfg.panelButtonCameraControlZoomIn)).onClick = () => {
            this.publishEvent(new CameraControl({zoom: -1}))
        }
        this.addChild(new Button(buttonsCfg.panelButtonCameraControlZoomOut)).onClick = () => {
            this.publishEvent(new CameraControl({zoom: 1}))
        }
        this.addChild(new Button(buttonsCfg.panelButtonCameraControlCycleBuildings)).onClick = () => {
            this.publishEvent(new CameraControl({cycleBuilding: true}))
        }
        this.addControlImage(panelRotationControlCfg.leftImage, CameraRotation.LEFT)
        this.addControlImage(panelRotationControlCfg.upImage, CameraRotation.UP)
        this.addControlImage(panelRotationControlCfg.rightImage, CameraRotation.RIGHT)
        this.addControlImage(panelRotationControlCfg.downImage, CameraRotation.DOWN)
    }

    private addControlImage(cfg: PanelRotationControlImageCfg, rotationIndex: CameraRotation) {
        this.addChild(new Button({
            highlightFile: cfg.imgHighlight,
            relX: cfg.x - this.relX,
            relY: cfg.y - this.relY,
        })).onClick = () => {
            this.publishEvent(new CameraControl({rotationIndex}))
        }
    }
}
