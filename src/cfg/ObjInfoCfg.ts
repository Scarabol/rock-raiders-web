import { ConfigSetFromRecord } from './Configurable'
import { CfgEntry } from './CfgEntry'

export class ObjInfoCfg implements ConfigSetFromRecord {
    healthBarPosition: { x: number, y: number } = {x: 0, y: 0}
    healthBarWidthHeight: { x: number, y: number } = {x: 0, y: 0}
    healthBarBorderSize: number = 0
    healthBarBorderRGB: number[] = [0, 0, 0]
    healthBarBackgroundRGB: number[] = [0, 0, 0]
    healthBarRGB: number[] = [0, 0, 0]
    hungerImagesPosition: { x: number, y: number } = {x: 0, y: 0}
    hungerImages: HungerImageCfg = new HungerImageCfg()
    upgradeImagePosition: { x: number, y: number } = {x: 0, y: 0}
    bubbleImagesPosition: { x: number, y: number } = {x: 0, y: 0}

    setFromRecord(cfgValue: CfgEntry): this {
        this.healthBarPosition = cfgValue.getValue('HealthBarPosition').toPos(':')
        this.healthBarWidthHeight = cfgValue.getValue('HealthBarWidthHeight').toPos(':')
        this.healthBarBorderSize = cfgValue.getValue('HealthBarBorderSize').toNumber()
        this.healthBarBorderRGB = cfgValue.getValue('HealthBarBorderRGB').toRGB()
        this.healthBarBackgroundRGB = cfgValue.getValue('HealthBarBackgroundRGB').toRGB()
        this.healthBarRGB = cfgValue.getValue('HealthBarRGB').toRGB()
        this.hungerImagesPosition = cfgValue.getValue('HungerImagesPosition').toPos(':')
        this.hungerImages.setFromRecord(cfgValue.getRecord('HungerImages'))
        this.upgradeImagePosition = cfgValue.getValue('UpgradeImagePosition').toPos(':')
        this.bubbleImagesPosition = cfgValue.getValue('BubbleImagesPosition').toPos(':')
        return this
    }
}

export class HungerImageCfg implements ConfigSetFromRecord {
    hungerImage0: string = ''
    hungerImage1: string = ''
    hungerImage2: string = ''
    hungerImage3: string = ''
    hungerImage4: string = ''

    setFromRecord(cfgValue: CfgEntry): this {
        this.hungerImage0 = cfgValue.getValue('HungerImage0').toFileName()
        this.hungerImage1 = cfgValue.getValue('HungerImage1').toFileName()
        this.hungerImage2 = cfgValue.getValue('HungerImage2').toFileName()
        this.hungerImage3 = cfgValue.getValue('HungerImage3').toFileName()
        this.hungerImage4 = cfgValue.getValue('HungerImage4').toFileName()
        return this
    }
}
