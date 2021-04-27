import { BaseButtonCfg } from '../../cfg/BaseButtonCfg'
import { MenuSliderItemCfg } from '../../cfg/MenuSliderItemCfg'
import { ResourceManager } from '../../resource/ResourceManager'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { MenuLayer } from './MenuLayer'

export class MenuSliderItem extends BaseElement {

    imgTextNormal: HTMLCanvasElement
    imgTextHover: HTMLCanvasElement
    imgLeft: HTMLCanvasElement
    imgNormal: HTMLCanvasElement
    imgHover: HTMLCanvasElement
    imgRight: HTMLCanvasElement
    sliderX: number = 0
    min: number = 0
    max: number = 1
    value: number = 0
    onValueChanged: (value: number) => any = (value) => console.log('value changed to: ' + value)

    constructor(parent: MenuLayer, itemCfg: MenuSliderItemCfg) {
        super(parent)
        this.relX = itemCfg.x
        this.relY = itemCfg.y
        this.sliderX = itemCfg.width
        this.imgLeft = ResourceManager.getImage(itemCfg.imgLeft)
        this.imgNormal = ResourceManager.getImage(itemCfg.imgOff)
        this.imgHover = ResourceManager.getImage(itemCfg.imgOn)
        this.imgRight = ResourceManager.getImage(itemCfg.imgRight)
        const leftBtn = this.addChild(new Button(this, new BaseButtonCfg()))
        leftBtn.imgNormal = ResourceManager.getImage(itemCfg.btnLeftNormal)
        leftBtn.imgHover = ResourceManager.getImage(itemCfg.btnLeftHover)
        leftBtn.relX = this.sliderX - this.imgLeft.width - leftBtn.imgHover.width
        leftBtn.width = leftBtn.imgHover.width
        leftBtn.height = leftBtn.imgHover.height
        leftBtn.updatePosition()
        leftBtn.onClick = () => {
            if (this.value > this.min) {
                this.value--
                this.onValueChanged(this.value)
            }
        }
        const rightBtn = this.addChild(new Button(this, new BaseButtonCfg()))
        rightBtn.imgNormal = ResourceManager.getImage(itemCfg.btnRightNormal)
        rightBtn.imgHover = ResourceManager.getImage(itemCfg.btnRightHover)
        rightBtn.relX = this.sliderX + this.imgNormal.width + this.imgRight.width * 2
        rightBtn.width = rightBtn.imgHover.width
        rightBtn.height = rightBtn.imgHover.height
        rightBtn.updatePosition()
        rightBtn.onClick = () => {
            if (this.value < this.max) {
                this.value++
                this.onValueChanged(this.value)
            }
        }
        this.width = itemCfg.width + leftBtn.imgHover.width + this.imgLeft.width + this.imgNormal.width + this.imgRight.width * 2 + rightBtn.imgHover.width
        this.min = itemCfg.min
        this.max = itemCfg.max || 1
        this.value = this.min // TODO set default value
        this.imgTextNormal = parent.loFont.createTextImage(itemCfg.description)
        this.imgTextHover = parent.hiFont.createTextImage(itemCfg.description)
        this.height = this.imgTextNormal.height
    }

    checkHover(cx, cy): boolean {
        const stateChanged = super.checkHover(cx, cy)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    onRedraw(context: CanvasRenderingContext2D) {
        if (this.hidden) return
        let img = this.imgTextNormal
        if (this.hover) {
            img = this.imgTextHover
        }
        context.drawImage(img, this.x, this.y)
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
