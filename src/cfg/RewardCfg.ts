import { BaseConfig } from './BaseConfig'

export class RewardCfg extends BaseConfig {
    display: boolean = true
    wallpaper: string = ''
    images: RewardImageCfg[] = []
    texts: RewardTextCfg[] = []
    boxImages: RewardImageCfg[] = []
    fonts: RewardFontsCfg = null
    flics: { flhFilepath: string, x: number, y: number, w: number, h: number } = null
    scrollSpeed: number = 0
    centreText: boolean = false
    vertSpacing: number = 0
    backFont: string = ''
    font: string = ''
    titleFont: string = ''
    timer: number = 0
    saveButton: string[] = []
    advanceButton: string[] = []
    completeText: string = ''
    failedText: string = ''
    quitText: string = ''
    textPos: [number, number] = [0, 0]

    assignValue(objKey: string, unifiedKey: string, cfgValue: any): boolean {
        if (unifiedKey === 'images') {
            Object.values(cfgValue).forEach((imgConf) => this.images.push(new RewardImageCfg(imgConf)))
            return true
        } else if (unifiedKey === 'text') {
            Object.values(cfgValue).forEach((imgConf) => this.texts.push(new RewardTextCfg(imgConf)))
            return true
        } else if (unifiedKey === 'boximages') {
            Object.values(cfgValue).forEach((imgConf) => this.boxImages.push(new RewardImageCfg(imgConf)))
            return true
        } else if (unifiedKey === 'fonts') {
            this.fonts = new RewardFontsCfg().setFromCfgObj(cfgValue)
            return true
        } else {
            return super.assignValue(objKey, unifiedKey, cfgValue)
        }
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
