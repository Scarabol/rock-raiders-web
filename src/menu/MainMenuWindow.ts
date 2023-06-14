import { SpriteContext, SpriteImage } from '../core/Sprite'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { ResourceManager } from '../resource/ResourceManager'
import { DEFAULT_FONT_NAME } from '../params'

export class MainMenuWindow extends MainMenuBaseItem {
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
        ResourceManager.bitmapFontWorkerPool.createTextImage(DEFAULT_FONT_NAME, text)
            .then((textImage) => {
                this.imgFirstLine = textImage
                this.state.stateChanged = true
            })
    }

    setSecondLine(text: string) {
        ResourceManager.bitmapFontWorkerPool.createTextImage(DEFAULT_FONT_NAME, text)
            .then((textImage) => {
                this.imgSecondLine = textImage
                this.state.stateChanged = true
            })
    }

    draw(context: SpriteContext) {
        super.draw(context)
        const cx = this.x + this.width / 2, cy = this.y + this.height / 2
        if (this.imgFirstLine) context.drawImage(this.imgFirstLine, cx - this.imgFirstLine.width / 2, cy - this.imgFirstLine.height)
        if (this.imgSecondLine) context.drawImage(this.imgSecondLine, cx - this.imgSecondLine.width / 2, cy)
    }
}
