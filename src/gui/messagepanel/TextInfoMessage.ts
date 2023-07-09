import { Sample } from '../../audio/Sample'
import { SpriteImage } from '../../core/Sprite'
import { TextInfoMessageEntryCfg } from '../../cfg/TextInfoMessageEntryCfg'
import { DEFAULT_FONT_NAME } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'

export class TextInfoMessage {
    textImage: SpriteImage
    infoImage: SpriteImage
    sfxSample: Sample

    constructor(infoMessageEntryConfig: TextInfoMessageEntryCfg, maxWidth: number) {
        ResourceManager.bitmapFontWorkerPool.createTextImage(DEFAULT_FONT_NAME, infoMessageEntryConfig.text, maxWidth)
            .then((textImage) => this.textImage = textImage)
        this.infoImage = ResourceManager.getImageOrNull(infoMessageEntryConfig.imageFilename)
        this.sfxSample = Sample[infoMessageEntryConfig.sfxName]
    }
}
