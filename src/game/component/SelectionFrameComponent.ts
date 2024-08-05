import { AbstractGameComponent } from '../ECS'
import { PickSphereStats } from '../../cfg/GameStatsCfg'
import { Object3D, Vector3 } from 'three'
import { SelectionFrameSprite } from '../../scene/SelectionFrameSprite'

export class SelectionFrameComponent extends AbstractGameComponent {
    readonly selectionFrame: SelectionFrameSprite
    readonly selectionFrameDouble: SelectionFrameSprite

    constructor(parentObj: Object3D, stats: PickSphereStats, pickSphereHeightOffset: number = 0) {
        super()
        this.selectionFrame = this.addSelectionFrame(parentObj, stats.PickSphere, parentObj.position, '#0f0')
        this.selectionFrame.position.y = pickSphereHeightOffset
        this.selectionFrameDouble = this.addSelectionFrame(parentObj, stats.PickSphere, parentObj.position, '#f00')
        this.selectionFrameDouble.position.y = pickSphereHeightOffset
    }

    private addSelectionFrame(parentObj: Object3D, pickSphereDiameter: number, pickSphereCenter: Vector3, hexColor: string) {
        const selectionFrame = new SelectionFrameSprite(pickSphereDiameter, hexColor)
        selectionFrame.position.copy(pickSphereCenter)
        const selectionFrameSize = pickSphereDiameter * 3 / 4
        selectionFrame.scale.set(selectionFrameSize, selectionFrameSize, selectionFrameSize)
        selectionFrame.visible = false
        parentObj.add(selectionFrame)
        return selectionFrame
    }

    select() {
        this.selectionFrame.visible = true
        this.selectionFrameDouble.visible = false
    }

    doubleSelect() {
        this.selectionFrame.visible = false
        this.selectionFrameDouble.visible = true
    }

    deselect() {
        this.selectionFrame.visible = false
        this.selectionFrameDouble.visible = false
    }

    isSelected(): boolean {
        return this.selectionFrame.visible || this.selectionFrameDouble.visible
    }
}
