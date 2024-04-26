import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { SpriteContext, SpriteImage } from '../core/Sprite'
import { ResourceManager } from '../resource/ResourceManager'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { MainMenuLayer } from './MainMenuLayer'
import { UiElementCallback } from './UiElementState'
import { clearTimeoutSafe } from '../core/Util'
import { TOOLTIP_DELAY_SFX_MENU } from '../params'
import { SoundManager } from '../audio/SoundManager'
import { Sample } from '../audio/Sample'

export class MainMenuLevelButton extends MainMenuBaseItem {
    imgActive: SpriteImage = null
    imgInactive: SpriteImage = null
    imgCross: SpriteImage = null
    tooltipTimeout: NodeJS.Timeout = null
    onShowTooltip: () => void = null

    constructor(
        readonly layer: MainMenuLayer,
        readonly levelConf: LevelEntryCfg,
    ) {
        super(levelConf.frontEndX, levelConf.frontEndY)
        this.actionName = 'selectlevel'
        this.zIndex = 10
        this.scrollAffected = true
        const [imgActive, imgInactive, imgCross] = levelConf.menuBMP
        this.imgActive = ResourceManager.getImage(imgActive)
        this.imgInactive = ResourceManager.getImage(imgInactive)
        this.imgCross = ResourceManager.getImage(imgCross)
        this.width = Math.max(this.imgActive.width, this.imgInactive.width, this.imgCross.width)
        this.height = Math.max(this.imgActive.height, this.imgInactive.height, this.imgCross.height)
        this.disabled = this.levelConf.isLocked()
    }

    set onPressed(callback: UiElementCallback) {
        super.onPressed = () => {
            SoundManager.playSample(Sample.SFX_ButtonPressed, false)
            callback()
        }
    }

    set onHoverChange(callback: UiElementCallback) {
        super.onHoverChange = () => {
            if (this.onShowTooltip) {
                if (this.hover) {
                    if (!this.tooltipTimeout) {
                        this.tooltipTimeout = setTimeout(() => this.onShowTooltip(), TOOLTIP_DELAY_SFX_MENU)
                    }
                } else {
                    this.tooltipTimeout = clearTimeoutSafe(this.tooltipTimeout)
                }
            }
            callback()
        }
    }

    reset() {
        super.reset()
        this.disabled = this.levelConf.isLocked()
        this.tooltipTimeout = clearTimeoutSafe(this.tooltipTimeout)
    }

    draw(context: SpriteContext) {
        super.draw(context)
        let img = this.imgCross
        if (!this.levelConf.isLocked()) img = this.state.hover ? this.imgActive : this.imgInactive
        context.drawImage(img, this.x, this.y - this.layer.scrollY)
    }
}
