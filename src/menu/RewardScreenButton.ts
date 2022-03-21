import { RewardButtonCfg } from '../cfg/RewardCfg'
import { ResourceManager } from '../resource/ResourceManager'
import { MainMenuBaseItem } from './MainMenuBaseItem'

export class RewardScreenButton extends MainMenuBaseItem {
    imgNormal: SpriteImage
    imgHover: SpriteImage
    imgPressed: SpriteImage
    imgDisabled: SpriteImage
    disabled: boolean = false
    visible: boolean = true

    constructor(conf: RewardButtonCfg) {
        super()
        this.x = conf.x
        this.y = conf.y
        this.imgNormal = ResourceManager.getImage(conf.imgNormalFilepath)
        this.imgHover = ResourceManager.getImage(conf.imgHoverFilepath)
        this.imgPressed = ResourceManager.getImage(conf.imgPressedFilepath)
        this.imgDisabled = ResourceManager.getImage(conf.imgDisabledFilepath)
        this.width = this.imgNormal.width
        this.height = this.imgNormal.height
    }

    checkSetPressed() {
        if (this.disabled || !this.visible) return
        super.checkSetPressed()
    }

    draw(context: SpriteContext) {
        super.draw(context)
        if (!this.visible) return
        let img = this.imgNormal
        if (this.disabled) {
            img = this.imgDisabled
        } else if (this.pressed) {
            img = this.imgPressed
        } else if (this.hover) {
            img = this.imgHover
        }
        context.drawImage(img, this.x, this.y)
    }
}
