import { AbstractGameComponent } from '../ECS'
import { WeaponTypeCfg } from '../../cfg/WeaponTypeCfg'

export class LaserBeamTurretComponent extends AbstractGameComponent {
    fireDelay: number = 0

    constructor(readonly weaponCfg: WeaponTypeCfg) {
        super()
    }
}
