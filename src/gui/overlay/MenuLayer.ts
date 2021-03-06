import { MenuEntryCfg } from '../../cfg/MenuEntryCfg'
import { BitmapFont } from '../../core/BitmapFont'
import { SPRITE_RESOLUTION_HEIGHT, SPRITE_RESOLUTION_WIDTH } from '../../params'
import { BaseElement } from '../base/BaseElement'
import { GuiResourceCache } from '../GuiResourceCache'
import { MenuCycleItem } from './MenuCycleItem'
import { MenuLabelItem } from './MenuLabelItem'
import { MenuSliderItem } from './MenuSliderItem'

export class MenuLayer extends BaseElement {

    menuImage: SpriteImage
    titleImage: SpriteImage
    loFont: BitmapFont
    hiFont: BitmapFont
    itemsTrigger: MenuLabelItem[] = []
    itemsNext: MenuLabelItem[] = []

    constructor(parent: BaseElement, menuCfg: MenuEntryCfg) {
        super(parent)
        this.relX = menuCfg.position[0]
        this.relY = menuCfg.position[1]
        this.menuImage = GuiResourceCache.getImageOrNull(menuCfg.menuImage[0]) // menuImage has 4 parameter here
        this.titleImage = GuiResourceCache.getBitmapFont(menuCfg.menuFont).createTextImage(menuCfg.fullName)
        this.loFont = GuiResourceCache.getBitmapFont(menuCfg.loFont)
        this.hiFont = GuiResourceCache.getBitmapFont(menuCfg.hiFont)
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

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        context.drawImage(this.menuImage, (SPRITE_RESOLUTION_WIDTH - this.menuImage.width) / 2, (SPRITE_RESOLUTION_HEIGHT - this.menuImage.height) / 2)
        context.drawImage(this.titleImage, (SPRITE_RESOLUTION_WIDTH - this.titleImage.width) / 2, this.y)
        super.onRedraw(context)
    }

}
