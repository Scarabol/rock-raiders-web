export class BaseConfig {

    static setFromCfg(config: BaseConfig, cfgObj: any) {
        Object.keys(cfgObj).forEach((cfgKey) => {
            const lCfgKeyName = (cfgKey.startsWith('!') ? cfgKey.substring(1) : cfgKey).toLowerCase()
            const found = Object.keys(config).some((objKey) => {
                return config.assignValue(objKey, lCfgKeyName, cfgObj[cfgKey])
            })
            if (!found) {
                console.warn('cfg key does not exist: ' + cfgKey)
            }
        })
        return config
    }

    assignValue(objKey, lCfgKeyName, cfgValue): boolean {
        if (objKey.toLowerCase() === lCfgKeyName) {
            this[objKey] = this.parseValue(lCfgKeyName, cfgValue)
            return true
        }
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        return cfgValue
    }

    parseLabel(cfgValue) {
        return cfgValue.replace(/_/g, ' ')
    }

}
