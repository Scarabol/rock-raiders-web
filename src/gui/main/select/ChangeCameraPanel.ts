import { IconSubPanel } from '../IconSubPanel'
import { BaseElement } from '../../base/BaseElement'
import { CameraViewMode, ChangeCameraEvent } from '../../../event/LocalEvents'
import { ResourceManager } from '../../../resource/ResourceManager'

export class ChangeCameraPanel extends IconSubPanel {
    cameraViewMode: CameraViewMode = null

    constructor(parent: BaseElement) {
        super(parent, 3)
        const birdViewItem = this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_GotoTopView')
        birdViewItem.isDisabled = () => this.cameraViewMode === CameraViewMode.BIRD
        birdViewItem.onClick = () => this.publishEvent(new ChangeCameraEvent(CameraViewMode.BIRD))
        const shoulderViewItem = this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_GotoSecondPerson')
        shoulderViewItem.isDisabled = () => this.cameraViewMode === CameraViewMode.SHOULDER
        shoulderViewItem.onClick = () => this.publishEvent(new ChangeCameraEvent(CameraViewMode.SHOULDER))
        const fpvViewItem = this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_GotoFirstPerson')
        fpvViewItem.isDisabled = () => this.cameraViewMode === CameraViewMode.FPV
        fpvViewItem.onClick = () => this.publishEvent(new ChangeCameraEvent(CameraViewMode.FPV))
    }

    reset() {
        super.reset()
        this.cameraViewMode = null
    }
}
