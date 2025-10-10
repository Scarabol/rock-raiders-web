import { MenuLabelItemCfg } from '../../cfg/MenuLabelItemCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { BaseElement } from '../base/BaseElement'
import { GuiHoverEvent, GuiPointerDownEvent, GuiPointerUpEvent } from '../event/GuiEvent'
import { MenuEntryCfg } from '../../cfg/MenuEntryCfg'
import { BitmapFontWorkerPool } from '../../worker/BitmapFontWorkerPool'
import { EventKey } from '../../event/EventKeyEnum'
import { LevelEntryCfg } from '../../cfg/LevelsCfg'

export class MenuLabelItem extends BaseElement {
    target: string
    loImg?: SpriteImage
    hiImg?: SpriteImage

    constructor(menuCfg: MenuEntryCfg, itemCfg: MenuLabelItemCfg, parentCenterX: number) {
        super()
        this.target = itemCfg.target
        Promise.all([
            BitmapFontWorkerPool.instance.createTextImage(menuCfg.loFont, itemCfg.label),
            BitmapFontWorkerPool.instance.createTextImage(menuCfg.hiFont, itemCfg.label),
        ]).then((textImages) => {
            [this.loImg, this.hiImg] = textImages
            this.width = this.loImg?.width || 0
            this.height = this.loImg?.height || 0
            this.relX = menuCfg.autoCenter ? parentCenterX - this.width / 2 : itemCfg.x
            this.updatePosition()
        })
        this.relY = itemCfg.y
        this.registerEventListener(EventKey.LEVEL_SELECTED, (event) => {
            this.disabled = LevelEntryCfg.isTutorial(event.levelConf.levelName) && itemCfg.flag === 'NotInTuto'
        })
    }

    onPointerMove(event: GuiHoverEvent): void {
        super.onPointerMove(event)
        if (event.hoverStateChanged) this.notifyRedraw()
    }

    onPointerDown(event: GuiPointerDownEvent): boolean {
        const stateChanged = super.onPointerDown(event)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    onPointerUp(event: GuiPointerUpEvent): boolean {
        const stateChanged = super.onPointerUp(event)
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    onPointerLeave(): boolean {
        const stateChanged = super.onPointerLeave()
        if (stateChanged) this.notifyRedraw()
        return stateChanged
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        if (this.hover) {
            if (this.hiImg) context.drawImage(this.hiImg, this.x, this.y)
        } else {
            if (this.loImg) context.drawImage(this.loImg, this.x, this.y)
        }
        super.onRedraw(context)
    }
}
