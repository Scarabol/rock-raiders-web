import { MenuItemCfg } from '../../cfg/MenuItemCfg'
import { MOUSE_BUTTON } from '../../event/EventTypeEnum'
import { BaseElement } from '../base/BaseElement'
import { GuiResourceCache } from '../GuiResourceCache'
import { IconPanelButton } from './IconPanelButton'

export class IconPanelToggleButton extends IconPanelButton {
    toggleState: boolean = false
    imgOnNormal: SpriteImage
    imgOnHover: SpriteImage
    imgOnPressed: SpriteImage
    imgOnDisabled: SpriteImage
    isToggled: () => boolean = () => false

    constructor(parent: BaseElement, menuItemOffCfg: MenuItemCfg, menuItemOnCfg: MenuItemCfg, parentWidth: number, menuIndex: number) {
        super(parent, menuItemOffCfg, null, parentWidth, menuIndex)
        this.imgOnNormal = GuiResourceCache.getImageOrNull(menuItemOnCfg.normalFile)
        this.imgOnHover = GuiResourceCache.getImageOrNull(menuItemOnCfg.highlightFile)
        this.imgOnPressed = GuiResourceCache.getImageOrNull(menuItemOnCfg.pressedFile)
        this.imgOnDisabled = GuiResourceCache.getImageOrNull(menuItemOnCfg.disabledFile)
    }

    clicked(cx: number, cy: number, button: MOUSE_BUTTON) {
        this.toggleState = !this.toggleState
        super.clicked(cx, cy, button)
    }

    updateState(autoRedraw: boolean = true): boolean {
        const stateChanged = super.updateState(false)
        const targetToggleState = !!this.isToggled()
        const toggleStateChanged = this.toggleState = targetToggleState
        this.toggleState = targetToggleState
        if ((stateChanged || toggleStateChanged) && autoRedraw) this.notifyRedraw()
        return stateChanged || toggleStateChanged
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        let img = this.toggleState ? this.imgOnNormal : this.imgNormal
        if (this.disabled) {
            if (this.toggleState) {
                img = this.imgOnDisabled || this.imgOnPressed || this.imgOnNormal
            } else {
                img = this.imgDisabled || this.imgPressed || this.imgNormal
            }
        } else if (this.pressedByButton !== null) {
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
