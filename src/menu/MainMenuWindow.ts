import { BitmapFont } from '../core/BitmapFont'
import { SpriteContext, SpriteImage } from '../core/Sprite'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { ResourceManager } from '../resource/ResourceManager'

export class MainMenuWindow extends MainMenuBaseItem {
    font: BitmapFont
    imgFirstLine: SpriteImage = null
    imgSecondLine: SpriteImage = null

    constructor(area: { x: number; y: number; w: number; h: number }) {
        super()
        this.x = area.x
        this.y = area.y
        this.width = area.w
        this.height = area.h
    }

    setFirstLine(text: string) {
        this.imgFirstLine = ResourceManager.getDefaultFont().createTextImage(text)
    }

    setSecondLine(text: string) {
        this.imgSecondLine = ResourceManager.getDefaultFont().createTextImage(text)
    }

    draw(context: SpriteContext) {
        super.draw(context)
        const cx = this.x + this.width / 2, cy = this.y + this.height / 2
        if (this.imgFirstLine) context.drawImage(this.imgFirstLine, cx - this.imgFirstLine.width / 2, cy - this.imgFirstLine.height)
        if (this.imgSecondLine) context.drawImage(this.imgSecondLine, cx - this.imgSecondLine.width / 2, cy)
    }
}
