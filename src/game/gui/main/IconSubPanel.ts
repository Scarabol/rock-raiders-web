import { Panel } from '../base/Panel'
import { Button } from '../base/Button'
import { InterfaceBackButtonCfg } from './InterfaceBackButtonCfg'
import { ResourceManager } from '../../../resource/ResourceManager'
import { InterfaceBackButton } from './InterfaceBackButton'
import { MenuItemCfg } from '../../../cfg/MenuItemCfg'
import { MenuItem } from '../base/MenuItem'

export class IconSubPanel extends Panel {

    countMenuItems: number = 0
    backBtn: Button = null

    constructor(numOfItems, onBackPanel: Panel = null) {
        super()
        if (onBackPanel) {
            const backBtnCfg = new InterfaceBackButtonCfg(ResourceManager.cfg('InterfaceBackButton'))
            this.backBtn = this.addChild(new InterfaceBackButton(this, backBtnCfg))
            const panel = this
            this.backBtn.onClick = () => panel.toggleState(() => onBackPanel.toggleState())
        }
        const frameImgCfg = ResourceManager.cfg('InterfaceSurroundImages', numOfItems.toString())
        const [imgName, val1, val2, val3, val4, imgNameWoBackName, woBack1, woBack2] = frameImgCfg
        this.img = onBackPanel ? ResourceManager.getImage(imgName) : ResourceManager.getImage(imgNameWoBackName)
        this.xOut = -this.img.width
    }

    addMenuItem(menuItemGroup: string, itemKey: string) {
        const menuItemCfg = new MenuItemCfg(ResourceManager.cfg(menuItemGroup, itemKey))
        const menuItem = this.addChild(new MenuItem(this, menuItemCfg, itemKey, this.img.width, this.countMenuItems))
        this.countMenuItems++
        return menuItem
    }

}
