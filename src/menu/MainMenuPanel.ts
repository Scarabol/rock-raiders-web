import { createContext } from '../core/ImageHelper'
import { MainMenuBaseItem } from './MainMenuBaseItem'

export class MainMenuPanel extends MainMenuBaseItem {
    context: SpriteContext

    constructor(imgData: ImageData, area: { x: number, y: number, w: number, h: number }) {
        super()
        this.zIndex = 50
        this.context = createContext(imgData.width, imgData.height)
        this.context.putImageData(imgData, 0, 0)
        this.x = area.x
        this.y = area.y
        this.width = area.w
        this.height = area.h
    }

    checkHover(sx: number, sy: number): boolean {
        const inRect = sx >= this.x && sx < this.x + this.width && sy >= this.y && sy < this.y + this.height
        const hover = inRect && this.context.getImageData(sx, sy, 1, 1).data[3] > 0
        if (this.hover !== hover) this.needsRedraw = true
        this.hover = hover
        return this.hover
    }

    draw(context: SpriteContext) {
        super.draw(context)
        context.drawImage(this.context.canvas, this.x, this.y, this.width, this.height)
    }
}
