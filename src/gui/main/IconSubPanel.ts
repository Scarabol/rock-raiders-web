import { MenuItemCfg } from '../../cfg/ButtonCfg'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { IconPanelButton } from './IconPanelButton'
import { ResourceManager } from '../../resource/ResourceManager'
import { GameConfig } from '../../cfg/GameConfig'

export class IconSubPanel extends Panel {
    backBtn: Button = null
    iconPanelButtons: IconPanelButton[] = []

    constructor(parent: BaseElement, numOfItems: number, onBackPanel: Panel = null) {
        super(parent)
        if (onBackPanel) {
            this.backBtn = this.addChild(new Button(this, GameConfig.instance.interfaceBackButton))
            this.backBtn.onClick = () => this.toggleState(() => onBackPanel.toggleState())
        }
        const frameImgCfg = GameConfig.instance.interfaceSurroundImages.cfgByNumItems[numOfItems]
        this.img = onBackPanel ? ResourceManager.getImage(frameImgCfg.imgName) : ResourceManager.getImage(frameImgCfg.imgNameWoBackName)
        this.xOut = -this.img.width
    }

    addMenuItem(menuItemGroup: Map<string, MenuItemCfg>, itemKey: string) {
        const menuItemCfg = menuItemGroup.get(itemKey.toLowerCase())
        const menuItem = this.addChild(new IconPanelButton(this, menuItemCfg, itemKey, this.img.width, this.iconPanelButtons.length))
        this.iconPanelButtons.push(menuItem)
        return menuItem
    }

    toggleState(onDone: () => any = null) {
        super.toggleState(onDone)
        if (this.movedIn) {
            this.iconPanelButtons.forEach((button) => button.showDependencies = false)
        } else {
            this.updateAllButtonStates()
        }
    }

    updateAllButtonStates() {
        this.iconPanelButtons.forEach((button) => button.updateState(false))
        this.notifyRedraw()
    }

    isInactive(): boolean {
        return this.movedIn || super.isInactive()
    }
}
