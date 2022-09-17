import { Sample } from '../../../../audio/Sample'
import { DynamiteActivity } from '../../activities/DynamiteActivity'
import { Dynamite } from '../../material/Dynamite'
import { CarryJob } from './CarryJob'

export class CarryDynamiteJob extends CarryJob<Dynamite> {
    onJobComplete() {
        super.onJobComplete()
        const position = this.item.sceneEntity.position2D
        this.item.worldMgr.entityMgr.tickingDynamite.push(position)
        this.item.sceneEntity.headTowards(this.item.targetSurface.getCenterWorld2D())
        this.item.sceneEntity.changeActivity(DynamiteActivity.TickDown, () => {
            this.item.worldMgr.entityMgr.tickingDynamite.remove(position)
            this.item.sceneEntity.disposeFromScene()
            this.item.targetSurface.collapse()
            this.item.worldMgr.addMiscAnim('MiscAnims/Effects/Mockup_explode3.lws', this.item.sceneEntity.position, this.item.sceneEntity.getHeading())
            this.item.sceneEntity.playPositionalAudio(Sample[Sample.SFX_Dynamite], false)
            // TODO damage raider, vehicle, buildings
        })
    }
}
