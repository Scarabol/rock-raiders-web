import { SpriteImage } from '../../core/Sprite'
import { TextInfoMessageEntryCfg } from '../../cfg/TextInfoMessageEntryCfg'
import { DEFAULT_FONT_NAME } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'
import { BitmapFontWorkerPool } from '../../worker/BitmapFontWorkerPool'

export class TextInfoMessage {
    constructor(
        readonly textImage: SpriteImage | undefined,
        readonly infoImage: SpriteImage | undefined,
        readonly sfxSample: string | undefined,
    ) {
    }

    static async fromConfig(cfg: TextInfoMessageEntryCfg, maxWidth: number): Promise<TextInfoMessage> {
        const textImage = await BitmapFontWorkerPool.instance.createTextImage(DEFAULT_FONT_NAME, cfg.text, maxWidth)
        const infoImage = cfg.imageFilename ? ResourceManager.getImage(cfg.imageFilename) : undefined
        return new TextInfoMessage(textImage, infoImage, cfg.sfxName)
    }
}
