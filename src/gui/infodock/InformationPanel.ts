import { PanelCfg } from '../../cfg/PanelCfg'
import { BitmapFont } from '../../core/BitmapFont'
import { ResourceManager } from '../../resource/ResourceManager'
import { Panel } from '../base/Panel'

export class InformationPanel extends Panel {

    font: BitmapFont = null
    textImage = null

    constructor(panelCfg: PanelCfg) {
        super(panelCfg)
        this.font = ResourceManager.getDefaultFont()
    }

    setText(text?: string) {
        this.textImage = text ? this.font.createTextImage(text, this.img.width - 80) : null
        this.notifyRedraw()
    }

    onRedraw(context: CanvasRenderingContext2D) {
        super.onRedraw(context)
        if (this.textImage) context.drawImage(this.textImage, this.x + (this.img.width - this.textImage.width) / 2, this.y + 12)
    }

}
