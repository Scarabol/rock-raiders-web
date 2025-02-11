import { BaseConfig } from './BaseConfig'

export class SamplesCfg extends BaseConfig {
    readonly pathToSfxKeys: Map<string, string[]> = new Map()

    unifyKey(cfgKey: string): string {
        if (cfgKey.startsWith('!')) cfgKey = cfgKey.slice(1) // XXX no clue what this means... loop? duplicate?!
        return cfgKey.toLowerCase()
    }

    assignValue(objKey: string, unifiedKey: string, cfgValue: any): boolean {
        const sndFilePaths: string[] = Array.isArray(cfgValue) ? cfgValue : [cfgValue]
        sndFilePaths.forEach((sndPath) => {
            if (sndPath.startsWith('*') || // XXX no clue what this means... don't loop maybe, see teleportup
                sndPath.startsWith('@')) {
                sndPath = sndPath.slice(1)
            }
            this.pathToSfxKeys.getOrUpdate(`${sndPath.toLowerCase()}.wav`, () => []).push(unifiedKey)
        })
        return true
    }
}
