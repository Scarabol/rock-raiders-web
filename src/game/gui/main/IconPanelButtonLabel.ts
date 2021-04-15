import { BaseElement } from '../base/BaseElement'
import { GameState } from '../../model/GameState'
import { EventBus } from '../../../event/EventBus'
import { RaiderRequested } from '../../../event/WorldEvents'

export class IconPanelButtonLabel extends BaseElement {

    constructor(parent: BaseElement) {
        super(parent)
        this.relX = 4
        this.relY = 11
        EventBus.registerEventListener(RaiderRequested.eventKey, () => this.notifyRedraw())
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
