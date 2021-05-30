import { ElectricFence } from '../../material/ElectricFence'
import { CarryJob } from './CarryJob'

export class CarryFenceJob extends CarryJob<ElectricFence> {

    onJobComplete() {
        super.onJobComplete()
        this.item.sceneEntity.addToScene(null, null)
        this.item.targetSurface.fence = this.item
    }

}
