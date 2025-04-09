import { SpriteImage } from '../../core/Sprite'
import { TextInfoMessageEntryCfg } from '../../cfg/TextInfoMessageCfg'
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
        const infoImage = cfg.imageFilename ? ResourceManager.getImage(cfg.imageFilename) : undefined
        maxWidth = maxWidth - (infoImage?.width || 0)
        const textImage = await BitmapFontWorkerPool.instance.createTextImage(DEFAULT_FONT_NAME, cfg.text, maxWidth)
        return new TextInfoMessage(textImage, infoImage, cfg.sfxName)
    }
}
