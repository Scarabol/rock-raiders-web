import { Sample } from '../../audio/Sample'
import { SpriteImage } from '../../core/Sprite'
import { TextInfoMessageEntryCfg } from '../../cfg/TextInfoMessageEntryCfg'
import { DEFAULT_FONT_NAME } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'
import { BitmapFontWorkerPool } from '../../worker/BitmapFontWorkerPool'

export class TextInfoMessage {
    constructor(
        readonly textImage: SpriteImage,
        readonly infoImage: SpriteImage,
        readonly sfxSample: Sample,
    ) {
    }

    static async fromConfig(cfg: TextInfoMessageEntryCfg, maxWidth: number): Promise<TextInfoMessage> {
        const textImage = await BitmapFontWorkerPool.instance.createTextImage(DEFAULT_FONT_NAME, cfg.text, maxWidth)
        const infoImage = ResourceManager.getImageOrNull(cfg.imageFilename)
        const sfxSample = Sample.fromString(cfg.sfxName)
        return new TextInfoMessage(textImage, infoImage, sfxSample)
    }
}
