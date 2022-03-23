import { MenuItemCfg } from '../../cfg/ButtonCfg'
import { BaseElement } from '../base/BaseElement'
import { GuiClickEvent } from '../event/GuiEvent'
import { OffscreenCache } from '../../worker/OffscreenCache'
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
        this.imgOnNormal = OffscreenCache.getImageOrNull(menuItemOnCfg.normalFile)
        this.imgOnHover = OffscreenCache.getImageOrNull(menuItemOnCfg.highlightFile)
        this.imgOnPressed = OffscreenCache.getImageOrNull(menuItemOnCfg.pressedFile)
        this.imgOnDisabled = OffscreenCache.getImageOrNull(menuItemOnCfg.disabledFile)
    }

    clicked(event: GuiClickEvent) {
        this.toggleState = !this.toggleState
        super.clicked(event)
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
