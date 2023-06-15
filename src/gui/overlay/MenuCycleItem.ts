import { MenuCycleItemCfg } from '../../cfg/MenuCycleItemCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { BaseElement } from '../base/BaseElement'
import { GuiClickEvent, GuiHoverEvent, GuiReleaseEvent } from '../event/GuiEvent'
import { MenuLayer } from './MenuLayer'
import { ResourceManager } from '../../resource/ResourceManager'

export class MenuCycleItem extends BaseElement {
    imgTextNormal: SpriteImage
    imgTextHover: SpriteImage
    imgLabelOnNormal: SpriteImage // TODO only toggle state with clicks on label
    imgLabelOffNormal: SpriteImage // TODO use button?
    imgLabelOnHover: SpriteImage
    imgLabelOffHover: SpriteImage

    labelX: number = 0
    state: boolean = false
    onStateChanged: (state: boolean) => any = (state) => console.log(`TODO: cycle item clicked; state: ${state}`)

    constructor(parent: MenuLayer, itemCfg: MenuCycleItemCfg) {
        super(parent)
        this.relX = itemCfg.x
        this.relY = itemCfg.y
        this.labelX = itemCfg.width
        Promise.all([
            ResourceManager.bitmapFontWorkerPool.createTextImage(parent.menuCfg.loFont, itemCfg.description),
            ResourceManager.bitmapFontWorkerPool.createTextImage(parent.menuCfg.hiFont, itemCfg.description),
            ResourceManager.bitmapFontWorkerPool.createTextImage(parent.menuCfg.loFont, itemCfg.labelOff),
            ResourceManager.bitmapFontWorkerPool.createTextImage(parent.menuCfg.hiFont, itemCfg.labelOff),
            ResourceManager.bitmapFontWorkerPool.createTextImage(parent.menuCfg.loFont, itemCfg.labelOn),
            ResourceManager.bitmapFontWorkerPool.createTextImage(parent.menuCfg.hiFont, itemCfg.labelOn),
        ]).then((textImages) => {
            [this.imgTextNormal, this.imgTextHover, this.imgLabelOffNormal, this.imgLabelOffHover, this.imgLabelOnNormal, this.imgLabelOnHover] = textImages
            this.width = itemCfg.width + Math.max(this.imgLabelOnHover.width, this.imgLabelOffHover.width)
            this.height = this.imgTextNormal.height
        })
        this.onClick = () => {
            this.state = !this.state
            this.onStateChanged(this.state)
        }
    }

    setState(state: boolean) {
        this.state = state
    }

    checkHover(event: GuiHoverEvent): void {
        super.checkHover(event)
        if (event.hoverStateChanged) this.notifyRedraw()
    }

    checkClick(event: GuiClickEvent): boolean {
        const stateChanged = super.checkClick(event)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    checkRelease(event: GuiReleaseEvent): boolean {
        const stateChanged = super.checkRelease(event)
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
        let img = this.imgTextNormal
        let imgLabel = this.state ? this.imgLabelOnNormal : this.imgLabelOffNormal
        if (this.hover) {
            img = this.imgTextHover
            imgLabel = this.state ? this.imgLabelOnHover : this.imgLabelOffHover
        }
        context.drawImage(img, this.x, this.y)
        context.drawImage(imgLabel, this.x + this.labelX, this.y)
        super.onRedraw(context)
    }
}
