import { BitmapFont } from '../core/BitmapFont'
import { MainMenuBaseItem } from './MainMenuBaseItem'

export class MainMenuWindow extends MainMenuBaseItem {

    font: BitmapFont
    imgFirstLine = null
    imgSecondLine = null

    constructor(font: BitmapFont, area: { x: number, y: number, w: number, h: number }) {
        super()
        this.font = font
        this.x = area.x
        this.y = area.y
        this.width = area.w
        this.height = area.h
    }

    setFirstLine(text: string) {
        this.imgFirstLine = !!text ? this.font.createTextImage(text) : null
    }

    setSecondLine(text: string) {
        this.imgSecondLine = !!text ? this.font.createTextImage(text) : null
    }

    draw(context: CanvasRenderingContext2D) {
        super.draw(context)
        const cx = this.x + this.width / 2, cy = this.y + this.height / 2
        if (this.imgFirstLine) context.drawImage(this.imgFirstLine, cx - this.imgFirstLine.width / 2, cy - this.imgFirstLine.height)
        if (this.imgSecondLine) context.drawImage(this.imgSecondLine, cx - this.imgSecondLine.width / 2, cy)
    }

}
