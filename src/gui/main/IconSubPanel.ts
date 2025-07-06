import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { IconPanelButton } from './IconPanelButton'
import { ResourceManager } from '../../resource/ResourceManager'
import { GameConfig } from '../../cfg/GameConfig'
import { SpriteContext } from '../../core/Sprite'
import { EventBroker } from '../../event/EventBroker'
import { DeselectAll, GuiBackButtonClicked } from '../../event/LocalEvents'
import { InterfaceImageEntryCfg } from '../../cfg/InterfaceImageCfg'

export class IconSubPanel extends Panel {
    readonly iconPanelButtons: IconPanelButton[] = []

    constructor(numOfItems: number, onBackPanel: Panel | undefined, deselectAll: boolean) {
        super()
        if (onBackPanel) {
            this.addChild(new Button(GameConfig.instance.interfaceBackButton)).onClick = () => {
                if (deselectAll) {
                    this.publishEvent(new DeselectAll())
                } else {
                    this.toggleState(() => onBackPanel.toggleState())
                }
                EventBroker.publish(new GuiBackButtonClicked())
            }
        }
        const frameImgCfg = GameConfig.instance.interfaceSurroundImages[numOfItems]
        this.img = onBackPanel ? ResourceManager.getImage(frameImgCfg.imgName) : ResourceManager.getImage(frameImgCfg.imgNameWoBackName)
        this.xOut = -this.img.width
        this.width = this.img.width
    }

    addMenuItem(interfaceImageCfg: InterfaceImageEntryCfg | undefined) {
        if (!interfaceImageCfg) throw new Error(`No menu item config given`)
        const menuItem = this.addChild(new IconPanelButton(interfaceImageCfg, this.width, this.iconPanelButtons.length))
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
