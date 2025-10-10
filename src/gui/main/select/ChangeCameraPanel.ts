import { IconSubPanel } from '../IconSubPanel'
import { CAMERA_VIEW_MODE, CameraViewMode, ChangeCameraEvent } from '../../../event/GuiCommand'
import { GameConfig } from '../../../cfg/GameConfig'

export class ChangeCameraPanel extends IconSubPanel {
    cameraViewMode?: CameraViewMode

    constructor() {
        super(3, undefined, false)
        const birdViewItem = this.addMenuItem(GameConfig.instance.interfaceImages.gotoTopView)
        birdViewItem.isDisabled = () => this.cameraViewMode === CAMERA_VIEW_MODE.bird
        birdViewItem.onClick = () => this.publishEvent(new ChangeCameraEvent(CAMERA_VIEW_MODE.bird))
        const shoulderViewItem = this.addMenuItem(GameConfig.instance.interfaceImages.gotoSecondPerson)
        shoulderViewItem.isDisabled = () => this.cameraViewMode === CAMERA_VIEW_MODE.shoulder
        shoulderViewItem.onClick = () => this.publishEvent(new ChangeCameraEvent(CAMERA_VIEW_MODE.shoulder))
        const fpvViewItem = this.addMenuItem(GameConfig.instance.interfaceImages.gotoFirstPerson)
        fpvViewItem.isDisabled = () => this.cameraViewMode === CAMERA_VIEW_MODE.fpv
        fpvViewItem.onClick = () => this.publishEvent(new ChangeCameraEvent(CAMERA_VIEW_MODE.fpv))
    }

    reset() {
        super.reset()
        this.cameraViewMode = undefined
    }
}
