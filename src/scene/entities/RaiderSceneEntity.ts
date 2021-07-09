import { BaseActivity } from '../../game/model/activities/BaseActivity'
import { RaiderActivity } from '../../game/model/activities/RaiderActivity'
import { FulfillerSceneEntity } from './FulfillerSceneEntity'

export class RaiderSceneEntity extends FulfillerSceneEntity {

    getDefaultActivity(): BaseActivity {
        return this.carriedEntity ? RaiderActivity.CarryStand : super.getDefaultActivity()
    }

}
