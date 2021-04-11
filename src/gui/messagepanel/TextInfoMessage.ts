import { Sample } from '../../audio/Sample'
import { BitmapFont } from '../../core/BitmapFont'
import { GuiResourceCache } from '../GuiResourceCache'
import { TextInfoMessageEntryConfig } from './TextInfoMessageEntryConfig'

export class TextInfoMessage {

    infoImage: HTMLCanvasElement
    textImage: HTMLCanvasElement
    sfxSample: Sample

    constructor(font: BitmapFont, infoMessageEntryConfig: TextInfoMessageEntryConfig, maxWidth: number) {
        this.textImage = font.createTextImage(infoMessageEntryConfig.text, maxWidth)
        this.infoImage = GuiResourceCache.getImageOrNull(infoMessageEntryConfig.imageFilename)
        this.sfxSample = Sample[infoMessageEntryConfig.sfxName]
    }

}
