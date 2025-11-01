import { MenuEntryCfg } from '../../cfg/MenuEntryCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { NATIVE_SCREEN_HEIGHT, NATIVE_SCREEN_WIDTH } from '../../params'
import { BaseElement } from '../base/BaseElement'
import { MenuCycleItem } from './MenuCycleItem'
import { MenuLabelItem } from './MenuLabelItem'
import { MenuSliderItem } from './MenuSliderItem'
import { ResourceManager } from '../../resource/ResourceManager'
import { BitmapFontWorkerPool } from '../../worker/BitmapFontWorkerPool'

export class MenuLayer extends BaseElement {
    menuImage: SpriteImage
    titleImage: SpriteImage | undefined
    itemsTrigger: MenuLabelItem[] = []
    itemsNext: MenuLabelItem[] = []
    itemsCycle: MenuCycleItem[] = []
    itemsSlider: MenuSliderItem[] = []

    constructor(menuCfg: MenuEntryCfg) {
        super()
        this.relX = menuCfg.position.x
        this.relY = menuCfg.position.y
        this.menuImage = ResourceManager.getImage(menuCfg.menuImage)
        BitmapFontWorkerPool.instance.createTextImage(menuCfg.menuFont, menuCfg.fullName)
            .then((textImage) => this.titleImage = textImage)
        menuCfg.itemsLabel.forEach((itemCfg) => {
            const item = this.addChild(new MenuLabelItem(menuCfg, itemCfg, -this.relX + this.menuImage.width / 2))
            if (itemCfg.actionName.toLowerCase() === 'trigger') {
                this.itemsTrigger.push(item)
            } else {
                this.itemsNext.push(item)
            }
        })
        this.itemsCycle = menuCfg.itemsCycle.map((itemCfg) => this.addChild(new MenuCycleItem(menuCfg, itemCfg)))
        this.itemsSlider = menuCfg.itemsSlider.map((itemCfg) => this.addChild(new MenuSliderItem(menuCfg, itemCfg)))
        this.hidden = true
    }

    override reset() {
        super.reset()
        this.hidden = true
    }

    override onRedraw(context: SpriteContext) {
        if (this.hidden) return
        context.drawImage(this.menuImage, (NATIVE_SCREEN_WIDTH - this.menuImage.width) / 2, (NATIVE_SCREEN_HEIGHT - this.menuImage.height) / 2)
        if (this.titleImage) context.drawImage(this.titleImage, (NATIVE_SCREEN_WIDTH - this.titleImage.width) / 2, this.y)
        super.onRedraw(context)
    }
}
