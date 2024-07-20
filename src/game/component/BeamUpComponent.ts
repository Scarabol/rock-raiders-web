import { AbstractGameComponent } from '../ECS'
import { Raider } from '../model/raider/Raider'
import { BuildingEntity } from '../model/building/BuildingEntity'
import { MaterialEntity } from '../model/material/MaterialEntity'
import { VehicleEntity } from '../model/vehicle/VehicleEntity'
import { DeselectAll } from '../../event/LocalEvents'
import { GameConfig } from '../../cfg/GameConfig'
import { EventBroker } from '../../event/EventBroker'

export class BeamUpComponent extends AbstractGameComponent {
    constructor(readonly entity: Raider | VehicleEntity | BuildingEntity | MaterialEntity) {
        super()
        EventBroker.publish(new DeselectAll())
        this.entity.worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.MiniTeleportUp, this.entity.getPosition(), this.entity.sceneEntity.heading, false)
        if (this.entity.worldMgr.sceneMgr.birdViewControls.lockedObject === entity.sceneEntity) this.entity.worldMgr.sceneMgr.birdViewControls.unlockCamera()
    }
}
