import { ConfigSetFromRecord } from './Configurable'
import { CfgEntry } from './CfgEntry'

export class SamplesCfg implements ConfigSetFromRecord {
    readonly pathToSfxKeys: Record<string, string[]> = {}

    setFromRecord(cfgVal: CfgEntry): this {
        cfgVal.forEachCfgEntryValue((value, key) => {
            value.toArray(',', undefined).map((v) => {
                let sndPath = v.toFileName()
                if (sndPath.startsWith('*') || // XXX no clue what this means... don't loop maybe, see teleportup
                    sndPath.startsWith('@')) {
                    sndPath = sndPath.slice(1)
                }
                this.pathToSfxKeys[`${sndPath.toLowerCase()}.wav`] = this.pathToSfxKeys[`${sndPath.toLowerCase()}.wav`] || []
                this.pathToSfxKeys[`${sndPath.toLowerCase()}.wav`].push(key.toLowerCase())
            })
        })
        return this
    }
}
