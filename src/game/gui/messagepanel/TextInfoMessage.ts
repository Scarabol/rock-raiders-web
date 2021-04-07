import { TextInfoMessageEntryConfig } from './TextInfoMessageEntryConfig'
import { ResourceManager } from '../../../resource/ResourceManager'
import { BitmapFont } from '../../../core/BitmapFont'

export class TextInfoMessage {

    infoImage
    textImage

    constructor(font: BitmapFont, infoMessageEntryConfig: TextInfoMessageEntryConfig, maxWidth: number) {
        this.textImage = font.createTextImage(infoMessageEntryConfig.text, maxWidth)
        this.infoImage = ResourceManager.getImageOrNull(infoMessageEntryConfig.imageFilename)
    }

}
