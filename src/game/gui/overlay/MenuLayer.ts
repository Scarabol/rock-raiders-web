import { MenuEntryCfg } from '../../../cfg/MenuEntryCfg'
import { ResourceManager } from '../../../resource/ResourceManager'
import { BaseElement } from '../base/BaseElement'
import { MenuCycleItem } from './MenuCycleItem'
import { MenuSliderItem } from './MenuSliderItem'
import { MenuLabelItem } from './MenuLabelItem'
import { BitmapFont } from '../../../core/BitmapFont'

export class MenuLayer extends BaseElement {

    menuImage: HTMLCanvasElement
    titleImage: HTMLCanvasElement
    loFont: BitmapFont
    hiFont: BitmapFont
    itemsTrigger: MenuLabelItem[] = []
    itemsNext: MenuLabelItem[] = []

    constructor(parent: BaseElement, menuCfg: MenuEntryCfg) {
        super(parent)
        this.relX = menuCfg.position[0]
        this.relY = menuCfg.position[1]
        this.menuImage = ResourceManager.getImageOrNull(menuCfg.menuImage[0]) // menuImage has 4 parameter here
        this.titleImage = ResourceManager.getBitmapFont(menuCfg.menuFont).createTextImage(menuCfg.fullName)
        this.loFont = ResourceManager.getBitmapFont(menuCfg.loFont)
        this.hiFont = ResourceManager.getBitmapFont(menuCfg.hiFont)
        menuCfg.itemsLabel.forEach((itemCfg) => {
            const item = this.addChild(new MenuLabelItem(this, itemCfg, menuCfg.autoCenter))
            if (itemCfg.actionName.toLowerCase() === 'trigger') {
                this.itemsTrigger.push(item)
            } else {
                this.itemsNext.push(item)
            }
        })
        menuCfg.itemsCycle.forEach((itemCfg) => this.addChild(new MenuCycleItem(this, itemCfg)))
        menuCfg.itemsSlider.forEach((itemCfg) => this.addChild(new MenuSliderItem(this, itemCfg)))
        this.hidden = true
    }

    reset() {
        super.reset()
        this.hidden = true
    }

    onRedraw(context: CanvasRenderingContext2D) {
        if (this.hidden) return
        context.drawImage(this.menuImage, (this.parent.width - this.menuImage.width) / 2, (this.parent.height - this.menuImage.height) / 2)
        context.drawImage(this.titleImage, (this.parent.width - this.titleImage.width) / 2, this.y)
        super.onRedraw(context)
    }

}
