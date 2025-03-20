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

export class ButtonCfg extends BaseButtonCfg {
    constructor(cfgValue: any) {
        super()
        if (cfgValue.length !== 9) throw new Error(`Invalid number of arguments (${cfgValue.length}) given for button configuration expected 9`);
        [this.buttonType, this.normalFile, this.highlightFile, this.pressedFile, this.relX, this.relY, this.width, this.height, this.tooltipKey] = cfgValue
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

export class IconPanelBackButtonCfg extends BaseButtonCfg {
    constructor() {
        super()
        this.buttonType = 'InterfaceBackButton'
        this.relX = 4
        this.relY = 14
        this.width = 28
        this.height = 28
    }

    setFromValue(cfgValue: [number, number, string, string, string, string]) {
        [this.width, this.height, this.highlightFile, this.pressedFile, this.tooltipText] = cfgValue
    }
}
