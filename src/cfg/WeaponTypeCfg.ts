import { EntityType, getEntityTypeByName } from '../game/model/EntityType'
import { ConfigSetFromRecord } from './Configurable'
import { CfgEntry } from './CfgEntry'

export class WeaponTypeListCfg implements ConfigSetFromRecord {
    smallLazer = new WeaponTypeCfg()
    bigLazer = new WeaponTypeCfg()
    boulder = new WeaponTypeCfg()
    pusher = new WeaponTypeCfg()
    laserShot = new WeaponTypeCfg()
    freezer = new WeaponTypeCfg()
    rockFallIn = new WeaponTypeCfg()

    setFromRecord(cfgValue: CfgEntry): this {
        this.smallLazer.setFromRecord(cfgValue.getRecord('SmallLazer'))
        this.bigLazer.setFromRecord(cfgValue.getRecord('BigLazer'))
        this.boulder.setFromRecord(cfgValue.getRecord('Boulder'))
        this.pusher.setFromRecord(cfgValue.getRecord('Pusher'))
        this.laserShot.setFromRecord(cfgValue.getRecord('LaserShot'))
        this.freezer.setFromRecord(cfgValue.getRecord('Freezer'))
        this.rockFallIn.setFromRecord(cfgValue.getRecord('RockFallIn'))
        return this
    }
}

export class WeaponTypeCfg implements ConfigSetFromRecord {
    readonly damageByEntityType: Partial<Record<EntityType, number[]>> = {}

    defaultDamage: number = 0
    rechargeTime: number = 0
    weaponRange: number = 0
    ammo: number = 0 // 0 = infinite

    wallDestroyTimeHard: number = 0 // Hard Rock
    wallDestroyTimeMedium: number = 0 // Loose Rock
    wallDestroyTimeLoose: number = 0 // Dirt
    dischargeRate: number = 0

    setFromRecord(cfgValue: CfgEntry): this {
        cfgValue.forEachCfgEntryValue((value, key) => {
            const entityType = getEntityTypeByName(key)
            if (entityType) {
                this.damageByEntityType[entityType] = value.toArray(':', undefined).map((v) => v.toNumber())
            }
        })
        this.defaultDamage = cfgValue.getValue('DefaultDamage').toNumber()
        this.rechargeTime = cfgValue.getValue('RechargeTime').toNumber()
        this.weaponRange = cfgValue.getValue('WeaponRange').toNumber()
        this.ammo = cfgValue.getValue('Ammo').toNumber()
        this.wallDestroyTimeHard = cfgValue.getValue('WallDestroyTime_Hard').toNumber()
        this.wallDestroyTimeMedium = cfgValue.getValue('WallDestroyTime_Medium').toNumber()
        this.wallDestroyTimeLoose = cfgValue.getValue('WallDestroyTime_Loose').toNumber()
        this.dischargeRate = cfgValue.getValue('DischargeRate').toNumber()
        return this
    }

    get rechargeTimeMs(): number {
        return this.rechargeTime / 25 * 1000 // 25 = 1 second
    }
}
