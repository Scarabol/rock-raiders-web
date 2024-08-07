export class TextInfoMessageEntryCfg {
    text: string
    imageFilename: string
    sfxName: string

    constructor(cfgValue: [string, string, string]) {
        [this.text, this.imageFilename, this.sfxName] = cfgValue
    }
}
