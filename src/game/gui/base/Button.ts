import { ResourceManager } from '../../../resource/ResourceManager'
import { BaseElement } from './BaseElement'
import { ButtonCfg } from '../../../cfg/ButtonsCfg'

export class Button extends BaseElement {

    buttonType: string
    imgNormal
    imgHover
    imgPressed
    imgDisabled
    tooltip: string

    constructor(parent: BaseElement, btnCfg: ButtonCfg) {
        super(parent)
        this.buttonType = btnCfg.buttonType
        this.imgNormal = ResourceManager.getImageOrNull(btnCfg.normalFile)
        this.imgHover = ResourceManager.getImageOrNull(btnCfg.highlightFile)
        this.imgPressed = ResourceManager.getImageOrNull(btnCfg.pressedFile)
        this.imgDisabled = ResourceManager.getImageOrNull(btnCfg.disabledFile)
        this.relX = btnCfg.relX
        this.relY = btnCfg.relY
        this.width = btnCfg.width || this.imgNormal?.width || this.imgPressed?.width
        this.height = btnCfg.height || this.imgNormal?.height || this.imgPressed?.height
        this.tooltip = btnCfg.tooltip
        this.updatePosition()
    }

    onClick() {
        console.log('button pressed: ' + this.buttonType)
    }

    onRedraw(context: CanvasRenderingContext2D) {
        if (this.hidden) return
        let img = this.imgNormal
        if (this.disabled) {
            img = this.imgDisabled || this.imgPressed
        } else if (this.pressed) {
            img = this.imgPressed
        } else if (this.hover) {
            img = this.imgHover
        }
        if (img) context.drawImage(img, this.x, this.y)
        super.onRedraw(context)
    }

}

