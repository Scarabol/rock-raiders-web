import { Sample } from '../../../audio/Sample'
import { DynamiteSceneEntity } from '../../../scene/entities/DynamiteSceneEntity'
import { WorldManager } from '../../WorldManager'
import { DynamiteActivity } from '../anim/AnimationActivity'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { Surface } from '../map/Surface'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { MaterialEntity } from './MaterialEntity'

export class Dynamite extends MaterialEntity {
    constructor(worldMgr: WorldManager, readonly targetSurface: Surface) {
        super(worldMgr, EntityType.DYNAMITE, PriorityIdentifier.DESTRUCTION, RaiderTraining.DEMOLITION)
        this.sceneEntity = new DynamiteSceneEntity(this.worldMgr.sceneMgr)
    }

    findCarryTargets(): PathTarget[] {
        if (this.targetSurface?.isDigable()) {
            return this.targetSurface.getDigPositions().map((p) => PathTarget.fromLocation(p, this.sceneEntity.getRadiusSquare() / 4))
        } else {
            return this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
        }
    }

    onCarryJobComplete(): void {
        super.onCarryJobComplete()
        this.worldMgr.entityMgr.tickingDynamite.push(this)
        this.sceneEntity.headTowards(this.targetSurface.getCenterWorld2D())
        this.sceneEntity.changeActivity(DynamiteActivity.TickDown, () => {
            this.worldMgr.entityMgr.tickingDynamite.remove(this)
            this.sceneEntity.disposeFromScene()
            this.targetSurface.collapse()
            this.worldMgr.addMiscAnim('MiscAnims/Effects/Mockup_explode3.lws', this.sceneEntity.position, this.sceneEntity.getHeading())
            this.sceneEntity.playPositionalAudio(Sample[Sample.SFX_Dynamite], false)
            // TODO damage raider, vehicle, buildings
        })
    }
}
