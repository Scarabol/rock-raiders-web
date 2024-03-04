import { AbstractGameComponent } from '../ECS'
import { WeaponTypeCfg } from '../../cfg/WeaponTypesCfg'

export class LaserBeamTurretComponent extends AbstractGameComponent {
    fireDelay: number = 0

    constructor(readonly weaponCfg: WeaponTypeCfg) {
        super()
    }
}
