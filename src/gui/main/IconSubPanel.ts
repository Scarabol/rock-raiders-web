import { IconPanelBackButtonCfg } from '../../cfg/IconPanelBackButtonCfg'
import { MenuItemCfg } from '../../cfg/MenuItemCfg'
import { ResourceManager } from '../../resource/ResourceManager'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { IconPanelButton } from './IconPanelButton'

export class IconSubPanel extends Panel {

    backBtn: Button = null
    iconPanelButtons: IconPanelButton[] = []

    constructor(parent: BaseElement, numOfItems, onBackPanel: Panel = null) {
        super(parent)
        if (onBackPanel) {
            const backBtnCfg = new IconPanelBackButtonCfg(ResourceManager.cfg('InterfaceBackButton'))
            this.backBtn = this.addChild(new Button(this, backBtnCfg))
            this.backBtn.onClick = () => this.toggleState(() => onBackPanel.toggleState())
        }
        const frameImgCfg = ResourceManager.cfg('InterfaceSurroundImages', numOfItems.toString())
        // noinspection JSUnusedLocalSymbols
        const [imgName, val1, val2, val3, val4, imgNameWoBackName, woBack1, woBack2] = frameImgCfg
        this.img = onBackPanel ? ResourceManager.getImage(imgName) : ResourceManager.getImage(imgNameWoBackName)
        this.xOut = -this.img.width
    }

    addMenuItem(menuItemGroup: string, itemKey: string) {
        const menuItemCfg = new MenuItemCfg(ResourceManager.cfg(menuItemGroup, itemKey))
        const menuItem = this.addChild(new IconPanelButton(this, menuItemCfg, itemKey, this.img.width, this.iconPanelButtons.length))
        this.iconPanelButtons.push(menuItem)
        return menuItem
    }

    toggleState(onDone: () => any = null) {
        super.toggleState(onDone)
        if (!this.movedIn) this.iconPanelButtons.forEach((button) => button.updateState())
    }

}
