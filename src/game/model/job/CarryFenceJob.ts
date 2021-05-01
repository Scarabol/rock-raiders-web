import { ElectricFence } from '../collect/ElectricFence'
import { CarryJob } from './CarryJob'

export class CarryFenceJob extends CarryJob<ElectricFence> {

    onJobComplete() {
        super.onJobComplete()
        if (this.item.targetSurface.canPlaceFence()) {
            this.item.worldMgr.sceneManager.scene.add(this.item.group)
            this.item.targetSurface.fence = this.item
        } // TODO else dispose item entity with mesh
    }

}
