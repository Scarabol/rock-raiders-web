import { ConfigSetFromEntryValue } from './Configurable'
import { CfgEntryValue } from './CfgEntry'

export class BaseButtonCfg {
    buttonType: string = ''
    normalFile: string = ''
    highlightFile: string = ''
    pressedFile: string = ''
    disabledFile: string = ''
    relX: number = 0
    relY: number = 0
    width: number = 0
    height: number = 0
    tooltipKey: string = ''
    tooltipText: string = ''
    tooltipSfx: string = ''
}

export class ButtonCfg extends BaseButtonCfg implements ConfigSetFromEntryValue {
    setFromValue(cfgValue: CfgEntryValue): this {
        const value = cfgValue.toArray(',', 9)
        this.buttonType = value[0].toString()
        this.normalFile = value[1].toFileName()
        this.highlightFile = value[2].toFileName()
        this.pressedFile = value[3].toFileName()
        this.relX = value[4].toNumber()
        this.relY = value[5].toNumber()
        this.width = value[6].toNumber()
        this.height = value[7].toNumber()
        this.tooltipKey = value[8].toString()
        return this
    }
}

export class InfoButtonCfg extends BaseButtonCfg {
    constructor(buttonImageFilename: string) {
        super()
        this.normalFile = buttonImageFilename
        this.highlightFile = buttonImageFilename
        this.pressedFile = buttonImageFilename
        this.disabledFile = buttonImageFilename
        this.relX = 0
        this.relY = 0
    }
}

export class IconPanelBackButtonCfg extends BaseButtonCfg implements ConfigSetFromEntryValue {
    constructor() {
        super()
        this.buttonType = 'InterfaceBackButton'
        this.relX = 4
        this.relY = 14
    }

    setFromValue(cfgValue: CfgEntryValue): this {
        const value = cfgValue.toArray(':', 5)
        this.width = value[0].toNumber()
        this.height = value[1].toNumber()
        this.highlightFile = value[2].toFileName()
        this.pressedFile = value[3].toFileName()
        this.tooltipText = value[4].toLabel()
        return this
    }
}
