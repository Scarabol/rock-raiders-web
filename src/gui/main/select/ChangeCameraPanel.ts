import { IconSubPanel } from '../IconSubPanel'
import { CameraViewMode, ChangeCameraEvent } from '../../../event/GuiCommand'
import { GameConfig } from '../../../cfg/GameConfig'

export class ChangeCameraPanel extends IconSubPanel {
    cameraViewMode: CameraViewMode = null

    constructor() {
        super(3)
        const birdViewItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_GotoTopView')
        birdViewItem.isDisabled = () => this.cameraViewMode === CameraViewMode.BIRD
        birdViewItem.onClick = () => this.publishEvent(new ChangeCameraEvent(CameraViewMode.BIRD))
        const shoulderViewItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_GotoSecondPerson')
        shoulderViewItem.isDisabled = () => this.cameraViewMode === CameraViewMode.SHOULDER
        shoulderViewItem.onClick = () => this.publishEvent(new ChangeCameraEvent(CameraViewMode.SHOULDER))
        const fpvViewItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_GotoFirstPerson')
        fpvViewItem.isDisabled = () => this.cameraViewMode === CameraViewMode.FPV
        fpvViewItem.onClick = () => this.publishEvent(new ChangeCameraEvent(CameraViewMode.FPV))
    }

    reset() {
        super.reset()
        this.cameraViewMode = null
    }
}
