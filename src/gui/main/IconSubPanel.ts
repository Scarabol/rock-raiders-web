import { MenuItemCfg } from '../../cfg/ButtonCfg'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { IconPanelButton } from './IconPanelButton'
import { ResourceManager } from '../../resource/ResourceManager'
import { GameConfig } from '../../cfg/GameConfig'
import { SpriteContext } from '../../core/Sprite'
import { EventBroker } from '../../event/EventBroker'
import { GuiBackButtonClicked } from '../../event/LocalEvents'

export class IconSubPanel extends Panel {
    iconPanelButtons: IconPanelButton[] = []

    constructor(numOfItems: number, onBackPanel?: Panel) {
        super()
        if (onBackPanel) {
            this.addChild(new Button(GameConfig.instance.interfaceBackButton)).onClick = () => {
                EventBroker.publish(new GuiBackButtonClicked())
            }
        }
        const frameImgCfg = GameConfig.instance.interfaceSurroundImages[numOfItems]
        this.img = onBackPanel ? ResourceManager.getImage(frameImgCfg.imgName) : ResourceManager.getImage(frameImgCfg.imgNameWoBackName)
        this.xOut = -this.img.width
    }

    addMenuItem(menuItemGroup: Map<string, MenuItemCfg>, itemKey: string) {
        const menuItemCfg = menuItemGroup.get(itemKey.toLowerCase())
        const menuItem = this.addChild(new IconPanelButton(menuItemCfg, itemKey, this.img.width, this.iconPanelButtons.length))
        this.iconPanelButtons.push(menuItem)
        return menuItem
    }

    toggleState(onDone?: () => void) {
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

    onRedraw(context: SpriteContext) {
        if (this.movedIn) return
        super.onRedraw(context)
    }
}
