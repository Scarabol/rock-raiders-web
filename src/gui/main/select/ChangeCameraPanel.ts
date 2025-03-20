import { IconSubPanel } from '../IconSubPanel'
import { CameraViewMode, ChangeCameraEvent } from '../../../event/GuiCommand'
import { GameConfig } from '../../../cfg/GameConfig'

export class ChangeCameraPanel extends IconSubPanel {
    cameraViewMode?: CameraViewMode

    constructor() {
        super(3, undefined, false)
        const birdViewItem = this.addMenuItem(GameConfig.instance.interfaceImages.gotoTopView)
        birdViewItem.isDisabled = () => this.cameraViewMode === CameraViewMode.BIRD
        birdViewItem.onClick = () => this.publishEvent(new ChangeCameraEvent(CameraViewMode.BIRD))
        const shoulderViewItem = this.addMenuItem(GameConfig.instance.interfaceImages.gotoSecondPerson)
        shoulderViewItem.isDisabled = () => this.cameraViewMode === CameraViewMode.SHOULDER
        shoulderViewItem.onClick = () => this.publishEvent(new ChangeCameraEvent(CameraViewMode.SHOULDER))
        const fpvViewItem = this.addMenuItem(GameConfig.instance.interfaceImages.gotoFirstPerson)
        fpvViewItem.isDisabled = () => this.cameraViewMode === CameraViewMode.FPV
        fpvViewItem.onClick = () => this.publishEvent(new ChangeCameraEvent(CameraViewMode.FPV))
    }

    reset() {
        super.reset()
        this.cameraViewMode = undefined
    }
}
