import { ResourceManager } from '../../../../resource/ResourceManager'
import { BaseElement } from '../BaseElement'
import { ButtonCfg } from './ButtonCfg'

export class Button extends BaseElement {

    buttonType: string
    imgNormal
    imgHover
    imgPressed
    label: string
    tooltip: string

    constructor(parent: BaseElement, btnCfg: ButtonCfg) {
        super(parent)
        this.buttonType = btnCfg.buttonType
        this.imgNormal = ResourceManager.getImageOrNull(btnCfg.normalFile)
        this.imgHover = ResourceManager.getImageOrNull(btnCfg.highlightFile)
        this.imgPressed = ResourceManager.getImageOrNull(btnCfg.pressedFile)
        this.relX = btnCfg.relX
        this.relY = btnCfg.relY
        this.width = btnCfg.width
        this.height = btnCfg.height
        this.tooltip = btnCfg.tooltip
        this.updatePosition()
    }

    onClick() {
        console.log('button pressed: ' + this.buttonType)
    }

    onRedraw(context: CanvasRenderingContext2D) {
        if (this.hidden) return
        let img = this.imgNormal
        if (this.disabled || this.pressed) {
            img = this.imgPressed
        } else if (this.hover) {
            img = this.imgHover
        }
        if (img) {
            context.drawImage(img, this.x, this.y)
        } else if (this.label) {
            context.textAlign = 'center'
            context.font = 'bold 10px Arial'
            context.fillStyle = '#fff'
            context.fillText(this.label, this.x + this.width / 2, this.y + this.height - 2)
        }
        super.onRedraw(context)
    }

}

