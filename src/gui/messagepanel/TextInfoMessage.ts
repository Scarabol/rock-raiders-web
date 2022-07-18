import { Sample } from '../../audio/Sample'
import { BitmapFont } from '../../core/BitmapFont'
import { SpriteImage } from '../../core/Sprite'
import { OffscreenCache } from '../../worker/OffscreenCache'
import { TextInfoMessageEntryConfig } from './TextInfoMessageEntryConfig'

export class TextInfoMessage {
    infoImage: SpriteImage
    textImage: SpriteImage
    sfxSample: Sample

    constructor(font: BitmapFont, infoMessageEntryConfig: TextInfoMessageEntryConfig, maxWidth: number) {
        this.textImage = font.createTextImage(infoMessageEntryConfig.text, maxWidth)
        this.infoImage = OffscreenCache.getImageOrNull(infoMessageEntryConfig.imageFilename)
        this.sfxSample = Sample[infoMessageEntryConfig.sfxName]
    }
}
