export class TextInfoMessageEntryConfig {

    text: string
    imageFilename: string
    sfxName: string

    textImage
    infoImage

    constructor(cfgValue: any) {
        [this.text, this.imageFilename, this.sfxName] = cfgValue
    }

}
