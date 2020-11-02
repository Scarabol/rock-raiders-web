import { BuildingEntity } from '../../scene/model/BuildingEntity';
import { Building } from './entity/building/Building';
import { Selectable, SelectionType } from './Selectable';
import { Raider } from '../../scene/model/Raider';
import { VehicleEntity } from '../../scene/model/VehicleEntity';

export class GameState {

    static numOre: number = 0;
    static numCrystal: number = 0;
    static usedCrystals: number = 0;
    static neededCrystals: number = 0;
    static airlevel: number = 1; // airlevel in percent from 0 to 1.0
    static selectedEntities: Selectable[] = [];
    static selectionType: SelectionType = null;
    static buildings: BuildingEntity[] = [];
    static raiders: Raider[] = [];
    static vehicles: VehicleEntity[] = [];

    static reset() {
        this.numOre = 0;
        this.numCrystal = 0;
        this.usedCrystals = 0;
        this.neededCrystals = 0;
        this.airlevel = 1;
        this.selectedEntities = [];
        this.selectionType = null;
        this.buildings = [];
        this.raiders = [];
        this.vehicles = [];
    }

    static getBuildingsByType(buildingType: Building): BuildingEntity[] {
        return this.buildings.filter((b) => b.type === buildingType);
    }

    static selectEntities(entities: Selectable[]) {
        // TODO handle event triggering here (avoid sending unecessary events)
        this.selectedEntities.forEach((entity) => entity.deselect()); // TODO only deselect entities not in new selection
        this.selectedEntities = [];
        this.selectionType = SelectionType.NONE;
        if (entities) {
            entities.forEach((entity) => entity.select());
            if (entities.length === 1) {
                const entity = entities[0];
                this.selectedEntities.push(entity);
                this.selectionType = entity.getSelectionType();
            } else {
                entities.forEach((entity) => this.selectedEntities.push(entity));
                this.selectionType = SelectionType.GROUP;
            }
        }
    }

}
