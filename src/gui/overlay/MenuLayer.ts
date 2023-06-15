import { MenuEntryCfg } from '../../cfg/MenuEntryCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../../params'
import { BaseElement } from '../base/BaseElement'
import { MenuCycleItem } from './MenuCycleItem'
import { MenuLabelItem } from './MenuLabelItem'
import { MenuSliderItem } from './MenuSliderItem'
import { ResourceManager } from '../../resource/ResourceManager'

export class MenuLayer extends BaseElement {
    menuImage: SpriteImage
    titleImage: SpriteImage
    itemsTrigger: MenuLabelItem[] = []
    itemsNext: MenuLabelItem[] = []
    itemsCycle: MenuCycleItem[] = []
    itemsSlider: MenuSliderItem[] = []

    constructor(parent: BaseElement, readonly menuCfg: MenuEntryCfg) {
        super(parent)
        this.relX = menuCfg.position[0]
        this.relY = menuCfg.position[1]
        this.menuImage = ResourceManager.getImageOrNull(menuCfg.menuImage[0]) // menuImage has 4 parameter here
        ResourceManager.bitmapFontWorkerPool.createTextImage(menuCfg.menuFont, menuCfg.fullName)
            .then((textImage) => this.titleImage = textImage)
        menuCfg.itemsLabel.forEach((itemCfg) => {
            const item = this.addChild(new MenuLabelItem(this, itemCfg, menuCfg.autoCenter))
            if (itemCfg.actionName.toLowerCase() === 'trigger') {
                this.itemsTrigger.push(item)
            } else {
                this.itemsNext.push(item)
            }
        })
        this.itemsCycle = menuCfg.itemsCycle.map((itemCfg) => this.addChild(new MenuCycleItem(this, itemCfg)))
        this.itemsSlider = menuCfg.itemsSlider.map((itemCfg) => this.addChild(new MenuSliderItem(this, itemCfg)))
        this.hidden = true
    }

    reset() {
        super.reset()
        this.hidden = true
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        context.drawImage(this.menuImage, (NATIVE_SCREEN_WIDTH - this.menuImage.width) / 2, (NATIVE_SCREEN_HEIGHT - this.menuImage.height) / 2)
        context.drawImage(this.titleImage, (NATIVE_SCREEN_WIDTH - this.titleImage.width) / 2, this.y)
        super.onRedraw(context)
    }
}
