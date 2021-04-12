import { SelectionType } from '../../game/model/Selectable'
import { FulfillerEntity } from './FulfillerEntity'

export abstract class VehicleEntity extends FulfillerEntity {

    constructor(aeFilename: string) {
        super(SelectionType.VEHICLE, aeFilename)
    }

}
