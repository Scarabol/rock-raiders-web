import { AbstractGameComponent } from '../ECS'
import { HealthBarSprite } from '../../scene/HealthBarSprite'
import { Object3D } from 'three'
import { GameState } from '../model/GameState'

export class HealthBarComponent extends AbstractGameComponent {
    sprite: HealthBarSprite = null
    actualStatus: number = 1
    targetStatus: number = 1

    constructor(yOffset: number, scale: number, readonly parent: Object3D, readonly canBeShownPermanently: boolean) {
        super()
        this.sprite = new HealthBarSprite(yOffset, scale)
        this.setVisible(GameState.showObjInfo)
        this.parent.add(this.sprite)
    }

    setVisible(visible: boolean) {
        this.sprite.visible = visible && this.canBeShownPermanently
    }

    setStatus(status: number) {
        this.targetStatus = Math.max(0, Math.min(1, status))
        if (this.targetStatus !== this.actualStatus) {
            this.sprite.visible = true
            this.updateStatus()
        }
    }

    private updateStatus() {
        if (this.targetStatus === this.actualStatus) {
            if (!(GameState.showObjInfo && this.canBeShownPermanently)) {
                setTimeout(() => { // TODO replace with synchronized update from main loop
                    this.sprite.visible = false
                }, 3000)
            }
            return
        }
        setTimeout(() => { // TODO replace with synchronized update from main loop
            const delta = this.targetStatus - this.actualStatus
            this.actualStatus += Math.sign(delta) * Math.min(Math.abs(delta), 0.03)
            this.sprite.setStatus(this.actualStatus)
            this.updateStatus()
        }, 30)
    }
}
