import { MenuCycleItemCfg } from '../../cfg/MenuCycleItemCfg'
import { BaseElement } from '../base/BaseElement'
import { MenuLayer } from './MenuLayer'

export class MenuCycleItem extends BaseElement {

    imgTextNormal: SpriteImage
    imgTextHover: SpriteImage
    imgLabelOnNormal: SpriteImage // TODO only toggle state with clicks on label
    imgLabelOffNormal: SpriteImage // TODO use button?
    imgLabelOnHover: SpriteImage
    imgLabelOffHover: SpriteImage

    labelX: number = 0
    state: boolean = false

    constructor(parent: MenuLayer, itemCfg: MenuCycleItemCfg) {
        super(parent)
        this.relX = itemCfg.x
        this.relY = itemCfg.y
        this.labelX = itemCfg.width
        this.imgTextNormal = parent.loFont.createTextImage(itemCfg.description)
        this.imgTextHover = parent.hiFont.createTextImage(itemCfg.description)
        this.imgLabelOffNormal = parent.loFont.createTextImage(itemCfg.labelOff)
        this.imgLabelOffHover = parent.hiFont.createTextImage(itemCfg.labelOff)
        this.imgLabelOnNormal = parent.loFont.createTextImage(itemCfg.labelOn)
        this.imgLabelOnHover = parent.hiFont.createTextImage(itemCfg.labelOn)
        this.width = itemCfg.width + Math.max(this.imgLabelOnHover.width, this.imgLabelOffHover.width)
        this.height = this.imgTextNormal.height
        this.onClick = () => {
            this.state = !this.state
            console.log('TODO: cycle item clicked; state: ' + this.state)
        }
    }

    checkHover(cx, cy): boolean {
        const stateChanged = super.checkHover(cx, cy)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    checkClick(cx, cy): boolean {
        const stateChanged = super.checkClick(cx, cy)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    checkRelease(cx, cy): boolean {
        const stateChanged = super.checkRelease(cx, cy)
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
