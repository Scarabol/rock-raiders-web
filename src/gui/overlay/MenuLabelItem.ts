import { MenuLabelItemCfg } from '../../cfg/MenuLabelItemCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { BaseElement } from '../base/BaseElement'
import { GuiHoverEvent, GuiPointerDownEvent, GuiPointerUpEvent } from '../event/GuiEvent'
import { MenuLayer } from './MenuLayer'
import { BitmapFontWorkerPool } from '../../worker/BitmapFontWorkerPool'

export class MenuLabelItem extends BaseElement {
    target: string
    loImg: SpriteImage
    hiImg: SpriteImage

    constructor(parent: MenuLayer, itemCfg: MenuLabelItemCfg, autoCenter: boolean) {
        super(parent)
        this.target = itemCfg.target
        Promise.all([
            BitmapFontWorkerPool.instance.createTextImage(parent.menuCfg.loFont, itemCfg.label),
            BitmapFontWorkerPool.instance.createTextImage(parent.menuCfg.hiFont, itemCfg.label),
        ]).then((textImages) => {
            [this.loImg, this.hiImg] = textImages
            this.width = this.loImg.width
            this.height = this.loImg.height
            this.relX = autoCenter ? -parent.relX + (parent.menuImage.width - this.width) / 2 : itemCfg.x
            this.updatePosition()
        })
        this.relY = itemCfg.y
    }

    onPointerMove(event: GuiHoverEvent): void {
        super.onPointerMove(event)
        if (event.hoverStateChanged) this.notifyRedraw()
    }

    onPointerDown(event: GuiPointerDownEvent): boolean {
        const stateChanged = super.onPointerDown(event)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    onPointerUp(event: GuiPointerUpEvent): boolean {
        const stateChanged = super.onPointerUp(event)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    onPointerLeave(): boolean {
        const stateChanged = super.onPointerLeave()
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        if (this.hover) {
            context.drawImage(this.hiImg, this.x, this.y)
        } else {
            context.drawImage(this.loImg, this.x, this.y)
        }
        super.onRedraw(context)
    }
}
