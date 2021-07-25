import { ElectricFence } from '../../material/ElectricFence'
import { CarryJob } from './CarryJob'

export class CarryFenceJob extends CarryJob<ElectricFence> {

    onJobComplete() {
        super.onJobComplete()
        this.item.sceneEntity.addToScene(null, null)
        this.item.sceneEntity.makeSelectable(this.item, this.item.stats.PickSphere / 4)
        this.item.targetSurface.fence = this.item
        this.item.entityMgr.placedFences.add(this.item)
    }

}
