import { Button } from '../../base/button/Button'
import { ResourceManager } from '../../../../resource/ResourceManager'
import { MenuItem } from '../../base/MenuItem'
import { Panel } from './Panel'
import { InterfaceBackButton } from '../../base/button/InterfaceBackButton'
import { ButtonCfg } from '../../../../cfg/ButtonsCfg'

export class IconPanel extends Panel {

    subPanels: IconSubPanel[] = []
    mainPanel: IconSubPanel

    constructor() {
        super()
        this.xOut = 640 + 95
        this.relX = this.xIn = 640 - 16
        this.relY = this.yIn = this.yOut = 9
        this.mainPanel = this.addSubPanel(4)
    }

    addSubPanel(numOfItems: number) {
        const childPanel = this.addChild(new IconSubPanel(numOfItems, this.mainPanel))
        this.subPanels.push(childPanel)
        return childPanel
    }

    selectSubPanel(targetPanel: IconSubPanel) {
        this.subPanels.forEach((subPanel) => subPanel.setMovedIn(false))
        targetPanel.setMovedIn(true)
    }

}

export class IconSubPanel extends Panel {

    countMenuItems: number = 0
    backBtn: Button = null

    constructor(numOfItems, onBackPanel: Panel = null) {
        super()
        if (onBackPanel) {
            const backBtnCfg = new ButtonCfg(ResourceManager.cfg('InterfaceBackButton'))
            this.backBtn = this.addChild(new InterfaceBackButton(this, backBtnCfg))
            const panel = this
            this.backBtn.onClick = () => panel.toggleState(() => onBackPanel.toggleState())
        }
        const frameImgCfg = ResourceManager.cfg('InterfaceSurroundImages', numOfItems.toString())
        const [imgName, val1, val2, val3, val4, imgNameWoBackName, woBack1, woBack2] = frameImgCfg
        this.img = onBackPanel ? ResourceManager.getImage(imgName) : ResourceManager.getImage(imgNameWoBackName)
        this.xIn = -this.img.width
    }

    addMenuItem(menuItemGroup, itemKey) {
        const menuItem = this.addChild(new MenuItem(this, menuItemGroup, itemKey))
        menuItem.relY += menuItem.height * this.countMenuItems
        this.countMenuItems++
        return menuItem
    }

}
