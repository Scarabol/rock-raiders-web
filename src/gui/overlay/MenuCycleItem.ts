import { MenuCycleItemCfg } from '../../cfg/MenuCycleItemCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { BaseElement } from '../base/BaseElement'
import { GuiHoverEvent, GuiPointerDownEvent, GuiPointerUpEvent } from '../event/GuiEvent'
import { MenuEntryCfg } from '../../cfg/MenuEntryCfg'
import { BitmapFontWorkerPool } from '../../worker/BitmapFontWorkerPool'

export class MenuCycleItem extends BaseElement {
    imgTextNormal?: SpriteImage
    imgTextHover?: SpriteImage
    imgLabelOnNormal?: SpriteImage // TODO only toggle state with clicks on label
    imgLabelOffNormal?: SpriteImage // TODO use button?
    imgLabelOnHover?: SpriteImage
    imgLabelOffHover?: SpriteImage

    labelX: number = 0
    state: boolean = false
    onStateChanged: (state: boolean) => void = (state) => console.log(`TODO: cycle item clicked; state: ${state}`)

    constructor(menuCfg: MenuEntryCfg, itemCfg: MenuCycleItemCfg) {
        super()
        this.relX = itemCfg.x
        this.relY = itemCfg.y
        this.labelX = itemCfg.width
        Promise.all([
            BitmapFontWorkerPool.instance.createTextImage(menuCfg.loFont, itemCfg.description),
            BitmapFontWorkerPool.instance.createTextImage(menuCfg.hiFont, itemCfg.description),
            BitmapFontWorkerPool.instance.createTextImage(menuCfg.loFont, itemCfg.labelOff),
            BitmapFontWorkerPool.instance.createTextImage(menuCfg.hiFont, itemCfg.labelOff),
            BitmapFontWorkerPool.instance.createTextImage(menuCfg.loFont, itemCfg.labelOn),
            BitmapFontWorkerPool.instance.createTextImage(menuCfg.hiFont, itemCfg.labelOn),
        ]).then((textImages) => {
            [this.imgTextNormal, this.imgTextHover, this.imgLabelOffNormal, this.imgLabelOffHover, this.imgLabelOnNormal, this.imgLabelOnHover] = textImages
            this.width = itemCfg.width + Math.max(this.imgLabelOnHover?.width || 0, this.imgLabelOffHover?.width || 0)
            this.height = this.imgTextNormal?.height || 0
        })
        this.onClick = () => {
            this.state = !this.state
            this.onStateChanged(this.state)
        }
    }

    setState(state: boolean) {
        this.state = state
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
        let img = this.imgTextNormal
        let imgLabel = this.state ? this.imgLabelOnNormal : this.imgLabelOffNormal
        if (this.hover) {
            img = this.imgTextHover
            imgLabel = this.state ? this.imgLabelOnHover : this.imgLabelOffHover
        }
        if (img) context.drawImage(img, this.x, this.y)
        if (imgLabel) context.drawImage(imgLabel, this.x + this.labelX, this.y)
        super.onRedraw(context)
    }
}
