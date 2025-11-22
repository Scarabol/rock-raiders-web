import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { SpriteContext, SpriteImage } from '../core/Sprite'
import { ResourceManager } from '../resource/ResourceManager'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { MainMenuLayer } from './MainMenuLayer'
import { UiElementCallback } from './UiElementState'
import { clearTimeoutSafe } from '../core/Util'
import { TOOLTIP_DELAY_SFX_MENU } from '../params'
import { SoundManager } from '../audio/SoundManager'

export class MainMenuLevelButton extends MainMenuBaseItem {
    imgActive: SpriteImage
    imgInactive: SpriteImage
    imgCross: SpriteImage
    tooltipTimeout: NodeJS.Timeout | undefined
    onShowTooltip?: () => void

    constructor(
        readonly layer: MainMenuLayer,
        readonly levelConf: LevelEntryCfg,
        readonly onlyTutorials: boolean,
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
        this.disabled = this.onlyTutorials && this.levelConf.isLocked()
    }

    override set onPressed(callback: UiElementCallback) {
        super.onPressed = () => {
            SoundManager.playSfxSound('SFX_ButtonPressed')
            callback()
        }
    }

    override set onHoverChange(callback: UiElementCallback) {
        super.onHoverChange = () => {
            const onShowTooltipCallback = this.onShowTooltip
            if (onShowTooltipCallback) {
                if (this.hover) {
                    if (!this.tooltipTimeout) {
                        this.tooltipTimeout = setTimeout(() => onShowTooltipCallback(), TOOLTIP_DELAY_SFX_MENU)
                    }
                } else {
                    this.tooltipTimeout = clearTimeoutSafe(this.tooltipTimeout)
                }
            }
            callback()
        }
    }

    override reset() {
        super.reset()
        this.disabled = this.onlyTutorials && this.levelConf.isLocked()
        this.tooltipTimeout = clearTimeoutSafe(this.tooltipTimeout)
    }

    override draw(context: SpriteContext) {
        super.draw(context)
        let img = this.imgCross
        if (!this.state.disabled) img = this.state.hover ? this.imgActive : this.imgInactive
        context.drawImage(img, this.x, this.y - this.layer.scrollY)
    }
}
