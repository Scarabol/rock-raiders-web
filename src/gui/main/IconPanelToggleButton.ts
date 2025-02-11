import { MenuItemCfg } from '../../cfg/ButtonCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { GuiPointerDownEvent } from '../event/GuiEvent'
import { IconPanelButton } from './IconPanelButton'
import { ResourceManager } from '../../resource/ResourceManager'

export class IconPanelToggleButton extends IconPanelButton {
    toggleState: boolean = false
    imgOnNormal?: SpriteImage
    imgOnHover?: SpriteImage
    imgOnPressed?: SpriteImage
    imgOnDisabled?: SpriteImage
    isToggled: () => boolean = () => false

    constructor(menuItemOffCfg: MenuItemCfg, menuItemOnCfg: MenuItemCfg, parentWidth: number, menuIndex: number) {
        super(menuItemOffCfg, '', parentWidth, menuIndex)
        if (menuItemOnCfg.normalFile) this.imgOnNormal = ResourceManager.getImage(menuItemOnCfg.normalFile)
        if (menuItemOnCfg.highlightFile) this.imgOnHover = ResourceManager.getImage(menuItemOnCfg.highlightFile)
        if (menuItemOnCfg.pressedFile) this.imgOnPressed = ResourceManager.getImage(menuItemOnCfg.pressedFile)
        if (menuItemOnCfg.disabledFile) this.imgOnDisabled = ResourceManager.getImage(menuItemOnCfg.disabledFile)
    }

    clicked(event: GuiPointerDownEvent) {
        this.toggleState = !this.toggleState
        super.clicked(event)
    }

    updateState(autoRedraw: boolean = true): boolean {
        const stateChanged = super.updateState(false)
        const targetToggleState = this.isToggled()
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
    }
}
