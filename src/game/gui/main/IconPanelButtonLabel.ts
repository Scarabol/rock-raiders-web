import { EventBus } from '../../../event/EventBus'
import { EventKey } from '../../../event/EventKeyEnum'
import { GameState } from '../../model/GameState'
import { BaseElement } from '../base/BaseElement'

export class IconPanelButtonLabel extends BaseElement {

    constructor(parent: BaseElement) {
        super(parent)
        this.relX = 4
        this.relY = 11
        EventBus.registerEventListener(EventKey.RAIDER_REQUESTED, () => this.notifyRedraw())
    }

    onRedraw(context: CanvasRenderingContext2D) {
        if (this.hidden) return
        const requestedRaiders = GameState.requestedRaiders
        if (!requestedRaiders) return
        context.textAlign = 'left'
        context.font = 'bold 10px Arial'
        context.fillStyle = this.disabled || (this.parent && this.parent.disabled) ? '#444' : '#fff'
        context.fillText(requestedRaiders.toString(), this.x, this.y)
        super.onRedraw(context)
    }

}
