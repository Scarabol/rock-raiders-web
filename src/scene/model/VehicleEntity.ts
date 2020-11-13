import { SelectionType } from '../../game/model/Selectable';
import { FulfillerEntity } from './FulfillerEntity';

export class VehicleEntity extends FulfillerEntity {

    constructor(aeFilename: string, speed: number) {
        super(SelectionType.VEHICLE, aeFilename, speed);
    }

    isOnRubble(): boolean {
        return false;
    }

}