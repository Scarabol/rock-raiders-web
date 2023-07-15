import { BaseConfig } from './BaseConfig'
import { EntityType, getEntityTypeByName } from '../game/model/EntityType'

export class WeaponTypeCfg extends BaseConfig {
    readonly damageByEntityType: Map<EntityType, number[]> = new Map()

    slowDeath: number[] = []
    defaultDamage: number = 0
    rechargeTimeMs: number = 0
    weaponRange: number = 0
    ammo: number = 0 // 0 = infinite

    wallDestroyTimeHard: number = 0 // Hard Rock
    wallDestroyTimeMedium: number = 0 // Loose Rock
    wallDestroyTimeLoose: number = 0 // Dirt
    dischargeRate: number = 0

    assignValue(objKey: string, unifiedKey: string, cfgValue: any): boolean {
        if (unifiedKey.equalsIgnoreCase('RechargeTime')) {
            this.rechargeTimeMs = isNaN(cfgValue) ? cfgValue : cfgValue / 25 * 1000 // 25 = 1 second
            return true
        } else if (unifiedKey.equalsIgnoreCase('DefaultDamage')) {
            const firstValue = Array.isArray(cfgValue) ? cfgValue[0] : cfgValue // XXX Numbers like 0.01 are given as array
            return super.assignValue(objKey, unifiedKey, firstValue)
        } else {
            const entityType = getEntityTypeByName(unifiedKey)
            if (entityType) {
                this.damageByEntityType.set(entityType, cfgValue as number[])
                return true
            }
            return super.assignValue(objKey, unifiedKey, cfgValue)
        }
    }
}
