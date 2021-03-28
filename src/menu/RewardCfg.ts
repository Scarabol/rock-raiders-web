export class RewardCfg {

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
    saveButton: any = ''
    advanceButton: any = ''
    completeText: string = ''
    failedText: string = ''
    quitText: string = ''
    textPos: [number, number] = [0, 0]

    constructor(cfgObj: any) {
        Object.keys(cfgObj).forEach((cfgKey) => {
            const cfgKeyname = (cfgKey.startsWith('!') ? cfgKey.substring(1) : cfgKey).toLowerCase()
            const found = Object.keys(this).some((objKey) => {
                if (cfgKeyname === 'images') {
                    Object.values(cfgObj[cfgKey]).forEach((imgConf) => this.images.push(new RewardImageCfg(imgConf)))
                    return true
                } else if (cfgKeyname === 'text') {
                    Object.values(cfgObj[cfgKey]).forEach((imgConf) => this.texts.push(new RewardTextCfg(imgConf)))
                    return true
                } else if (cfgKeyname === 'boximages') {
                    Object.values(cfgObj[cfgKey]).forEach((imgConf) => this.boxImages.push(new RewardImageCfg(imgConf)))
                    return true
                } else if (cfgKeyname === 'fonts') {
                    this.fonts = new RewardFontsCfg(cfgObj[cfgKey])
                    return true
                } else if (objKey.toLowerCase() === cfgKeyname) {
                    this[objKey] = cfgObj[cfgKey]
                    return true
                }
            })
            if (!found) {
                console.warn('cfg key does not exist on menu full config: ' + cfgKey)
            }
        })
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

export class RewardFontsCfg {

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

    constructor(cfgObj: any) {
        Object.keys(cfgObj).forEach((cfgKey) => {
            const cfgKeyname = (cfgKey.startsWith('!') ? cfgKey.substring(1) : cfgKey).toLowerCase()
            const found = Object.keys(this).some((objKey) => {
                if (objKey.toLowerCase() === cfgKeyname) {
                    this[objKey] = cfgObj[cfgKey]
                    return true
                }
            })
            if (!found) {
                console.warn('cfg key does not exist on menu full config: ' + cfgKey)
            }
        })
    }

}
