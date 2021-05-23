import { ElectricFence } from '../material/ElectricFence'
import { CarryJob } from './CarryJob'

export class CarryFenceJob extends CarryJob<ElectricFence> {

    onJobComplete() {
        super.onJobComplete()
        if (this.item.targetSurface.canPlaceFence()) {
            this.item.addToScene(null, null)
            this.item.targetSurface.fence = this.item
        } // TODO else dispose item entity with mesh
    }

}
