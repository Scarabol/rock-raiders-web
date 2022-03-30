import { MenuItemCfg } from '../../cfg/ButtonCfg'
import { OffscreenCache } from '../../worker/OffscreenCache'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { IconPanelButton } from './IconPanelButton'

export class IconSubPanel extends Panel {
    backBtn: Button = null
    iconPanelButtons: IconPanelButton[] = []

    constructor(parent: BaseElement, numOfItems: number, onBackPanel: Panel = null) {
        super(parent)
        if (onBackPanel) {
            this.backBtn = this.addChild(new Button(this, OffscreenCache.configuration.interfaceBackButton))
            this.backBtn.onClick = () => this.toggleState(() => onBackPanel.toggleState())
        }
        const frameImgCfg = OffscreenCache.cfg('InterfaceSurroundImages', numOfItems.toString())
        // noinspection JSUnusedLocalSymbols
        const [imgName, val1, val2, val3, val4, imgNameWoBackName, woBack1, woBack2] = frameImgCfg
        this.img = onBackPanel ? OffscreenCache.getImage(imgName) : OffscreenCache.getImage(imgNameWoBackName)
        this.xOut = -this.img.width
    }

    addMenuItem(menuItemGroup: string, itemKey: string) {
        const menuItemCfg = new MenuItemCfg(OffscreenCache.cfg(menuItemGroup, itemKey))
        const menuItem = this.addChild(new IconPanelButton(this, menuItemCfg, itemKey, this.img.width, this.iconPanelButtons.length))
        this.iconPanelButtons.push(menuItem)
        return menuItem
    }

    toggleState(onDone: () => any = null) {
        super.toggleState(onDone)
        if (!this.movedIn) this.updateAllButtonStates()
    }

    updateAllButtonStates() {
        this.iconPanelButtons.forEach((button) => button.updateState(false))
        this.notifyRedraw()
    }
}
