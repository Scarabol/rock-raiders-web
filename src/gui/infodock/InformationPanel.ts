import { PanelCfg } from '../../cfg/PanelCfg'
import { BitmapFont } from '../../core/BitmapFont'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { GuiResourceCache } from '../GuiResourceCache'

export class InformationPanel extends Panel {

    font: BitmapFont = null
    textImage = null

    constructor(parent: BaseElement, panelCfg: PanelCfg) {
        super(parent, panelCfg)
        this.font = GuiResourceCache.getDefaultFont()
    }

    setText(text?: string) {
        this.textImage = text ? this.font.createTextImage(text, this.img.width - 80) : null
        this.notifyRedraw()
    }

    onRedraw(context: SpriteContext) {
        super.onRedraw(context)
        if (this.textImage) context.drawImage(this.textImage, this.x + (this.img.width - this.textImage.width) / 2, this.y + 12)
    }

}
