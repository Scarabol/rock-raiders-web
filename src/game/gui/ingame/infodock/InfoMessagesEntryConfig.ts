export class InfoMessagesEntryConfig {

    message: string = null
    buttonImageFilename: string = null
    sfx: string = null
    timing: string = null
    flag: string = null

    constructor(cfgValue: any) {
        [this.message, this.buttonImageFilename, this.sfx, this.timing, this.flag] = cfgValue
        this.message = this.message.replace(/_/g, ' ')
    }

}
