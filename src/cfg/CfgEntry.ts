import { CfgRecord, CfgValue } from '../resource/fileparser/CfgFileParser'

export class CfgEntry {
    constructor(readonly root: CfgRecord) {
    }

    forEachEntry(callback: (key: string, entry: CfgEntry) => void): void {
        Object.entries(this.root).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                // No warning here, because some like "PausedMenu" has mixture of MenuCount value and records
                return
            }
            callback(key, new CfgEntry(value))
        })
    }

    forEachCfgEntryValue(callback: (value: CfgEntryValue, key: string) => void): void {
        Object.entries(this.root).forEach(([key, value]) => {
            if (!Array.isArray(value)) {
                console.warn(`Unexpected object (${value}) given; expected config values`)
                return
            }
            value.forEach((v) => {
                callback(new CfgEntryValue(String.fromCharCode(...(v))), key)
            })
        })
    }

    getRecordOptional(searchKey: string): CfgEntry | undefined {
        if (!searchKey) throw new Error('No key name given')
        const objKeys = Object.keys(this.root)
        const unifiedSearchKey = CfgEntry.unifyKey(searchKey)
        const key = objKeys.find((k) => CfgEntry.unifyKey(k) === unifiedSearchKey)
        if (!key) return undefined
        const val = (this.root)[key]
        if (val === undefined || val === null) return undefined
        if (Array.isArray(val)) throw new Error(`Unexpected array (${val}) given; expected record object`)
        return new CfgEntry(val)
    }

    getRecord(searchKey: string): CfgEntry {
        const result = this.getRecordOptional(searchKey)
        if (!result) throw new Error(`No value given for key "${searchKey}" in object (${Object.keys(parent)})`)
        return result
    }

    getValue(searchKey: string): CfgEntryValue {
        if (!this?.root) throw new Error('No config entry given')
        if (!searchKey) throw new Error('No key name given')
        if (Array.isArray(this.root)) throw new Error(`Unexpected array (${this}) given; expected record object type`)
        const objKeys = Object.keys(this.root)
        const unifiedSearchKey = CfgEntry.unifyKey(searchKey)
        const key = objKeys.find((k) => CfgEntry.unifyKey(k) === unifiedSearchKey)
        if (!key) return new CfgEntryValue(undefined)
        const val = this.root[key]
        if (val === undefined) return new CfgEntryValue(undefined)
        if (!Array.isArray(val)) throw new Error(`Unexpected value (${val}) given; expected array with values`)
        return new CfgEntryValue(String.fromCharCode(...(val[0]))) // When multiple values given for the same key, we only consider the FIRST one
    }

    private static unifyKey(keyValue: string) {
        // TODO Keys actually case-sensitive (see UpgradeTypes -> SPEED_up for hoverboard VS Speed_Up for small cat
        return keyValue.toString().toLowerCase().replaceAll(/[_-]/g, '')
    }

    findValueByPrefix(searchPrefix: string): CfgEntryValue {
        const result = Object.values(this.root).flatMap((v) => v as CfgValue[]).find((value) => new CfgEntryValue(String.fromCharCode(...(value))).toString().startsWith(searchPrefix))
        if (!result) throw new Error(`No value given with prefix "${searchPrefix}" in (${(Object.values(this.root))})`)
        return new CfgEntryValue(String.fromCharCode(...(result)))
    }
}

export class CfgEntryValue {
    constructor(readonly value: string | undefined) {
    }

    toArray(separator: string, expectedLength: number | undefined, fallback: CfgEntryValue[] = []): CfgEntryValue[] {
        if (this.value === undefined) return fallback
        let value = [this.value]
        for (const sep of separator) {
            value = value.flatMap((s) => s.split(sep))
        }
        if (expectedLength !== undefined && value.length !== expectedLength) throw new Error(`Invalid array value (${value}) with ${value.length} given; expected length of ${expectedLength}`)
        return value.map((v) => new CfgEntryValue(v))
    }

    toString(fallback: string = ''): string {
        if (this.value === undefined) return fallback
        if (this.value.toLowerCase() === 'null') return ''
        return this.value
    }

    toLabel(fallback: string = ''): string {
        if (this.value === undefined) return fallback
        return this.value.replace(/_/g, ' ')
    }

    toNumber(fallback: number = 0): number {
        if (this.value === undefined) return fallback
        const result = Number(this.value)
        if (isNaN(result)) throw new Error(`Invalid value (${this.value}) given; expected number value`)
        return result
    }

    toFileName(fallback: string = ''): string {
        if (this.value === undefined) return fallback
        if (this.value.toLowerCase() === 'null') return ''
        return this.value.replaceAll('\\', '/')
    }

    toBoolean(fallback: boolean = false): boolean {
        if (this.value === undefined) return fallback
        const strVal = this.value.toLowerCase()
        if (strVal === 'yes' || strVal === 'true') {
            return true
        } else if (strVal === 'no' || strVal === 'false') {
            return false
        } else {
            throw new Error(`Invalid value (${strVal}) given; expected boolean`)
        }
    }

    toLevelReference(fallback: string = ''): string {
        if (this.value === undefined) return fallback
        if (!this.value.toLowerCase().startsWith('Levels::'.toLowerCase())) throw new Error(`Invalid level reference (${(this.value)}) given; expected to start with "Levels::"`)
        // XXX Assert level reference actually exists
        return this.value.slice('Levels::'.length)
    }

    toTextureSet(fallback: string = ''): string {
        if (this.value === undefined) return fallback
        const value = this.toString()
        if (!value.toLowerCase().startsWith('Textures::'.toLowerCase())) throw new Error(`Invalid texture set (${value}) given; expected to start with "Textures::"`)
        // XXX Assert texture set reference actually exists
        return value.slice('Textures::'.length)
    }

    toRGB(fallback: [r: number, g: number, b: number] = [0, 0, 0]): [r: number, g: number, b: number] {
        if (this.value === undefined) return fallback
        return this.toArray(':', 3).map((n) => Math.max(0, Math.min(255, n.toNumber())) / 255) as [number, number, number]
    }

    toPos(separator: string, fallback: { x: number, y: number } = {x: 0, y: 0}): { x: number, y: number } {
        if (this.value === undefined) return fallback
        const [x, y] = this.toArray(separator, 2).map((v) => v.toNumber())
        return {x: x, y: y}
    }
}
