import { ButtonCfg } from '../../cfg/ButtonCfg'
import { GuiResourceCache } from '../GuiResourceCache'
import { BaseElement } from './BaseElement'

export class Button extends BaseElement {

    buttonType: string = null
    imgNormal: HTMLCanvasElement = null
    imgHover: HTMLCanvasElement = null
    imgPressed: HTMLCanvasElement = null
    imgDisabled: HTMLCanvasElement = null
    tooltip: string = null

    constructor(parent: BaseElement, btnCfg: ButtonCfg) {
        super(parent)
        this.buttonType = btnCfg.buttonType
        this.imgNormal = GuiResourceCache.getImageOrNull(btnCfg.normalFile)
        this.imgHover = GuiResourceCache.getImageOrNull(btnCfg.highlightFile)
        this.imgPressed = GuiResourceCache.getImageOrNull(btnCfg.pressedFile)
        this.imgDisabled = GuiResourceCache.getImageOrNull(btnCfg.disabledFile)
        this.relX = btnCfg.relX
        this.relY = btnCfg.relY
        this.width = btnCfg.width || this.imgNormal?.width || this.imgPressed?.width
        this.height = btnCfg.height || this.imgNormal?.height || this.imgPressed?.height
        this.tooltip = btnCfg.tooltip?.replace(/_/g, ' ') // TODO refactor cfg handling
        this.updatePosition()
    }

    onClick() {
        console.log('button pressed: ' + this.buttonType)
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

    onRedraw(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
        if (this.hidden) return
        let img = this.imgNormal
        if (this.disabled) {
            img = this.imgDisabled || this.imgPressed || this.imgNormal
        } else if (this.pressed) {
            img = this.imgPressed || this.imgNormal
        } else if (this.hover) {
            img = this.imgHover || this.imgNormal
        }
        if (img) context.drawImage(img, this.x, this.y)
        super.onRedraw(context)
    }

}

