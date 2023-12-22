import { BaseConfig } from './BaseConfig'
import { VERBOSE } from '../params'

export class SamplesCfg extends BaseConfig {
    readonly pathToSfxKeys: Map<string, string[]> = new Map()

    unifyKey(cfgKey: string): string {
        if (cfgKey.startsWith('!')) cfgKey = cfgKey.slice(1) // XXX no clue what this means... loop? duplicate?!
        return cfgKey.toLowerCase()
    }

    assignValue(objKey: string, unifiedKey: string, cfgValue: any): boolean {
        const sndFilePaths: string[] = Array.isArray(cfgValue) ? cfgValue : [cfgValue]
        sndFilePaths.map((sndPath) => {
            if (sndPath.startsWith('*') || // XXX no clue what this means... don't loop maybe, see teleportup
                sndPath.startsWith('@')) {
                sndPath = sndPath.slice(1)
            }
            return `${sndPath}.wav`
        }).forEach(sndPath => this.pathToSfxKeys.getOrUpdate(sndPath, () => []).push(unifiedKey))
        return true
    }
}
