import { PanelCfg } from '../../cfg/PanelCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { DEFAULT_FONT_NAME } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'

export class InformationPanel extends Panel {
    textImage: SpriteImage = null

    constructor(parent: BaseElement, panelCfg: PanelCfg) {
        super(parent, panelCfg)
    }

    setText(text?: string) {
        ResourceManager.bitmapFontWorkerPool.createTextImage(DEFAULT_FONT_NAME, text, this.img.width - 80)
            .then((textImage) => {
                this.textImage = textImage
                this.notifyRedraw()
            })
    }

    onRedraw(context: SpriteContext) {
        super.onRedraw(context)
        if (this.textImage) context.drawImage(this.textImage, this.x + (this.img.width - this.textImage.width) / 2, this.y + 12)
    }
}
