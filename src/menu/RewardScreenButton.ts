import { RewardButtonCfg } from '../cfg/RewardCfg'
import { ResourceManager } from '../resource/ResourceManager'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { EventBus } from '../event/EventBus'
import { ChangeTooltip } from '../event/LocalEvents'

export class RewardScreenButton extends MainMenuBaseItem {
    imgNormal: SpriteImage
    imgHover: SpriteImage
    imgPressed: SpriteImage
    imgDisabled: SpriteImage

    constructor(conf: RewardButtonCfg, tooltipKey: string) {
        super()
        this.x = conf.x
        this.y = conf.y
        this.imgNormal = ResourceManager.getImage(conf.imgNormalFilepath)
        this.imgHover = ResourceManager.getImage(conf.imgHoverFilepath)
        this.imgPressed = ResourceManager.getImage(conf.imgPressedFilepath)
        this.imgDisabled = ResourceManager.getImage(conf.imgDisabledFilepath)
        this.width = this.imgNormal.width
        this.height = this.imgNormal.height
        this.state.onShowTooltip = () => EventBus.publishEvent(new ChangeTooltip(tooltipKey))
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
