import { MenuLabelItemCfg } from '../../cfg/MenuLabelItemCfg'
import { MOUSE_BUTTON } from '../../event/EventTypeEnum'
import { BaseElement } from '../base/BaseElement'
import { MenuLayer } from './MenuLayer'

export class MenuLabelItem extends BaseElement {
    target: string
    loImg: SpriteImage
    hiImg: SpriteImage

    constructor(parent: MenuLayer, itemCfg: MenuLabelItemCfg, autoCenter: boolean) {
        super(parent)
        this.target = itemCfg.target
        this.loImg = parent.loFont.createTextImage(itemCfg.label)
        this.hiImg = parent.hiFont.createTextImage(itemCfg.label)
        this.width = this.loImg.width
        this.height = this.loImg.height
        this.relX = autoCenter ? -parent.relX + (parent.menuImage.width - this.width) / 2 : itemCfg.x
        this.relY = itemCfg.y
    }

    checkHover(cx: number, cy: number): boolean {
        const stateChanged = super.checkHover(cx, cy)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    checkClick(cx: number, cy: number, button: MOUSE_BUTTON): boolean {
        const stateChanged = super.checkClick(cx, cy, button)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    checkRelease(cx: number, cy: number, button: MOUSE_BUTTON): boolean {
        const stateChanged = super.checkRelease(cx, cy, button)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    release(): boolean {
        const stateChanged = super.release()
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
