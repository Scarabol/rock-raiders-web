export class InfoMessagesEntryConfig {
    message: string
    buttonImageFilename: string
    sfxName: string
    timing: string
    flag: string

    constructor(cfgValue: any) {
        [this.message, this.buttonImageFilename, this.sfxName, this.timing, this.flag] = cfgValue
        this.message = this.message.replace(/_/g, ' ')
    }
}
