import { ElectricFence } from '../../material/ElectricFence'
import { CarryJob } from './CarryJob'

export class CarryFenceJob extends CarryJob<ElectricFence> {

    onJobComplete() {
        super.onJobComplete()
        this.item.placeDown()
    }

}
