import { MainMenuLayer } from './MainMenuLayer'
import { MainMenuItemCfg } from '../cfg/MainMenuItemCfg'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { ResourceManager } from '../resource/ResourceManager'

export class MainMenuIconButton extends MainMenuBaseItem {

    imgNormal = null
    imgHover = null
    imgPressed = null
    tooltip = ''

    constructor(layer: MainMenuLayer, cfg: MainMenuItemCfg) {
        super()
        this.imgNormal = ResourceManager.getImage(cfg.imgNormal)
        this.imgHover = ResourceManager.getImage(cfg.imgHover)
        this.imgPressed = ResourceManager.getImage(cfg.imgPressed)
        this.tooltip = (cfg.tooltip || '').replace(/_/g, ' ')
        this.width = Math.max(this.imgNormal.width, this.imgHover.width, this.imgPressed.width)
        this.height = Math.max(this.imgNormal.height, this.imgHover.height, this.imgPressed.height)
        this.x = layer.cfg.autoCenter ? (layer.fixedWidth - this.width) / 2 : layer.cfg.position[0] + cfg.x
        this.y = layer.cfg.position[1] + cfg.y
        this.actionName = cfg.actionName
        if (this.actionName === 'Next') this.targetIndex = Number(cfg.target.substring('menu'.length)) - 1
    }

    draw(context: CanvasRenderingContext2D) {
        super.draw(context)
        let img = this.imgNormal
        if (this.hover) img = this.imgHover
        if (this.pressed) img = this.imgPressed
        context.drawImage(img, this.x, this.y)
    }

}
