import { BaseButtonCfg } from '../../cfg/ButtonCfg'
import { MenuSliderItemCfg } from '../../cfg/MenuSliderItemCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { GuiHoverEvent } from '../event/GuiEvent'
import { MenuEntryCfg } from '../../cfg/MenuEntryCfg'
import { ResourceManager } from '../../resource/ResourceManager'
import { BitmapFontWorkerPool } from '../../worker/BitmapFontWorkerPool'

export class MenuSliderItem extends BaseElement {
    imgTextNormal: SpriteImage | undefined
    imgTextHover: SpriteImage | undefined
    imgLeft: SpriteImage
    imgNormal: SpriteImage
    imgHover: SpriteImage
    imgRight: SpriteImage
    sliderX: number = 0
    min: number = 0
    max: number = 1
    value: number = 0
    onValueChanged: (value: number) => void = (value) => console.log(`TODO: Slider value changed; value: ${value}`)

    constructor(menuCfg: MenuEntryCfg, itemCfg: MenuSliderItemCfg) {
        super()
        this.relX = itemCfg.x
        this.relY = itemCfg.y
        this.sliderX = itemCfg.width
        this.imgLeft = ResourceManager.getImage(itemCfg.imgLeft)
        this.imgNormal = ResourceManager.getImage(itemCfg.imgOff)
        this.imgHover = ResourceManager.getImage(itemCfg.imgOn)
        this.imgRight = ResourceManager.getImage(itemCfg.imgRight)
        const leftBtn = this.addChild(new Button(new BaseButtonCfg()))
        leftBtn.imgNormal = ResourceManager.getImage(itemCfg.btnLeftNormal)
        leftBtn.imgHover = ResourceManager.getImage(itemCfg.btnLeftHover)
        leftBtn.relX = this.sliderX - this.imgLeft.width - leftBtn.imgHover.width
        leftBtn.width = leftBtn.imgHover.width
        leftBtn.height = leftBtn.imgHover.height
        leftBtn.updatePosition()
        leftBtn.onClick = () => {
            if (this.value > this.min) {
                this.value = Math.max(this.value - 1, this.min)
                this.onValueChanged(this.value / this.max)
            }
        }
        const rightBtn = this.addChild(new Button(new BaseButtonCfg()))
        rightBtn.imgNormal = ResourceManager.getImage(itemCfg.btnRightNormal)
        rightBtn.imgHover = ResourceManager.getImage(itemCfg.btnRightHover)
        rightBtn.relX = this.sliderX + this.imgNormal.width + this.imgRight.width * 2
        rightBtn.width = rightBtn.imgHover.width
        rightBtn.height = rightBtn.imgHover.height
        rightBtn.updatePosition()
        rightBtn.onClick = () => {
            if (this.value < this.max) {
                this.value = Math.min(this.value + 1, this.max)
                this.onValueChanged(this.value / this.max)
            }
        }
        this.width = itemCfg.width + leftBtn.imgHover.width + this.imgLeft.width + this.imgNormal.width + this.imgRight.width * 2 + rightBtn.imgHover.width
        this.min = itemCfg.min
        this.max = itemCfg.max || 1
        this.value = this.min
        Promise.all([
            BitmapFontWorkerPool.instance.createTextImage(menuCfg.loFont, itemCfg.description),
            BitmapFontWorkerPool.instance.createTextImage(menuCfg.hiFont, itemCfg.description),
        ]).then((textImages) => {
            [this.imgTextNormal, this.imgTextHover] = textImages
            this.height = this.imgTextNormal?.height || 0
        })
    }

    setValue(value: number) {
        this.value = Math.max(0, Math.min(1, value)) * this.max
    }

    override onPointerMove(event: GuiHoverEvent): void {
        super.onPointerMove(event)
        if (event.hoverStateChanged) this.notifyRedraw()
    }

    override onRedraw(context: SpriteContext) {
        if (this.hidden) return
        let img = this.imgTextNormal
        if (this.hover) {
            img = this.imgTextHover
        }
        if (img) context.drawImage(img, this.x, this.y)
        let posX = this.x + this.sliderX
        context.drawImage(this.imgLeft, posX, this.y)
        context.drawImage(this.imgNormal, posX, this.y)
        const dw = Math.round(this.value / this.max * this.imgHover.width)
        context.drawImage(this.imgHover, 0, 0, dw, this.imgHover.height, posX, this.y, dw, this.imgHover.height)
        posX += this.imgNormal.width
        context.drawImage(this.imgRight, posX, this.y)
        super.onRedraw(context)
    }
}
