import { BuildingEntity } from '../../scene/model/BuildingEntity';
import { Building } from './entity/building/Building';
import { Selectable, SelectionType } from './Selectable';
import { Raider } from '../../scene/model/Raider';
import { VehicleEntity } from '../../scene/model/VehicleEntity';
import { Collectable } from '../../scene/model/Collectable';
import { Vector3 } from 'three';

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
    static collectables: Collectable[] = [];

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
        this.collectables = [];
    }

    static getBuildingsByType(...buildingTypes: Building[]): BuildingEntity[] {
        const matches = [];
        for (let c = 0; c < buildingTypes.length; c++) {
            matches.push(...this.buildings.filter((b) => b.type === buildingTypes[c]));
        }
        return matches;
    }

    static getClosestBuildingByType(position: Vector3, ...buildingTypes: Building[]): BuildingEntity {
        const targetBuildings = GameState.getBuildingsByType(...buildingTypes);
        let closest = null, minDist = null;
        targetBuildings.forEach((b) => {
            const bPos = b.getDropPosition();
            const dist = new Vector3().copy(position).sub(bPos).lengthSq();
            if (closest === null || dist < minDist) {
                closest = b;
                minDist = dist;
            }
        });
        return closest;
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
