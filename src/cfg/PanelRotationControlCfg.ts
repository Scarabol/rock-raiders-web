import { BaseConfig } from './BaseConfig'

export class PanelRotationControlCfg extends BaseConfig {
    centerPositionX: number = 484
    centerPositionY: number = 445
    radius: number = 30
    leftImage: PanelRotationControlImageCfg = new PanelRotationControlImageCfg()
    upImage: PanelRotationControlImageCfg = new PanelRotationControlImageCfg()
    rightImage: PanelRotationControlImageCfg = new PanelRotationControlImageCfg()
    downImage: PanelRotationControlImageCfg = new PanelRotationControlImageCfg()

    assignValue(objKey: string, unifiedKey: string, cfgValue: any): boolean {
        if ('LeftImage'.equalsIgnoreCase(unifiedKey)) {
            this.leftImage.setFromCfgObj(cfgValue)
        } else if ('UpImage'.equalsIgnoreCase(unifiedKey)) {
            this.upImage.setFromCfgObj(cfgValue)
        } else if ('RightImage'.equalsIgnoreCase(unifiedKey)) {
            this.rightImage.setFromCfgObj(cfgValue)
        } else if ('DownImage'.equalsIgnoreCase(unifiedKey)) {
            this.downImage.setFromCfgObj(cfgValue)
        } else {
            return super.assignValue(objKey, unifiedKey, cfgValue)
        }
        return true
    }
}

export class PanelRotationControlImageCfg extends BaseConfig {
    imgHighlight?: string
    x: number = 0
    y: number = 0

    setFromCfgObj(cfgObj: any, createMissing: boolean = false): this {
        [this.imgHighlight, this.x, this.y] = cfgObj
        return this
    }
}
