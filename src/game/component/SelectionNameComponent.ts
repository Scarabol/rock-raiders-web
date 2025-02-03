import { AbstractGameComponent } from '../ECS'
import { SelectionNameSprite } from '../../scene/SelectionNameSprite'
import { Object3D } from 'three'

export class SelectionNameComponent extends AbstractGameComponent {
    readonly nameSprite: SelectionNameSprite

    constructor(parentObj: Object3D) {
        super()
        this.nameSprite = new SelectionNameSprite()
        this.nameSprite.position.y += 15
        this.nameSprite.scale.setScalar(30)
        this.nameSprite.visible = false
        parentObj.add(this.nameSprite)
    }

    setName(name: string) {
        this.nameSprite.setName(name)
    }

    setVisible(state: boolean): void {
        this.nameSprite.visible = state
    }
}
