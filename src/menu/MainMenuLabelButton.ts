import { Sample } from '../audio/Sample'
import { SoundManager } from '../audio/SoundManager'
import { MenuLabelItemCfg } from '../cfg/MenuLabelItemCfg'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { MainMenuLayer } from './MainMenuLayer'
import { UiElementCallback } from './UiElementState'

export class MainMenuLabelButton extends MainMenuBaseItem {
    labelImgLo: SpriteImage = null
    labelImgHi: SpriteImage = null

    constructor(layer: MainMenuLayer, cfg: MenuLabelItemCfg) {
        super()
        this.labelImgLo = layer.loFont.createTextImage(cfg.label)
        this.labelImgHi = layer.hiFont.createTextImage(cfg.label)
        this.width = Math.max(this.labelImgLo.width, this.labelImgHi.width)
        this.height = Math.max(this.labelImgLo.height, this.labelImgHi.height)
        this.x = layer.cfg.autoCenter ? (layer.fixedWidth - this.width) / 2 : layer.cfg.position[0] + cfg.x
        this.y = layer.cfg.position[1] + cfg.y
        this.actionName = cfg.actionName
        if (this.actionName === 'Next') this.targetIndex = Number(cfg.target.substring('menu'.length)) - 1
    }

    set onPressed(callback: UiElementCallback) {
        super.onPressed = () => {
            SoundManager.playSample(Sample.SFX_ButtonPressed)
            callback()
        }
    }

    draw(context: SpriteContext) {
        super.draw(context)
        const img = this.state.hover && !this.state.pressed ? this.labelImgHi : this.labelImgLo
        context.drawImage(img, this.x, this.y)
    }
}
