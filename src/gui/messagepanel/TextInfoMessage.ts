import { BitmapFont } from '../../core/BitmapFont'
import { ResourceManager } from '../../resource/ResourceManager'
import { TextInfoMessageEntryConfig } from './TextInfoMessageEntryConfig'

export class TextInfoMessage {

    infoImage
    textImage

    constructor(font: BitmapFont, infoMessageEntryConfig: TextInfoMessageEntryConfig, maxWidth: number) {
        this.textImage = font.createTextImage(infoMessageEntryConfig.text, maxWidth)
        this.infoImage = ResourceManager.getImageOrNull(infoMessageEntryConfig.imageFilename)
    }

}
