import { RewardButtonCfg } from '../cfg/RewardCfg'
import { SpriteContext, SpriteImage } from '../core/Sprite'
import { ChangeTooltip, HideTooltip } from '../event/GuiCommand'
import { ResourceManager } from '../resource/ResourceManager'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { TOOLTIP_DELAY_TEXT_MENU } from '../params'
import { GameConfig } from '../cfg/GameConfig'
import { EventBroker } from '../event/EventBroker'
import { UiElementCallback } from './UiElementState'
import { SoundManager } from '../audio/SoundManager'
import { SAMPLE } from '../audio/Sample'

export class RewardScreenButton extends MainMenuBaseItem {
    imgNormal: SpriteImage
    imgHover: SpriteImage
    imgPressed: SpriteImage
    imgDisabled: SpriteImage

    constructor(conf: RewardButtonCfg, tooltipKey: string) {
        super(conf.x, conf.y)
        this.imgNormal = ResourceManager.getImage(conf.imgNormalFilepath)
        this.imgHover = ResourceManager.getImage(conf.imgHoverFilepath)
        this.imgPressed = ResourceManager.getImage(conf.imgPressedFilepath)
        this.imgDisabled = ResourceManager.getImage(conf.imgDisabledFilepath)
        this.width = this.imgNormal.width
        this.height = this.imgNormal.height
        const tooltipText = GameConfig.instance.getTooltipText(tooltipKey)
        this.state.onShowTooltip = () => EventBroker.publish(new ChangeTooltip(tooltipText, TOOLTIP_DELAY_TEXT_MENU))
        this.state.onHideTooltip = () => EventBroker.publish(new HideTooltip(tooltipText))
    }

    set onPressed(callback: UiElementCallback) {
        super.onPressed = () => {
            SoundManager.playSound(SAMPLE.SFX_ButtonPressed, false)
            callback()
        }
    }

    draw(context: SpriteContext) {
        super.draw(context)
        if (!this.state.visible) return
        let img = this.imgNormal
        if (this.state.disabled) {
            img = this.imgDisabled
        } else if (this.state.pressed) {
            img = this.imgPressed
        } else if (this.state.hover) {
            img = this.imgHover
        }
        context.drawImage(img, this.x, this.y)
    }
}
