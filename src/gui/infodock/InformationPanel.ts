import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { Panel } from '../base/Panel'
import { DEFAULT_FONT_NAME } from '../../params'
import { BitmapFontWorkerPool } from '../../worker/BitmapFontWorkerPool'

export class InformationPanel extends Panel {
    textImage?: SpriteImage

    setText(text?: string) {
        BitmapFontWorkerPool.instance.createTextImage(DEFAULT_FONT_NAME, text, this.width - 80)
            .then((textImage) => {
                this.textImage = textImage
                this.notifyRedraw()
            })
    }

    onRedraw(context: SpriteContext) {
        super.onRedraw(context)
        if (this.textImage) context.drawImage(this.textImage, this.x + (this.width - this.textImage.width) / 2, this.y + 12)
    }
}
