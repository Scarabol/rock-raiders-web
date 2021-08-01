import { Sample } from '../../../../audio/Sample'
import { DynamiteActivity } from '../../activities/DynamiteActivity'
import { Dynamite } from '../../material/Dynamite'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { CarryJob } from './CarryJob'

export class CarryDynamiteJob extends CarryJob<Dynamite> {
    color: number = 0xa06060

    constructor(dynamite: Dynamite) {
        super(dynamite)
    }

    getRequiredTraining(): RaiderTraining {
        return RaiderTraining.DEMOLITION
    }

    onJobComplete() {
        super.onJobComplete()
        this.item.entityMgr.scarer.push(this.item)
        this.item.sceneEntity.headTowards(this.item.targetSurface.getCenterWorld2D())
        this.item.sceneEntity.changeActivity(DynamiteActivity.TickDown, () => {
            this.item.entityMgr.scarer.remove(this.item)
            this.item.sceneEntity.disposeFromScene()
            this.item.targetSurface.collapse()
            this.item.entityMgr.addMiscAnim('MiscAnims/Effects/Mockup_explode3.lws', this.item.sceneMgr, this.item.sceneEntity.position, this.item.sceneEntity.getHeading())
            this.item.sceneEntity.playPositionalAudio(Sample[Sample.SFX_Dynamite], false)
            // TODO damage raider, vehicle, buildings
        })
    }
}
