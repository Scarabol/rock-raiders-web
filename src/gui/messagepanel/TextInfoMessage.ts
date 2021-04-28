import { BitmapFont } from '../../core/BitmapFont'
import { GuiResourceCache } from '../GuiResourceCache'
import { TextInfoMessageEntryConfig } from './TextInfoMessageEntryConfig'

export class TextInfoMessage {

    infoImage
    textImage

    constructor(font: BitmapFont, infoMessageEntryConfig: TextInfoMessageEntryConfig, maxWidth: number) {
        this.textImage = font.createTextImage(infoMessageEntryConfig.text, maxWidth)
        this.infoImage = GuiResourceCache.getImageOrNull(infoMessageEntryConfig.imageFilename)
    }

}
