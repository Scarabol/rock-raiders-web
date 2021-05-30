import { BaseElement } from '../base/BaseElement'

export class IconPanelButtonLabel extends BaseElement {

    label: string = ''

    constructor(parent: BaseElement) {
        super(parent)
        this.relX = 4
        this.relY = 11
    }

    setLabel(label: number) {
        this.label = (label || '').toString()
    }

    reset() {
        super.reset()
        this.label = ''
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        context.textAlign = 'left'
        context.font = 'bold 10px Arial'
        context.fillStyle = this.disabled || (this.parent && this.parent.disabled) ? '#444' : '#fff'
        context.fillText(this.label, this.x, this.y)
        super.onRedraw(context)
    }

}
