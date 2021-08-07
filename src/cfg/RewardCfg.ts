import { BaseConfig } from './BaseConfig'

export class RewardCfg extends BaseConfig {
    display: boolean = true
    wallpaper: string = ''
    images: RewardImageCfg[] = []
    text: RewardTextCfg[] = []
    boxImages: RewardImageCfg[] = []
    fonts: RewardFontsCfg = new RewardFontsCfg()
    flics: { flhFilepath: string, x: number, y: number, w: number, h: number } = null
    scrollSpeed: number = 0
    centreText: boolean = false
    vertSpacing: number = 0
    backFont: string = ''
    font: string = ''
    titleFont: string = ''
    timer: number = 0
    saveButton: RewardButtonCfg = new RewardButtonCfg()
    advanceButton: RewardButtonCfg = new RewardButtonCfg()
    completeText: string = ''
    failedText: string = ''
    quitText: string = ''
    textPos: [number, number] = [0, 0]

    assignValue(objKey: string, unifiedKey: string, cfgValue: any): boolean {
        if (objKey.toLowerCase() !== unifiedKey) return false
        if (unifiedKey === 'images') {
            Object.values(cfgValue).forEach((imgConf) => this.images.push(new RewardImageCfg(imgConf)))
        } else if (unifiedKey === 'text') {
            Object.values(cfgValue).forEach((imgConf) => this.text.push(new RewardTextCfg(imgConf)))
        } else if (unifiedKey === 'boximages') {
            Object.values(cfgValue).forEach((imgConf) => this.boxImages.push(new RewardImageCfg(imgConf)))
        } else if (unifiedKey === 'fonts') {
            this.fonts.setFromCfgObj(cfgValue)
        } else if (unifiedKey === 'savebutton') {
            this.saveButton.setFromCfgObj(cfgValue)
        } else if (unifiedKey === 'advancebutton') {
            this.advanceButton.setFromCfgObj(cfgValue)
        } else {
            return super.assignValue(objKey, unifiedKey, cfgValue)
        }
        return true
    }
}

export class RewardImageCfg {
    filePath: string = ''
    x: number = 0
    y: number = 0

    constructor(cfgObj: any) {
        [this.filePath, this.x, this.y] = cfgObj
    }
}

export class RewardTextCfg {
    text: string = ''
    x: number = 0
    y: number = 0

    constructor(cfgObj: any) {
        [this.text, this.x, this.y] = cfgObj
    }
}

export class RewardFontsCfg extends BaseConfig {
    crystals: string = ''
    ore: string = ''
    diggable: string = ''
    constructions: string = ''
    caverns: string = ''
    figures: string = ''
    rockMonsters: string = ''
    oxygen: string = ''
    timer: string = ''
    score: string = ''
}

export class RewardButtonCfg extends BaseConfig {
    imgNormalFilepath: string = null
    imgHoverFilepath: string = null
    imgPressedFilepath: string = null
    imgDisabledFilepath: string = null
    x: number = 0
    y: number = 0

    setFromCfgObj(cfgObj: any, createMissing: boolean = false): this {
        if (!Array.isArray(cfgObj) || cfgObj.length !== 6) {
            throw new Error(`Invalid number of args given: ${cfgObj}`)
        }
        [this.imgNormalFilepath, this.imgHoverFilepath, this.imgPressedFilepath, this.imgDisabledFilepath, this.x, this.y] = cfgObj
        return this
    }
}
