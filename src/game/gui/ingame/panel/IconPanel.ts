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
        this.relX = this.xOut = 640 - 16
        this.xIn = 640 + 95
        this.relY = this.yOut = this.yIn = 9
        this.movedIn = false
        this.mainPanel = this.addSubPanel(4)
        this.mainPanel.relX = this.mainPanel.xOut
        this.mainPanel.relY = this.mainPanel.yOut
        this.mainPanel.movedIn = false
    }

    addSubPanel(numOfItems: number) {
        const childPanel = this.addChild(new IconSubPanel(numOfItems, this.mainPanel))
        this.subPanels.push(childPanel)
        return childPanel
    }

    selectSubPanel(targetPanel: IconSubPanel) {
        this.subPanels.forEach((subPanel) => subPanel.setMovedIn(true))
        targetPanel.setMovedIn(false)
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
        this.xOut = -this.img.width
    }

    addMenuItem(menuItemGroup, itemKey) {
        const menuItem = this.addChild(new MenuItem(this, menuItemGroup, itemKey))
        menuItem.relY += menuItem.height * this.countMenuItems
        this.countMenuItems++
        return menuItem
    }

}
