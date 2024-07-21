import { parseLabel } from './CfgHelper'

export class BaseButtonCfg {
    buttonType?: string
    normalFile?: string
    highlightFile?: string
    pressedFile?: string
    disabledFile?: string
    relX?: number
    relY?: number
    width?: number
    height?: number
    tooltipKey?: string
    tooltipText?: string
    tooltipSfx?: string
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
    constructor(cfgValue: any) {
        super();
        [this.width, this.height, this.highlightFile, this.pressedFile, this.tooltipText] = cfgValue // Interface back button
        this.relX = 4
        this.relY = 14
    }
}

export class MenuItemCfg extends BaseButtonCfg {
    tooltipDisabled?: string
    tooltipDisabledSfx?: string
    hotkey?: string

    constructor(cfgValue: any) {
        super()
        let hotkeyName: string | undefined
        if (cfgValue.length === 4) {
            [this.normalFile, this.disabledFile, this.pressedFile, hotkeyName] = cfgValue
        } else if (cfgValue.length === 6 || cfgValue.length === 7) { // XXX 7th element is boolean, but usage unknown
            let tooltip: string | undefined, tooltipDisabled: string | undefined
            ;[this.normalFile, this.disabledFile, this.pressedFile, tooltip, tooltipDisabled, hotkeyName] = cfgValue
            ;[this.tooltipText, this.tooltipSfx] = Array.ensure(tooltip)
            ;[this.tooltipDisabled, this.tooltipDisabledSfx] = Array.ensure(tooltipDisabled)
            this.tooltipText = parseLabel(this.tooltipText)
            this.tooltipDisabled = parseLabel(this.tooltipDisabled)
        } else {
            console.error(`Unexpected menu item cfg value length: ${cfgValue.length}`)
        }
        this.width = 40
        this.height = 40
        this.hotkey = this.keyNameToKey(hotkeyName)
    }

    private keyNameToKey(hotkeyName?: string): string {
        if ('KEY_ONE'.equalsIgnoreCase(hotkeyName)) {
            return '1'
        } else if ('KEY_TWO'.equalsIgnoreCase(hotkeyName)) {
            return '2'
        } else if ('KEY_THREE'.equalsIgnoreCase(hotkeyName)) {
            return '3'
        } else if ('KEY_FOUR'.equalsIgnoreCase(hotkeyName)) {
            return '4'
        } else if ('KEY_FIVE'.equalsIgnoreCase(hotkeyName)) {
            return '5'
        } else if ('KEY_SIX'.equalsIgnoreCase(hotkeyName)) {
            return '6'
        } else if ('KEY_SEVEN'.equalsIgnoreCase(hotkeyName)) {
            return '7'
        } else if ('KEY_EIGHT'.equalsIgnoreCase(hotkeyName)) {
            return '8'
        } else if ('KEY_NINE'.equalsIgnoreCase(hotkeyName)) {
            return '9'
        } else if ('KEY_ZERO'.equalsIgnoreCase(hotkeyName)) {
            return '0'
        } else if ('KEY_MINUS'.equalsIgnoreCase(hotkeyName)) {
            return '-'
        } else if ('KEY_EQUALS'.equalsIgnoreCase(hotkeyName)) {
            return '='
        } else {
            const hotkeyMatch = hotkeyName?.match(/^KEY_([A-Z])$/i)
            if (hotkeyMatch) {
                return hotkeyMatch[1].toLowerCase()
            } else if (hotkeyName) {
                console.warn(`Given hotkey '${hotkeyName}' does not match with pattern`)
            }
        }
        return ''
    }
}
