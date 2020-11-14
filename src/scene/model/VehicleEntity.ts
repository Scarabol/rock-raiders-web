import { SelectionType } from '../../game/model/Selectable';
import { FulfillerEntity } from './FulfillerEntity';
import { GameState } from '../../game/model/GameState';

export abstract class VehicleEntity extends FulfillerEntity {

    constructor(aeFilename: string, speed: number) {
        super(SelectionType.VEHICLE, aeFilename, speed);
        // TODO call create picksphere after mesh initialized
    }

    isOnRubble(): boolean {
        return false;
    }

    onDiscover() {
        super.onDiscover();
        const index = GameState.vehiclesUndiscovered.indexOf(this);
        if (index !== -1) GameState.vehiclesUndiscovered.splice(index, 1);
        GameState.vehicles.push(this);
        console.log('A vehicle has been discovered');
    }

}