export class CfgHelper {
    static parseLabel(label?: string[] | string): string {
        if (!label) return ''
        const result = Array.isArray(label) ? label.join(',') : this.assertString(label) // cfg parser does split(',')
        return result.replace(/_/g, ' ')
    }

    static getValue<T>(cfgValue: Record<string, unknown>, keyName: string, fallback?: T): T {
        if (!cfgValue) throw new Error('No config value given')
        if (!keyName) throw new Error('No key name given')
        const objKeys = Object.keys(cfgValue)
        const lKeyName = keyName.toLowerCase()
        const key = objKeys.find((k) => k.toLowerCase().replaceAll(/[_-]/g, '').endsWith(lKeyName))
        if (!key) {
            if (fallback !== undefined && fallback !== null) return fallback
            throw new Error(`Could not find key "${keyName}" in object (${objKeys})`)
        }
        const val = cfgValue[key]
        if (!val) {
            if (fallback !== undefined && fallback !== null) return fallback
            throw new Error(`No value given for key "${keyName}"`)
        }
        return val as T
    }

    static assertString(value: unknown): string {
        if (typeof value === 'string' || value instanceof String) return value as string
        throw new Error(`Invalid value (${value}) given`)
    }

    static assertNumber(value: unknown): number {
        if (isNaN(value as number)) throw new Error(`Invalid value (${value}) given`)
        return value as number
    }
}
