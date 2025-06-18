import { ConfigSetFromEntryValue, ConfigSetFromRecord } from './Configurable'
import { CfgEntry, CfgEntryValue } from './CfgEntry'

export class PanelRotationControlCfg implements ConfigSetFromRecord {
    leftImage: PanelRotationControlImageCfg = new PanelRotationControlImageCfg()
    upImage: PanelRotationControlImageCfg = new PanelRotationControlImageCfg()
    rightImage: PanelRotationControlImageCfg = new PanelRotationControlImageCfg()
    downImage: PanelRotationControlImageCfg = new PanelRotationControlImageCfg()

    setFromRecord(cfgValue: CfgEntry): this {
        this.leftImage.setFromValue(cfgValue.getValue('LeftImage'))
        this.upImage.setFromValue(cfgValue.getValue('UpImage'))
        this.rightImage.setFromValue(cfgValue.getValue('RightImage'))
        this.downImage.setFromValue(cfgValue.getValue('DownImage'))
        return this
    }
}

export class PanelRotationControlImageCfg implements ConfigSetFromEntryValue {
    imgHighlight: string = ''
    x: number = 0
    y: number = 0

    setFromValue(cfgValue: CfgEntryValue): this {
        const value = cfgValue.toArray(',', 3)
        this.imgHighlight = value[0].toFileName()
        this.x = value[1].toNumber()
        this.y = value[2].toNumber()
        return this
    }
}
