import { Sample } from '../../audio/Sample'
import { SpriteImage } from '../../core/Sprite'
import { OffscreenCache } from '../../worker/OffscreenCache'
import { TextInfoMessageEntryConfig } from './TextInfoMessageEntryConfig'
import { DEFAULT_FONT_NAME } from '../../params'

export class TextInfoMessage {
    infoImage: SpriteImage
    textImage: SpriteImage
    sfxSample: Sample

    constructor(infoMessageEntryConfig: TextInfoMessageEntryConfig, maxWidth: number) {
        OffscreenCache.bitmapFontWorkerPool.createTextImage(DEFAULT_FONT_NAME, infoMessageEntryConfig.text, maxWidth)
            .then((textImage) => this.textImage = textImage)
        this.infoImage = OffscreenCache.getImageOrNull(infoMessageEntryConfig.imageFilename)
        this.sfxSample = Sample[infoMessageEntryConfig.sfxName]
    }
}
