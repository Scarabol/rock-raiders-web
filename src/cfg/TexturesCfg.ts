import { ConfigSetFromRecord } from './Configurable'
import { CfgEntry } from './CfgEntry'

export class TexturesCfg implements ConfigSetFromRecord {
    textureSetByName: Record<string, TextureEntryCfg> = {}

    setFromRecord(cfgValue: CfgEntry): this {
        cfgValue.forEachEntry((levelName, entry) => {
            this.textureSetByName[levelName.toLowerCase()] = new TextureEntryCfg().setFromRecord(entry)
        })
        return this
    }
}

export class TextureEntryCfg implements ConfigSetFromRecord {
    roofTexture: string = ''
    surfTextWidth: number = 8
    surfTextHeight: number = 8
    meshBasename: string = ''
    textureBasename: string = ''

    setFromRecord(cfgValue: CfgEntry): this {
        this.roofTexture = cfgValue.getValue('roofTexture').toFileName()
        this.surfTextWidth = cfgValue.getValue('surfTextWidth').toNumber()
        this.surfTextHeight = cfgValue.getValue('surfTextHeight').toNumber()
        this.meshBasename = cfgValue.getValue('meshBasename').toFileName()
        this.textureBasename = cfgValue.getValue('textureBasename').toFileName()
        return this
    }
}
