import { BaseConfig } from './BaseConfig'

export class ObjInfoCfg extends BaseConfig {
    healthBarPosition: number[] = [0, 0]
    healthBarWidthHeight: number[] = [0, 0]
    healthBarBorderSize: number = 0
    healthBarBorderRGB: number[] = [0, 0, 0]
    healthBarBackgroundRGB: number[] = [0, 0, 0]
    healthBarRGB: number[] = [0, 0, 0]
    hungerImagesPosition: number[] = [0, 0]
    hungerImages: HungerImageCfg = new HungerImageCfg()
    upgradeImagePosition: number[] = [0, 0]
    bubbleImagesPosition: number[] = [0, 0]

    parseValue(unifiedKey: string, cfgValue: any): any {
        if (unifiedKey === 'hungerimages') {
            return this.hungerImages.setFromCfgObj(cfgValue)
        }
        return super.parseValue(unifiedKey, cfgValue)
    }
}

export class HungerImageCfg extends BaseConfig {
    hungerImage0: string = ''
    hungerImage1: string = ''
    hungerImage2: string = ''
    hungerImage3: string = ''
    hungerImage4: string = ''
}
