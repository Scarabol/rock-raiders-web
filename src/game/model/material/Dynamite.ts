import { Sample } from '../../../audio/Sample'
import { DynamiteSceneEntity } from '../../../scene/entities/DynamiteSceneEntity'
import { WorldManager } from '../../WorldManager'
import { DynamiteActivity } from '../activities/DynamiteActivity'
import { EntityType } from '../EntityType'
import { CarryPathTarget } from '../job/carry/CarryPathTarget'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { Surface } from '../map/Surface'
import { RaiderTraining } from '../raider/RaiderTraining'
import { MaterialEntity } from './MaterialEntity'

export class Dynamite extends MaterialEntity {
    constructor(worldMgr: WorldManager, readonly targetSurface: Surface) {
        super(worldMgr, EntityType.DYNAMITE, PriorityIdentifier.DESTRUCTION, RaiderTraining.DEMOLITION)
        this.sceneEntity = new DynamiteSceneEntity(this.worldMgr.sceneMgr)
    }

    findCarryTargets(): CarryPathTarget[] {
        if (this.targetSurface?.isDigable()) {
            return this.targetSurface.getDigPositions().map((p) => new CarryPathTarget(p, this.sceneEntity.getRadiusSquare() / 4))
        } else {
            return this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
        }
    }

    onCarryJobComplete(): void {
        super.onCarryJobComplete()
        const position = this.sceneEntity.position2D
        this.worldMgr.entityMgr.tickingDynamite.push(position)
        this.sceneEntity.headTowards(this.targetSurface.getCenterWorld2D())
        this.sceneEntity.changeActivity(DynamiteActivity.TickDown, () => {
            this.worldMgr.entityMgr.tickingDynamite.remove(position)
            this.sceneEntity.disposeFromScene()
            this.targetSurface.collapse()
            this.worldMgr.addMiscAnim('MiscAnims/Effects/Mockup_explode3.lws', this.sceneEntity.position, this.sceneEntity.getHeading())
            this.sceneEntity.playPositionalAudio(Sample[Sample.SFX_Dynamite], false)
            // TODO damage raider, vehicle, buildings
        })
    }
}
