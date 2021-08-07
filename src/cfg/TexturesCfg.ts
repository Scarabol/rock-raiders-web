import { BaseConfig } from './BaseConfig'

export class TexturesCfg extends BaseConfig {
    textureSetByName: Map<string, TextureEntryCfg> = new Map()

    setFromCfgObj(cfgObj: any): this {
        Object.keys(cfgObj).forEach((levelKey) => {
            this.textureSetByName.set(levelKey.toLowerCase(), new TextureEntryCfg().setFromCfgObj(cfgObj[levelKey]))
        })
        return this
    }
}

export class TextureEntryCfg extends BaseConfig {
    roofTexture: string = null
    surfTextWidth: number = 8
    surfTextHeight: number = 8
    meshBasename: string = null
    textureBasename: string = null
}
