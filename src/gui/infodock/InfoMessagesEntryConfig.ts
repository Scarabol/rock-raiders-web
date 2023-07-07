export class InfoMessagesEntryConfig {
    message: string = null
    buttonImageFilename: string = null
    sfxName: string = null
    timing: string = null
    flag: string = null

    constructor(cfgValue: any) {
        [this.message, this.buttonImageFilename, this.sfxName, this.timing, this.flag] = cfgValue
        this.message = this.message.replace(/_/g, ' ')
    }
}
