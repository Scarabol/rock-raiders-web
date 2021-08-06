export class BaseConfig {
    setFromCfgObj(cfgObj: any): this {
        Object.entries(cfgObj).forEach(([cfgKey, value]) => {
            const unifiedKey = BaseConfig.unifyKey(cfgKey)
            const found = Object.keys(this).some((objKey) => {
                return this.assignValue(objKey, unifiedKey, value)
            })
            if (!found) {
                console.warn(`cfg key: ${cfgKey} does not exist in cfg: ${this?.constructor?.name}`)
            }
        })
        return this
    }

    static unifyKey(cfgKey: string): string {
        return (cfgKey.startsWith('!') ? cfgKey.substring(1) : cfgKey)
            .replace(/_/g, '') // Activity_Stand
            .replace(/-/g, '') // Geo-dome
            .toLowerCase()
    }

    assignValue(objKey, unifiedKey, cfgValue): boolean {
        if (objKey.toLowerCase() !== unifiedKey) return false
        const currentValue = this[objKey]
        const currentIsArray = Array.isArray(currentValue)
        let parsedValue = this.parseValue(unifiedKey, cfgValue)
        const parsedIsArray = Array.isArray(parsedValue)
        if (currentValue && currentIsArray !== parsedIsArray) {
            if (currentIsArray) {
                parsedValue = [parsedValue]
            } else {
                console.warn(`Array overwrite conflict for key ${objKey} with existing value (${currentValue}) and new value (${parsedValue})`)
            }
        }
        this[objKey] = parsedValue
        return true
    }

    parseValue(unifiedKey: string, cfgValue: any): any {
        return cfgValue
    }
}
