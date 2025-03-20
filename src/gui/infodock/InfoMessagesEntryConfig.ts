import { CfgHelper } from '../../cfg/CfgHelper'

export class InfoMessagesEntryConfig {
    message: string = ''
    buttonImageFilename: string = ''
    sfxName: string = ''
    timing: string = ''
    flag: string = ''

    setFromValue(cfgValue: [string, string, string, string, string]) {
        this.message = CfgHelper.parseLabel(cfgValue[0])
        this.buttonImageFilename = CfgHelper.assertString(cfgValue[1])
        this.sfxName = CfgHelper.assertString(cfgValue[2])
        this.timing = CfgHelper.assertString(cfgValue[3])
        this.flag = CfgHelper.assertString(cfgValue[4] || '')
    }
}
