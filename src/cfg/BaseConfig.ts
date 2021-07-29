export class BaseConfig {
    static setFromCfg(config: BaseConfig, cfgObj: any) {
        Object.keys(cfgObj).forEach((cfgKey) => {
            const lCfgKeyName = (cfgKey.startsWith('!') ? cfgKey.substring(1) : cfgKey)
                .toLowerCase()
                .replace(/_/g, '') // Activity_Stand
                .replace(/-/g, '') // Geo-dome
            const found = Object.keys(config).some((objKey) => {
                return config.assignValue(objKey, lCfgKeyName, cfgObj[cfgKey])
            })
            if (!found) {
                console.warn(`cfg key: ${cfgKey} does not exist in cfg: ${config?.constructor?.name}`)
            }
        })
        return config
    }

    assignValue(objKey, lCfgKeyName, cfgValue): boolean {
        if (objKey.toLowerCase() === lCfgKeyName) {
            const currentValue = this[objKey]
            const currentIsArray = Array.isArray(currentValue)
            let parsedValue = this.parseValue(lCfgKeyName, cfgValue)
            const parsedIsArray = Array.isArray(parsedValue)
            if (currentValue && currentIsArray !== parsedIsArray) {
                if (currentIsArray) {
                    parsedValue = [parsedValue]
                    // } else {
                    //     console.warn(`Array overwrite conflict for key ${objKey} with existing value (${currentValue}) and new value (${parsedValue})`)
                }
            }
            this[objKey] = parsedValue
            return true
        }
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        return cfgValue
    }
}
