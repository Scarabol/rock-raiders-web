import { SAMPLE } from '../audio/Sample'
import { SoundManager } from '../audio/SoundManager'
import { MenuLabelItemCfg } from '../cfg/MenuLabelItemCfg'
import { SpriteContext, SpriteImage } from '../core/Sprite'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { MainMenuLayer } from './MainMenuLayer'
import { UiElementCallback } from './UiElementState'
import { BitmapFontWorkerPool } from '../worker/BitmapFontWorkerPool'

export class MainMenuLabelButton extends MainMenuBaseItem {
    labelImgLo: SpriteImage
    labelImgHi: SpriteImage

    constructor(layer: MainMenuLayer, cfg: MenuLabelItemCfg) {
        super()
        Promise.all([
            BitmapFontWorkerPool.instance.createTextImage(layer.cfg.loFont, cfg.label), // TODO create all images in loading phase
            BitmapFontWorkerPool.instance.createTextImage(layer.cfg.hiFont, cfg.label), // TODO create all images in loading phase
        ]).then((textImages) => {
            [this.labelImgLo, this.labelImgHi] = textImages
            this.width = Math.max(this.labelImgLo.width, this.labelImgHi.width)
            this.height = Math.max(this.labelImgLo.height, this.labelImgHi.height)
            this.x = layer.cfg.autoCenter ? (layer.fixedWidth - this.width) / 2 : layer.cfg.position[0] + cfg.x
            layer.animationFrame.notifyRedraw() // TODO create all images in loading phase
        })
        this.y = layer.cfg.position[1] + cfg.y
        this.actionName = cfg.actionName
        if (this.actionName?.equalsIgnoreCase('Next')) this.targetIndex = Number(cfg.target.slice('menu'.length)) - 1
    }

    set onPressed(callback: UiElementCallback) {
        super.onPressed = () => {
            SoundManager.playSound(SAMPLE.SFX_ButtonPressed, false)
            callback()
        }
    }

    draw(context: SpriteContext) {
        super.draw(context)
        const img = this.state.hover && !this.state.pressed ? this.labelImgHi : this.labelImgLo
        if (img) context.drawImage(img, this.x, this.y)
    }
}
