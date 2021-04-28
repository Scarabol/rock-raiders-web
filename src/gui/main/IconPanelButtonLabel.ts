import { EventKey } from '../../event/EventKeyEnum'
import { RequestedRaidersChanged } from '../../event/WorldEvents'
import { BaseElement } from '../base/BaseElement'

export class IconPanelButtonLabel extends BaseElement {

    numRequestedRaiders: string = ''

    constructor(parent: BaseElement) {
        super(parent)
        this.relX = 4
        this.relY = 11
        this.registerEventListener(EventKey.REQUESTED_RAIDERS_CHANGED, (event: RequestedRaidersChanged) => {
            this.numRequestedRaiders = (event.numRequestedRaiders || '').toString()
            this.notifyRedraw()
        })
    }

    reset() {
        super.reset()
        this.numRequestedRaiders = ''
    }

    onRedraw(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
        if (this.hidden) return
        context.textAlign = 'left'
        context.font = 'bold 10px Arial'
        context.fillStyle = this.disabled || (this.parent && this.parent.disabled) ? '#444' : '#fff'
        context.fillText(this.numRequestedRaiders, this.x, this.y)
        super.onRedraw(context)
    }

}
