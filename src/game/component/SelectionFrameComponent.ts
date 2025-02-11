import { AbstractGameComponent } from '../ECS'
import { PickSphereStats } from '../../cfg/GameStatsCfg'
import { Object3D, Vector3 } from 'three'
import { SelectionFrameSprite } from '../../scene/SelectionFrameSprite'

export class SelectionFrameComponent extends AbstractGameComponent {
    readonly selectionFrame: SelectionFrameSprite
    readonly selectionFrameDouble: SelectionFrameSprite
    readonly selectionFrameSecondary: SelectionFrameSprite

    constructor(parentObj: Object3D, stats: PickSphereStats, pickSphereHeightOffset: number = 0) {
        super()
        this.selectionFrame = this.addSelectionFrame(parentObj, stats.PickSphere, parentObj.position, '#0f0')
        this.selectionFrame.position.y = pickSphereHeightOffset
        this.selectionFrameDouble = this.addSelectionFrame(parentObj, stats.PickSphere, parentObj.position, '#f00')
        this.selectionFrameDouble.position.y = pickSphereHeightOffset
        this.selectionFrameSecondary = this.addSelectionFrame(parentObj, stats.PickSphere, parentObj.position, '#ff0')
        this.selectionFrameSecondary.position.y = pickSphereHeightOffset
    }

    private addSelectionFrame(parentObj: Object3D, pickSphereDiameter: number, pickSphereCenter: Vector3, hexColor: string) {
        const selectionFrame = new SelectionFrameSprite(pickSphereDiameter, hexColor)
        selectionFrame.position.copy(pickSphereCenter)
        selectionFrame.scale.setScalar(pickSphereDiameter * 3 / 4)
        selectionFrame.visible = false
        parentObj.add(selectionFrame)
        return selectionFrame
    }

    select() {
        this.selectionFrame.visible = true
        this.selectionFrameDouble.visible = false
        this.selectionFrameSecondary.visible = false
    }

    doubleSelect() {
        this.selectionFrame.visible = false
        this.selectionFrameDouble.visible = true
        this.selectionFrameSecondary.visible = false
    }

    selectSecondary() {
        this.selectionFrame.visible = false
        this.selectionFrameDouble.visible = false
        this.selectionFrameSecondary.visible = true
    }

    deselect() {
        this.selectionFrame.visible = false
        this.selectionFrameDouble.visible = false
        this.selectionFrameSecondary.visible = false
    }

    isSelected(): boolean {
        return this.selectionFrame.visible || this.selectionFrameDouble.visible || this.selectionFrameSecondary.visible
    }
}
