import { BuildingEntity } from '../../scene/model/BuildingEntity';
import { Building } from './entity/building/Building';
import { Selectable, SelectionType } from './Selectable';
import { Raider } from '../../scene/model/Raider';
import { VehicleEntity } from '../../scene/model/VehicleEntity';
import { CollectableEntity } from '../../scene/model/collect/CollectableEntity';
import { Vector3 } from 'three';
import { ADDITIONAL_RAIDER_PER_SUPPORT, MAX_RAIDER_BASE } from '../../main';

export class GameState {

    static gameSpeedMultiplier: number = 1;
    static numOre: number = 0;
    static numCrystal: number = 0;
    static usedCrystals: number = 0;
    static neededCrystals: number = 0;
    static airlevel: number = 1; // airlevel in percent from 0 to 1.0
    static selectedEntities: Selectable[] = [];
    static selectionType: SelectionType = null;
    static buildings: BuildingEntity[] = [];
    static raiders: Raider[] = [];
    static requestedRaiders: number = 0;
    static vehicles: VehicleEntity[] = [];
    static collectables: CollectableEntity[] = [];

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
        this.requestedRaiders = 0;
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
        this.selectionType = null;
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

    static getMaxRaiders(): number {
        return MAX_RAIDER_BASE + this.getBuildingsByType(Building.SUPPORT).length * ADDITIONAL_RAIDER_PER_SUPPORT;
    }

}
