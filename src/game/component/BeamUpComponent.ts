import { AbstractGameComponent } from '../ECS'
import { Raider } from '../model/raider/Raider'
import { BuildingEntity } from '../model/building/BuildingEntity'
import { ElectricFence } from '../model/material/ElectricFence'
import { VehicleEntity } from '../model/vehicle/VehicleEntity'
import { EventBus } from '../../event/EventBus'
import { DeselectAll } from '../../event/LocalEvents'
import { ResourceManager } from '../../resource/ResourceManager'
import { Sample } from '../../audio/Sample'

export class BeamUpComponent extends AbstractGameComponent {
    constructor(readonly entity: Raider | VehicleEntity | BuildingEntity | ElectricFence) {
        super()
        EventBus.publishEvent(new DeselectAll())
        const grp= this.entity.worldMgr.sceneMgr.addMiscAnim(ResourceManager.configuration.miscObjects.MiniTeleportUp, this.entity.sceneEntity.position, this.entity.sceneEntity.getHeading())
        this.entity.worldMgr.sceneMgr.addPositionalAudio(grp, Sample[Sample.SND_TeleUp], true)
    }
}
