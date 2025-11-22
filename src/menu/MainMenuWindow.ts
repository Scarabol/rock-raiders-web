import { SpriteContext, SpriteImage } from '../core/Sprite'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { DEFAULT_FONT_NAME } from '../params'
import { BitmapFontWorkerPool } from '../worker/BitmapFontWorkerPool'

export class MainMenuWindow extends MainMenuBaseItem {
    imgFirstLine: SpriteImage | undefined
    imgSecondLine: SpriteImage | undefined

    constructor(area: { x: number; y: number; w: number; h: number }) {
        super(area.x, area.y, area.w, area.h)
    }

    setFirstLine(text: string | undefined) {
        BitmapFontWorkerPool.instance.createTextImage(DEFAULT_FONT_NAME, text, this.width).then((textImage) => {
            this.imgFirstLine = textImage
            this.state.stateChanged = true
        })
    }

    setSecondLine(text: string | undefined) {
        BitmapFontWorkerPool.instance.createTextImage(DEFAULT_FONT_NAME, text, this.width).then((textImage) => {
            this.imgSecondLine = textImage
            this.state.stateChanged = true
        })
    }

    override draw(context: SpriteContext) {
        super.draw(context)
        const totalHeight = (this.imgFirstLine?.height || 0) + (this.imgSecondLine?.height || 0)
        const cx = this.x + this.width / 2, cy = this.y + this.height * (this.imgFirstLine?.height || 0) / totalHeight
        if (this.imgFirstLine) context.drawImage(this.imgFirstLine, cx - this.imgFirstLine.width / 2, cy - this.imgFirstLine.height)
        if (this.imgSecondLine) context.drawImage(this.imgSecondLine, cx - this.imgSecondLine.width / 2, cy)
    }
}
