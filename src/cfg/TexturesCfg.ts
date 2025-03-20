import { BaseConfig } from './BaseConfig'
import { CfgHelper } from './CfgHelper'

export class TexturesCfg extends BaseConfig {
    textureSetByName: Record<string, TextureEntryCfg> = {}

    setFromCfgObj(cfgObj: any): this {
        Object.keys(cfgObj).forEach((levelName) => {
            const textureEntryCfg = new TextureEntryCfg()
            textureEntryCfg.setFromValue(cfgObj[levelName])
            this.textureSetByName[levelName.toLowerCase()] = textureEntryCfg
        })
        return this
    }
}

export class TextureEntryCfg {
    roofTexture: string = ''
    surfTextWidth: number = 8
    surfTextHeight: number = 8
    meshBasename: string = ''
    textureBasename: string = ''

    setFromValue(cfgValue: Record<string, string | number>): void {
        this.roofTexture = CfgHelper.assertString(CfgHelper.getValue(cfgValue, 'roofTexture'))
        this.surfTextWidth = CfgHelper.assertNumber(CfgHelper.getValue(cfgValue, 'surfTextWidth'))
        this.surfTextHeight = CfgHelper.assertNumber(CfgHelper.getValue(cfgValue, 'surfTextHeight'))
        this.meshBasename = CfgHelper.assertString(CfgHelper.getValue(cfgValue, 'meshBasename'))
        this.textureBasename = CfgHelper.assertString(CfgHelper.getValue(cfgValue, 'textureBasename'))
    }
}
