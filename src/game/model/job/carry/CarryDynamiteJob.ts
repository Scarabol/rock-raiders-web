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
            // TODO add explosion animation
            // TODO damage raider, vehicle, buildings
        })
    }
}
