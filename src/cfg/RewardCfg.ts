import { Rect } from '../core/Rect'
import { DEV_MODE } from '../params'
import { ConfigSetFromEntryValue, ConfigSetFromRecord } from './Configurable'
import { CfgEntry, CfgEntryValue } from './CfgEntry'

export class RewardCfg implements ConfigSetFromRecord {
    display: boolean = true
    wallpaper: string = ''
    images: RewardImageCfg[] = []
    text: RewardTextCfg[] = []
    boxImages: RewardImageCfg[] = []
    fonts: RewardFontsCfg = new RewardFontsCfg()
    flics: Record<string, { flhFilepath: string, rect: Rect }> = {}
    scrollSpeed: number = 0
    centerText: boolean = false
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
    textPos: { x: number, y: number } = {x: 0, y: 0}

    setFromRecord(cfgValue: CfgEntry): this {
        this.display = cfgValue.getValue('Display').toBoolean()
        this.wallpaper = cfgValue.getValue('Wallpaper').toFileName()
        cfgValue.getRecord('Images').forEachCfgEntryValue((value) => ((imgConf) => {
            this.images.push(new RewardImageCfg().setFromValue(imgConf))
        })(value))
        cfgValue.getRecord('Text').forEachCfgEntryValue((value) => ((imgConf) => {
            this.text.push(new RewardTextCfg().setFromValue(imgConf))
        })(value))
        cfgValue.getRecord('BoxImages').forEachCfgEntryValue((value) => ((imgConf) => {
            this.boxImages.push(new RewardImageCfg().setFromValue(imgConf))
        })(value))
        this.fonts.setFromRecord(cfgValue.getRecord('Fonts'))
        cfgValue.getRecord('Flics').forEachCfgEntryValue((value, cfgKey) => {
            const array = value.toArray('|', 5)
            const nums = array.slice(1).map((v) => v.toNumber())
            this.flics[cfgKey.toLowerCase()] = {flhFilepath: array[0].toFileName(), rect: Rect.fromArray(nums)}
        })
        this.scrollSpeed = cfgValue.getValue('ScrollSpeed').toNumber()
        this.centerText = cfgValue.getValue('CenterText').toBoolean() // typo "centre" in original config with value false
        this.vertSpacing = cfgValue.getValue('VertSpacing').toNumber()
        this.backFont = cfgValue.getValue('BackFont').toFileName()
        this.font = cfgValue.getValue('Font').toFileName()
        this.titleFont = cfgValue.getValue('TitleFont').toFileName()
        this.timer = cfgValue.getValue('Timer').toNumber()
        this.saveButton.setFromValue(cfgValue.getValue('SaveButton'))
        this.advanceButton.setFromValue(cfgValue.getValue('AdvanceButton'))
        this.completeText = cfgValue.getValue('CompleteText').toLabel()
        this.failedText = cfgValue.getValue('FailedText').toLabel()
        this.quitText = cfgValue.getValue('QuitText').toLabel()
        this.textPos = cfgValue.getValue('TextPos').toPos('|')
        return this
    }

    get timerMs(): number {
        return Math.round(this.timer * (DEV_MODE ? 100 : 1000))
    }
}

export class RewardImageCfg implements ConfigSetFromEntryValue {
    filePath: string = ''
    x: number = 0
    y: number = 0

    setFromValue(cfgValue: CfgEntryValue): this {
        const array = cfgValue.toArray('|', 3)
        this.filePath = array[0].toFileName()
        this.x = array[1].toNumber()
        this.y = array[2].toNumber()
        return this
    }
}

export class RewardTextCfg implements ConfigSetFromEntryValue {
    text: string = ''
    x: number = 0
    y: number = 0

    setFromValue(cfgValue: CfgEntryValue): this {
        const array = cfgValue.toArray('|{', 3) // Czech translation uses | and { as separator in same value // XXX Endianness issue?
        this.text = array[0].toLabel()
        this.x = array[1].toNumber()
        this.y = array[2].toNumber()
        return this
    }
}

export class RewardFontsCfg implements ConfigSetFromRecord {
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

    setFromRecord(cfgValue: CfgEntry): this {
        this.crystals = cfgValue.getValue('Crystals').toFileName()
        this.ore = cfgValue.getValue('Ore').toFileName()
        this.diggable = cfgValue.getValue('Diggable').toFileName()
        this.constructions = cfgValue.getValue('Constructions').toFileName()
        this.caverns = cfgValue.getValue('Caverns').toFileName()
        this.figures = cfgValue.getValue('Figures').toFileName()
        this.rockMonsters = cfgValue.getValue('RockMonsters').toFileName()
        this.oxygen = cfgValue.getValue('Oxygen').toFileName()
        this.timer = cfgValue.getValue('Timer').toFileName()
        this.score = cfgValue.getValue('Score').toFileName()
        return this
    }
}

export class RewardButtonCfg implements ConfigSetFromEntryValue {
    imgNormalFilepath: string = ''
    imgHoverFilepath: string = ''
    imgPressedFilepath: string = ''
    imgDisabledFilepath: string = ''
    x: number = 0
    y: number = 0

    setFromValue(cfgValue: CfgEntryValue): this {
        const value = cfgValue.toArray('|', 6)
        this.imgNormalFilepath = value[0].toFileName()
        this.imgHoverFilepath = value[1].toFileName()
        this.imgPressedFilepath = value[2].toFileName()
        this.imgDisabledFilepath = value[3].toFileName()
        this.x = value[4].toNumber()
        this.y = value[5].toNumber()
        return this
    }
}
