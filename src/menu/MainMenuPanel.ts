import { MenuPanelCfg } from '../cfg/MenuCfg'
import { createCanvas, createContext } from '../core/ImageHelper'
import { SpriteContext } from '../core/Sprite'
import { ResourceManager } from '../resource/ResourceManager'
import { MainMenuBaseItem } from './MainMenuBaseItem'

export class MainMenuPanel extends MainMenuBaseItem {
    readonly context: SpriteContext
    readonly readbackContext: SpriteContext

    constructor(cfg: MenuPanelCfg) {
        super(cfg.rect.x, cfg.rect.y, cfg.rect.w, cfg.rect.h)
        this.zIndex = 50
        const imgData = ResourceManager.getImageData(cfg.imgBackground)
        this.context = createContext(imgData.width, imgData.height)
        this.context.putImageData(imgData, 0, 0)
        const readbackContext = createCanvas(imgData.width, imgData.height).getContext('2d', {willReadFrequently: true})
        if (!readbackContext) throw new Error('Could not get readback context')
        this.readbackContext = readbackContext
        this.readbackContext.putImageData(imgData, 0, 0)
    }

    isHovered(sx: number, sy: number): boolean {
        return super.isHovered(sx, sy) && this.readbackContext.getImageData(sx, sy, 1, 1).data[3] > 0
    }

    draw(context: SpriteContext) {
        super.draw(context)
        super.draw(this.readbackContext)
        context.drawImage(this.context.canvas, this.x, this.y, this.width, this.height)
        this.readbackContext.drawImage(this.readbackContext.canvas, this.x, this.y, this.width, this.height)
    }
}
