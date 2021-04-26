import { MenuItemCfg } from '../../../cfg/MenuItemCfg'
import { ResourceManager } from '../../../resource/ResourceManager'
import { BaseElement } from '../base/BaseElement'
import { IconPanelButton } from './IconPanelButton'

export class IconPanelToggleButton extends IconPanelButton {

    toggleState: boolean = false
    imgOnNormal: HTMLCanvasElement
    imgOnHover: HTMLCanvasElement
    imgOnPressed: HTMLCanvasElement
    imgOnDisabled: HTMLCanvasElement

    constructor(parent: BaseElement, menuItemOffCfg: MenuItemCfg, menuItemOnCfg: MenuItemCfg, parentWidth: number, menuIndex: number) {
        super(parent, menuItemOffCfg, null, parentWidth, menuIndex)
        this.imgOnNormal = ResourceManager.getImageOrNull(menuItemOnCfg.normalFile)
        this.imgOnHover = ResourceManager.getImageOrNull(menuItemOnCfg.highlightFile)
        this.imgOnPressed = ResourceManager.getImageOrNull(menuItemOnCfg.pressedFile)
        this.imgOnDisabled = ResourceManager.getImageOrNull(menuItemOnCfg.disabledFile)
    }

    onClick() {
        this.toggleState = !this.toggleState
        this.onToggleStateChange()
    }

    onToggleStateChange() {
    }

    onRedraw(context: CanvasRenderingContext2D) {
        if (this.hidden) return
        let img = this.toggleState ? this.imgOnNormal : this.imgNormal
        if (this.disabled) {
            if (this.toggleState) {
                img = this.imgOnDisabled || this.imgOnPressed || this.imgOnNormal
            } else {
                img = this.imgDisabled || this.imgPressed || this.imgNormal
            }
        } else if (this.pressed) {
            if (this.toggleState) {
                img = this.imgOnPressed || this.imgOnNormal
            } else {
                img = this.imgPressed || this.imgNormal
            }
        } else if (this.hover) {
            if (this.toggleState) {
                img = this.imgOnHover || this.imgOnNormal
            } else {
                img = this.imgHover || this.imgNormal
            }
        }
        if (img) context.drawImage(img, this.x, this.y)
        this.children.forEach((child) => child.onRedraw(context))
        this.children.forEach((child) => child.drawHover(context))
        this.children.forEach((child) => child.drawTooltip(context))
    }

}
